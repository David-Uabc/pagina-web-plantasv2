import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("in");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const exitDelay = prefersReducedMotion ? 450 : 1200;
    const doneDelay = prefersReducedMotion ? 700 : 1800;
    const timeout1 = setTimeout(() => setPhase("out"), exitDelay);
    const timeout2 = setTimeout(() => onDone?.(), doneDelay);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [onDone, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.2 : 0.5, ease: "easeInOut" }}
          onAnimationComplete={() => {
            if (phase === "out") setPhase("done");
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999999,
            background: "#080a0e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 65%)",
              filter: prefersReducedMotion ? "blur(30px)" : "blur(60px)",
              pointerEvents: "none",
            }}
          />

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0.25 : 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ position: "relative" }}
          >
            {!prefersReducedMotion && [1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, delay: index * 0.4, repeat: Infinity, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  inset: -(index * 16),
                  borderRadius: "50%",
                  border: "1px solid rgba(52,211,153,0.3)",
                }}
              />
            ))}

            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                background: "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(96,165,250,0.20))",
                border: "1px solid rgba(52,211,153,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                boxShadow: "0 0 40px rgba(52,211,153,0.20)",
              }}
            >
              💧
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: prefersReducedMotion ? 0.2 : 0.5 }}
            style={{ textAlign: "center" }}
          >
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                backgroundImage: "linear-gradient(135deg, #f0f6fc, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: 6,
              }}
            >
              Sistema RiegoIQ
            </div>
            <div style={{ fontSize: 13, color: "#78909c" }}>
              Cargando tu sistema...
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ width: 180, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: prefersReducedMotion ? 0.35 : 1, delay: 0.25, ease: "easeInOut" }}
              style={{
                height: "100%",
                borderRadius: 99,
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
