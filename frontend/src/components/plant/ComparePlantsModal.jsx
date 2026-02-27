// ComparePlantsModal.jsx — Compara 2 plantas con gráficas de humedad lado a lado
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { X, GitCompare } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

const COLORS = ["#34d399", "#60a5fa"];

function buildChartData(plantA, plantB, days = 7) {
  const now = Date.now();
  const cutoff = now - days * 24 * 3600 * 1000;

  const histA = (plantA?.humidityHistory || []).filter(h => new Date(h.date).getTime() > cutoff);
  const histB = (plantB?.humidityHistory || []).filter(h => new Date(h.date).getTime() > cutoff);

  // Merge all timestamps
  const allDates = [...new Set([
    ...histA.map(h => new Date(h.date).toLocaleDateString("es-MX", { month:"short", day:"numeric" })),
    ...histB.map(h => new Date(h.date).toLocaleDateString("es-MX", { month:"short", day:"numeric" })),
  ])].slice(-days * 4); // max puntos razonables

  // Group by date label - take last reading per day
  function groupByDate(hist) {
    const map = {};
    hist.forEach(h => {
      const label = new Date(h.date).toLocaleDateString("es-MX", { month:"short", day:"numeric" });
      map[label] = h.humidity;
    });
    return map;
  }

  const mapA = groupByDate(histA);
  const mapB = groupByDate(histB);

  // Generate last N days
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const label = d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
    result.push({
      date: label,
      [plantA?.name || "A"]: mapA[label] ?? null,
      [plantB?.name || "B"]: mapB[label] ?? null,
    });
  }
  return result;
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      flex: 1, padding: "10px 12px", borderRadius: 12, textAlign: "center",
      background: `${color}10`, border: `1px solid ${color}20`,
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'Syne',sans-serif" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#78909c", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</div>
    </div>
  );
}

function PlantSelector({ plants, selected, onSelect, color, label }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
        {label}
      </div>
      <select
        value={selected?._id || ""}
        onChange={e => onSelect(plants.find(p => p._id === e.target.value) || null)}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 11,
          background: "rgba(255,255,255,0.04)", border: `1px solid ${color}30`,
          color: "#f0f6fc", fontSize: 13, outline: "none", cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
      >
        <option value="">— Seleccionar planta —</option>
        {plants.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sector})</option>)}
      </select>
    </div>
  );
}

