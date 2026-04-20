const mongoose = require("mongoose");
const path     = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Plant  = require("../models/Plant");
const Device = require("../models/Device");
const User   = require("../models/User");

const DEMO_PLANTS = [
  { name: "Lavanda",  sector: "Superior", minHumidity: 30, maxHumidity: 70, currentHumidity: 45, irrigationType: "Diario",      imageUrl: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80" },
  { name: "Menta",    sector: "Superior", minHumidity: 40, maxHumidity: 80, currentHumidity: 35, irrigationType: "Semanal",     imageUrl: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&q=80" },
  { name: "Albahaca", sector: "Superior", minHumidity: 35, maxHumidity: 75, currentHumidity: 62, irrigationType: "Por humedad", imageUrl: "https://images.unsplash.com/photo-1600231915210-7e8b1e9e39c0?w=400&q=80" },
  { name: "Romero",   sector: "Superior", minHumidity: 25, maxHumidity: 60, currentHumidity: 18, irrigationType: "Quincenal",   imageUrl: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=400&q=80" },
  { name: "Rosa",     sector: "Inferior", minHumidity: 35, maxHumidity: 70, currentHumidity: 28, irrigationType: "Diario",      imageUrl: "https://images.unsplash.com/photo-1561181286-d3f8d8d4f8e0?w=400&q=80" },
  { name: "Cactus",   sector: "Inferior", minHumidity: 10, maxHumidity: 40, currentHumidity: 22, irrigationType: "Quincenal",   imageUrl: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&q=80" },
  { name: "Girasol",  sector: "Inferior", minHumidity: 40, maxHumidity: 80, currentHumidity: 55, irrigationType: "Semanal",     imageUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&q=80" },
  { name: "Gardenia", sector: "Inferior", minHumidity: 45, maxHumidity: 75, currentHumidity: 12, irrigationType: "Por humedad", imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80" },
];

const DEMO_DEVICES = [
  { deviceId: "ESP32-SUP-01", sector: "Superior", status: "Offline" },
  { deviceId: "ESP32-INF-01", sector: "Inferior", status: "Offline" },
];

function generateHistory(baseHumidity, days = 30) {
  const history = [];
  let current = baseHumidity;
  const now = Date.now();
  const DAY = 86400000;
  for (let i = days; i >= 0; i--) {
    current = Math.max(5, Math.min(95, current + (Math.random() * 10 - 5)));
    history.push({ humidity: Math.round(current), date: new Date(now - i * DAY) });
  }
  return history;
}

async function seed() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/riego_iot";
    console.log("🔌 Conectando a:", uri.substring(0, 50) + "...");
    await mongoose.connect(uri);
    console.log("✅ Conectado a MongoDB\n");

    // ── Borrar datos existentes del usuario demo para empezar limpio ──
    const existingUser = await User.findOne({ username: "david" });
    if (existingUser) {
      await Plant.deleteMany({ owner: existingUser._id });
      await Device.deleteMany({ owner: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      console.log("🧹 Datos anteriores del usuario demo eliminados");
    }

    // ── Crear usuario demo ──
    const demoUser = await User.create({
      name:     "David",
      username: "david",
      email:    "david@riego.iot",
      password: "david123",
      role:     "admin",
    });
    console.log("👤 Usuario demo creado — david / david123");

    // ── Crear plantas ──
    const plantsToInsert = DEMO_PLANTS.map(p => ({
      ...p,
      owner:           demoUser._id,
      valveStatus:     p.currentHumidity < p.minHumidity ? "OPEN" : "CLOSED",
      humidityHistory: generateHistory(p.currentHumidity),
      lastWatered:     new Date(Date.now() - Math.random() * 48 * 3600000),
    }));
    await Plant.insertMany(plantsToInsert);
    console.log(`🌿 ${DEMO_PLANTS.length} plantas demo creadas`);

    // ── Crear dispositivos ──
    const devicesToInsert = DEMO_DEVICES.map(d => ({
      ...d,
      owner:    demoUser._id,
      lastSeen: new Date(),
    }));
    await Device.insertMany(devicesToInsert);
    console.log(`📡 ${DEMO_DEVICES.length} dispositivos ESP32 creados`);

    // ── Resumen ──
    const totalUsers   = await User.countDocuments();
    const totalPlants  = await Plant.countDocuments();
    const totalDevices = await Device.countDocuments();

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Seed completado");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Estado actual de la BD:`);
    console.log(`   • ${totalUsers}  usuarios totales`);
    console.log(`   • ${totalPlants}  plantas totales`);
    console.log(`   • ${totalDevices}  dispositivos totales`);
    console.log("\n🔑 Cuenta demo:");
    console.log("   Usuario: david | Contraseña: david123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error.message);
    process.exit(1);
  }
}

seed();