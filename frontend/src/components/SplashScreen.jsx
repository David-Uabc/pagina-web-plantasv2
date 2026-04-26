import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * SplashScreen — aparece 1.2s al cargar la app por primera vez
 * Uso: envuelve <App /> o ponlo dentro de App.jsx
 */
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("in"); // in → visible → out

  useEffect(() => {
    // Fase visible durante 1s, luego sale
    const t1 = setTimeout(() => setPhase("out"), 1200);
    const t2 = setTimeout(() => onDone?.(), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          onAnimationComplete={() => { if (phase === "out") setPhase("done"); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999999,
            background: "#080a0e",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 20,
          }}
        >
          {/* Glow de fondo */}
          <div style={{
            position: "absolute", width: 400, height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 65%)",
            filter: "blur(60px)", pointerEvents: "none",
          }} />

          {/* Logo animado */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ position: "relative" }}
          >
            {/* Anillos pulsantes */}
            {[1, 2].map(i => (
              <motion.div key={i}
                animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  inset: -(i * 16),
                  borderRadius: "50%",
                  border: "1px solid rgba(52,211,153,0.3)",
                }}
              />
            ))}

            <div style={{
              width: 80, height: 80, borderRadius: 22,
              background: "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(96,165,250,0.20))",
              border: "1px solid rgba(52,211,153,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40,
              boxShadow: "0 0 40px rgba(52,211,153,0.20)",
            }}>💧</div>
          </motion.div>

          {/* Título */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ textAlign: "center" }}
          >
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 22, fontWeight: 800,
              backgroundImage: "linear-gradient(135deg, #f0f6fc, #34d399)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", marginBottom: 6,
            }}>Sistema de RiegoIQ</div>
            <div style={{ fontSize: 13, color: "#78909c" }}>
              Cargando tu sistema...
            </div>
          </motion.div>

          {/* Barra de carga */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ width: 180, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.0, delay: 0.4, ease: "easeInOut" }}
              style={{
                height: "100%", borderRadius: 99,
                background: "linear-gradient(90deg, #34d399, #60a5fa)",
                boxShadow: "0 0 10px rgba(52,211,153,0.5)",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashScreen;
