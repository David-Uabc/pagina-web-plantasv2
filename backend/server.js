const express    = require("express");
const cors       = require("cors");
const dotenv     = require("dotenv");
const http       = require("http");
const { Server } = require("socket.io");
const connectDB  = require("./src/config/db");
const simulator  = require("./src/mqtt/simulator");
const scheduler  = require("./src/jobs/scheduleRunner");

dotenv.config();

const app    = express();
const server = http.createServer(app);  // ✅ HTTP server para Socket.io

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

// ── Socket.io ────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
});

// Hacer io accesible en toda la app
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// ── Base de datos ────────────────────────────────────
connectDB();

// ── Middlewares ──────────────────────────────────────
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas ────────────────────────────────────────────
app.use("/api/plants",  require("./src/routes/plants.routes"));
app.use("/api/auth",    require("./src/routes/auth.routes"));
app.use("/api/stats",   require("./src/routes/stats.routes"));
app.use("/api/devices", require("./src/routes/devices.routes"));
app.use("/api/mqtt",    require("./src/routes/mqtt.routes"));
app.use("/api/iot",     require("./src/routes/iot.routes"));   // ✅ Ruta pública ESP32

// ── Ruta base ────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Servidor IoT Riego Inteligente funcionando",
    version: "3.0",
    routes: {
      plants:  "/api/plants",
      auth:    "/api/auth",
      stats:   "/api/stats",
      devices: "/api/devices",
      mqtt:    "/api/mqtt",
      iot:     "/api/iot",  // ESP32 public endpoint
    },
  });
});

// ── 404 handler ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada` });
});

// ── Iniciar servidor ─────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🔥 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 Socket.io activo`);
  console.log(`🌿 API disponible en http://localhost:${PORT}/api`);

  // Simulador (solo si está habilitado)
  if (process.env.MQTT_SIMULATOR === "true") {
    simulator.startSimulator(io);
  } else {
    console.log("💡 Simulador MQTT en standby — actívalo en POST /api/mqtt/start");
  }

  // ✅ Scheduler de riegos programados (siempre activo)
  scheduler.start(io);
});