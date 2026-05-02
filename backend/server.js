const express       = require("express");
const cors          = require("cors");
const dotenv        = require("dotenv");
const http          = require("http");
const helmet        = require("helmet");
const rateLimit     = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss           = require("xss-clean");
const cookieParser  = require("cookie-parser");
const { Server }    = require("socket.io");
const connectDB     = require("./src/config/db");
const simulator     = require("./src/mqtt/simulator");
const scheduler     = require("./src/jobs/scheduleRunner");
const { resolveSocketUser, roomForUser } = require("./src/utils/socketRooms");

dotenv.config();

const app    = express();
const server = http.createServer(app);
const isDev  = process.env.NODE_ENV !== "production";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://riego-iot-frontend.onrender.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

// ── Socket.io ─────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"], credentials: true },
});
app.set("io", io);

io.use(async (socket, next) => {
  try {
    const user = await resolveSocketUser(socket);
    socket.user = user;
    next();
  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {
  if (socket.user?._id) {
    socket.join(roomForUser(socket.user._id));
  }
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  socket.on("disconnect", () => console.log(`❌ Desconectado: ${socket.id}`));
});

// ── Base de datos ─────────────────────────────────────
connectDB();

// ── Helmet ────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameAncestors: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isDev ? null : [],
    },
  },
}));

// ── Rate Limiting ─────────────────────────────────────
// ✅ En desarrollo LOCAL se omite el rate limit para no
//    bloquear las peticiones duplicadas del React StrictMode
const skipInDev = () => isDev;

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Demasiadas peticiones. Por favor espera 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev, // ✅ en desarrollo no limita
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos de acceso. Por favor espera 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev, // ✅ en desarrollo no limita
});

const iotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Límite de peticiones del dispositivo IoT alcanzado." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

app.use(generalLimiter);

// ── Middlewares ───────────────────────────────────────
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,            // ✅ necesario para cookies httpOnly
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","x-device-id","x-api-key"],
}));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());

// ── Rutas ─────────────────────────────────────────────
app.use("/api/auth",          authLimiter, require("./src/routes/auth.routes"));
app.use("/api/iot",           iotLimiter,  require("./src/routes/iot.routes"));
app.use("/api/plants",                     require("./src/routes/plants.routes"));
app.use("/api/stats",                      require("./src/routes/stats.routes"));
app.use("/api/devices",                    require("./src/routes/devices.routes"));
app.use("/api/mqtt",                       require("./src/routes/mqtt.routes"));
app.use("/api/notifications",              require("./src/routes/notifications.routes"));

// ── Ruta base ─────────────────────────────────────────
app.get("/", (req, res) => res.json({
  message: "🚀 RiegoIQ — Sistema de Riego IoT",
  version: "3.1",
  status:  "online",
  env:     process.env.NODE_ENV || "development",
}));

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada` });
});

// ── Error handler global ──────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    error: isDev ? err.message : "Ocurrió un error en el servidor.",
  });
});

// ── Iniciar servidor ──────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🔥 RiegoIQ en http://localhost:${PORT}`);
  console.log(`🛡️  Seguridad: Helmet + ${isDev ? "Rate Limit DESACTIVADO (dev)" : "Rate Limit ACTIVO (prod)"}`);
  console.log(`🍪 Cookie Parser activo — soporte refresh token`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 CORS permitido para: ${ALLOWED_ORIGINS.join(", ")}\n`);

  if (process.env.MQTT_SIMULATOR === "true") {
    simulator.startSimulator(io);
  }

  scheduler.start(io);

  // ✅ Cliente MQTT del backend — recibe sensores y publica comandos de válvula
  const { startMqttClient } = require("./src/mqtt/mqttClient");
  startMqttClient(io);
});
