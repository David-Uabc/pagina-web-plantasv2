import { motion, AnimatePresence } from "framer-motion";
import HumidityGauge from "./HumidityGauge";
import { useState, useCallback } from "react";
import { Line, Bar } from "react-chartjs-2";
import { Download, FileText } from "lucide-react";
import {
  Chart as ChartJS, LineElement, BarElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler, Legend
} from "chart.js";
import { useToast } from "../../context/ToastProvider";
import ConfirmModal from "./ConfirmModal";
import ConfirmIrrigationModal from "./ConfirmIrrigationModal";
import { exportCSV, exportPDF } from "../../utils/exportHistory";

ChartJS.register(LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler, Legend);

const PLANT_IMAGES = {
  lavanda:  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&q=80",
  menta:    "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80",
  rosa:     "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
  cactus:   "https://images.unsplash.com/photo-1512427691650-6c1e8d3bfa63?w=600&q=80",
  albahaca: "https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=600&q=80",
  romero:   "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=600&q=80",
  girasol:  "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&q=80",
  gardenia: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  tomate:   "https://images.unsplash.com/photo-1546470427-e2a4e5eaccf5?w=600&q=80",
};
const FALLBACK = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80";

function getImage(plant) {
  if (plant.imageUrl) return plant.imageUrl;
  const key = plant.name?.toLowerCase() ?? "";
  for (const [k, v] of Object.entries(PLANT_IMAGES)) {
    if (key.includes(k)) return v;
  }
  return FALLBACK;
}

function getHumState(h, min, max) {
  if (h < min)      return { color: "#f87171", label: "Crítica",  bar: "linear-gradient(90deg,#ef4444,#f87171)" };
  if (h < min + 10) return { color: "#fbbf24", label: "Baja",     bar: "linear-gradient(90deg,#f59e0b,#fbbf24)" };
  if (h > max)      return { color: "#38bdf8", label: "Alta",     bar: "linear-gradient(90deg,#0ea5e9,#38bdf8)" };
  return              { color: "#22c55e", label: "Óptima",  bar: "linear-gradient(90deg,#16a34a,#22c55e)" };
}

function generateHistory(plant, days = 14) {
  const now = Date.now(); const DAY = 86400000;
  const humidity = []; const irrigations = [];
  let current = plant.currentHumidity ?? 55;
  for (let i = days; i >= 0; i--) {
    const ts = now - i * DAY;
    current = Math.max(10, Math.min(95, current + (Math.random() * 8 - 4.5)));
    humidity.push({ ts, value: Math.round(current) });
    if (current < plant.minHumidity + 6 && Math.random() > 0.35) {
      const duration = Math.floor(Math.random() * 18 + 4);
      const raised   = Math.floor(Math.random() * 18 + 8);
      irrigations.push({ ts, duration, raised });
      current = Math.min(95, current + raised);
    }
  }
  return { humidity, irrigations };
}

function fmt(ts) { return new Date(ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }); }

const HISTORY_TABS = ["Humedad", "Riegos"];

