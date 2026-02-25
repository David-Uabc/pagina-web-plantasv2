import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, BarElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler, Legend
} from "chart.js";

ChartJS.register(LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler, Legend);

// ── Generar historial simulado realista ───────────────
function generateHistory(plant, days = 30) {
  const now = Date.now();
  const DAY = 86400000;
  const humidity = [];
  const irrigations = [];
  let current = plant.currentHumidity ?? 55;

  for (let i = days; i >= 0; i--) {
    const ts = now - i * DAY;
    // Simula bajada natural + subida por riego
    current = Math.max(10, Math.min(95, current + (Math.random() * 8 - 5)));
    humidity.push({ ts, value: Math.round(current) });
    // Riego cuando baja mucho
    if (current < plant.minHumidity + 5 && Math.random() > 0.3) {
      const duration = Math.floor(Math.random() * 20 + 5);
      irrigations.push({ ts, duration, raised: Math.floor(Math.random() * 20 + 10) });
      current = Math.min(95, current + irrigations[irrigations.length - 1].raised);
    }
  }
  return { humidity, irrigations };
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

const TABS = ["Humedad", "Riegos", "Resumen"];

function PlantHistoryModal({ plant, isOpen, onClose }) {
  const [tab,     setTab]     = useState("Humedad");
  const [range,   setRange]   = useState(30);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (isOpen && plant) {
      setHistory(generateHistory(plant, range));
      setTab("Humedad");
    }
  }, [isOpen, plant, range]);

  if (!isOpen || !plant || !history) return null;

  const { humidity, irrigations } = history;

  // ── Chart: Humedad ─────────────────────────────────
  const humLabels = humidity.map(h => formatDate(h.ts));
  const humValues = humidity.map(h => h.value);

  const humidityChartData = {
    labels: humLabels,
    datasets: [
      {
        label: "Humedad %",
        data: humValues,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.08)",
        fill: true, tension: 0.45,
        pointRadius: 0, pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: `Mínimo (${plant.minHumidity}%)`,
        data: Array(humidity.length).fill(plant.minHumidity),
        borderColor: "rgba(248,113,113,0.5)",
        borderDash: [6, 4], borderWidth: 1.5,
        pointRadius: 0, fill: false,
      },
      {
        label: `Máximo (${plant.maxHumidity}%)`,
        data: Array(humidity.length).fill(plant.maxHumidity),
        borderColor: "rgba(56,189,248,0.5)",
        borderDash: [6, 4], borderWidth: 1.5,
        pointRadius: 0, fill: false,
      },
    ],
  };

  const humidityOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: "#a3c4b0", font: { size: 11 }, boxWidth: 20, padding: 16 }
      },
      tooltip: {
        backgroundColor: "rgba(5,14,10,0.92)",
        borderColor: "rgba(34,197,94,0.3)", borderWidth: 1,
        titleColor: "#f0faf4", bodyColor: "#22c55e", padding: 12,
        callbacks: { label: ctx => ` ${ctx.parsed.y}%` }
      }
    },
    scales: {
      x: {
        ticks: { color: "#4d7a5e", font: { size: 10 }, maxTicksLimit: 8 },
        grid: { color: "rgba(34,197,94,0.06)" },
      },
      y: {
        min: 0, max: 100,
        ticks: { color: "#4d7a5e", font: { size: 10 }, callback: v => `${v}%` },
        grid: { color: "rgba(34,197,94,0.06)" },
      }
    },
    interaction: { mode: "nearest", intersect: false },
  };

  // ── Chart: Riegos ──────────────────────────────────
  const irrLabels   = irrigations.map(r => formatDate(r.ts));
  const irrDuration = irrigations.map(r => r.duration);
  const irrRaised   = irrigations.map(r => r.raised);

  const irrigationChartData = {
    labels: irrLabels,
    datasets: [
      {
        label: "Duración (min)",
        data: irrDuration,
        backgroundColor: "rgba(56,189,248,0.65)",
        borderColor: "#38bdf8",
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: "Humedad ganada (%)",
        data: irrRaised,
        backgroundColor: "rgba(34,197,94,0.55)",
        borderColor: "#22c55e",
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const irrigationOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: "#a3c4b0", font: { size: 11 }, boxWidth: 20, padding: 16 }
      },
      tooltip: {
        backgroundColor: "rgba(5,14,10,0.92)",
        borderColor: "rgba(56,189,248,0.3)", borderWidth: 1,
        titleColor: "#f0faf4", bodyColor: "#38bdf8", padding: 12,
      }
    },
    scales: {
      x: { ticks: { color: "#4d7a5e", font: { size: 10 }, maxTicksLimit: 8 }, grid: { color: "rgba(34,197,94,0.06)" } },
      y: { ticks: { color: "#4d7a5e", font: { size: 10 } }, grid: { color: "rgba(34,197,94,0.06)" } }
    }
  };

  // ── Resumen stats ──────────────────────────────────
  const avgHum   = Math.round(humValues.reduce((a, b) => a + b, 0) / humValues.length);
  const minHum   = Math.min(...humValues);
  const maxHum   = Math.max(...humValues);
  const alerts   = humValues.filter(v => v < plant.minHumidity).length;
  const totalMin = irrigations.reduce((s, r) => s + r.duration, 0);

  const summaryStats = [
    { icon: "📊", label: "Humedad promedio",  value: `${avgHum}%`,            color: "#22c55e" },
    { icon: "⬇",  label: "Mínimo registrado", value: `${minHum}%`,            color: minHum < plant.minHumidity ? "#f87171" : "#a3c4b0" },
    { icon: "⬆",  label: "Máximo registrado", value: `${maxHum}%`,            color: "#38bdf8" },
    { icon: "⚠",  label: "Días con alerta",   value: alerts,                  color: alerts > 3 ? "#f87171" : "#fbbf24" },
    { icon: "💧", label: "Riegos realizados",  value: irrigations.length,      color: "#38bdf8" },
    { icon: "⏱",  label: "Minutos regando",    value: `${totalMin} min`,       color: "#10b981" },
  ];

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay history-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div className="history-modal"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: 30, scale: 0.96  }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Barra top */}
          <div className="history-bar" />

          {/* Header */}
          <div className="history-header">
            <div className="history-plant-info">
              <div className="history-avatar">{plant.name?.[0]?.toUpperCase() ?? "🌿"}</div>
              <div>
                <h2 className="history-title">{plant.name}</h2>
                <span className="history-subtitle">Sector {plant.sector} · {plant.irrigationType}</span>
              </div>
            </div>
            <div className="history-header-right">
              {/* Range selector */}
              <div className="history-range-group">
                {[7, 14, 30].map(d => (
                  <button key={d}
                    className={`history-range-btn ${range === d ? "active" : ""}`}
                    onClick={() => setRange(d)}
                  >{d}d</button>
                ))}
              </div>
              <button className="history-close" onClick={onClose}>✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="history-tabs">
            {TABS.map(t => (
              <button key={t}
                className={`history-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >{t === "Humedad" ? "📈 Humedad" : t === "Riegos" ? "💧 Riegos" : "📋 Resumen"}</button>
            ))}
          </div>

          {/* Content */}
          <div className="history-body">
            <AnimatePresence mode="wait">

              {/* ── TAB: HUMEDAD ── */}
              {tab === "Humedad" && (
                <motion.div key="humidity"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                >
                  <div className="history-chart-wrap">
                    <Line data={humidityChartData} options={humidityOptions} />
                  </div>

                  {/* Mini stats rápidas */}
                  <div className="history-mini-stats">
                    <div className="hms-item">
                      <span className="hms-val" style={{ color: "#22c55e" }}>{avgHum}%</span>
                      <span className="hms-lbl">Promedio</span>
                    </div>
                    <div className="hms-item">
                      <span className="hms-val" style={{ color: "#f87171" }}>{minHum}%</span>
                      <span className="hms-lbl">Mínimo</span>
                    </div>
                    <div className="hms-item">
                      <span className="hms-val" style={{ color: "#38bdf8" }}>{maxHum}%</span>
                      <span className="hms-lbl">Máximo</span>
                    </div>
                    <div className="hms-item">
                      <span className="hms-val" style={{ color: alerts > 0 ? "#f87171" : "#4d7a5e" }}>{alerts}</span>
                      <span className="hms-lbl">Alertas</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── TAB: RIEGOS ── */}
              {tab === "Riegos" && (
                <motion.div key="irrigations"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                >
                  {irrigations.length === 0 ? (
                    <div className="history-empty">
                      <span>🌵</span>Sin riegos registrados en este período.
                    </div>
                  ) : (
                    <>
                      <div className="history-chart-wrap" style={{ height: 200, marginBottom: 20 }}>
                        <Bar data={irrigationChartData} options={irrigationOptions} />
                      </div>

                      {/* Lista de eventos */}
                      <div className="irrigation-list">
                        <div className="irr-list-header">
                          <span>Fecha</span><span>Hora</span><span>Duración</span><span>Humedad +</span>
                        </div>
                        {irrigations.slice(-10).reverse().map((irr, i) => (
                          <motion.div key={i} className="irr-row"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <span className="irr-date">{formatDate(irr.ts)}</span>
                            <span className="irr-time">{formatTime(irr.ts)}</span>
                            <span className="irr-duration">⏱ {irr.duration} min</span>
                            <span className="irr-raised" style={{ color: "#22c55e" }}>+{irr.raised}%</span>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── TAB: RESUMEN ── */}
              {tab === "Resumen" && (
                <motion.div key="summary"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                >
                  <div className="summary-grid">
                    {summaryStats.map((s, i) => (
                      <motion.div key={i} className="summary-card"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0  }}
                        transition={{ delay: i * 0.07 }}
                      >
                        <span className="sum-icon">{s.icon}</span>
                        <span className="sum-value" style={{ color: s.color }}>{s.value}</span>
                        <span className="sum-label">{s.label}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Estado de salud */}
                  <div className="health-bar-section">
                    <div className="health-bar-header">
                      <span className="health-label">Salud general</span>
                      <span className="health-score" style={{
                        color: avgHum >= plant.minHumidity && avgHum <= plant.maxHumidity ? "#22c55e" : "#fbbf24"
                      }}>
                        {avgHum >= plant.minHumidity && avgHum <= plant.maxHumidity ? "Óptima ✓" : "Revisar ⚠"}
                      </span>
                    </div>
                    <div className="health-track">
                      <motion.div className="health-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, ((avgHum - plant.minHumidity) / (plant.maxHumidity - plant.minHumidity)) * 100))}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                          background: avgHum >= plant.minHumidity && avgHum <= plant.maxHumidity
                            ? "linear-gradient(90deg, #22c55e, #10b981)"
                            : "linear-gradient(90deg, #fbbf24, #f87171)"
                        }}
                      />
                    </div>
                    <div className="health-range-labels">
                      <span>{plant.minHumidity}% mín</span>
                      <span>{plant.maxHumidity}% máx</span>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PlantHistoryModal;