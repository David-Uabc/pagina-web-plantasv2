const mqtt = require("mqtt");
const { emitToUser } = require("../utils/socketRooms");

let client    = null;
let connected = false;

function describeMqttError(err) {
  if (!err) return "Error desconocido";
  return err.message || err.code || err.name || "Error desconocido";
}

function startMqttClient(io) {
  const MQTT_URL  = process.env.MQTT_URL;
  const MQTT_USER = process.env.MQTT_USER;
  const MQTT_PASS = process.env.MQTT_PASSWORD;
  const allowSelfSigned =
    process.env.NODE_ENV !== "production" ||
    process.env.MQTT_ALLOW_SELF_SIGNED === "true";

  if (!MQTT_URL) {
    console.warn("⚠ MQTT_URL no definido — cliente MQTT del backend desactivado");
    return;
  }

  let protocol = "mqtts";
  let hostLabel = MQTT_URL;
  try {
    const parsed = new URL(MQTT_URL);
    protocol = parsed.protocol.replace(":", "") || "mqtts";
    hostLabel = parsed.host || MQTT_URL;
  } catch (_) {
  }

  client = mqtt.connect(MQTT_URL, {
    username: MQTT_USER,
    password: MQTT_PASS,
    protocol,
    rejectUnauthorized: !allowSelfSigned,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  });

  client.on("connect", () => {
    connected = true;
    console.log(`✅ [MQTT Backend] Conectado a ${hostLabel} (${protocol})`);
    client.subscribe("riegoiq/Superior/report");
    client.subscribe("riegoiq/Inferior/report");
    client.subscribe("riegoiq/Superior/heartbeat");
    client.subscribe("riegoiq/Inferior/heartbeat");
    console.log("📡 [MQTT Backend] Suscrito a topics de sensores y heartbeat");
  });

  client.on("message", async (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());

      if (topic.includes("/heartbeat")) {
        const { deviceId, sector } = data;
        if (!deviceId) return;

        const Device = require("../models/Device");
        const { ensureDeviceOwner } = require("../utils/deviceOwnership");
        const device = await Device.findOneAndUpdate(
          { deviceId },
          {
            status: "Online",
            lastConnection: new Date(),
            lastSeen: new Date(),
            ...(sector && { sector }),
          },
          { upsert: true, new: true }
        );
        if (sector) {
          await ensureDeviceOwner(device, sector);
        }

        if (io) {
          emitToUser(io, device.owner, "device:heartbeat", {
            deviceId,
            sector: sector || null,
            lastConnection: new Date(),
            lastSeen: new Date(),
            status: "Online",
          });
        }
        return;
      }

      if (topic.includes("/report")) {
        const { sector, deviceId, readings } = data;
        if (!readings || !sector || !deviceId) return;

        const Device = require("../models/Device");
        const { ensureDeviceOwner } = require("../utils/deviceOwnership");
        const { processReading, findPlantForReading } = require("../routes/iot.routes");
        const device = await Device.findOneAndUpdate(
          { deviceId },
          {
            status: "Online",
            lastConnection: new Date(),
            lastSeen: new Date(),
            sector,
          },
          { upsert: true, new: true }
        );
        const resolved = await ensureDeviceOwner(device, sector);
        if (!resolved.ownerId) return;

        for (const r of readings.slice(0, 10)) {
          const h = Number(r.humidity);
          if (isNaN(h) || h < 0 || h > 100) continue;

          const plant = await findPlantForReading(resolved.ownerId, sector, r);
          if (plant) {
            await processReading(plant, h, deviceId, io);
          }
        }
      }

    } catch (err) {
      console.error("[MQTT Backend] Error procesando mensaje:", describeMqttError(err));
    }
  });

  client.on("error", (err) => {
    console.error(`[MQTT Backend] Error (${hostLabel}):`, describeMqttError(err));
  });
  client.on("disconnect", () => {
    connected = false;
    console.log("[MQTT Backend] Desconectado");
  });
  client.on("reconnect", () => {
    console.log(`[MQTT Backend] Reconectando a ${hostLabel}...`);
  });
}

function publishValveCommand(sector, valveNumber, command, plantId = null) {
  if (!client || !connected) {
    console.warn("[MQTT Backend] No conectado — comando no enviado por MQTT");
    return false;
  }

  const topic = `riegoiq/${sector}/valve/command`;
  const payload = JSON.stringify({
    valve: valveNumber,
    valveNumber,
    command,
    ...(plantId && { plantId }),
  });

  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[MQTT Backend] Error publicando en ${topic}:`, describeMqttError(err));
    } else {
      console.log(`[MQTT Backend] ✅ Publicado → ${topic}: ${payload}`);
    }
  });

  return true;
}

function isConnected() {
  return connected;
}

module.exports = { startMqttClient, publishValveCommand, isConnected };
