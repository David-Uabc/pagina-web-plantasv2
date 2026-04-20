import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowLeft, Plus, GripVertical } from "lucide-react";
import api from "../api";
import Navbar    from "../components/layout/Navbar";
import PlantCard from "../components/plant/PlantCard";
import PlantModal from "../components/plant/PlantModal";
import { PlantGridSkeleton } from "../components/plant/PlantCardSkeleton";
import EmptyPlants from "../components/plant/EmptyPlants";
import AlertHistoryModal from "../components/plant/AlertHistoryModal";
import { useToast } from "../context/ToastProvider";
import { useNotifications } from "../hooks/useNotifications";
import { useSocket } from "../hooks/useSocket";

const SORT_OPTIONS = [
  { value: "order",         label: "Personalizado" },
  { value: "name-asc",      label: "Nombre A–Z"    },
  { value: "name-desc",     label: "Nombre Z–A"    },
  { value: "humidity-asc",  label: "Humedad ↑"     },
  { value: "humidity-desc", label: "Humedad ↓"     },
];

const STATUS_CHIPS = [
  { value: "all",      label: "Todas",     icon: null },
  { value: "active",   label: "Regando",   icon: "💧" },
  { value: "inactive", label: "Inactivas", icon: "⏸"  },
  { value: "alert",    label: "Alerta",    icon: "⚠"  },
];

const SECTOR_THEME = {
  Superior: {
    gradient:     "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #0f172a 100%)",
    accent:       "#34d399",
    accentDim:    "rgba(52,211,153,0.15)",
    accentBorder: "rgba(52,211,153,0.30)",
    glow:         "rgba(52,211,153,0.20)",
    icon:         "🌿",
    label:        "Patio Superior",
    img:          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=60",
  },
  Inferior: {
    gradient:     "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)",
    accent:       "#818cf8",
    accentDim:    "rgba(129,140,248,0.15)",
    accentBorder: "rgba(129,140,248,0.30)",
    glow:         "rgba(129,140,248,0.20)",
    icon:         "🌱",
    label:        "Patio Inferior",
    img:          "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=60",
  },
};

