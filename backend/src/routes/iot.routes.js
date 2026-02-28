// routes/iot.routes.js
// Ruta PÚBLICA para ESP32 — autenticación por deviceId + apiKey (sin JWT)
const express = require("express");
const router  = express.Router();
const Plant   = require("../models/Plant");
const Device  = require("../models/Device");
const Log     = require("../models/Log");

// ── Middleware de autenticación IoT ──────────────────
// El ESP32 envía en el header: x-device-id y x-api-key
// La apiKey se configura en .env como IOT_API_KEY
async function iotAuth(req, res, next) {
  const deviceId = req.headers["x-device-id"];
  const apiKey   = req.headers["x-api-key"];

  if (!deviceId || !apiKey) {
    return res.status(401).json({ error: "Falta x-device-id o x-api-key en headers" });
  }
  if (apiKey !== process.env.IOT_API_KEY) {
    return res.status(403).json({ error: "API key inválida" });
  }

  // Registrar/actualizar dispositivo como Online
  const device = await Device.findOneAndUpdate(
    { deviceId },
    { deviceId, status: "Online", lastConnection: new Date() },
    { upsert: true, new: true }
  );

  req.deviceId = deviceId;
  req.device   = device;
  next();
}

// =====================================================
// POST /api/iot/report
// ESP32 reporta humedad de una o varias plantas
// Body: { sector, readings: [{ plantId, humidity }] }
//   ó : { sector, humidity } si solo hay 1 planta
// =====================================================
router.post("/report", iotAuth, async (req, res) => {
  const io = req.app.get("io");
  try {
    const { sector, readings, humidity, plantId } = req.body;

    if (!sector) return res.status(400).json({ error: "sector es requerido" });

    // Normalizar: aceptar lectura única o array
    const list = readings
      ? readings
      : plantId
        ? [{ plantId, humidity }]
        : [];

    // Si no vienen plantIds, actualizar TODAS las plantas del sector
    let plants;
    if (list.length === 0) {
      // El ESP32 manda solo { sector, humidity } — repartir a todas las plantas del sector
      plants = await Plant.find({ sector });
      for (const p of plants) {
        await processReading(p, humidity ?? 0, req.deviceId, io);
      }
    } else {
      for (const r of list) {
        const p = await Plant.findById(r.plantId);
        if (p && p.sector === sector) {
          await processReading(p, r.humidity, req.deviceId, io);
        }
      }
    }

    res.json({ ok: true, message: "Lecturas procesadas", deviceId: req.deviceId, sector });
  } catch (err) {
    console.error("❌ [IoT] Error en /report:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// GET /api/iot/valve/:sector
// ESP32 consulta el estado de la válvula de su sector
// Devuelve: { sector, command: "OPEN"|"CLOSED", plants: [...] }
// =====================================================
router.get("/valve/:sector", iotAuth, async (req, res) => {
  try {
    const { sector } = req.params;
    const plants = await Plant.find({ sector }, "name valveStatus currentHumidity");

    // Si ALGUNA planta del sector tiene válvula abierta → comando OPEN
    const anyOpen = plants.some(p => p.valveStatus === "OPEN");

    res.json({
      sector,
      command: anyOpen ? "OPEN" : "CLOSED",
      plants: plants.map(p => ({
        id:          p._id,
        name:        p.name,
        valveStatus: p.valveStatus,
        humidity:    p.currentHumidity,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// POST /api/iot/heartbeat
// ESP32 reporta que sigue vivo (sin datos de humedad)
// =====================================================
router.post("/heartbeat", iotAuth, async (req, res) => {
  const io = req.app.get("io");
  try {
    // Emitir al frontend que el dispositivo está vivo
    io.emit("device:heartbeat", {
      deviceId:       req.deviceId,
      sector:         req.body.sector,
      lastConnection: new Date(),
      status:         "Online",
    });

    res.json({ ok: true, message: "Heartbeat recibido", ts: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Función común: procesar una lectura de humedad ──
async function processReading(plant, humidity, deviceId, io) {
  const prevHumidity  = plant.currentHumidity;
  const wasAlert      = prevHumidity < plant.minHumidity;
  const isAlert       = humidity < plant.minHumidity;
  const wasOverMax    = prevHumidity > plant.maxHumidity;

  plant.currentHumidity = humidity;

  // Guardar en historial (máx 500 entradas)
  plant.humidityHistory.push({ humidity, date: new Date() });
  if (plant.humidityHistory.length > 500) {
    plant.humidityHistory = plant.humidityHistory.slice(-500);
  }

  // ✅ Lógica de válvula automática
  let irrigationExecuted = false;
  if (humidity < plant.minHumidity && plant.valveStatus !== "OPEN") {
    plant.valveStatus    = "OPEN";
    plant.lastIrrigation = new Date();
    irrigationExecuted   = true;

    // ✅ Registrar alerta en historial
    plant.alertHistory.push({
      type:     "low_humidity",
      message:  `Humedad bajó a ${humidity}% (mínimo: ${plant.minHumidity}%)`,
      humidity,
      resolved: false,
    });
    if (plant.alertHistory.length > 100) {
      plant.alertHistory = plant.alertHistory.slice(-100);
    }

  } else if (humidity >= plant.maxHumidity && plant.valveStatus === "OPEN") {
    plant.valveStatus = "CLOSED";

    // Resolver alertas pendientes
    plant.alertHistory = plant.alertHistory.map(a =>
      !a.resolved ? { ...a.toObject(), resolved: true } : a
    );

    // Registrar cierre de válvula
    plant.alertHistory.push({
      type:     "valve_off",
      message:  `Válvula cerrada — humedad alcanzó ${humidity}%`,
      humidity,
      resolved: true,
    });
  } else if (humidity >= plant.minHumidity && wasAlert) {
    // Se recuperó sin llegar al máximo
    plant.alertHistory = plant.alertHistory.map(a =>
      !a.resolved && a.type === "low_humidity" ? { ...a.toObject(), resolved: true } : a
    );
  }

  await plant.save();

  // Log en DB
  await Log.create({
    plantId: plant._id,
    deviceId,
    sector:  plant.sector,
    humidity,
    irrigationExecuted,
    valveStatus: plant.valveStatus,
  });

  // ✅ Emitir evento en tiempo real al frontend
  if (io) {
    io.emit("plant:update", {
      _id:             plant._id.toString(),
      name:            plant.name,
      sector:          plant.sector,
      currentHumidity: humidity,
      valveStatus:     plant.valveStatus,
      lastIrrigation:  plant.lastIrrigation,
      minHumidity:     plant.minHumidity,
      maxHumidity:     plant.maxHumidity,
      alertHistory:    plant.alertHistory,
    });

    // Si se abrió la válvula ahora, emitir alerta separada
    if (irrigationExecuted) {
      io.emit("plant:alert", {
        plantId: plant._id.toString(),
        name:    plant.name,
        sector:  plant.sector,
        humidity,
        type:    "low_humidity",
      });
    }
  }

  return plant;
}

// Exportar processReading para usarla en el simulador
module.exports = router;
module.exports.processReading = processReading;