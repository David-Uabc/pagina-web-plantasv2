// mqtt/simulator.js — Simulador ESP32 con Socket.io + alertHistory
const Plant  = require("../models/Plant");
const Log    = require("../models/Log");
const Device = require("../models/Device");
const { processReading } = require("../routes/iot.routes");

const DEVICES = [
  { deviceId: "ESP32-SUP-01", sector: "Superior" },
  { deviceId: "ESP32-INF-01", sector: "Inferior" },
];

const INTERVAL_MS = 10000;
let simulatorInterval = null;
let isRunning         = false;
let _io               = null;

function simulateHumidity(current, min, max) {
  const drift  = -0.5 + Math.random() * 1.5;
  const noise  = (Math.random() - 0.5) * 4;
  let newValue = (current || 50) + drift + noise;
  return Math.round(Math.max(5, Math.min(95, newValue)));
}

async function simulatorTick() {
  try {
    for (const dev of DEVICES) {
      await Device.findOneAndUpdate(
        { deviceId: dev.deviceId },
        { deviceId: dev.deviceId, sector: dev.sector, status: "Online", lastConnection: new Date() },
        { upsert: true, new: true }
      );
      // Emitir heartbeat al frontend
      if (_io) {
        _io.emit("device:heartbeat", {
          deviceId: dev.deviceId, sector: dev.sector,
          lastConnection: new Date(), status: "Online",
        });
      }
    }

    const plants = await Plant.find();
    for (const plant of plants) {
      const device   = DEVICES.find(d => d.sector === plant.sector) || DEVICES[0];
      const humidity = simulateHumidity(plant.currentHumidity, plant.minHumidity, plant.maxHumidity);
      // Reutiliza la misma lógica del endpoint IoT real
      await processReading(plant, humidity, device.deviceId, _io);
    }

    console.log(`🤖 [SIM] Tick ${new Date().toLocaleTimeString()} — ${plants.length} plantas`);
  } catch (err) {
    console.error("❌ [SIM] Error:", err.message);
  }
}

function startSimulator(io) {
  if (isRunning) return;
  _io = io || null;
  simulatorInterval = setInterval(simulatorTick, INTERVAL_MS);
  isRunning = true;
  console.log(`✅ [SIM] Simulador iniciado (cada ${INTERVAL_MS / 1000}s)`);
  simulatorTick();
}

function stopSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    isRunning = false;
    console.log("🛑 [SIM] Simulador detenido");
  }
}

function getStatus() {
  return { running: isRunning, intervalMs: INTERVAL_MS, devices: DEVICES };
}

module.exports = { startSimulator, stopSimulator, getStatus };