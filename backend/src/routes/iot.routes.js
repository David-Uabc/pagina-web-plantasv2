// routes/iot.routes.js
const express = require("express");
const router  = express.Router();
const crypto  = require("crypto");
const Plant   = require("../models/Plant");
const Device  = require("../models/Device");
const Log     = require("../models/Log");

async function iotAuth(req, res, next) {
  try {
    const deviceId = req.headers["x-device-id"];
    const apiKey   = req.headers["x-api-key"];

    if (!deviceId || !apiKey) {
      return res.status(401).json({ error: "Falta x-device-id o x-api-key en headers" });
    }

    if (!process.env.IOT_API_KEY) {
      console.error("❌ CRÍTICO: IOT_API_KEY no está definido en .env");
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }

    const provided = Buffer.from(apiKey);
    const expected = Buffer.from(process.env.IOT_API_KEY);
    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(provided, expected)
    ) {
      return res.status(403).json({ error: "No autorizado" });
    }

    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(deviceId)) {
      return res.status(400).json({ error: "Formato de device-id inválido" });
    }

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { deviceId, status: "Online", lastConnection: new Date(), lastSeen: new Date() },
      { upsert: true, new: true }
    );

    req.deviceId = deviceId;
    req.device   = device;
    next();
  } catch (err) {
    console.error("❌ [IoT] Error en iotAuth:", err.message);
    res.status(500).json({ error: "Error al verificar el dispositivo" });
  }
}

const sectorValido = (s) => ["Superior", "Inferior"].includes(s);
const errProd = (msg, err) =>
  process.env.NODE_ENV === "production" ? msg : err.message;

// =====================================================
// POST /api/iot/report
// =====================================================
router.post("/report", iotAuth, async (req, res) => {
  const io = req.app.get("io");
  try {
    const { sector, readings, humidity, plantId } = req.body;

    if (!sector) return res.status(400).json({ error: "sector es requerido" });
    if (!sectorValido(sector)) return res.status(400).json({ error: "sector debe ser Superior o Inferior" });

    if (humidity !== undefined) {
      const h = Number(humidity);
      if (isNaN(h) || h < 0 || h > 100)
        return res.status(400).json({ error: "humidity debe ser un número entre 0 y 100" });
    }

    const list = readings
      ? readings
      : plantId
        ? [{ plantId, humidity }]
        : [];

    if (list.length === 0) {
      const massHumidity = Number(humidity);
      if (isNaN(massHumidity) || massHumidity < 0 || massHumidity > 100) {
        return res.status(400).json({
          error: "humidity debe ser un número entre 0 y 100 cuando no envías readings ni plantId",
        });
      }

      const plants = await Plant.find({ sector });
      for (const p of plants) {
        await processReading(p, massHumidity, req.deviceId, io);
      }
    } else {
      const limitedList = list.slice(0, 10);
      for (const r of limitedList) {
        const h = Number(r.humidity);
        if (isNaN(h) || h < 0 || h > 100) continue;
        const p = await Plant.findById(r.plantId);
        if (p && p.sector === sector) {
          await processReading(p, h, req.deviceId, io);
        }
      }
    }

    res.json({ ok: true, message: "Lecturas procesadas", deviceId: req.deviceId, sector });
  } catch (err) {
    console.error("❌ [IoT] Error en /report:", err.message);
    res.status(500).json({ error: errProd("Error al procesar lecturas", err) });
  }
});

// =====================================================
// GET /api/iot/valve/:sector
// =====================================================
router.get("/valve/:sector", iotAuth, async (req, res) => {
  try {
    const { sector } = req.params;

    if (!sectorValido(sector)) {
      return res.status(400).json({ error: "sector debe ser Superior o Inferior" });
    }

    const plants = await Plant.find(
      { sector },
      "name valveStatus currentHumidity valveNumber"
    );

    const anyOpen = plants.some(p => p.valveStatus === "OPEN");

    res.json({
      sector,
      command: anyOpen ? "OPEN" : "CLOSED",
      plants: plants.map(p => ({
        id:          p._id,
        name:        p.name,
        valveStatus: p.valveStatus,
        valveNumber: p.valveNumber,
        humidity:    p.currentHumidity,
      })),
    });
  } catch (err) {
    console.error("❌ [IoT] Error en /valve:", err.message);
    res.status(500).json({ error: errProd("Error al consultar válvulas", err) });
  }
});

// =====================================================
// POST /api/iot/heartbeat
// =====================================================
router.post("/heartbeat", iotAuth, async (req, res) => {
  const io = req.app.get("io");
  try {
    const sector = req.body.sector;

    if (sector && !sectorValido(sector)) {
      return res.status(400).json({ error: "sector debe ser Superior o Inferior" });
    }

    // ✅ FIX — actualizar lastSeen en MongoDB para que el polling del frontend lo detecte
    await Device.findOneAndUpdate(
      { deviceId: req.deviceId },
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
        deviceId:       req.deviceId,
        sector:         sector || null,
        lastConnection: new Date(),
        lastSeen:       new Date(),
        status:         "Online",
      });
    }

    res.json({ ok: true, message: "Heartbeat recibido", ts: new Date() });
  } catch (err) {
    console.error("❌ [IoT] Error en /heartbeat:", err.message);
    res.status(500).json({ error: errProd("Error al procesar heartbeat", err) });
  }
});

// ── Procesar lectura de humedad ───────────────────────
async function processReading(plant, humidity, deviceId, io) {
  const wasAlert = plant.currentHumidity < plant.minHumidity;

  plant.currentHumidity = humidity;

  plant.humidityHistory.push({ humidity, date: new Date() });
  if (plant.humidityHistory.length > 500) {
    plant.humidityHistory = plant.humidityHistory.slice(-500);
  }

  let irrigationExecuted = false;

  if (humidity < plant.minHumidity && plant.valveStatus !== "OPEN") {
    plant.valveStatus    = "OPEN";
    plant.lastIrrigation = new Date();
    irrigationExecuted   = true;

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
    plant.alertHistory = plant.alertHistory.map(a =>
      !a.resolved ? { ...a.toObject(), resolved: true } : a
    );
    plant.alertHistory.push({
      type:     "valve_off",
      message:  `Válvula cerrada — humedad alcanzó ${humidity}%`,
      humidity,
      resolved: true,
    });

  } else if (humidity >= plant.minHumidity && wasAlert) {
    plant.alertHistory = plant.alertHistory.map(a =>
      !a.resolved && a.type === "low_humidity" ? { ...a.toObject(), resolved: true } : a
    );
  }

  await plant.save();

  await Log.create({
    plantId:            plant._id,
    deviceId,
    sector:             plant.sector,
    humidity,
    irrigationExecuted,
    valveStatus:        plant.valveStatus,
  });

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

module.exports = router;
module.exports.processReading = processReading;
