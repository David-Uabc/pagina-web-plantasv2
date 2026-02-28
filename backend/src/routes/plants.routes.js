// routes/plants.routes.js
const express  = require("express");
const router   = express.Router();
const Plant    = require("../models/Plant");
const Log      = require("../models/Log");
const { protect } = require("../middleware/auth");
const { processReading } = require("./iot.routes");

router.use(protect);

// GET /api/plants
router.get("/", async (req, res) => {
  try {
    const plants = await Plant.find({ owner: req.user._id }).sort({ order: 1, createdAt: -1 });
    res.json(plants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/plants
router.post("/", async (req, res) => {
  try {
    const plant = new Plant({ ...req.body, owner: req.user._id });
    await plant.save();
    res.status(201).json(plant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/plants/:id
router.put("/:id", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const io      = req.app.get("io");
    const updated = await Plant.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // ✅ Emitir cambio en tiempo real (incluye cambio manual de válvula)
    if (io) {
      io.emit("plant:update", {
        _id:             updated._id.toString(),
        name:            updated.name,
        sector:          updated.sector,
        currentHumidity: updated.currentHumidity,
        valveStatus:     updated.valveStatus,
        lastIrrigation:  updated.lastIrrigation,
        minHumidity:     updated.minHumidity,
        maxHumidity:     updated.maxHumidity,
        alertHistory:    updated.alertHistory,
        schedule:        updated.schedule,
        notes:           updated.notes,
        order:           updated.order,
      });

      // Notificar al ESP32 indirectamente via evento de socket
      io.emit("valve:command", {
        sector:  updated.sector,
        command: updated.valveStatus,
        plantId: updated._id.toString(),
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/plants/:id
router.delete("/:id", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    await Plant.findByIdAndDelete(req.params.id);
    await Log.deleteMany({ plantId: req.params.id });

    const io = req.app.get("io");
    if (io) io.emit("plant:deleted", { _id: req.params.id });

    res.json({ message: "Planta eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/plants/:id/humidity — mantener para compatibilidad
router.post("/:id/humidity", async (req, res) => {
  try {
    const { humidity, deviceId } = req.body;
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const io = req.app.get("io");
    await processReading(plant, humidity, deviceId || "manual", io);

    res.json({ message: "Humedad actualizada", plant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/plants/:id/history — historial REAL de la DB
router.get("/:id/history", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const days = parseInt(req.query.days) || 14;
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);

    const history = plant.humidityHistory
      .filter(h => new Date(h.date) >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/plants/:id/logs
router.get("/:id/logs", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const logs = await Log.find({ plantId: req.params.id }).sort({ createdAt: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/plants/:id/alerts — historial de alertas
router.get("/:id/alerts", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const alerts = [...plant.alertHistory].reverse();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;