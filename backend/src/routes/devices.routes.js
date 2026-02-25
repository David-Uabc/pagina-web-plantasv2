const express = require("express");
const router  = express.Router();
const Device  = require("../models/Device");
const Log     = require("../models/Log");

// ============================================
// 🔹 OBTENER TODOS LOS DISPOSITIVOS
// GET /api/devices
// ============================================
router.get("/", async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 REGISTRAR / ACTUALIZAR DISPOSITIVO
// POST /api/devices
// Usado por el ESP32 al conectarse
// ============================================
router.post("/", async (req, res) => {
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
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// 🔹 HEARTBEAT — ESP32 reporta que sigue vivo
// PUT /api/devices/:deviceId/heartbeat
// ============================================
router.put("/:deviceId/heartbeat", async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 MARCAR DISPOSITIVO OFFLINE
// PUT /api/devices/:deviceId/offline
// ============================================
router.put("/:deviceId/offline", async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 ELIMINAR DISPOSITIVO
// DELETE /api/devices/:deviceId
// ============================================
router.delete("/:deviceId", async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({ deviceId: req.params.deviceId });

    if (!device) {
      return res.status(404).json({ error: "Dispositivo no encontrado" });
    }

    res.json({ message: "Dispositivo eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 LOGS DE UN DISPOSITIVO
// GET /api/devices/:deviceId/logs
// ============================================
router.get("/:deviceId/logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs  = await Log.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("plantId", "name sector");

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;