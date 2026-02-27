import { motion, AnimatePresence } from "framer-motion";

/**
 * Modal de confirmación antes de activar/detener el riego
 * Props:
 *   isOpen   — boolean
 *   plant    — objeto planta
 *   isOn     — boolean (true = válvula actualmente abierta)
 *   onConfirm — fn
 *   onCancel  — fn
 */
function ConfirmIrrigationModal({ isOpen, plant, isOn, onConfirm, onCancel }) {
  if (!isOpen || !plant) return null;

  const action  = isOn ? "Detener riego" : "Iniciar riego";
  const emoji   = isOn ? "🛑" : "💧";
  const color   = isOn ? "#f87171" : "#34d399";
  const colorDim = isOn ? "rgba(248,113,113,0.12)" : "rgba(52,211,153,0.12)";
  const border  = isOn ? "rgba(248,113,113,0.30)" : "rgba(52,211,153,0.30)";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 999999,
          background: "rgba(0,0,0,0.70)", backdropFilter: "blur(14px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.85, y: 24, opacity: 0 }}
          animate={{ scale: 1,    y: 0,  opacity: 1 }}
          exit={{    scale: 0.88, y: 16, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%", maxWidth: 360,
            background: "rgba(8,14,10,0.98)",
            border: `1px solid ${border}`,
            borderRadius: 22, overflow: "hidden",
            boxShadow: `0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px ${border}`,
            position: "relative",
          }}
        >
          {/* Top accent */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }} />

          <div style={{ padding: "28px 28px 24px" }}>
            {/* Icono animado */}
            <motion.div
              animate={!isOn ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px",
                background: colorDim, border: `1px solid ${border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32,
              }}
            >{emoji}</motion.div>

            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18, fontWeight: 800, color: "#f0f6fc",
              textAlign: "center", marginBottom: 8,
            }}>
              {action}
            </div>

            <div style={{ fontSize: 13, color: "#78909c", textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
              ¿Confirmas {isOn ? "detener" : "iniciar"} el riego de{" "}
              <span style={{ color: "#f0f6fc", fontWeight: 700 }}>{plant.name}</span>?
              {!isOn && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#4d7a5e" }}>
                  Humedad actual: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{plant.currentHumidity ?? 0}%</span>
                  {" "}· Mínimo: <span style={{ color: "#f87171", fontWeight: 700 }}>{plant.minHumidity}%</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onCancel} style={{
                flex: 1, padding: "12px", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "#b0bec5", fontWeight: 600, fontSize: 14,
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>Cancelar</button>

              <motion.button
                onClick={onConfirm}
                whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
                style={{
                  flex: 2, padding: "12px", borderRadius: 12, border: "none",
                  background: isOn
                    ? "linear-gradient(135deg, #dc2626, #f87171)"
                    : "linear-gradient(135deg, #059669, #34d399)",
                  color: "#fff", fontFamily: "'Syne', sans-serif",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  boxShadow: `0 4px 16px ${colorDim}`,
                }}
              >{emoji} {action}</motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ConfirmIrrigationModal;