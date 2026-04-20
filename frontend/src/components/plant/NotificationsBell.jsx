// components/NotificationsBell.jsx
// Botón en el navbar para activar/desactivar notificaciones push PWA
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import usePushNotifications from "../hooks/usePushNotifications";
import api from "../utils/api";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const {
    permiso, suscrito, cargando, error,
    activar, desactivar,
  } = usePushNotifications();

  const probarNotificacion = async () => {
    try {
      await api.post("/api/notifications/test");
    } catch (err) {
      console.error("Error enviando notificación de prueba:", err);
    }
  };

  // Color del icono según estado
  const color = suscrito && permiso === "granted"
    ? "#34d399"   // activo — verde
    : permiso === "denied"
      ? "#f87171" // bloqueado — rojo
      : "#78909c"; // inactivo — gris

  return (
    <div style={{ position: "relative" }}>
      {/* Botón campana */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 38, height: 38, borderRadius: 10,
          border: `1px solid ${suscrito ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.09)"}`,
          background: suscrito ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.04)",
          color, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, transition: "all 0.18s", position: "relative",
        }}
        title={suscrito ? "Notificaciones activas" : "Activar notificaciones"}
      >
        🔔
        {/* Punto verde si está suscrito */}
        {suscrito && (
          <span style={{
            position: "absolute", top: -3, right: -3,
            width: 10, height: 10, borderRadius: "50%",
            background: "#34d399",
            border: "2px solid var(--bg-base, #080a0e)",
          }} />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay para cerrar */}
            <div
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 998 }}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: 300, zIndex: 999,
                background: "rgba(6,12,8,0.99)",
                border: "1px solid rgba(52,211,153,0.18)",
                borderRadius: 18, overflow: "hidden",
                boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
              }}
            >
              {/* Accent top */}
              <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#34d399,transparent)" }} />

              <div style={{ padding: "18px 18px 16px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f0f6fc", marginBottom: 4, fontFamily: "'Syne',sans-serif" }}>
                  🔔 Notificaciones push
                </div>
                <div style={{ fontSize: 12, color: "#5a7a66", marginBottom: 16, lineHeight: 1.5 }}>
                  Recibe alertas en tu celular cuando una planta necesite agua, incluso con la app cerrada
                </div>

                {/* Estado actual */}
                <div style={{
                  padding: "10px 13px", borderRadius: 12, marginBottom: 14,
                  background: suscrito
                    ? "rgba(52,211,153,0.08)"
                    : permiso === "denied"
                      ? "rgba(248,113,113,0.08)"
                      : "rgba(255,255,255,0.04)",
                  border: suscrito
                    ? "1px solid rgba(52,211,153,0.2)"
                    : permiso === "denied"
                      ? "1px solid rgba(248,113,113,0.2)"
                      : "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>
                      {suscrito ? "✅" : permiso === "denied" ? "🚫" : "⭕"}
                    </span>
                    <div>
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: suscrito ? "#34d399" : permiso === "denied" ? "#f87171" : "#94a3b8",
                        marginBottom: 1,
                      }}>
                        {suscrito
                          ? "Notificaciones activas"
                          : permiso === "denied"
                            ? "Notificaciones bloqueadas"
                            : "Notificaciones inactivas"}
                      </div>
                      <div style={{ fontSize: 11, color: "#4d7a5e", lineHeight: 1.4 }}>
                        {suscrito
                          ? "Recibirás alertas de humedad en tiempo real"
                          : permiso === "denied"
                            ? "Ve a Configuración del navegador para desbloquear"
                            : "Toca el botón para activarlas"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    padding: "9px 12px", borderRadius: 10, marginBottom: 12,
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.2)",
                    fontSize: 12, color: "#f87171", lineHeight: 1.5,
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* Botones de acción */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {!suscrito && permiso !== "denied" && (
                    <button
                      onClick={activar}
                      disabled={cargando}
                      style={{
                        width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
                        background: cargando
                          ? "rgba(52,211,153,0.3)"
                          : "linear-gradient(135deg,#059669,#34d399)",
                        color: cargando ? "#5a7a66" : "#000",
                        fontWeight: 800, fontSize: 14, cursor: cargando ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        fontFamily: "'Inter',sans-serif",
                        transition: "all 0.2s",
                      }}
                    >
                      {cargando ? (
                        <><div style={spinnerStyle} /> Activando...</>
                      ) : (
                        "🔔 Activar notificaciones"
                      )}
                    </button>
                  )}

                  {suscrito && (
                    <>
                      <button
                        onClick={probarNotificacion}
                        style={{
                          width: "100%", padding: "10px 0", borderRadius: 11,
                          border: "1px solid rgba(52,211,153,0.25)",
                          background: "rgba(52,211,153,0.07)",
                          color: "#34d399", fontWeight: 700, fontSize: 13,
                          cursor: "pointer", fontFamily: "'Inter',sans-serif",
                        }}
                      >
                        🧪 Enviar notificación de prueba
                      </button>
                      <button
                        onClick={desactivar}
                        disabled={cargando}
                        style={{
                          width: "100%", padding: "10px 0", borderRadius: 11,
                          border: "1px solid rgba(248,113,113,0.2)",
                          background: "rgba(248,113,113,0.06)",
                          color: "#f87171", fontWeight: 600, fontSize: 12,
                          cursor: "pointer", fontFamily: "'Inter',sans-serif",
                        }}
                      >
                        Desactivar notificaciones
                      </button>
                    </>
                  )}

                  {permiso === "denied" && (
                    <div style={{ fontSize: 12, color: "#5a7a66", lineHeight: 1.6, textAlign: "center" }}>
                      Para activarlas ve a:<br />
                      <strong style={{ color: "#94a3b8" }}>Configuración del navegador → Notificaciones → riego-iot-frontend.onrender.com → Permitir</strong>
                    </div>
                  )}
                </div>

                {/* Qué notificaciones recibirás */}
                {!suscrito && permiso !== "denied" && (
                  <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4d7a5e", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                      Recibirás alertas de:
                    </div>
                    {[
                      ["🚨", "Humedad baja — planta necesita agua"],
                      ["💧", "Riego automático ejecutado"],
                      ["✅", "Planta recuperada — humedad normalizada"],
                      ["🔧", "Mantenimiento programado"],
                    ].map(([icon, text]) => (
                      <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 12, color: "#78909c" }}>
                        <span>{icon}</span><span>{text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const spinnerStyle = {
  width: 14, height: 14, borderRadius: "50%",
  border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000",
  animation: "spin 0.7s linear infinite",
};