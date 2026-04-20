// components/IrrigationLog.jsx
// Tabla de historial de riegos por planta
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";

export default function IrrigationLog({ plant, isOpen, onClose }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [solo,    setSolo]    = useState(true); // solo riegos ejecutados
  const LIMIT = 20;

  const cargar = useCallback(async (p = 1, soloRiego = solo) => {
    if (!plant?._id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:            p,
        limit:           LIMIT,
        onlyIrrigation:  soloRiego ? "true" : "false",
      });
      const res = await api.get(`/api/plants/${plant._id}/logs?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.pagination?.total || 0);
      setPage(p);
    } catch (err) {
      console.error("Error cargando logs:", err);
    } finally {
      setLoading(false);
    }
  }, [plant?._id, solo]);

  useEffect(() => {
    if (isOpen) cargar(1);
  }, [isOpen, cargar]);

  const toggleFiltro = () => {
    const nuevo = !solo;
    setSolo(nuevo);
    cargar(1, nuevo);
  };

  const exportarCSV = () => {
    if (!plant?._id) return;
    const days = 30;
    window.open(
      `${process.env.REACT_APP_API_URL || ""}/api/plants/${plant._id}/export/csv?days=${days}`,
      "_blank"
    );
  };

  const exportarTodo = () => {
    window.open(
      `${process.env.REACT_APP_API_URL || ""}/api/plants/export/csv/all?days=7`,
      "_blank"
    );
  };

  const formatFecha = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  };
  const formatHora = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  const pages = Math.ceil(total / LIMIT);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.80)", backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 99999, padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%", maxWidth: 680,
            background: "rgba(6,12,8,0.98)",
            border: "1px solid rgba(52,211,153,0.18)",
            borderRadius: 24, overflow: "hidden",
            boxShadow: "0 40px 100px rgba(0,0,0,0.85)",
            maxHeight: "88vh", display: "flex", flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Accent top */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#34d399,#60a5fa,transparent)" }} />

          {/* Header */}
          <div style={{
            padding: "24px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 800, color: "#f0f6fc", marginBottom: 4 }}>
                📋 Log de Riegos
              </div>
              <div style={{ fontSize: 13, color: "#5a7a66" }}>
                {plant?.name} — {plant?.sector} — V{plant?.valveNumber}
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.04)", color: "#78909c",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, flexShrink: 0,
            }}>✕</button>
          </div>

          {/* Toolbar */}
          <div style={{
            padding: "12px 24px",
            display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}>
            {/* Filtro */}
            <button onClick={toggleFiltro} style={{
              padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
              border: solo ? "1.5px solid rgba(52,211,153,0.45)" : "1px solid rgba(255,255,255,0.09)",
              background: solo ? "rgba(52,211,153,0.10)" : "rgba(255,255,255,0.04)",
              color: solo ? "#34d399" : "#78909c", cursor: "pointer", transition: "all 0.18s",
            }}>
              💧 {solo ? "Solo riegos" : "Todos los eventos"}
            </button>

            <div style={{ fontSize: 12, color: "#4d7a5e", marginRight: "auto" }}>
              {total} registros
            </div>

            {/* Export CSV planta */}
            <button onClick={exportarCSV} style={{
              padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
              border: "1px solid rgba(96,165,250,0.3)",
              background: "rgba(96,165,250,0.08)", color: "#60a5fa",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              📥 CSV esta planta
            </button>

            {/* Export CSV todas */}
            <button onClick={exportarTodo} style={{
              padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
              border: "1px solid rgba(52,211,153,0.3)",
              background: "rgba(52,211,153,0.08)", color: "#34d399",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              📊 CSV todas las plantas
            </button>
          </div>

          {/* Tabla */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#4d7a5e" }}>
                <div style={spinnerBig} />
                <div style={{ marginTop: 12, fontSize: 13 }}>Cargando registros...</div>
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💧</div>
                <div style={{ fontSize: 15, color: "#f0f6fc", fontWeight: 600, marginBottom: 6 }}>
                  Sin registros aún
                </div>
                <div style={{ fontSize: 13, color: "#4d7a5e" }}>
                  {solo ? "Esta planta no ha tenido riegos registrados." : "No hay eventos registrados para esta planta."}
                </div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
                <thead>
                  <tr>
                    {["Fecha", "Hora", "Humedad", "Válvula", "Dispositivo", "Estado"].map(h => (
                      <th key={h} style={{
                        padding: "12px 10px", textAlign: "left",
                        fontSize: 11, fontWeight: 700, color: "#4d7a5e",
                        textTransform: "uppercase", letterSpacing: "0.8px",
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                        position: "sticky", top: 0,
                        background: "rgba(6,12,8,0.98)", backdropFilter: "blur(8px)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <motion.tr key={log._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td style={tdStyle}>{formatFecha(log.createdAt)}</td>
                      <td style={{ ...tdStyle, color: "#60a5fa" }}>{formatHora(log.createdAt)}</td>
                      <td style={{ ...tdStyle }}>
                        <span style={{
                          fontWeight: 800, fontSize: 14,
                          color: log.humidity < 30 ? "#f87171" :
                                 log.humidity > 70 ? "#60a5fa" : "#34d399",
                        }}>
                          {log.humidity ?? "—"}%
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: "#a78bfa" }}>V{log.valveNumber || "—"}</td>
                      <td style={{ ...tdStyle, fontSize: 11, color: "#5a7a66" }}>
                        {log.deviceId || "manual"}
                      </td>
                      <td style={tdStyle}>
                        {log.irrigationExecuted ? (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 8px",
                            borderRadius: 99, background: "rgba(52,211,153,0.12)",
                            border: "1px solid rgba(52,211,153,0.25)", color: "#34d399",
                          }}>💧 Regó</span>
                        ) : (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 8px",
                            borderRadius: 99, background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)", color: "#4d7a5e",
                          }}>Lectura</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {pages > 1 && (
            <div style={{
              padding: "12px 24px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex", justifyContent: "center", gap: 8, flexShrink: 0,
            }}>
              <button onClick={() => cargar(page - 1)} disabled={page === 1 || loading}
                style={btnPage(page > 1)}>← Anterior</button>
              <span style={{ fontSize: 13, color: "#5a7a66", alignSelf: "center" }}>
                {page} / {pages}
              </span>
              <button onClick={() => cargar(page + 1)} disabled={page === pages || loading}
                style={btnPage(page < pages)}>Siguiente →</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const tdStyle = {
  padding: "11px 10px", fontSize: 13, color: "#b0bec5",
  fontFamily: "'Inter',sans-serif",
};
const spinnerBig = {
  width: 28, height: 28, borderRadius: "50%", margin: "0 auto",
  border: "3px solid rgba(52,211,153,0.2)", borderTopColor: "#34d399",
  animation: "spin 0.8s linear infinite",
};
const btnPage = (active) => ({
  padding: "7px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600,
  border: "1px solid rgba(255,255,255,0.09)",
  background: active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
  color: active ? "#b0bec5" : "#3d4d42",
  cursor: active ? "pointer" : "not-allowed",
});