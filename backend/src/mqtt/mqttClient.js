const mqtt = require("mqtt");

let client    = null;
let connected = false;

function startMqttClient(io) {
  const MQTT_URL  = process.env.MQTT_URL;
  const MQTT_USER = process.env.MQTT_USER;
  const MQTT_PASS = process.env.MQTT_PASSWORD;

  if (!MQTT_URL) {
    console.warn("⚠️  MQTT_URL no definido — cliente MQTT del backend desactivado");
    return;
  }

  client = mqtt.connect(MQTT_URL, {
    username:           MQTT_USER,
    password:           MQTT_PASS,
    protocol:           "mqtts",
    rejectUnauthorized: false,
    reconnectPeriod:    5000,
    connectTimeout:     10000,
  });

  client.on("connect", () => {
    connected = true;
    console.log("✅ [MQTT Backend] Conectado a HiveMQ Cloud");
    client.subscribe("riegoiq/Superior/report");
    client.subscribe("riegoiq/Inferior/report");
    client.subscribe("riegoiq/Superior/heartbeat");
    client.subscribe("riegoiq/Inferior/heartbeat");
    console.log("📡 [MQTT Backend] Suscrito a topics de sensores y heartbeat");
  });

  client.on("message", async (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());

      // ── Heartbeat ──────────────────────────────────────
      if (topic.includes("/heartbeat")) {
        const { deviceId, sector } = data;
        if (!deviceId) return;

        const Device = require("../models/Device");
        await Device.findOneAndUpdate(
          { deviceId },
          {
            status:         "Online",
            lastConnection: new Date(),
            lastSeen:       new Date(),
            ...(sector && { sector }),
          },
          { upsert: true, new: true }
        );

        if (io) {
          io.emit("device:heartbeat", {
            deviceId,
            sector:         sector || null,
            lastConnection: new Date(),
            lastSeen:       new Date(),
            status:         "Online",
          });
        }
        return;
      }

      // ── Reporte de humedad ─────────────────────────────
      if (topic.includes("/report")) {
        const { sector, deviceId, readings } = data;
        if (!readings || !sector || !deviceId) return;

        const Plant = require("../models/Plant");
        const { processReading } = require("../routes/iot.routes");

        for (const r of readings.slice(0, 10)) {
          const h = Number(r.humidity);
          if (isNaN(h) || h < 0 || h > 100) continue;

          let plant = null;
          if (r.plantId) {
            plant = await Plant.findById(r.plantId);
          }
          if (!plant) {
            plant = await Plant.findOne({ sector, valveNumber: r.valve });
          }
          if (plant) {
            await processReading(plant, h, deviceId, io);
          }
        }
      }

    } catch (err) {
      console.error("[MQTT Backend] Error procesando mensaje:", err.message);
    }
  });

  client.on("error",      (err) => console.error("[MQTT Backend] Error:", err.message));
  client.on("disconnect", ()    => { connected = false; console.log("[MQTT Backend] Desconectado"); });
  client.on("reconnect",  ()    => console.log("[MQTT Backend] Reconectando..."));
}

function publishValveCommand(sector, valveNumber, command, plantId = null) {
  if (!client || !connected) {
    console.warn("[MQTT Backend] No conectado — comando no enviado por MQTT");
    return false;
  }

  const topic   = `riegoiq/${sector}/valve/command`;
  const payload = JSON.stringify({
    valve:       valveNumber,
    valveNumber: valveNumber,
    command:     command,
    ...(plantId && { plantId }),
  });

  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[MQTT Backend] Error publicando en ${topic}:`, err.message);
    } else {
      console.log(`[MQTT Backend] ✅ Publicado → ${topic}: ${payload}`);
    }
  });

  return true;
}

function isConnected() { return connected; }

module.exports = { startMqttClient, publishValveCommand, isConnected };