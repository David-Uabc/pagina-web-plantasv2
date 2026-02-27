import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { getGreeting } from "../../App";

/**
 * WelcomeToast — aparece al entrar al dashboard, se cierra solo después de 4s
 * Uso: <WelcomeToast />  (dentro de Dashboard)
 */
function WelcomeToast() {
  const [visible, setVisible] = useState(false);

  const session  = JSON.parse(localStorage.getItem("iot_session") || "{}");
  const userName = session.name || session.username || "";
  const greeting = getGreeting(userName);

  // Mostrar una vez por período del día (mañana / tarde / noche)
  useEffect(() => {
    const h = new Date().getHours();
    const period = h < 12 ? "morning" : h < 18 ? "afternoon" : "night";
    const today  = new Date().toISOString().slice(0, 10); // "2026-02-26"
    const key    = `welcome_${today}_${period}`;

    const shown = localStorage.getItem(key);
    if (!shown) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      const h      = new Date().getHours();
      const period = h < 12 ? "morning" : h < 18 ? "afternoon" : "night";
      const today  = new Date().toISOString().slice(0, 10);
      const key    = `welcome_${today}_${period}`;
      localStorage.setItem(key, "1");
      const t = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0,  scale: 1   }}
          exit={{    opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            bottom: 28, left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
            pointerEvents: "none",
          }}
        >
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 20px",
            background: "rgba(8,14,10,0.97)",
            border: "1px solid rgba(52,211,153,0.25)",
            borderRadius: 18,
            boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(52,211,153,0.08)",
            backdropFilter: "blur(20px)",
            minWidth: 260, maxWidth: 360,
            position: "relative", overflow: "hidden",
          }}>
            {/* Accent top */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, transparent, #34d399, #60a5fa, transparent)",
            }} />

            {/* Avatar */}
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(96,165,250,0.20))",
              border: "1px solid rgba(52,211,153,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>
              {getTimeEmoji()}
            </div>

            {/* Texto */}
            <div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15, fontWeight: 800, color: "#f0f6fc",
                marginBottom: 2,
              }}>{greeting}</div>
              <div style={{ fontSize: 12, color: "#78909c" }}>
                Bienvenido al sistema de riego 🌱
              </div>
            </div>

            {/* Barra de progreso que se vacía en 4s */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 3.8, ease: "linear" }}
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg, #34d399, #60a5fa)",
                transformOrigin: "left",
                borderRadius: "0 0 18px 18px",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getTimeEmoji() {
  const h = new Date().getHours();
  if (h < 12) return "🌅";
  if (h < 18) return "☀️";
  return "🌙";
}

export default WelcomeToast;