const express = require("express");
const router  = express.Router();
const crypto  = require("crypto");
const Device  = require("../models/Device");
const Log     = require("../models/Log");
const Plant   = require("../models/Plant");
const { protect } = require("../middleware/auth");

const errProd = (msg, err) =>
  process.env.NODE_ENV === "production" ? msg : err.message;

function readDeviceApiKey(req) {
  const apiKey = req.headers["x-api-key"];
  return typeof apiKey === "string" ? apiKey : "";
}

function hasValidDeviceKey(req) {
  if (!process.env.IOT_API_KEY) return false;

  const provided = Buffer.from(readDeviceApiKey(req));
  const expected = Buffer.from(process.env.IOT_API_KEY);

  return (
    provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected)
  );
}

async function protectOrDeviceKey(req, res, next) {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return protect(req, res, next);
  }

  if (hasValidDeviceKey(req)) {
    return next();
  }

  return res.status(401).json({ error: "No autorizado" });
}

async function resolveVisibleDevices(req) {
  const ownedDevices = await Device.find({ owner: req.user._id }).sort({ createdAt: -1 });
  if (ownedDevices.length > 0) return ownedDevices;

  const sectors = await Plant.distinct("sector", { owner: req.user._id });
  if (sectors.length === 0) return [];

  return Device.find({ sector: { $in: sectors } }).sort({ createdAt: -1 });
}

// ============================================
// 🔹 OBTENER TODOS LOS DISPOSITIVOS
// GET /api/devices
// ============================================
router.get("/", protect, async (req, res) => {
  try {
    const devices = await resolveVisibleDevices(req);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: errProd("Error al obtener dispositivos", error) });
  }
});

// ============================================
// 🔹 REGISTRAR / ACTUALIZAR DISPOSITIVO
// POST /api/devices
// Usado por el ESP32 al conectarse
// ============================================
router.post("/", protectOrDeviceKey, async (req, res) => {
  try {
    const { deviceId, sector } = req.body;

    if (!deviceId || !sector) {
      return res.status(400).json({ error: "deviceId y sector son requeridos" });
    }

    // Upsert — crea si no existe, actualiza si existe
    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        deviceId,
        sector,
        status:         "Online",
        lastConnection: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Dispositivo registrado/actualizado", device });
  } catch (error) {
    res.status(400).json({ error: errProd("Error al registrar dispositivo", error) });
  }
});

// ============================================
// 🔹 HEARTBEAT — ESP32 reporta que sigue vivo
// PUT /api/devices/:deviceId/heartbeat
// ============================================
router.put("/:deviceId/heartbeat", protectOrDeviceKey, async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { status: "Online", lastConnection: new Date() },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: "Dispositivo no encontrado" });
    }

    res.json({ message: "Heartbeat recibido", device });
  } catch (error) {
    res.status(500).json({ error: errProd("Error al procesar heartbeat", error) });
  }
});

// ============================================
// 🔹 MARCAR DISPOSITIVO OFFLINE
// PUT /api/devices/:deviceId/offline
// ============================================
router.put("/:deviceId/offline", protectOrDeviceKey, async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { status: "Offline" },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: "Dispositivo no encontrado" });
    }

    res.json({ message: "Dispositivo marcado offline", device });
  } catch (error) {
    res.status(500).json({ error: errProd("Error al actualizar dispositivo", error) });
  }
});

// ============================================
// 🔹 ELIMINAR DISPOSITIVO
// DELETE /api/devices/:deviceId
// ============================================
router.delete("/:deviceId", protect, async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({ deviceId: req.params.deviceId });

    if (!device) {
      return res.status(404).json({ error: "Dispositivo no encontrado" });
    }

    res.json({ message: "Dispositivo eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: errProd("Error al eliminar dispositivo", error) });
  }
});

// ============================================
// 🔹 LOGS DE UN DISPOSITIVO
// GET /api/devices/:deviceId/logs
// ============================================
router.get("/:deviceId/logs", protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const visibleDevices = await resolveVisibleDevices(req);
    const allowedDeviceIds = new Set(visibleDevices.map((device) => device.deviceId));

    if (!allowedDeviceIds.has(req.params.deviceId)) {
      return res.status(404).json({ error: "Dispositivo no encontrado" });
    }

    const logs  = await Log.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("plantId", "name sector");

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: errProd("Error al obtener logs del dispositivo", error) });
  }
});

module.exports = router;
