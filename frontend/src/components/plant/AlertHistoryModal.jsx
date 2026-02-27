// AlertHistoryModal.jsx — Modal con historial de todas las alertas de una planta
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, X, Clock } from "lucide-react";

const TYPE_CONFIG = {
  low_humidity:  { icon: "💧", label: "Humedad baja",  color: "#f87171" },
  high_humidity: { icon: "🌊", label: "Humedad alta",   color: "#60a5fa" },
  valve_on:      { icon: "🟢", label: "Riego iniciado", color: "#34d399" },
  valve_off:     { icon: "⏹", label: "Riego detenido", color: "#78909c" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs  / 24);
  if (days > 0)  return `hace ${days}d`;
  if (hrs  > 0)  return `hace ${hrs}h`;
  if (mins > 0)  return `hace ${mins}m`;
  return "ahora";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString("es-MX", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

export default function AlertHistoryModal({ plant, onClose }) {
  if (!plant) return null;
  const alerts = [...(plant.alertHistory || [])].reverse(); // más reciente primero

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.88, y: 32, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%", maxWidth: 480, maxHeight: "82vh",
            background: "rgba(8,14,10,0.97)",
            border: "1px solid rgba(248,113,113,0.20)",
            borderRadius: 24, overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
            display: "flex", flexDirection: "column",
          }}
        >
          {/* Top accent */}
          <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#f87171,#fbbf24,transparent)", flexShrink: 0 }} />

          {/* Header */}
          <div style={{ padding: "22px 24px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AlertTriangle size={20} color="#f87171" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#f0f6fc", fontFamily: "'Syne',sans-serif" }}>
                  Historial de alertas
                </div>
                <div style={{ fontSize: 12, color: "#78909c" }}>{plant.name} · {alerts.length} eventos</div>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.05)", color: "#78909c", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <X size={14} />
            </button>
          </div>

          {/* Resumen pills */}
          <div style={{ padding: "0 24px 16px", display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
              const count = alerts.filter(a => a.type === type).length;
              if (!count) return null;
              return (
                <div key={type} style={{
                  padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, color: cfg.color,
                }}>
                  {cfg.icon} {count} {cfg.label}
                </div>
              );
            })}
            {alerts.length === 0 && (
              <div style={{ fontSize: 12, color: "#78909c" }}>Sin eventos registrados</div>
            )}
          </div>

          {/* Lista */}
          <div style={{ overflowY: "auto", flex: 1, padding: "0 24px 24px" }}>
            {alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: "center", padding: "48px 20px" }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#34d399", marginBottom: 8 }}>Sin alertas</div>
                <div style={{ fontSize: 13, color: "#78909c" }}>Esta planta no ha tenido eventos todavía.</div>
              </motion.div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {alerts.map((alert, i) => {
                  const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.low_humidity;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        padding: "14px 16px", borderRadius: 14,
                        background: `${cfg.color}08`,
                        border: `1px solid ${cfg.color}20`,
                        display: "flex", alignItems: "flex-start", gap: 12,
                      }}
                    >
                      {/* Icono */}
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                      }}>
                        {cfg.icon}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            {alert.resolved && (
                              <CheckCircle size={12} color="#34d399" />
                            )}
                            <span style={{ fontSize: 11, color: "#4d7a5e" }}>{timeAgo(alert.createdAt)}</span>
                          </div>
                        </div>
                        {alert.message && (
                          <div style={{ fontSize: 12, color: "#b0bec5", marginTop: 3 }}>{alert.message}</div>
                        )}
                        {alert.humidity != null && (
                          <div style={{ fontSize: 11, color: "#78909c", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={10} /> {formatDate(alert.createdAt)}
                            <span style={{ marginLeft: 6, color: cfg.color }}>· Humedad: {alert.humidity}%</span>
                          </div>
                        )}
                        {alert.humidity == null && (
                          <div style={{ fontSize: 11, color: "#78909c", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={10} /> {formatDate(alert.createdAt)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}