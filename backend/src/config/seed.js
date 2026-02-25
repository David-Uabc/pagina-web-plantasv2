const mongoose = require("mongoose");
const dotenv   = require("dotenv");
dotenv.config({ path: "../../.env" });

const Plant  = require("../models/Plant");
const Device = require("../models/Device");
const User   = require("../models/User");

const PLANTS = [
  { name: "Lavanda",  sector: "Superior", minHumidity: 30, maxHumidity: 70, currentHumidity: 45, irrigationType: "Diario",      imageUrl: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80" },
  { name: "Menta",    sector: "Superior", minHumidity: 40, maxHumidity: 80, currentHumidity: 35, irrigationType: "Semanal",     imageUrl: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&q=80" },
  { name: "Albahaca", sector: "Superior", minHumidity: 35, maxHumidity: 75, currentHumidity: 62, irrigationType: "Por humedad", imageUrl: "https://images.unsplash.com/photo-1600231915210-7e8b1e9e39c0?w=400&q=80" },
  { name: "Romero",   sector: "Superior", minHumidity: 25, maxHumidity: 60, currentHumidity: 18, irrigationType: "Quincenal",   imageUrl: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=400&q=80" },
  { name: "Rosa",     sector: "Inferior", minHumidity: 35, maxHumidity: 70, currentHumidity: 28, irrigationType: "Diario",      imageUrl: "https://images.unsplash.com/photo-1561181286-d3f8d8d4f8e0?w=400&q=80" },
  { name: "Cactus",   sector: "Inferior", minHumidity: 10, maxHumidity: 40, currentHumidity: 22, irrigationType: "Quincenal",   imageUrl: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&q=80" },
  { name: "Girasol",  sector: "Inferior", minHumidity: 40, maxHumidity: 80, currentHumidity: 55, irrigationType: "Semanal",     imageUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&q=80" },
  { name: "Gardenia", sector: "Inferior", minHumidity: 45, maxHumidity: 75, currentHumidity: 12, irrigationType: "Por humedad", imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80" },
];

const DEVICES = [
  { deviceId: "ESP32-SUP-01", sector: "Superior", status: "Offline" },
  { deviceId: "ESP32-INF-01", sector: "Inferior", status: "Offline" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/riego_iot");
    console.log("✅ Conectado a MongoDB");

    // Limpiar colecciones
    await Plant.deleteMany({});
    await Device.deleteMany({});
    await User.deleteMany({});
    console.log("🗑️  Colecciones limpiadas");

    // Crear plantas con historial inicial
    const plantsWithHistory = PLANTS.map(p => ({
      ...p,
      valveStatus: p.currentHumidity < p.minHumidity ? "OPEN" : "CLOSED",
      humidityHistory: Array.from({ length: 12 }, (_, i) => ({
        humidity: Math.max(5, Math.min(95, p.currentHumidity + (Math.random() - 0.5) * 20)),
        date: new Date(Date.now() - (12 - i) * 60 * 60 * 1000),
      })),
    }));

    await Plant.insertMany(plantsWithHistory);
    console.log(`🌿 ${PLANTS.length} plantas creadas`);

    await Device.insertMany(DEVICES);
    console.log(`📡 ${DEVICES.length} dispositivos creados`);

    // Usuario admin por defecto
    await User.create({
      name:     "Administrador",
      username: "admin",
      email:    "admin@riego.iot",
      password: "admin123",
      role:     "admin",
    });
    console.log("👤 Usuario admin creado — usuario: admin / contraseña: admin123");

    console.log("\n✅ Seed completado exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  }
}

seed();