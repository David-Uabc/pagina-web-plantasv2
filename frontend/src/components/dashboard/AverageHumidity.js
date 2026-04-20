import { useState, useMemo } from "react";
import { useI18n } from "../../i18n";
import { Line } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

function generateSimHistory(days, baseValue) {
  const pts = [];
  let v = baseValue || 55;
  for (let i = days; i >= 0; i--) {
    v = Math.max(5, Math.min(95, v + (Math.random() * 10 - 5)));
    const label = new Date(Date.now() - i * 86400000)
      .toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
    pts.push({ label, value: Math.round(v) });
  }
  return pts;
}

export default function AverageHumidity({ plants = [] }) {
  const { t } = useI18n();

  const getColor = (v) => {
    if (v < 30) return { line: "#f87171", fill: "rgba(248,113,113,0.10)", label: t("hum.critical") };
    if (v < 60) return { line: "#fbbf24", fill: "rgba(251,191,36,0.10)",  label: t("hum.regular")  };
    return              { line: "#22c55e", fill: "rgba(34,197,94,0.10)",   label: t("hum.optimal")  };
  };

  const TABS = [
    { key: "24h",    label: t("hum.24h"),   days: 1  },
    { key: "semana", label: t("hum.week"),  days: 7  },
    { key: "mes",    label: t("hum.month"), days: 30 },
  ];

  const [tab, setTab] = useState("mes");

  const avgNow = useMemo(() => {
    if (!plants.length) return 0;
    return Math.round(plants.reduce((s, p) => s + (p.currentHumidity || 0), 0) / plants.length);
  }, [plants]);

  const days    = TABS.find(tb => tb.key === tab)?.days ?? 30;
  const history = useMemo(() => generateSimHistory(days, avgNow || 55), [days, avgNow]);

  const { line, fill, label: statusLabel } = getColor(avgNow);
  const minVal = Math.min(...history.map(h => h.value));
  const maxVal = Math.max(...history.map(h => h.value));
  const trend  = history.length > 1
    ? history[history.length - 1].value - history[history.length - 2].value
    : 0;

  const chartData = {
    labels: history.map(h => h.label),
    datasets: [{
      data: history.map(h => h.value),
      borderColor: line,
      backgroundColor: fill,
      fill: true,
      tension: 0.45,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: line,
      pointHoverBorderColor: "#fff",
      pointHoverBorderWidth: 2,
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(8, 14, 10, 0.97)",
        borderColor: line,
        borderWidth: 1,
        titleColor: "#f0f6fc",       // ✅ título siempre blanco
        bodyColor:  "#f0f6fc",       // ✅ valor siempre blanco — antes era `line` (invisible)
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        titleFont: { size: 11, weight: "600" },
        bodyFont:  { family: "'Syne', sans-serif", size: 15, weight: "800" },
        callbacks: {
          title: (ctx) => ctx[0].label,
          label: (ctx) => ` ${ctx.parsed.y}%`,
        },
        // Punto de color a la izquierda del valor
        boxWidth: 8,
        boxHeight: 8,
      }
    },
    scales: {
      x: {
        ticks: { color: "rgba(180,212,192,0.55)", font: { size: 9 }, maxTicksLimit: 7 },
        grid:  { color: "rgba(34,197,94,0.05)" },
      },
      y: {
        min: 0, max: 100,
        ticks: { color: "rgba(180,212,192,0.55)", font: { size: 9 }, callback: v => `${v}%` },
        grid:  { color: "rgba(34,197,94,0.05)" },
      }
    },
    interaction: { mode: "nearest", intersect: false },
  };

  const miniStats = [
    { label: t("hum.min"),    value: `${minVal}%`, color: "#f87171"  },
    { label: t("hum.max"),    value: `${maxVal}%`, color: "#38bdf8"  },
    { label: t("hum.plants"), value: plants.length, color: "#22c55e" },
  ];

  return (
    <div className="card ah-card">

      {/* ── Header ── */}
      <div className="ah-header">
        <div className="ah-header-left">
          <p className="ah-label">{t("hum.title")}</p>
          <p className="ah-sub">{plants.length} {t("hum.monitored")}</p>
        </div>
        <div className="ah-pill" style={{ borderColor: `${line}45`, color: line, background: `${line}12` }}>
          <span className="ah-pill-dot" style={{ background: line }} />
          {statusLabel}
        </div>
      </div>

      {/* ── Valor principal ── */}
      <div className="ah-value-row">
        <span className="ah-value" style={{
           backgroundImage: `linear-gradient(135deg, ${line}, ${line}aa)`,
           WebkitBackgroundClip: "text",
           WebkitTextFillColor: "transparent",
           backgroundClip: "text"
        }}>
          {avgNow}%
        </span>
        {trend !== 0 && (
          <motion.span
            className={`ah-trend ${trend > 0 ? "up" : "down"}`}
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </motion.span>
        )}
      </div>

      {/* ── Barra ── */}
      <div className="ah-bar-track">
        <motion.div className="ah-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${avgNow}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, ${line}77, ${line})` }}
        />
      </div>

      {/* ── Mini stats en fila ── */}
      <div className="ah-stats-row">
        {miniStats.map((s, i) => (
          <div key={s.label} className="ah-stat" style={i > 0 ? { borderLeft: "1px solid var(--border)" } : {}}>
            <span className="ah-stat-val" style={{ color: s.color }}>{s.value}</span>
            <span className="ah-stat-lbl">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Gráfica ── */}
      <div className="ah-chart">
        <AnimatePresence mode="wait">
          <motion.div key={tab} className="ah-chart-inner"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Line data={chartData} options={chartOptions} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Tabs ── */}
      <div className="ah-tabs">
        {TABS.map(tb => (
          <button key={tb.key}
            className={`ah-tab ${tab === tb.key ? "active" : ""}`}
            onClick={() => setTab(tb.key)}
            style={tab === tb.key ? { color: line, background: `${line}18`, borderColor: `${line}38` } : {}}>
            {tb.label}
          </button>
        ))}
      </div>

    </div>
  );
}