export default function ComparePlantsModal({ plants, onClose }) {
  const [plantA, setPlantA] = useState(plants[0] || null);
  const [plantB, setPlantB] = useState(plants[1] || null);
  const [days,   setDays]   = useState(7);

  const chartData = useMemo(() => buildChartData(plantA, plantB, days), [plantA, plantB, days]);

  function getStats(plant) {
    if (!plant) return { avg: "—", min: "—", max: "—", alerts: "—" };
    const hist = plant.humidityHistory || [];
    const vals = hist.map(h => h.humidity).filter(v => v != null);
    const avg  = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : "—";
    const min  = vals.length ? Math.min(...vals) : "—";
    const max  = vals.length ? Math.max(...vals) : "—";
    const alerts = (plant.alertHistory || []).filter(a => a.type === "low_humidity").length;
    return { avg: avg !== "—" ? `${avg}%` : "—", min: min !== "—" ? `${min}%` : "—", max: max !== "—" ? `${max}%` : "—", alerts };
  }

  const statsA = getStats(plantA);
  const statsB = getStats(plantB);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(0,0,0,0.80)", backdropFilter: "blur(18px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.88, y: 32, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%", maxWidth: 700, maxHeight: "88vh",
            background: "rgba(8,14,10,0.98)",
            border: "1px solid rgba(52,211,153,0.18)",
            borderRadius: 24, overflow: "hidden",
            boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
            display: "flex", flexDirection: "column",
          }}
        >
          <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#34d399,#60a5fa,transparent)", flexShrink: 0 }} />

          {/* Header */}
          <div style={{ padding: "22px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "linear-gradient(135deg,rgba(52,211,153,0.2),rgba(96,165,250,0.15))",
                border: "1px solid rgba(52,211,153,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <GitCompare size={20} color="#34d399" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#f0f6fc", fontFamily: "'Syne',sans-serif" }}>
                  Comparar Plantas
                </div>
                <div style={{ fontSize: 12, color: "#78909c" }}>Humedad histórica lado a lado</div>
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

          <div style={{ overflowY: "auto", flex: 1, padding: "0 24px 24px" }}>
            {/* Selectores */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <PlantSelector plants={plants} selected={plantA} onSelect={setPlantA} color={COLORS[0]} label="Planta A" />
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 12, color: "#78909c", fontSize: 18 }}>vs</div>
              <PlantSelector plants={plants} selected={plantB} onSelect={setPlantB} color={COLORS[1]} label="Planta B" />
            </div>

            {/* Selector de días */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => setDays(d)} style={{
                  padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                  background: days === d ? "rgba(52,211,153,0.20)" : "rgba(255,255,255,0.05)",
                  color: days === d ? "#34d399" : "#78909c",
                  border: days === d ? "1px solid rgba(52,211,153,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  transition: "all 0.15s",
                }}>
                  {d}d
                </button>
              ))}
            </div>

            {/* Stats comparativas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, marginBottom: 20, alignItems: "start" }}>
              {/* Stats A */}
              <div>
                {plantA && <div style={{ fontSize: 12, fontWeight: 700, color: COLORS[0], marginBottom: 8 }}>{plantA.name}</div>}
                <div style={{ display: "flex", gap: 6 }}>
                  <StatPill label="Prom" value={statsA.avg} color={COLORS[0]} />
                  <StatPill label="Mín"  value={statsA.min} color={COLORS[0]} />
                  <StatPill label="Alertas" value={statsA.alerts} color="#f87171" />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 52 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#78909c",
                }}>⚡</div>
              </div>

              {/* Stats B */}
              <div>
                {plantB && <div style={{ fontSize: 12, fontWeight: 700, color: COLORS[1], marginBottom: 8 }}>{plantB.name}</div>}
                <div style={{ display: "flex", gap: 6 }}>
                  <StatPill label="Prom" value={statsB.avg} color={COLORS[1]} />
                  <StatPill label="Mín"  value={statsB.min} color={COLORS[1]} />
                  <StatPill label="Alertas" value={statsB.alerts} color="#f87171" />
                </div>
              </div>
            </div>

            {/* Gráfica */}
            {plantA && plantB ? (
              <div style={{
                padding: 16, borderRadius: 16,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#78909c" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#78909c" }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(8,14,10,0.95)", border: "1px solid rgba(52,211,153,0.2)",
                        borderRadius: 10, fontSize: 12,
                      }}
                      labelStyle={{ color: "#b0bec5", marginBottom: 4 }}
                      formatter={(v, name) => [v != null ? `${v}%` : "—", name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#b0bec5" }} />
                    <ReferenceLine y={plantA?.minHumidity} stroke={COLORS[0]} strokeDasharray="3 3" strokeOpacity={0.4} />
                    <ReferenceLine y={plantB?.minHumidity} stroke={COLORS[1]} strokeDasharray="3 3" strokeOpacity={0.4} />
                    <Line type="monotone" dataKey={plantA?.name || "A"} stroke={COLORS[0]} strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey={plantB?.name || "B"} stroke={COLORS[1]} strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10, color: "#4d7a5e", textAlign: "center", marginTop: 6 }}>
                  — — líneas punteadas indican humedad mínima de cada planta
                </div>
              </div>
            ) : (
              <div style={{
                padding: "36px 20px", borderRadius: 16, textAlign: "center",
                background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 14, color: "#78909c" }}>Selecciona dos plantas para comparar</div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}