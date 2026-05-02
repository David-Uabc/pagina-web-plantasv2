import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getGreeting } from "../../App";

function WelcomeToast() {
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const userName = user?.name || user?.username || "";
  const greeting = getGreeting(userName);
  const subtitle = userName
    ? "Todo listo para seguir cuidando tus plantas"
    : "Bienvenido de vuelta al sistema";

  useEffect(() => {
    const hour = new Date().getHours();
    const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "night";
    const today = new Date().toISOString().slice(0, 10);
    const key = `welcome_${today}_${period}`;

    if (!localStorage.getItem(key)) {
      const timeoutId = setTimeout(() => setVisible(true), prefersReducedMotion ? 250 : 600);
      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!visible) return undefined;

    const hour = new Date().getHours();
    const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "night";
    const today = new Date().toISOString().slice(0, 10);
    const key = `welcome_${today}_${period}`;

    localStorage.setItem(key, "1");
    const timeoutId = setTimeout(() => setVisible(false), 4200);
    return () => clearTimeout(timeoutId);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: prefersReducedMotion ? 0.18 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minWidth: 300,
              maxWidth: 400,
              padding: "16px 18px 18px",
              background: "rgba(8,14,10,0.97)",
              border: "1px solid rgba(52,211,153,0.24)",
              borderRadius: 20,
              boxShadow: "0 18px 46px rgba(0,0,0,0.70), 0 0 0 1px rgba(52,211,153,0.08)",
              backdropFilter: prefersReducedMotion ? "none" : "blur(20px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: "linear-gradient(90deg, transparent, #34d399, #60a5fa, transparent)",
              }}
            />

            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                flexShrink: 0,
                background: "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(96,165,250,0.20))",
                border: "1px solid rgba(52,211,153,0.30)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              {getTimeEmoji()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#6ee7b7",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 800,
                  }}
                >
                  Sesión activa
                </div>
                <button
                  onClick={() => setVisible(false)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#9fb0ba",
                    cursor: "pointer",
                    fontSize: 12,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#f0f6fc",
                  marginBottom: 4,
                }}
              >
                {greeting}
              </div>

              <div style={{ fontSize: 12, color: "#9aa9b3", lineHeight: 1.5 }}>
                {subtitle}
              </div>
            </div>

            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: "linear" }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
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
  const hour = new Date().getHours();
  if (hour < 12) return "🌅";
  if (hour < 18) return "☀️";
  return "🌙";
}

export default WelcomeToast;