function SectorPage({ sector }) {
  const toast    = useToast();
  const navigate = useNavigate();
  const theme    = SECTOR_THEME[sector] || SECTOR_THEME.Superior;
  const { requestPermission, checkPlants } = useNotifications();

  const [plants,        setPlants]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editingPlant,  setEditingPlant]  = useState(null);
  const [alertPlant,    setAlertPlant]    = useState(null);
  const [search,        setSearch]        = useState("");
  const [sort,          setSort]          = useState("order");
  const [status,        setStatus]        = useState("all");
  const [dragEnabled,   setDragEnabled]   = useState(false);
  const [orderedPlants, setOrderedPlants] = useState([]);

  useEffect(() => { requestPermission(); }, [requestPermission]);

  // ── Fetch plantas ─────────────────────────────────────────
  const fetchPlants = useCallback(async () => {
    try {
      const res = await api.get("/api/plants");
      setPlants(res.data);
      checkPlants(res.data.filter(p => p.sector === sector));
    } catch {}
    finally { setLoading(false); }
  }, [checkPlants, sector]);

  useEffect(() => {
    fetchPlants();
    const interval = setInterval(fetchPlants, 30000);
    return () => clearInterval(interval);
  }, [fetchPlants]);

  // ── Socket.io tiempo real ─────────────────────────────────
  useSocket({
    // ✅ CORREGIDO: spread para no perder campos con actualización optimista
    onPlantUpdate: useCallback((data) => {
      if (data.sector !== sector) return;
      setPlants(prev => prev.map(p =>
        p._id === data._id ? { ...p, ...data } : p
      ));
    }, [sector]),

    onPlantDeleted: useCallback((data) => {
      setPlants(prev => prev.filter(p => p._id !== data._id));
    }, []),

    onAlert: useCallback((data) => {
      if (data.sector !== sector) return;
      toast(`⚠️ ${data.name} — humedad crítica: ${data.humidity}%`, "error");
    }, [sector, toast]),

    onScheduleTriggered: useCallback((data) => {
      if (data.sector !== sector) return;
      toast(`⏰ Riego automático — ${data.name}`, "info");
    }, [sector, toast]),
  });

  // ── Plantas del sector memoizadas ─────────────────────────
  const sectorPlants = useMemo(
    () => plants.filter(p => p.sector === sector),
    [plants, sector]
  );

  // ── Orden de plantas — solo actualizar si cambian IDs u order
  useEffect(() => {
    setOrderedPlants(prev => {
      const sorted = [...sectorPlants].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const prevKey = prev.map(p => p._id + p.order + p.valveStatus).join(",");
      const nextKey = sorted.map(p => p._id + p.order + p.valveStatus).join(",");
      if (prevKey === nextKey) return prev;
      return sorted;
    });
  }, [sectorPlants]);

  // ── Guardar / editar planta ───────────────────────────────
  const handleSave = async (data) => {
    try {
      if (editingPlant) {
        const res = await api.put(`/api/plants/${editingPlant._id}`, data);
        setPlants(prev => prev.map(p => p._id === editingPlant._id ? res.data : p));
        toast(`${data.name} actualizada ✓`, "success");
      } else {
        const res = await api.post("/api/plants", { ...data, sector });
        setPlants(prev => [...prev, res.data]);
        toast(`${data.name} agregada ✓`, "success");
      }
    } catch (err) {
      toast(err.response?.data?.error || "Error al guardar", "error");
    }
    setShowModal(false);
    setEditingPlant(null);
  };

  // ── Eliminar planta ───────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/plants/${id}`);
      setPlants(prev => prev.filter(p => p._id !== id));
    } catch {
      toast("Error al eliminar", "error");
    }
  };

  // ── Toggle válvula ✅ actualiza plants Y orderedPlants al instante
  const handleToggleValve = async (plant) => {
    const newStatus = plant.valveStatus === "OPEN" ? "CLOSED" : "OPEN";

    // ✅ Actualizar AMBOS estados — orderedPlants es el que renderiza el grid
    const applyUpdate = prev => prev.map(p =>
      p._id === plant._id ? { ...p, valveStatus: newStatus } : p
    );
    setPlants(applyUpdate);
    setOrderedPlants(applyUpdate);

    try {
      const res = await api.put(`/api/plants/${plant._id}`, { valveStatus: newStatus });
      // Sincronizar con la respuesta real del servidor
      const applySync = prev => prev.map(p =>
        p._id === plant._id ? { ...p, ...res.data } : p
      );
      setPlants(applySync);
      setOrderedPlants(applySync);
      toast(
        newStatus === "OPEN"
          ? `💧 Riego iniciado — ${plant.name}`
          : `⏹ Riego detenido — ${plant.name}`,
        newStatus === "OPEN" ? "info" : "warning"
      );
    } catch {
      // Revertir ambos si falla
      const applyRevert = prev => prev.map(p =>
        p._id === plant._id ? { ...p, valveStatus: plant.valveStatus } : p
      );
      setPlants(applyRevert);
      setOrderedPlants(applyRevert);
      toast("Error al controlar la válvula", "error");
    }
  };

  // ── Reordenar plantas con drag ────────────────────────────
  const handleReorderEnd = useCallback(async (newOrder) => {
    setOrderedPlants(newOrder);
    try {
      await Promise.all(
        newOrder.map((p, i) =>
          p.order !== i
            ? api.put(`/api/plants/${p._id}`, { order: i })
            : Promise.resolve()
        )
      );
      setPlants(prev => prev.map(p => {
        const idx = newOrder.findIndex(o => o._id === p._id);
        return idx !== -1 ? { ...p, order: idx } : p;
      }));
    } catch {
      toast("Error al guardar orden", "error");
    }
  }, [toast]);

  // ── Stats del hero ────────────────────────────────────────
  const avgHum        = sectorPlants.length
    ? Math.round(sectorPlants.reduce((s, p) => s + (p.currentHumidity || 0), 0) / sectorPlants.length)
    : 0;
  const alertCount    = sectorPlants.filter(p => (p.currentHumidity ?? 0) < p.minHumidity).length;
  const wateringCount = sectorPlants.filter(p => p.valveStatus === "OPEN").length;

  // ── Filtros y ordenamiento ────────────────────────────────
  const filteredPlants = [...orderedPlants]
    .filter(p => {
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.irrigationType?.toLowerCase().includes(q);
    })
    .filter(p => {
      if (status === "all")      return true;
      if (status === "active")   return p.valveStatus === "OPEN";
      if (status === "inactive") return p.valveStatus !== "OPEN" && (p.currentHumidity ?? 0) >= p.minHumidity;
      if (status === "alert")    return (p.currentHumidity ?? 0) < p.minHumidity;
      return true;
    })
    .sort((a, b) => {
      if (sort === "order")         return (a.order ?? 0) - (b.order ?? 0);
      if (sort === "name-asc")      return a.name?.localeCompare(b.name);
      if (sort === "name-desc")     return b.name?.localeCompare(a.name);
      if (sort === "humidity-asc")  return (a.currentHumidity || 0) - (b.currentHumidity || 0);
      if (sort === "humidity-desc") return (b.currentHumidity || 0) - (a.currentHumidity || 0);
      return 0;
    });

  const hasFilters = search !== "" || status !== "all";
  const isDragging = dragEnabled && sort === "order" && !hasFilters;

  return (
    <div className="sp-page">
      <Navbar plants={plants} />

      {/* ── Hero ── */}
      <motion.div className="sp-hero"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ "--sector-accent": theme.accent, "--sector-glow": theme.glow }}
      >
        <div className="sp-hero-bg">
          <img src={theme.img} alt="" className="sp-hero-img" />
          <div className="sp-hero-overlay" style={{ background: theme.gradient }} />
        </div>
        <div className="sp-hero-content">
          <motion.button className="sp-back-btn" onClick={() => navigate("/")}
            whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          >
            <ArrowLeft size={15} /> Dashboard
          </motion.button>

          <motion.div className="sp-hero-title-wrap"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="sp-hero-icon">{theme.icon}</span>
            <div>
              <h1 className="sp-hero-title" style={{
                backgroundImage: `linear-gradient(135deg, #fff 30%, ${theme.accent})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{theme.label}</h1>
              <p className="sp-hero-sub">{sectorPlants.length} plantas · Sistema de Riego IoT</p>
            </div>
          </motion.div>

          <motion.div className="sp-stats-bar"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.45 }}
          >
            {[
              { label: "Total",    value: sectorPlants.length, color: theme.accent },
              { label: "Regando",  value: wateringCount,       color: "#60a5fa"    },
              { label: "Alertas",  value: alertCount,          color: alertCount > 0 ? "#f87171" : theme.accent },
              { label: "Hum. Avg", value: `${avgHum}%`,        color: theme.accent },
            ].map((s, i) => (
              <motion.div key={s.label} className="sp-stat"
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <span className="sp-stat-val" style={{ color: s.color }}>{s.value}</span>
                <span className="sp-stat-lbl">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Filtros ── */}
      <motion.div className="sp-filters"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{
          "--sector-accent":        theme.accent,
          "--sector-accent-dim":    theme.accentDim,
          "--sector-accent-border": theme.accentBorder,
        }}
      >
        <div className="sp-search-wrap">
          <Search size={15} className="sp-search-icon" />
          <input
            className="sp-search"
            placeholder="Buscar planta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="sp-sort-wrap">
          <SlidersHorizontal size={14} className="sp-sort-icon" />
          <select className="sp-sort" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="sp-chips">
          {STATUS_CHIPS.map(chip => (
            <button
              key={chip.value}
              className={`sp-chip ${status === chip.value ? "active" : ""}`}
              onClick={() => setStatus(chip.value)}
            >
              {chip.icon && <span>{chip.icon}</span>}{chip.label}
              {chip.value !== "all" && (
                <span className="sp-chip-count">
                  {chip.value === "active"   ? wateringCount :
                   chip.value === "alert"    ? alertCount    :
                   sectorPlants.filter(p =>
                     p.valveStatus !== "OPEN" && (p.currentHumidity ?? 0) >= p.minHumidity
                   ).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {sectorPlants.length > 1 && (
          <button
            onClick={() => setDragEnabled(d => !d)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
              background:  dragEnabled ? theme.accentDim : "rgba(255,255,255,0.05)",
              color:        dragEnabled ? theme.accent    : "#78909c",
              border:       dragEnabled
                ? `1px solid ${theme.accentBorder}`
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <GripVertical size={13} />
            {dragEnabled ? "Listo" : "Ordenar"}
          </button>
        )}

        <span className="sp-count">{filteredPlants.length} / {sectorPlants.length} plantas</span>
      </motion.div>

      {/* ── Grid ── */}
      <div className="sp-grid-wrap">
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{
                margin: "0 0 12px", padding: "10px 16px", borderRadius: 12,
                background: theme.accentDim, border: `1px solid ${theme.accentBorder}`,
                fontSize: 12, color: theme.accent, display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <GripVertical size={14} />
              Arrastra las tarjetas para reorganizar el orden.
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="plant-grid"><PlantGridSkeleton count={4} /></div>

        ) : sectorPlants.length === 0 ? (
          <EmptyPlants
            sector={sector}
            onAdd={() => { setEditingPlant(null); setShowModal(true); }}
          />

        ) : filteredPlants.length === 0 ? (
          <motion.div
            className="sp-empty"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          >
            <span className="sp-empty-icon">🔍</span>
            <p>No hay plantas con esos filtros</p>
            {hasFilters && (
              <button className="sp-empty-reset" onClick={() => { setSearch(""); setStatus("all"); }}>
                Limpiar filtros
              </button>
            )}
          </motion.div>

        ) : isDragging ? (
          <Reorder.Group
            axis="x"
            values={orderedPlants}
            onReorder={setOrderedPlants}
            className="plant-grid"
            style={{ listStyle: "none", padding: 0, margin: 0 }}
            as="div"
          >
            {orderedPlants.map((plant, i) => (
              <Reorder.Item
                key={plant._id}
                value={plant}
                onDragEnd={() => handleReorderEnd(orderedPlants)}
                style={{ cursor: "grab" }}
                whileDrag={{ scale: 1.04, zIndex: 50 }}
              >
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", top: 8, left: 8, zIndex: 10,
                    width: 24, height: 24, borderRadius: 6,
                    background: theme.accentDim,
                    border: `1px solid ${theme.accentBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: theme.accent,
                  }}>
                    <GripVertical size={12} />
                  </div>
                  <PlantCard
                    plant={plant} index={i}
                    onEdit={p => { setEditingPlant(p); setShowModal(true); }}
                    onDelete={handleDelete}
                    onToggleValve={handleToggleValve}
                    onShowAlerts={p => setAlertPlant(p)}
                  />
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

        ) : (
          <AnimatePresence mode="popLayout">
            <div className="plant-grid">
              {filteredPlants.map((plant, i) => (
                <PlantCard
                  key={plant._id} plant={plant} index={i}
                  onEdit={p => { setEditingPlant(p); setShowModal(true); }}
                  onDelete={handleDelete}
                  onToggleValve={handleToggleValve}
                  onShowAlerts={p => setAlertPlant(p)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* ── FAB agregar planta ── */}
      <motion.button
        className="sp-fab"
        onClick={() => { setEditingPlant(null); setShowModal(true); }}
        style={{
          background:  `linear-gradient(135deg, ${theme.accent}, ${theme.accent}aa)`,
          boxShadow:   `0 8px 32px ${theme.glow}`,
        }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", bounce: 0.4 }}
      >
        <Plus size={22} color="#000" strokeWidth={2.5} />
      </motion.button>

      {/* ── Modal planta ── */}
      <PlantModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPlant(null); }}
        onSave={handleSave}
        plant={editingPlant}
        defaultSector={sector}
      />

      {/* ── Modal alertas ── */}
      <AnimatePresence>
        {alertPlant && (
          <AlertHistoryModal plant={alertPlant} onClose={() => setAlertPlant(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default SectorPage;