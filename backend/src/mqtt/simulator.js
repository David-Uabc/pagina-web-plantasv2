const Plant  = require("../models/Plant");
const Log    = require("../models/Log");
const Device = require("../models/Device");

// ── Configuración del simulador ───────────────────────
const DEVICES = [
  { deviceId: "ESP32-SUP-01", sector: "Superior" },
  { deviceId: "ESP32-INF-01", sector: "Inferior" },
];

const INTERVAL_MS = 10000; // cada 10 segundos
let   simulatorInterval = null;
let   isRunning         = false;

// ── Simula una lectura de humedad realista ─────────────
function simulateHumidity(current, min, max) {
  // Oscila ±3% con tendencia a bajar (evaporación natural)
  const drift  = -0.5 + Math.random() * 1.5; // tiende a bajar
  const noise  = (Math.random() - 0.5) * 4;
  let newValue = (current || 50) + drift + noise;
  // Mantener dentro de rango razonable
  newValue = Math.max(5, Math.min(95, newValue));
  return Math.round(newValue);
}

// ── Procesa una planta: lee humedad → decide válvula ──
async function processPlant(plant, deviceId) {
  const humidity = simulateHumidity(
    plant.currentHumidity,
    plant.minHumidity,
    plant.maxHumidity
  );

  plant.currentHumidity = humidity;
  plant.humidityHistory.push({ humidity, date: new Date() });

  // Mantener solo últimas 200 lecturas (evitar documentos gigantes)
  if (plant.humidityHistory.length > 200) {
    plant.humidityHistory = plant.humidityHistory.slice(-200);
  }

  let irrigationExecuted = false;
  let valveStatus        = plant.valveStatus;

  if (humidity < plant.minHumidity) {
    plant.valveStatus    = "OPEN";
    plant.lastIrrigation = new Date();
    irrigationExecuted   = true;
    valveStatus          = "OPEN";
  } else if (humidity >= plant.maxHumidity) {
    plant.valveStatus = "CLOSED";
    valveStatus       = "CLOSED";
  }

  await plant.save();

  await Log.create({
    plantId:           plant._id,
    deviceId,
    sector:            plant.sector,
    humidity,
    irrigationExecuted,
    valveStatus,
  });

  return { plantId: plant._id, name: plant.name, humidity, valveStatus };
}

// ── Tick principal del simulador ──────────────────────
async function simulatorTick() {
  try {
    // Registrar dispositivos como Online
    for (const dev of DEVICES) {
      await Device.findOneAndUpdate(
        { deviceId: dev.deviceId },
        { deviceId: dev.deviceId, sector: dev.sector, status: "Online", lastConnection: new Date() },
        { upsert: true, new: true }
      );
    }

    // Leer todas las plantas y simular por sector
    const plants = await Plant.find();
    const results = [];

    for (const plant of plants) {
      const device = DEVICES.find(d => d.sector === plant.sector) || DEVICES[0];
      const result = await processPlant(plant, device.deviceId);
      results.push(result);
    }

    console.log(`🤖 [MQTT-SIM] Tick — ${new Date().toLocaleTimeString()} — ${results.length} plantas`);
    results.forEach(r =>
      console.log(`   📊 ${r.name}: ${r.humidity}% | Válvula: ${r.valveStatus}`)
    );

  } catch (error) {
    console.error("❌ [MQTT-SIM] Error en tick:", error.message);
  }
}

// ── API pública del simulador ─────────────────────────
function startSimulator() {
  if (isRunning) {
    console.log("⚠️  [MQTT-SIM] Ya está corriendo");
    return;
  }
  simulatorInterval = setInterval(simulatorTick, INTERVAL_MS);
  isRunning = true;
  console.log(`✅ [MQTT-SIM] Simulador iniciado (cada ${INTERVAL_MS / 1000}s)`);
  simulatorTick(); // primer tick inmediato
}

function stopSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    isRunning = false;
    console.log("🛑 [MQTT-SIM] Simulador detenido");
  }
}

function getStatus() {
  return { running: isRunning, intervalMs: INTERVAL_MS, devices: DEVICES };
}

module.exports = { startSimulator, stopSimulator, getStatus };