function HistoryPanel({ plant, range, onRangeChange }) {
  const [tab,      setTab]      = useState("Humedad");
  const [exporting, setExporting] = useState(null); // "csv" | "pdf" | null

  const history = generateHistory(plant, range);
  const { humidity, irrigations } = history;
  const humValues = humidity.map(h => h.value);
  const avg = Math.round(humValues.reduce((a, b) => a + b, 0) / humValues.length);

  const handleCSV = () => {
    setExporting("csv");
    setTimeout(() => { exportCSV(plant, history); setExporting(null); }, 300);
  };
  const handlePDF = () => {
    setExporting("pdf");
    setTimeout(() => { exportPDF(plant, history); setExporting(null); }, 300);
  };

  const tooltipBase = {
    backgroundColor: "rgba(5,14,10,0.95)", borderWidth: 1,
    titleColor: "#f0f6fc", bodyColor: "#f0f6fc",
    padding: 10, cornerRadius: 8, displayColors: false,
  };
  const chartBase = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: tooltipBase },
    scales: {
      x: { ticks: { color: "#4d7a5e", font: { size: 9 }, maxTicksLimit: 7 }, grid: { color: "rgba(34,197,94,0.05)" } },
      y: { ticks: { color: "#4d7a5e", font: { size: 9 } }, grid: { color: "rgba(34,197,94,0.05)" } },
    },
    interaction: { mode: "nearest", intersect: false },
  };

  const humData = {
    labels: humidity.map(h => fmt(h.ts)),
    datasets: [
      { data: humValues, fill: true, tension: 0.45, borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.07)", pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: "#22c55e", pointHoverBorderColor: "#fff", pointHoverBorderWidth: 2, borderWidth: 1.8 },
      { data: Array(humValues.length).fill(plant.minHumidity), borderColor: "rgba(248,113,113,0.45)", borderDash: [5,4], borderWidth: 1.2, pointRadius: 0, fill: false },
      { data: Array(humValues.length).fill(plant.maxHumidity), borderColor: "rgba(56,189,248,0.45)", borderDash: [5,4], borderWidth: 1.2, pointRadius: 0, fill: false },
    ],
  };
  const humOptions = { ...chartBase, plugins: { ...chartBase.plugins, tooltip: { ...tooltipBase, borderColor: "rgba(34,197,94,0.3)" } }, scales: { ...chartBase.scales, y: { ...chartBase.scales.y, min: 0, max: 100, ticks: { ...chartBase.scales.y.ticks, callback: v => `${v}%` } } } };

  const irrData = {
    labels: irrigations.map(r => fmt(r.ts)),
    datasets: [
      { label: "Duración (min)", data: irrigations.map(r => r.duration), backgroundColor: "rgba(56,189,248,0.6)", borderColor: "#38bdf8", borderWidth: 1.5, borderRadius: 5 },
      { label: "Humedad +%",    data: irrigations.map(r => r.raised),   backgroundColor: "rgba(34,197,94,0.55)",  borderColor: "#22c55e", borderWidth: 1.5, borderRadius: 5 },
    ],
  };
  const irrOptions = { ...chartBase, plugins: { ...chartBase.plugins, legend: { display: true, labels: { color: "#a3c4b0", font: { size: 10 }, boxWidth: 14, padding: 10 } }, tooltip: { ...tooltipBase, borderColor: "rgba(56,189,248,0.3)" } } };

  return (
    <motion.div className="pc-history-panel"
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pc-hist-inner">

        {/* Header con tabs, rango y botones exportar */}
        <div className="pc-hist-header">
          <div className="pc-hist-tabs">
            {HISTORY_TABS.map(t => (
              <button key={t} className={`pc-hist-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t === "Humedad" ? "📈" : "💧"} {t}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Rango */}
            <div className="pc-hist-range">
              {[7, 14, 30].map(d => (
                <button key={d} className={`pc-hist-range-btn ${range === d ? "active" : ""}`} onClick={() => onRangeChange(d)}>{d}d</button>
              ))}
            </div>
            {/* ✅ Botón CSV */}
            <motion.button
              onClick={handleCSV} title="Descargar CSV"
              whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.08 }}
              disabled={!!exporting}
              style={{
                width: 28, height: 28, borderRadius: 8,
                border: "1px solid rgba(52,211,153,0.25)",
                background: exporting === "csv" ? "rgba(52,211,153,0.18)" : "rgba(52,211,153,0.08)",
                color: "#34d399", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              {exporting === "csv"
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} style={{ width: 11, height: 11, border: "2px solid #34d399", borderTopColor: "transparent", borderRadius: "50%" }} />
                : <Download size={12} />
              }
            </motion.button>
            {/* ✅ Botón PDF */}
            <motion.button
              onClick={handlePDF} title="Exportar PDF"
              whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.08 }}
              disabled={!!exporting}
              style={{
                width: 28, height: 28, borderRadius: 8,
                border: "1px solid rgba(96,165,250,0.25)",
                background: exporting === "pdf" ? "rgba(96,165,250,0.18)" : "rgba(96,165,250,0.08)",
                color: "#60a5fa", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              {exporting === "pdf"
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} style={{ width: 11, height: 11, border: "2px solid #60a5fa", borderTopColor: "transparent", borderRadius: "50%" }} />
                : <FileText size={12} />
              }
            </motion.button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="pc-hist-stats">
          <div className="pc-hs-item"><span className="pc-hs-val" style={{ color: "#22c55e" }}>{avg}%</span><span className="pc-hs-lbl">Promedio</span></div>
          <div className="pc-hs-item"><span className="pc-hs-val" style={{ color: "#f87171" }}>{Math.min(...humValues)}%</span><span className="pc-hs-lbl">Mínimo</span></div>
          <div className="pc-hs-item"><span className="pc-hs-val" style={{ color: "#38bdf8" }}>{Math.max(...humValues)}%</span><span className="pc-hs-lbl">Máximo</span></div>
          <div className="pc-hs-item"><span className="pc-hs-val" style={{ color: "#10b981" }}>{irrigations.length}</span><span className="pc-hs-lbl">Riegos</span></div>
        </div>

        {/* Gráfica */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} className="pc-hist-chart"
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
            {tab === "Humedad" ? <Line data={humData} options={humOptions} /> :
             irrigations.length === 0 ? <div className="pc-hist-empty">Sin riegos en este período 🌵</div> :
             <Bar data={irrData} options={irrOptions} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export const cardVariants = {
  hidden:  { opacity: 0, y: 32, scale: 0.94 },
  visible: { opacity: 1, y: 0,  scale: 1    },
};

function PlantCard({ plant, onEdit, onDelete, onToggleValve, index = 0 }) {
  const toast    = useToast();
  const humidity = plant.currentHumidity ?? 0;
  const hs       = getHumState(humidity, plant.minHumidity, plant.maxHumidity);
  const isAlert  = humidity < plant.minHumidity;
  const isOn     = plant.valveStatus === "OPEN";

  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [irrigConfirm, setIrrigConfirm] = useState(false);
  const [historyOpen,  setHistoryOpen]  = useState(false);
  const [historyRange, setHistoryRange] = useState(14);
  const [imgLoaded,    setImgLoaded]    = useState(false);
  const [toggling,     setToggling]     = useState(false);

  const handleToggleClick = useCallback(() => {
    if (toggling) return;
    setIrrigConfirm(true);
  }, [toggling]);

  const handleToggleConfirmed = useCallback(async () => {
    setIrrigConfirm(false);
    setToggling(true);
    if (onToggleValve) await onToggleValve(plant);
    setToggling(false);
  }, [plant, onToggleValve]);

  return (
    <>
      <motion.div
        className={`pc2 ${isOn ? "pc2-active" : ""} ${isAlert ? "pc2-alert" : ""} ${historyOpen ? "pc2-expanded" : ""}`}
        variants={cardVariants} initial="hidden" animate="visible"
        transition={{ duration: 0.38, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        whileHover={!historyOpen ? { y: -4, transition: { duration: 0.2 } } : {}}
        layout
      >
        <div className="pc2-img-wrap">
          <img src={getImage(plant)} alt={plant.name}
            className={`pc2-img ${imgLoaded ? "loaded" : ""}`}
            onLoad={() => setImgLoaded(true)}
            onError={e => { e.target.src = FALLBACK; setImgLoaded(true); }}
          />
          <div className="pc2-img-gradient" />
          <div className="pc2-top-badges">
            <span className="pc2-sector">{plant.sector}</span>
            {isOn && (
              <motion.span className="pc2-watering"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}>
                💧 Regando
              </motion.span>
            )}
          </div>
          <div className="pc2-hum-overlay" style={{ background: "rgba(6,10,16,0.55)", backdropFilter: "blur(8px)", padding: "8px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
            <HumidityGauge value={humidity} min={plant.minHumidity} max={plant.maxHumidity} size={100} />
          </div>
        </div>

        <div className="pc2-body">
          <div className="pc2-name-row">
            <h3 className="pc2-name">{plant.name}</h3>
            <span className="pc2-irr-type">{plant.irrigationType}</span>
          </div>
          <div className="pc2-progress">
            <div className="pc2-track">
              <div className="pc2-zone-ok" style={{ left: `${plant.minHumidity}%`, width: `${plant.maxHumidity - plant.minHumidity}%` }} />
              <motion.div className="pc2-fill"
                initial={{ width: 0 }} animate={{ width: `${Math.min(humidity, 100)}%` }}
                transition={{ duration: 1.1, delay: index * 0.08 + 0.3, ease: "easeOut" }}
                style={{ background: hs.bar }}
              />
              <motion.div className="pc2-thumb"
                initial={{ left: "0%" }} animate={{ left: `${Math.min(humidity, 100)}%` }}
                transition={{ duration: 1.1, delay: index * 0.08 + 0.3, ease: "easeOut" }}
                style={{ background: hs.color, boxShadow: `0 0 8px ${hs.color}88` }}
              />
            </div>
            <div className="pc2-range-labels">
              <span>{plant.minHumidity}%</span>
              <span style={{ color: hs.color, fontWeight: 700 }}>{humidity}%</span>
              <span>{plant.maxHumidity}%</span>
            </div>
          </div>

          {isAlert && (
            <motion.div className="pc2-alert-strip"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              ⚠ Humedad bajo mínimo — riego recomendado
            </motion.div>
          )}

          {/* Botón regar con pulso animado */}
          <div style={{ position: "relative" }}>
            {isOn && (
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                style={{ position: "absolute", inset: 0, borderRadius: 10, background: "rgba(52,211,153,0.25)", pointerEvents: "none" }}
              />
            )}
            <motion.button
              className={`pc2-water-btn ${isOn ? "stop" : "go"}`}
              onClick={handleToggleClick}
              whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
              disabled={toggling}
              style={{ position: "relative" }}
            >
              {toggling ? "⏳ Procesando..." : isOn ? "🛑 Detener Riego" : "💧 Regar Ahora"}
            </motion.button>
          </div>

          <div className="pc2-actions">
            <button className={`pc2-act history ${historyOpen ? "active" : ""}`} onClick={() => setHistoryOpen(v => !v)}>
              {historyOpen ? "▲ Ocultar" : "📈 Historial"}
            </button>
            <button className="pc2-act edit" onClick={() => onEdit(plant)}>✏ Editar</button>
            <button className="pc2-act delete" onClick={() => setConfirmOpen(true)}>🗑</button>
          </div>
        </div>

        <AnimatePresence>
          {historyOpen && <HistoryPanel plant={plant} range={historyRange} onRangeChange={setHistoryRange} />}
        </AnimatePresence>
      </motion.div>

      <ConfirmModal
        isOpen={confirmOpen}
        plantName={plant.name}
        onConfirm={() => { setConfirmOpen(false); onDelete(plant._id); toast(`${plant.name} eliminada`, "error"); }}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmIrrigationModal
        isOpen={irrigConfirm}
        plant={plant}
        isOn={isOn}
        onConfirm={handleToggleConfirmed}
        onCancel={() => setIrrigConfirm(false)}
      />
    </>
  );
}

export default PlantCard;