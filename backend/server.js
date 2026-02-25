const express    = require("express");
const cors       = require("cors");
const dotenv     = require("dotenv");
const connectDB  = require("./src/config/db");
const simulator  = require("./src/mqtt/simulator");

dotenv.config();

const app = express();

// ── Base de datos ────────────────────────────────────
connectDB();

// ── Middlewares ──────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
}));
app.use(express.json());

// ── Rutas ────────────────────────────────────────────
app.use("/api/plants",  require("./src/routes/plants.routes"));
app.use("/api/auth",    require("./src/routes/auth.routes"));
app.use("/api/stats",   require("./src/routes/stats.routes"));
app.use("/api/devices", require("./src/routes/devices.routes"));
app.use("/api/mqtt",    require("./src/routes/mqtt.routes"));

// ── Ruta base ────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Servidor IoT Riego Inteligente funcionando",
    version: "2.0",
    routes: {
      plants:  "/api/plants",
      auth:    "/api/auth",
      stats:   "/api/stats",
      devices: "/api/devices",
      mqtt:    "/api/mqtt",
    },
  });
});

// ── 404 handler ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada` });
});

// ── Iniciar servidor ─────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🔥 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);

  // Iniciar simulador MQTT automáticamente
  if (process.env.MQTT_SIMULATOR === "true") {
    simulator.startSimulator();
  } else {
    console.log("💡 Simulador MQTT en standby — actívalo en POST /api/mqtt/start");
  }
});