const express = require("express");
const router  = express.Router();
const Plant   = require("../models/Plant");
const Log     = require("../models/Log");
const Device  = require("../models/Device");
const { protect } = require("../middleware/auth");
const { findVisibleDevicesForUser } = require("../utils/deviceOwnership");

// Todas las rutas requieren autenticación
router.use(protect);

// ============================================
// 🔹 ESTADÍSTICAS GENERALES DEL DASHBOARD
// GET /api/stats
// ============================================
router.get("/", async (req, res) => {
  try {
    const userId  = req.user._id;
    const plants  = await Plant.find({ owner: userId });
    const devices = await findVisibleDevicesForUser(userId);

    const total    = plants.length;
    const watering = plants.filter(p => p.valveStatus === "OPEN").length;
    const alerts   = plants.filter(p => p.currentHumidity < p.minHumidity).length;
    const avgHum   = total > 0
      ? Math.round(plants.reduce((s, p) => s + (p.currentHumidity || 0), 0) / total)
      : 0;

    const superior = plants.filter(p => p.sector === "Superior");
    const inferior = plants.filter(p => p.sector === "Inferior");

    const sectorStats = {
      Superior: {
        total:    superior.length,
        watering: superior.filter(p => p.valveStatus === "OPEN").length,
        alerts:   superior.filter(p => p.currentHumidity < p.minHumidity).length,
        avgHum:   superior.length > 0
          ? Math.round(superior.reduce((s, p) => s + (p.currentHumidity || 0), 0) / superior.length)
          : 0,
      },
      Inferior: {
        total:    inferior.length,
        watering: inferior.filter(p => p.valveStatus === "OPEN").length,
        alerts:   inferior.filter(p => p.currentHumidity < p.minHumidity).length,
        avgHum:   inferior.length > 0
          ? Math.round(inferior.reduce((s, p) => s + (p.currentHumidity || 0), 0) / inferior.length)
          : 0,
      },
    };

    const devicesOnline  = devices.filter(d => d.status === "Online").length;
    const devicesOffline = devices.filter(d => d.status === "Offline").length;

    const lastIrrigated = plants
      .filter(p => p.lastIrrigation)
      .sort((a, b) => new Date(b.lastIrrigation) - new Date(a.lastIrrigation))[0];

    res.json({
      plants:    { total, watering, alerts, avgHumidity: avgHum },
      sectors:   sectorStats,
      devices:   { total: devices.length, online: devicesOnline, offline: devicesOffline },
      lastIrrigation: lastIrrigated?.lastIrrigation || null,
      systemStatus: {
        mqtt:      devicesOnline > 0 ? "Online" : "Offline",
        database:  "Online",
        reporting: "Online",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 HISTORIAL DE HUMEDAD
// GET /api/stats/humidity?range=24h|week|month
// ============================================
router.get("/humidity", async (req, res) => {
  try {
    const userId = req.user._id;
    const range  = req.query.range || "24h";

    const now = new Date();
    let since;
    if      (range === "24h")   since = new Date(now - 24 * 60 * 60 * 1000);
    else if (range === "week")  since = new Date(now - 7  * 24 * 60 * 60 * 1000);
    else if (range === "month") since = new Date(now - 30 * 24 * 60 * 60 * 1000);
    else since = new Date(now - 24 * 60 * 60 * 1000);

    // Solo logs de plantas del usuario
    const userPlants = await Plant.find({ owner: userId }).select("_id");
    const plantIds   = userPlants.map(p => p._id);

    const logs = await Log.find({
      plantId:   { $in: plantIds },
      createdAt: { $gte: since },
    }).sort({ createdAt: 1 }).populate("plantId", "name sector");

    const grouped = {};
    logs.forEach(log => {
      const d = new Date(log.createdAt);
      const key = range === "24h"
        ? `${d.getHours()}:00`
        : d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
      if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
      grouped[key].sum   += log.humidity;
      grouped[key].count += 1;
    });

    const data = Object.entries(grouped).map(([label, { sum, count }]) => ({
      label,
      avgHumidity: Math.round(sum / count),
    }));

    res.json({ range, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 LOGS RECIENTES
// GET /api/stats/logs
// ============================================
router.get("/logs", async (req, res) => {
  try {
    const userId     = req.user._id;
    const limit      = parseInt(req.query.limit) || 20;
    const userPlants = await Plant.find({ owner: userId }).select("_id");
    const plantIds   = userPlants.map(p => p._id);

    const logs = await Log.find({ plantId: { $in: plantIds } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("plantId", "name sector");

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 ALERTAS ACTIVAS
// GET /api/stats/alerts
// ============================================
router.get("/alerts", async (req, res) => {
  try {
    const userId = req.user._id;
    const alertPlants = await Plant.find({
      owner: userId,
      $expr: { $lt: ["$currentHumidity", "$minHumidity"] },
    }).select("name sector currentHumidity minHumidity lastIrrigation");

    res.json({ count: alertPlants.length, plants: alertPlants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
