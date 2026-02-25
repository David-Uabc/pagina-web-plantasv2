const express = require("express");
const router  = express.Router();
const Plant   = require("../models/Plant");
const Log     = require("../models/Log");
const Device  = require("../models/Device");

// ============================================
// 🔹 ESTADÍSTICAS GENERALES DEL DASHBOARD
// GET /api/stats
// ============================================
router.get("/", async (req, res) => {
  try {
    const plants  = await Plant.find();
    const devices = await Device.find();

    const total     = plants.length;
    const watering  = plants.filter(p => p.valveStatus === "OPEN").length;
    const alerts    = plants.filter(p => p.currentHumidity < p.minHumidity).length;
    const avgHum    = total > 0
      ? Math.round(plants.reduce((s, p) => s + (p.currentHumidity || 0), 0) / total)
      : 0;

    // Por sector
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

    // Dispositivos
    const devicesOnline  = devices.filter(d => d.status === "Online").length;
    const devicesOffline = devices.filter(d => d.status === "Offline").length;

    // Último riego global
    const lastIrrigated = plants
      .filter(p => p.lastIrrigation)
      .sort((a, b) => new Date(b.lastIrrigation) - new Date(a.lastIrrigation))[0];

    res.json({
      plants: { total, watering, alerts, avgHumidity: avgHum },
      sectors: sectorStats,
      devices: { total: devices.length, online: devicesOnline, offline: devicesOffline },
      lastIrrigation: lastIrrigated?.lastIrrigation || null,
      systemStatus: {
        mqtt:     devicesOnline > 0 ? "Online" : "Offline",
        database: "Online",
        reporting: "Online",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 HISTORIAL DE HUMEDAD GLOBAL (últimas 24h)
// GET /api/stats/humidity?range=24h|week|month
// ============================================
router.get("/humidity", async (req, res) => {
  try {
    const range = req.query.range || "24h";

    const now  = new Date();
    let since;
    if (range === "24h")   since = new Date(now - 24 * 60 * 60 * 1000);
    else if (range === "week")  since = new Date(now - 7  * 24 * 60 * 60 * 1000);
    else if (range === "month") since = new Date(now - 30 * 24 * 60 * 60 * 1000);
    else since = new Date(now - 24 * 60 * 60 * 1000);

    const logs = await Log.find({ createdAt: { $gte: since } })
      .sort({ createdAt: 1 })
      .populate("plantId", "name sector");

    // Agrupar promedio por hora (24h) o por día (semana/mes)
    const grouped = {};
    logs.forEach(log => {
      let key;
      const d = new Date(log.createdAt);
      if (range === "24h") {
        key = `${d.getHours()}:00`;
      } else {
        key = d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
      }
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
// 🔹 LOGS RECIENTES (últimos 20)
// GET /api/stats/logs
// ============================================
router.get("/logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const logs  = await Log.find()
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
    const alertPlants = await Plant.find({
      $expr: { $lt: ["$currentHumidity", "$minHumidity"] },
    }).select("name sector currentHumidity minHumidity lastIrrigation");

    res.json({
      count:  alertPlants.length,
      plants: alertPlants,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;