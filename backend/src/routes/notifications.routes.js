// routes/notifications.routes.js
// Gestión de suscripciones push PWA + envío de notificaciones
// Requiere: npm install web-push

const express = require("express");
const router  = express.Router();
const webpush = require("web-push");
const { protect } = require("../middleware/auth");

// ── Modelo de suscripciones ───────────────────────────
// Guardamos las suscripciones en memoria para simplicidad
// En producción deberías guardarlas en MongoDB
const suscripciones = new Map(); // userId → [subscription, ...]

// ── Configurar VAPID ──────────────────────────────────
// Genera las claves con: npx web-push generate-vapid-keys
// Guarda el resultado en tu .env
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.MAIL_USER || "sistemariego2026@gmail.com"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log("📳 VAPID configurado correctamente");
} else {
  console.warn("⚠️  VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY no están definidos en .env");
  console.warn("    Genera las claves con: npx web-push generate-vapid-keys");
}

// ── Helper: enviar notificación a un usuario ──────────
async function enviarNotificacion(userId, payload) {
  const subs = suscripciones.get(userId.toString()) || [];
  const fallidas = [];

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(sub, JSON.stringify(payload))
        .catch(err => {
          // Si el endpoint ya no existe (410 Gone), marcar para borrar
          if (err.statusCode === 410 || err.statusCode === 404) {
            fallidas.push(sub);
          }
        })
    )
  );

  // Limpiar suscripciones inválidas
  if (fallidas.length > 0) {
    const validas = subs.filter(s => !fallidas.includes(s));
    suscripciones.set(userId.toString(), validas);
  }
}

// ── Exportar para usar en otras rutas (ej: iot.routes.js) ──
module.exports.enviarNotificacion = enviarNotificacion;
module.exports.suscripciones      = suscripciones;

// ════════════════════════════════════════
// GET /api/notifications/vapid-key
// Devuelve la clave pública VAPID al frontend
// ════════════════════════════════════════
router.get("/vapid-key", (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: "Notificaciones push no configuradas en el servidor" });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// ════════════════════════════════════════
// POST /api/notifications/subscribe
// Guarda la suscripción push del usuario
// ════════════════════════════════════════
router.post("/subscribe", protect, (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription?.endpoint) {
      return res.status(400).json({ error: "Suscripción inválida" });
    }

    const userId = req.user._id.toString();
    const subs   = suscripciones.get(userId) || [];

    // Evitar duplicados por endpoint
    const existe = subs.some(s => s.endpoint === subscription.endpoint);
    if (!existe) {
      subs.push(subscription);
      suscripciones.set(userId, subs);
    }

    res.json({ message: "Suscripción guardada correctamente" });
  } catch (err) {
    console.error("❌ Error en /subscribe:", err.message);
    res.status(500).json({ error: "Error al guardar la suscripción" });
  }
});

// ════════════════════════════════════════
// DELETE /api/notifications/unsubscribe
// Elimina la suscripción del usuario
// ════════════════════════════════════════
router.delete("/unsubscribe", protect, (req, res) => {
  try {
    const userId = req.user._id.toString();
    suscripciones.delete(userId);
    res.json({ message: "Suscripción eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar la suscripción" });
  }
});

// ════════════════════════════════════════
// POST /api/notifications/test
// Enviar notificación de prueba al usuario actual
// ════════════════════════════════════════
router.post("/test", protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const subs   = suscripciones.get(userId) || [];

    if (subs.length === 0) {
      return res.status(400).json({ error: "No tienes suscripciones activas. Activa las notificaciones primero." });
    }

    await enviarNotificacion(userId, {
      title:  "🧪 Prueba de notificación — RiegoIQ",
      body:   "Las notificaciones push están funcionando correctamente",
      type:   "ok",
      url:    "/",
    });

    res.json({ message: "Notificación de prueba enviada" });
  } catch (err) {
    console.error("❌ Error en /test:", err.message);
    res.status(500).json({ error: "Error al enviar la notificación de prueba" });
  }
});

module.exports = router;