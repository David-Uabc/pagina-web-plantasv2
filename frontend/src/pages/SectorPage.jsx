import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Droplets, AlertTriangle, Leaf, ArrowLeft, Plus } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import PlantCard from "../components/plant/PlantCard";
import PlantModal from "../components/plant/PlantModal";
import { PlantGridSkeleton } from "../components/plant/PlantCardSkeleton";
import { useToast } from "../context/ToastProvider";

const SORT_OPTIONS = [
  { value: "name-asc",      label: "Nombre A–Z"  },
  { value: "name-desc",     label: "Nombre Z–A"  },
  { value: "humidity-asc",  label: "Humedad ↑"   },
  { value: "humidity-desc", label: "Humedad ↓"   },
];

const STATUS_CHIPS = [
  { value: "all",      label: "Todas",       icon: null          },
  { value: "active",   label: "Regando",     icon: "💧"          },
  { value: "inactive", label: "Inactivas",   icon: "⏸"          },
  { value: "alert",    label: "Alerta",      icon: "⚠"          },
];

const MOCK_DATA = {
  Superior: [
    { _id: "1", name: "Lavanda",  sector: "Superior", currentHumidity: 45, minHumidity: 30, maxHumidity: 70, irrigationType: "Diario",      valveStatus: false },
    { _id: "2", name: "Menta",    sector: "Superior", currentHumidity: 30, minHumidity: 40, maxHumidity: 80, irrigationType: "Semanal",     valveStatus: true  },
    { _id: "3", name: "Albahaca", sector: "Superior", currentHumidity: 65, minHumidity: 35, maxHumidity: 75, irrigationType: "Por humedad", valveStatus: false },
    { _id: "4", name: "Romero",   sector: "Superior", currentHumidity: 20, minHumidity: 25, maxHumidity: 60, irrigationType: "Quincenal",   valveStatus: false },
  ],
  Inferior: [
    { _id: "5", name: "Rosa",     sector: "Inferior", currentHumidity: 28, minHumidity: 35, maxHumidity: 70, irrigationType: "Diario",      valveStatus: true  },
    { _id: "6", name: "Cactus",   sector: "Inferior", currentHumidity: 60, minHumidity: 10, maxHumidity: 40, irrigationType: "Quincenal",   valveStatus: false },
    { _id: "7", name: "Girasol",  sector: "Inferior", currentHumidity: 50, minHumidity: 40, maxHumidity: 80, irrigationType: "Semanal",     valveStatus: false },
    { _id: "8", name: "Gardenia", sector: "Inferior", currentHumidity: 15, minHumidity: 45, maxHumidity: 75, irrigationType: "Por humedad", valveStatus: false },
  ],
};

// Paleta por sector
const SECTOR_THEME = {
  Superior: {
    gradient:    "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #0f172a 100%)",
    accent:      "#34d399",
    accentDim:   "rgba(52,211,153,0.15)",
    accentBorder:"rgba(52,211,153,0.30)",
    glow:        "rgba(52,211,153,0.20)",
    icon:        "🌿",
    label:       "Patio Superior",
    img:         "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=60",
  },
  Inferior: {
    gradient:    "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)",
    accent:      "#818cf8",
    accentDim:   "rgba(129,140,248,0.15)",
    accentBorder:"rgba(129,140,248,0.30)",
    glow:        "rgba(129,140,248,0.20)",
    icon:        "🌱",
    label:       "Patio Inferior",
    img:         "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=60",
  },
};

