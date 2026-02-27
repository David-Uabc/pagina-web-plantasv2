// DaySummaryWidget.jsx — Resumen del día en el dashboard
import { motion } from "framer-motion";
import { Droplets, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

const STORAGE_KEY = "iot_day_summary";
const TODAY_KEY   = () => new Date().toISOString().slice(0, 10);

// Persistir eventos del día en localStorage
export function recordIrrigation(plantName) {
  const key = `${STORAGE_KEY}_${TODAY_KEY()}`;
  try {
    const data = JSON.parse(localStorage.getItem(key) || "{}");
    data.irrigations = (data.irrigations || 0) + 1;
    data.lastPlant   = plantName;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function recordAlertResolved() {
  const key = `${STORAGE_KEY}_${TODAY_KEY()}`;
  try {
    const data = JSON.parse(localStorage.getItem(key) || "{}");
    data.alertsResolved = (data.alertsResolved || 0) + 1;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function getTodaySummary() {
  const key = `${STORAGE_KEY}_${TODAY_KEY()}`;
  try { return JSON.parse(localStorage.getItem(key) || "{}"); }
  catch { return {}; }
}

export default function DaySummaryWidget({ plants }) {
  const summary = getTodaySummary();
  const irrigations    = summary.irrigations    || 0;
  const alertsResolved = summary.alertsResolved || 0;

  const totalAlerts = plants.filter(p => (p.currentHumidity ?? 0) < p.minHumidity).length;
  const watering    = plants.filter(p => p.valveStatus === "OPEN").length;
  const healthyPct  = plants.length
    ? Math.round((plants.filter(p => (p.currentHumidity ?? 0) >= p.minHumidity).length / plants.length) * 100)
    : 100;

  const items = [
    {
      icon: <Droplets size={14} color="#60a5fa" />,
      label: "Riegos hoy",
      value: irrigations,
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.10)",
      border: "rgba(96,165,250,0.20)",
    },
    {
      icon: <AlertTriangle size={14} color={totalAlerts > 0 ? "#f87171" : "#34d399"} />,
      label: "Alertas activas",
      value: totalAlerts,
      color: totalAlerts > 0 ? "#f87171" : "#34d399",
      bg: totalAlerts > 0 ? "rgba(248,113,113,0.08)" : "rgba(52,211,153,0.08)",
      border: totalAlerts > 0 ? "rgba(248,113,113,0.18)" : "rgba(52,211,153,0.18)",
    },
    {
      icon: <CheckCircle size={14} color="#34d399" />,
      label: "Plantas sanas",
      value: `${healthyPct}%`,
      color: "#34d399",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.18)",
    },
    {
      icon: <TrendingUp size={14} color="#fbbf24" />,
      label: "Regando ahora",
      value: watering,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.18)",
    },
  ];

  const now   = new Date();
  const hours = now.getHours();
  const dateLabel = now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const dateCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        margin: "0 24px 20px",
        padding: "18px 20px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(52,211,153,0.12)",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Glow de fondo */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 0% 100%, rgba(52,211,153,0.06) 0%, transparent 70%)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#f0f6fc", fontFamily: "'Syne',sans-serif" }}>
            Resumen del día
          </div>
          <div style={{ fontSize: 11, color: "#4d7a5e", marginTop: 1 }}>{dateCapitalized}</div>
        </div>
        <div style={{
          padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
          background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.20)",
          color: "#34d399",
        }}>
          {hours < 12 ? "🌅 Mañana" : hours < 18 ? "☀️ Tarde" : "🌙 Noche"}
        </div>
      </div>

      {/* Grid de métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            style={{
              padding: "10px 8px", borderRadius: 12, textAlign: "center",
              background: item.bg, border: `1px solid ${item.border}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>{item.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: item.color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>
              {item.value}
            </div>
            <div style={{ fontSize: 9, color: "#78909c", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {item.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Barra de salud general */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "#78909c" }}>Salud general del sistema</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: healthyPct >= 80 ? "#34d399" : healthyPct >= 50 ? "#fbbf24" : "#f87171" }}>
            {healthyPct}%
          </span>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${healthyPct}%` }}
            transition={{ duration: 1.0, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: "100%", borderRadius: 99,
              background: healthyPct >= 80
                ? "linear-gradient(90deg,#059669,#34d399)"
                : healthyPct >= 50
                ? "linear-gradient(90deg,#d97706,#fbbf24)"
                : "linear-gradient(90deg,#dc2626,#f87171)",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}