const express   = require("express");
const router    = express.Router();
const simulator = require("../mqtt/simulator");

// ============================================
// 🔹 ESTADO DEL SIMULADOR
// GET /api/mqtt/status
// ============================================
router.get("/status", (req, res) => {
  res.json(simulator.getStatus());
});

// ============================================
// 🔹 INICIAR SIMULADOR
// POST /api/mqtt/start
// ============================================
router.post("/start", (req, res) => {
  simulator.startSimulator();
  res.json({ message: "Simulador MQTT iniciado", status: simulator.getStatus() });
});

// ============================================
// 🔹 DETENER SIMULADOR
// POST /api/mqtt/stop
// ============================================
router.post("/stop", (req, res) => {
  simulator.stopSimulator();
  res.json({ message: "Simulador MQTT detenido", status: simulator.getStatus() });
});

module.exports = router;