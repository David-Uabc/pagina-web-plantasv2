const express  = require("express");
const router   = express.Router();
const Plant    = require("../models/Plant");
const Log      = require("../models/Log");
const { protect } = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(protect);

// =============================
// 🔹 OBTENER PLANTAS DEL USUARIO
// =============================
router.get("/", async (req, res) => {
  try {
    const plants = await Plant.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// 🔹 CREAR PLANTA
// =============================
router.post("/", async (req, res) => {
  try {
    const newPlant = new Plant({ ...req.body, owner: req.user._id });
    const savedPlant = await newPlant.save();
    res.status(201).json(savedPlant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// =============================
// 🔹 EDITAR PLANTA
// =============================
router.put("/:id", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const updated = await Plant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// =============================
// 🔹 ELIMINAR PLANTA
// =============================
router.delete("/:id", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    await Plant.findByIdAndDelete(req.params.id);
    await Log.deleteMany({ plantId: req.params.id });

    res.json({ message: "Planta y logs eliminados correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 RECIBIR HUMEDAD (SIMULA ESP32)
// ============================================
router.post("/:id/humidity", async (req, res) => {
  try {
    const { humidity, deviceId, sector } = req.body;
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    plant.currentHumidity = humidity;
    plant.humidityHistory.push({ humidity, date: new Date() });

    let irrigationExecuted = false;
    let valveStatus = "CLOSED";

    if (humidity < plant.minHumidity) {
      plant.valveStatus = "OPEN";
      plant.lastIrrigation = new Date();
      irrigationExecuted = true;
      valveStatus = "OPEN";
    } else if (humidity >= plant.maxHumidity) {
      plant.valveStatus = "CLOSED";
    }

    await plant.save();

    const newLog = await Log.create({
      plantId: plant._id,
      deviceId: deviceId || "ESP32-SIM",
      sector: sector || plant.sector,
      humidity,
      irrigationExecuted,
      valveStatus,
    });

    res.status(201).json({ message: "Humedad actualizada", plant, log: newLog });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// 🔹 HISTORIAL DE LOGS
// ============================================
router.get("/:id/logs", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const logs = await Log.find({ plantId: req.params.id }).sort({ createdAt: 1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 HISTORIAL INTERNO
// ============================================
router.get("/:id/history", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    res.json(plant.humidityHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;