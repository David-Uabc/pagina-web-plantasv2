const express = require("express");
const router = express.Router();
const Plant = require("../models/Plant");
const Log = require("../models/Log");


// =============================
// 🔹 OBTENER TODAS LAS PLANTAS
// =============================
router.get("/", async (req, res) => {
  try {
    const plants = await Plant.find().sort({ createdAt: -1 });
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
    const newPlant = new Plant(req.body);
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
    const updatedPlant = await Plant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedPlant) {
      return res.status(404).json({ message: "Planta no encontrada" });
    }

    res.json(updatedPlant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =============================
// 🔹 ELIMINAR PLANTA
// =============================
router.delete("/:id", async (req, res) => {
  try {
    const deletedPlant = await Plant.findByIdAndDelete(req.params.id);

    if (!deletedPlant) {
      return res.status(404).json({ message: "Planta no encontrada" });
    }

    // También eliminamos logs relacionados
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

    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({ message: "Planta no encontrada" });
    }

    plant.currentHumidity = humidity;

    // 🔥 Guardamos en historial interno
    plant.humidityHistory.push({
      humidity,
      date: new Date()
    });

    let irrigationExecuted = false;
    let valveStatus = "CLOSED";

    // 🔥 LÓGICA INTELIGENTE CON MIN Y MAX
    if (humidity < plant.minHumidity) {
      plant.valveStatus = "OPEN";
      plant.lastIrrigation = new Date();
      irrigationExecuted = true;
      valveStatus = "OPEN";
    } 
    else if (humidity >= plant.maxHumidity) {
      plant.valveStatus = "CLOSED";
      valveStatus = "CLOSED";
    }

    await plant.save();

    // 🔥 Guardamos log externo
    const newLog = await Log.create({
      plantId: plant._id,
      deviceId: deviceId || "ESP32-SIM",
      sector: sector || plant.sector,
      humidity,
      irrigationExecuted,
      valveStatus
    });

    res.status(201).json({
      message: "Humedad actualizada correctamente",
      plant,
      log: newLog
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// ============================================
// 🔹 OBTENER HISTORIAL DE LOGS
// ============================================
router.get("/:id/logs", async (req, res) => {
  try {
    const logs = await Log.find({ plantId: req.params.id })
      .sort({ createdAt: 1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ============================================
// 🔹 OBTENER HISTORIAL INTERNO (del Plant)
// ============================================
router.get("/:id/history", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({ message: "Planta no encontrada" });
    }

    res.json(plant.humidityHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
