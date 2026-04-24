// routes/mqtt.routes.js
const express   = require("express");
const router    = express.Router();
const simulator = require("../mqtt/simulator");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/status", (req, res) => {
  res.json(simulator.getStatus());
});

router.post("/start", (req, res) => {
  const io = req.app.get("io");
  simulator.startSimulator(io);
  res.json({ message: "Simulador iniciado", status: simulator.getStatus() });
});

router.post("/stop", (req, res) => {
  simulator.stopSimulator();
  res.json({ message: "Simulador detenido", status: simulator.getStatus() });
});

module.exports = router;
