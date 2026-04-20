// components/MaintenanceToggle.jsx
// Botón para activar/desactivar el modo mantenimiento de una planta
// Cuando está activo: válvula se cierra y el riego automático se pausa
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";

export default function MaintenanceToggle({ plant, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note,     setNote]     = useState("");
  const [error,    setError]    = useState(null);

  const isActive = plant?.maintenanceMode || false;

  const toggle = async () => {
    // Si vamos a activar, mostrar el campo de nota primero
    if (!isActive && !showNote) {
      setShowNote(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/api/plants/${plant._id}/maintenance`, {
        active: !isActive,
        note:   note.trim(),
      });
      setShowNote(false);
      setNote("");
      if (onUpdate) onUpdate(res.data.plant);
    } catch (err) {
      setError(err.mensajeUsuario || "Error al cambiar modo mantenimiento");
    } finally {
      setLoading(false);
    }
  };

  const cancelar = () => {
    setShowNote(false);
    setNote("");
    setError(null);
  };

  return (
    <div style={{ width: "100%" }}>

      {/* Botón principal */}
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: 12,
          border: isActive
            ? "1.5px solid rgba(251,191,36,0.45)"
            : "1px solid rgba(255,255,255,0.09)",
          background: isActive
            ? "rgba(251,191,36,0.10)"
            : "rgba(255,255,255,0.04)",
          color: isActive ? "#fbbf24" : "#94a3b8",
          fontWeight: 700,
          fontSize: 13,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.2s",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <>
            <div style={spinnerStyle} />
            Cambiando...
          </>
        ) : isActive ? (
          <>🔧 Mantenimiento activo — toca para desactivar</>
        ) : (
          <>🔧 Activar modo mantenimiento</>
        )}
      </button>

      {/* Nota de mantenimiento si está activo */}
      {isActive && plant.maintenanceNote && (
        <div style={{
          marginTop: 6, padding: "8px 12px", borderRadius: 9,
          background: "rgba(251,191,36,0.06)",
          border: "1px solid rgba(251,191,36,0.15)",
          fontSize: 12, color: "#fbbf24", lineHeight: 1.5,
        }}>
          📝 {plant.maintenanceNote}
        </div>
      )}

      {/* Panel para escribir nota al activar */}
      <AnimatePresence>
        {showNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              marginTop: 10, padding: "14px 14px",
              borderRadius: 13,
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.20)",
            }}>
              <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600, marginBottom: 8 }}>
                🔧 ¿Por qué activas el mantenimiento? (opcional)
              </div>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="ej. Revisión de tuberías, cambio de sensor..."
                maxLength={200}
                autoFocus
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 9,
                  border: "1px solid rgba(251,191,36,0.25)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#f0f6fc", fontSize: 13,
                  fontFamily: "'Inter',sans-serif",
                  outline: "none", boxSizing: "border-box",
                  marginBottom: 10,
                }}
                onKeyDown={e => e.key === "Enter" && toggle()}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={cancelar} style={{
                  flex: 1, padding: "9px 0", borderRadius: 9,
                  border: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#78909c", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Cancelar</button>
                <button onClick={toggle} disabled={loading} style={{
                  flex: 2, padding: "9px 0", borderRadius: 9, border: "none",
                  background: "linear-gradient(135deg,#b45309,#fbbf24)",
                  color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>
                  {loading ? "Activando..." : "✓ Activar mantenimiento"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 500 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

const spinnerStyle = {
  width: 14, height: 14, borderRadius: "50%",
  border: "2px solid rgba(255,255,255,0.2)",
  borderTopColor: "#fbbf24",
  animation: "spin 0.7s linear infinite",
};