function SectorPage({ sector, onLogout }) {
  const toast    = useToast();
  const navigate = useNavigate();
  const theme    = SECTOR_THEME[sector] || SECTOR_THEME.Superior;

  const [plants,       setPlants]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [search,       setSearch]       = useState("");
  const [sort,         setSort]         = useState("name-asc");
  const [status,       setStatus]       = useState("all");

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/plants");
        setPlants(res.data);
      } catch {
        setPlants(MOCK_DATA[sector] || []);
      } finally {
        setLoading(false);
      }
    };
    fetchPlants();
    const interval = setInterval(fetchPlants, 5000);
    return () => clearInterval(interval);
  }, [sector]);

  const handleSave = async (data) => {
    try {
      if (editingPlant) {
        const res = await axios.put(`http://localhost:5000/api/plants/${editingPlant._id}`, data);
        setPlants(prev => prev.map(p => p._id === editingPlant._id ? res.data : p));
        toast(`${data.name} actualizada ✓`, "success");
      } else {
        const res = await axios.post("http://localhost:5000/api/plants", { ...data, sector });
        setPlants(prev => [...prev, res.data]);
        toast(`${data.name} agregada ✓`, "success");
      }
    } catch {
      if (editingPlant) {
        setPlants(prev => prev.map(p => p._id === editingPlant._id ? { ...p, ...data } : p));
        toast(`${data.name} actualizada ✓`, "success");
      } else {
        setPlants(prev => [...prev, { ...data, _id: Date.now().toString(), sector, currentHumidity: 0 }]);
        toast(`${data.name} agregada ✓`, "success");
      }
    }
    setShowModal(false);
    setEditingPlant(null);
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`http://localhost:5000/api/plants/${id}`); } catch {}
    setPlants(prev => prev.filter(p => p._id !== id));
  };

  const sectorPlants = plants.filter(p => p.sector === sector);
  const avgHum       = sectorPlants.length
    ? Math.round(sectorPlants.reduce((s, p) => s + (p.currentHumidity || 0), 0) / sectorPlants.length)
    : 0;
  const alertCount   = sectorPlants.filter(p => p.currentHumidity < p.minHumidity).length;
  const wateringCount= sectorPlants.filter(p => p.valveStatus === true || p.valveStatus === "OPEN").length;

  const filtered = sectorPlants
    .filter(p => {
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.irrigationType?.toLowerCase().includes(q);
    })
    .filter(p => {
      if (status === "all")      return true;
      if (status === "active")   return p.valveStatus === true || p.valveStatus === "OPEN";
      if (status === "inactive") return !p.valveStatus && p.currentHumidity >= p.minHumidity;
      if (status === "alert")    return p.currentHumidity < p.minHumidity;
      return true;
    })
    .sort((a, b) => {
      if (sort === "name-asc")      return a.name?.localeCompare(b.name);
      if (sort === "name-desc")     return b.name?.localeCompare(a.name);
      if (sort === "humidity-asc")  return (a.currentHumidity || 0) - (b.currentHumidity || 0);
      if (sort === "humidity-desc") return (b.currentHumidity || 0) - (a.currentHumidity || 0);
      return 0;
    });

  return (
    <div className="sp-page">
      <Navbar onLogout={onLogout} />

      {/* ══ HERO HEADER ══════════════════════════════════ */}
      <motion.div
        className="sp-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ "--sector-accent": theme.accent, "--sector-glow": theme.glow }}
      >
        {/* Imagen de fondo con overlay */}
        <div className="sp-hero-bg">
          <img src={theme.img} alt="" className="sp-hero-img" />
          <div className="sp-hero-overlay" style={{ background: theme.gradient }} />
        </div>

        {/* Contenido del hero */}
        <div className="sp-hero-content">
          {/* Breadcrumb */}
          <motion.button
            className="sp-back-btn"
            onClick={() => navigate("/")}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <ArrowLeft size={15} />
            Dashboard
          </motion.button>

          {/* Título */}
          <motion.div
            className="sp-hero-title-wrap"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="sp-hero-icon">{theme.icon}</span>
            <div>
              <h1 className="sp-hero-title" style={{
                backgroundImage: `linear-gradient(135deg, #fff 30%, ${theme.accent})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {theme.label}
              </h1>
              <p className="sp-hero-sub">
                {sectorPlants.length} plantas · Sistema de Riego IoT
              </p>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            className="sp-stats-bar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.45 }}
          >
            {[
              { Icon: Leaf,          label: "Total",    value: sectorPlants.length, color: theme.accent },
              { Icon: Droplets,      label: "Regando",  value: wateringCount,       color: "#60a5fa"    },
              { Icon: AlertTriangle, label: "Alertas",  value: alertCount,          color: alertCount > 0 ? "#f87171" : theme.accent },
              { Icon: null,          label: "Hum. Avg", value: `${avgHum}%`,        color: theme.accent },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="sp-stat"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ "--stat-color": s.color }}
              >
                <span className="sp-stat-val" style={{ color: s.color }}>{s.value}</span>
                <span className="sp-stat-lbl">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ══ FILTER BAR ═══════════════════════════════════ */}
      <motion.div
        className="sp-filters"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ "--sector-accent": theme.accent, "--sector-accent-dim": theme.accentDim, "--sector-accent-border": theme.accentBorder }}
      >
        {/* Search */}
        <div className="sp-search-wrap">
          <Search size={15} className="sp-search-icon" />
          <input
            className="sp-search"
            placeholder="Buscar planta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Sort */}
        <div className="sp-sort-wrap">
          <SlidersHorizontal size={14} className="sp-sort-icon" />
          <select className="sp-sort" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Status chips */}
        <div className="sp-chips">
          {STATUS_CHIPS.map(chip => (
            <button
              key={chip.value}
              className={`sp-chip ${status === chip.value ? "active" : ""}`}
              onClick={() => setStatus(chip.value)}
            >
              {chip.icon && <span>{chip.icon}</span>}
              {chip.label}
              {chip.value !== "all" && (
                <span className="sp-chip-count">
                  {chip.value === "active"   ? wateringCount :
                   chip.value === "alert"    ? alertCount    :
                   sectorPlants.filter(p => !p.valveStatus && p.currentHumidity >= p.minHumidity).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Count */}
        <span className="sp-count">
          {filtered.length} / {sectorPlants.length} plantas
        </span>
      </motion.div>

      {/* ══ GRID DE PLANTAS ══════════════════════════════ */}
      <div className="sp-grid-wrap">
        <AnimatePresence mode="popLayout">
          <div className="plant-grid">
            {loading ? (
              <PlantGridSkeleton count={4} />
            ) : filtered.length === 0 ? (
              <motion.div
                className="sp-empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="sp-empty-icon">🌵</span>
                <p>No hay plantas con esos filtros</p>
                <button className="sp-empty-reset" onClick={() => { setSearch(""); setStatus("all"); }}>
                  Limpiar filtros
                </button>
              </motion.div>
            ) : (
              filtered.map((plant, i) => (
                <PlantCard
                  key={plant._id} plant={plant} index={i}
                  onEdit={p => { setEditingPlant(p); setShowModal(true); }}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* ══ FAB — Añadir planta ═══════════════════════════ */}
      <motion.button
        className="sp-fab"
        onClick={() => { setEditingPlant(null); setShowModal(true); }}
        style={{
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}aa)`,
          boxShadow: `0 8px 32px ${theme.glow}, 0 2px 8px rgba(0,0,0,0.4)`,
        }}
        whileHover={{ scale: 1.08, boxShadow: `0 12px 40px ${theme.glow}, 0 4px 12px rgba(0,0,0,0.5)` }}
        whileTap={{ scale: 0.94 }}
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", bounce: 0.4 }}
      >
        <Plus size={22} color="#000" strokeWidth={2.5} />
      </motion.button>

      <PlantModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPlant(null); }}
        onSave={handleSave}
        plant={editingPlant}
        defaultSector={sector}
      />
    </div>
  );
}

export default SectorPage;