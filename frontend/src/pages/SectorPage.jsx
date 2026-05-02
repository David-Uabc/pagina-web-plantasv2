import { lazy, Suspense, useState, useEffect, useCallback, useMemo, useRef, useDeferredValue } from "react";
import { motion, AnimatePresence, Reorder, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowLeft, Plus, GripVertical, Droplets, Thermometer, Zap } from "lucide-react";
import api from "../api";
import Navbar from "../components/layout/Navbar";
import PlantCard from "../components/plant/PlantCard";
import { PlantGridSkeleton } from "../components/plant/PlantCardSkeleton";
import EmptyPlants from "../components/plant/EmptyPlants";
import { useToast } from "../context/ToastProvider";
import { useNotifications } from "../hooks/useNotifications";
import { useSocket } from "../hooks/useSocket";

const PlantModal = lazy(() => import("../components/plant/PlantModal"));
const AlertHistoryModal = lazy(() => import("../components/plant/AlertHistoryModal"));

const SORT_OPTIONS = [
  { value: "order", label: "Personalizado" },
  { value: "name-asc", label: "Nombre A-Z" },
  { value: "name-desc", label: "Nombre Z-A" },
  { value: "humidity-asc", label: "Humedad ↑" },
  { value: "humidity-desc", label: "Humedad ↓" },
];

const STATUS_CHIPS = [
  { value: "all", label: "Todas", icon: null },
  { value: "active", label: "Regando", icon: "💧" },
  { value: "inactive", label: "Inactivas", icon: "⏸" },
  { value: "alert", label: "Alerta", icon: "⚠" },
];

const SECTOR_THEME = {
  Superior: {
    gradient: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #0f172a 100%)",
    gradientHero: "linear-gradient(160deg, #022c22 0%, #064e3b 35%, #0a3d2e 65%, #050d0a 100%)",
    accent: "#34d399",
    accentDim: "rgba(52,211,153,0.15)",
    accentBorder: "rgba(52,211,153,0.30)",
    glow: "rgba(52,211,153,0.20)",
    glowStrong: "rgba(52,211,153,0.45)",
    orb1: "rgba(52,211,153,0.18)",
    orb2: "rgba(16,185,129,0.12)",
    orb3: "rgba(5,150,105,0.10)",
    particle: "rgba(52,211,153,0.6)",
    icon: "🌿",
    label: "Patio Superior",
    sublabel: "Zona verde principal",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=60",
  },
  Inferior: {
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)",
    gradientHero: "linear-gradient(160deg, #0f0e1f 0%, #1e1b4b 35%, #252060 65%, #0a0918 100%)",
    accent: "#818cf8",
    accentDim: "rgba(129,140,248,0.15)",
    accentBorder: "rgba(129,140,248,0.30)",
    glow: "rgba(129,140,248,0.20)",
    glowStrong: "rgba(129,140,248,0.45)",
    orb1: "rgba(129,140,248,0.18)",
    orb2: "rgba(99,102,241,0.12)",
    orb3: "rgba(167,139,250,0.10)",
    particle: "rgba(129,140,248,0.6)",
    icon: "🌱",
    label: "Patio Inferior",
    sublabel: "Zona de cultivo interior",
    img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=60",
  },
};

function FloatingParticles({ color, seed, count = 18, reducedMotion = false }) {
  const particles = useMemo(() => {
    let currentSeed = seed;
    const rand = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };

    return Array.from({ length: count }, (_, index) => ({
      id: index,
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 4 + 1.5,
      dur: rand() * 8 + 6,
      del: rand() * 4,
      dx: (rand() - 0.5) * 60,
      dy: -(rand() * 80 + 40),
    }));
  }, [count, seed]);

  if (reducedMotion || count <= 0) return null;

  return (
    <div className="sp-particles" aria-hidden>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="sp-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: color,
          }}
          animate={{
            x: [0, particle.dx, 0],
            y: [0, particle.dy, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: particle.dur,
            delay: particle.del,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function BackgroundOrbs({ theme, compact = false, reducedMotion = false }) {
  const orbMotion = reducedMotion
    ? {}
    : {
        orb1: { scale: [1, compact ? 1.06 : 1.15, 1], x: [0, compact ? 14 : 30, 0], y: [0, compact ? -10 : -20, 0] },
        orb2: { scale: [1, compact ? 1.08 : 1.2, 1], x: [0, compact ? -12 : -25, 0], y: [0, compact ? 14 : 30, 0] },
        orb3: { scale: [1, compact ? 1.05 : 1.1, 1], x: [0, compact ? 10 : 20, 0], y: [0, compact ? 10 : 20, 0] },
      };

  return (
    <>
      <motion.div
        className="sp-orb sp-orb-1"
        style={{ background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 70%)` }}
        animate={orbMotion.orb1}
        transition={reducedMotion ? undefined : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="sp-orb sp-orb-2"
        style={{ background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 70%)` }}
        animate={orbMotion.orb2}
        transition={reducedMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="sp-orb sp-orb-3"
        style={{ background: `radial-gradient(circle, ${theme.orb3} 0%, transparent 70%)` }}
        animate={orbMotion.orb3}
        transition={reducedMotion ? undefined : { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
    </>
  );
}

function HeroStat({ label, value, color, icon: Icon, index }) {
  return (
    <motion.div
      className="sp-hero-stat"
      initial={{ opacity: 0, y: 20, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.35 + index * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ "--stat-color": color }}
      whileHover={{ y: -4, scale: 1.04 }}
    >
      {Icon && (
        <div className="sp-hero-stat-icon">
          <Icon size={14} strokeWidth={2} />
        </div>
      )}
      <span className="sp-hero-stat-val">{value}</span>
      <span className="sp-hero-stat-lbl">{label}</span>
    </motion.div>
  );
}

function SectorPage({ sector }) {
  const toast = useToast();
  const navigate = useNavigate();
  const theme = SECTOR_THEME[sector] || SECTOR_THEME.Superior;
  const heroRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { requestPermission, checkPlants } = useNotifications();
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  }));

  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [alertPlant, setAlertPlant] = useState(null);
  const [wateringSector, setWateringSector] = useState(false);
  const [stoppingSector, setStoppingSector] = useState(false);
  const [maintenanceSector, setMaintenanceSector] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("order");
  const [status, setStatus] = useState("all");
  const [dragEnabled, setDragEnabled] = useState(false);
  const [orderedPlants, setOrderedPlants] = useState([]);

  const compactMotion = viewport.width < 900;
  const particleCount = prefersReducedMotion ? 0 : viewport.width < 640 ? 8 : viewport.width < 1024 ? 12 : 18;
  const particleSeed = useMemo(
    () => Math.round(viewport.width / 24) * 31 + Math.round(viewport.height / 24) * 17 + sector.length * 13,
    [viewport.height, viewport.width, sector.length]
  );

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, compactMotion ? 18 : 60]);
  const heroOpacity = useTransform(scrollY, [0, 200], [1, compactMotion ? 0.86 : 0.6]);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    let frame = null;
    const handleResize = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setViewport((prev) => {
          const next = { width: window.innerWidth, height: window.innerHeight };
          if (prev.width === next.width && prev.height === next.height) return prev;
          return next;
        });
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const fetchPlants = useCallback(async (signal) => {
    try {
      const res = await api.get("/api/plants", {
        signal,
        meta: { cancelPrevious: false },
      });
      setPlants(res.data);
      checkPlants(res.data.filter((plant) => plant.sector === sector));
    } catch (error) {
      if (error.code !== "ERR_CANCELED" && error.name !== "CanceledError") {
        setLoading(false);
      }
      return;
    }
    setLoading(false);
  }, [checkPlants, sector]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPlants(controller.signal);
    const runFetch = () => {
      if (document.hidden) return;
      fetchPlants();
    };
    const interval = setInterval(runFetch, 30000);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPlants();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchPlants]);

  useSocket({
    onPlantUpdate: useCallback((data) => {
      if (data.sector !== sector) return;
      setPlants((prev) => prev.map((plant) => (plant._id === data._id ? { ...plant, ...data } : plant)));
    }, [sector]),
    onPlantDeleted: useCallback((data) => {
      setPlants((prev) => prev.filter((plant) => plant._id !== data._id));
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

  const sectorPlants = useMemo(() => plants.filter((plant) => plant.sector === sector), [plants, sector]);

  useEffect(() => {
    setOrderedPlants((prev) => {
      const sorted = [...sectorPlants].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const prevKey = prev.map((plant) => `${plant._id}|${plant.order}|${plant.valveStatus}|${plant.currentHumidity ?? 0}`).join(",");
      const nextKey = sorted.map((plant) => `${plant._id}|${plant.order}|${plant.valveStatus}|${plant.currentHumidity ?? 0}`).join(",");
      return prevKey === nextKey ? prev : sorted;
    });
  }, [sectorPlants]);

  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const statusCounts = useMemo(() => {
    const active = sectorPlants.filter((plant) => plant.valveStatus === "OPEN").length;
    const alert = sectorPlants.filter((plant) => (plant.currentHumidity ?? 0) < plant.minHumidity).length;
    const inactive = sectorPlants.filter((plant) => plant.valveStatus !== "OPEN" && (plant.currentHumidity ?? 0) >= plant.minHumidity).length;
    const maintenance = sectorPlants.filter((plant) => plant.maintenanceMode).length;
    return { active, alert, inactive, maintenance };
  }, [sectorPlants]);

  const avgHum = useMemo(
    () => (sectorPlants.length ? Math.round(sectorPlants.reduce((sum, plant) => sum + (plant.currentHumidity || 0), 0) / sectorPlants.length) : 0),
    [sectorPlants]
  );

  const filteredPlants = useMemo(
    () =>
      [...orderedPlants]
        .filter((plant) => {
          if (!normalizedSearch) return true;
          return plant.name?.toLowerCase().includes(normalizedSearch) || plant.irrigationType?.toLowerCase().includes(normalizedSearch);
        })
        .filter((plant) => {
          if (status === "all") return true;
          if (status === "active") return plant.valveStatus === "OPEN";
          if (status === "inactive") return plant.valveStatus !== "OPEN" && (plant.currentHumidity ?? 0) >= plant.minHumidity;
          if (status === "alert") return (plant.currentHumidity ?? 0) < plant.minHumidity;
          return true;
        })
        .sort((a, b) => {
          if (sort === "order") return (a.order ?? 0) - (b.order ?? 0);
          if (sort === "name-asc") return a.name?.localeCompare(b.name);
          if (sort === "name-desc") return b.name?.localeCompare(a.name);
          if (sort === "humidity-asc") return (a.currentHumidity || 0) - (b.currentHumidity || 0);
          if (sort === "humidity-desc") return (b.currentHumidity || 0) - (a.currentHumidity || 0);
          return 0;
        }),
    [normalizedSearch, orderedPlants, sort, status]
  );

  const hasFilters = search !== "" || status !== "all";
  const isDragging = dragEnabled && sort === "order" && !hasFilters;
  const canWaterAll = sectorPlants.some((plant) => !plant.maintenanceMode && plant.valveStatus !== "OPEN");
  const canStopAll = sectorPlants.some((plant) => plant.valveStatus === "OPEN");
  const allInMaintenance = sectorPlants.length > 0 && sectorPlants.every((plant) => plant.maintenanceMode);

  const openCreateModal = useCallback(() => {
    setEditingPlant(null);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((plant) => {
    setEditingPlant(plant);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingPlant(null);
  }, []);

  const handleSave = useCallback(
    async (data) => {
      try {
        if (editingPlant) {
          const res = await api.put(`/api/plants/${editingPlant._id}`, data);
          setPlants((prev) => prev.map((plant) => (plant._id === editingPlant._id ? res.data : plant)));
          toast(`${data.name} actualizada ✓`, "success");
        } else {
          const res = await api.post("/api/plants", { ...data, sector });
          setPlants((prev) => [...prev, res.data]);
          toast(`${data.name} agregada ✓`, "success");
        }
      } catch (err) {
        toast(err.response?.data?.error || "Error al guardar", "error");
      }
      closeModal();
    },
    [closeModal, editingPlant, sector, toast]
  );

  const handleDelete = useCallback(async (id) => {
    try {
      await api.delete(`/api/plants/${id}`);
      setPlants((prev) => prev.filter((plant) => plant._id !== id));
    } catch {
      toast("Error al eliminar", "error");
    }
  }, [toast]);

  const handleToggleValve = useCallback(
    async (plant) => {
      const newStatus = plant.valveStatus === "OPEN" ? "CLOSED" : "OPEN";
      const applyUpdate = (prev) => prev.map((item) => (item._id === plant._id ? { ...item, valveStatus: newStatus } : item));
      setPlants(applyUpdate);
      setOrderedPlants(applyUpdate);

      try {
        const res = await api.put(`/api/plants/${plant._id}`, { valveStatus: newStatus });
        const applySync = (prev) => prev.map((item) => (item._id === plant._id ? { ...item, ...res.data } : item));
        setPlants(applySync);
        setOrderedPlants(applySync);
        toast(newStatus === "OPEN" ? `💧 Riego iniciado — ${plant.name}` : `⏹ Riego detenido — ${plant.name}`, newStatus === "OPEN" ? "info" : "warning");
      } catch {
        const applyRevert = (prev) => prev.map((item) => (item._id === plant._id ? { ...item, valveStatus: plant.valveStatus } : item));
        setPlants(applyRevert);
        setOrderedPlants(applyRevert);
        toast("Error al controlar la válvula", "error");
      }
    },
    [toast]
  );

  const handleMaintenanceUpdate = useCallback((updatedPlant) => {
    const syncPlant = (prev) => prev.map((plant) => (plant._id === updatedPlant._id ? { ...plant, ...updatedPlant } : plant));
    setPlants(syncPlant);
    setOrderedPlants(syncPlant);
  }, []);

  const handleWaterAll = useCallback(async () => {
    const targets = sectorPlants.filter((plant) => !plant.maintenanceMode && plant.valveStatus !== "OPEN");

    if (targets.length === 0) {
      toast(`No hay plantas disponibles para regar en ${theme.label}`, "warning");
      return;
    }

    setWateringSector(true);
    try {
      const results = await Promise.all(
        targets.map((plant) => api.put(`/api/plants/${plant._id}`, { valveStatus: "OPEN" }))
      );
      const updated = new Map(results.map((res) => [res.data._id, res.data]));
      const syncPlants = (prev) => prev.map((plant) => updated.get(plant._id) || plant);
      setPlants(syncPlants);
      setOrderedPlants(syncPlants);
      toast(`💧 Riego activado en ${targets.length} planta${targets.length !== 1 ? "s" : ""} de ${theme.label}`, "success");
    } catch (error) {
      toast(error?.response?.data?.error || `No se pudo regar ${theme.label}`, "error");
    } finally {
      setWateringSector(false);
    }
  }, [sectorPlants, theme.label, toast]);

  const handleStopAll = useCallback(async () => {
    const targets = sectorPlants.filter((plant) => plant.valveStatus === "OPEN");

    if (targets.length === 0) {
      toast(`No hay riego activo para detener en ${theme.label}`, "warning");
      return;
    }

    setStoppingSector(true);
    try {
      const results = await Promise.all(
        targets.map((plant) => api.put(`/api/plants/${plant._id}`, { valveStatus: "CLOSED" }))
      );
      const updated = new Map(results.map((res) => [res.data._id, res.data]));
      const syncPlants = (prev) => prev.map((plant) => updated.get(plant._id) || plant);
      setPlants(syncPlants);
      setOrderedPlants(syncPlants);
      toast(`⏹ Riego detenido en ${targets.length} planta${targets.length !== 1 ? "s" : ""} de ${theme.label}`, "success");
    } catch (error) {
      toast(error?.response?.data?.error || `No se pudo detener el riego en ${theme.label}`, "error");
    } finally {
      setStoppingSector(false);
    }
  }, [sectorPlants, theme.label, toast]);

  const handleMaintenanceAll = useCallback(async () => {
    const activate = !sectorPlants.every((plant) => plant.maintenanceMode);
    const targets = sectorPlants.filter((plant) => plant.maintenanceMode !== activate);

    if (targets.length === 0) {
      toast(
        activate
          ? `Todas las plantas de ${theme.label} ya estaban en mantenimiento`
          : `No hay plantas en mantenimiento para restaurar en ${theme.label}`,
        "warning"
      );
      return;
    }

    setMaintenanceSector(true);
    try {
      const results = await Promise.all(
        targets.map((plant) =>
          api.patch(`/api/plants/${plant._id}/maintenance`, {
            active: activate,
            note: activate ? "Mantenimiento por sector" : "",
          })
        )
      );
      const updated = new Map(results.map((res) => [res.data.plant._id, res.data.plant]));
      const syncPlants = (prev) => prev.map((plant) => updated.get(plant._id) || plant);
      setPlants(syncPlants);
      setOrderedPlants(syncPlants);
      toast(
        activate
          ? `🔧 Mantenimiento activado en ${targets.length} planta${targets.length !== 1 ? "s" : ""} de ${theme.label}`
          : `✅ Mantenimiento desactivado en ${targets.length} planta${targets.length !== 1 ? "s" : ""} de ${theme.label}`,
        "success"
      );
    } catch (error) {
      toast(error?.response?.data?.error || `No se pudo actualizar mantenimiento en ${theme.label}`, "error");
    } finally {
      setMaintenanceSector(false);
    }
  }, [sectorPlants, theme.label, toast]);

  const handleReorderEnd = useCallback(
    async (newOrder) => {
      setOrderedPlants(newOrder);
      try {
        await Promise.all(
          newOrder.map((plant, index) =>
            plant.order !== index ? api.put(`/api/plants/${plant._id}`, { order: index }) : Promise.resolve()
          )
        );

        setPlants((prev) =>
          prev.map((plant) => {
            const nextIndex = newOrder.findIndex((orderedPlant) => orderedPlant._id === plant._id);
            return nextIndex !== -1 ? { ...plant, order: nextIndex } : plant;
          })
        );
      } catch {
        toast("Error al guardar orden", "error");
      }
    },
    [toast]
  );

  return (
    <div
      className="sp-page"
      style={{
        "--sp-accent": theme.accent,
        "--sp-accent-dim": theme.accentDim,
        "--sp-accent-border": theme.accentBorder,
        "--sp-glow": theme.glow,
        "--sp-glow-strong": theme.glowStrong,
        "--sp-particle": theme.particle,
      }}
    >
      <Navbar plants={plants} />

      <div className="sp-hero-wrapper" ref={heroRef}>
        <motion.div className="sp-hero" style={{ y: heroY, opacity: heroOpacity }}>
          <div className="sp-hero-bg">
            <img src={theme.img} alt="" className="sp-hero-img" />
            <div className="sp-hero-overlay" style={{ background: theme.gradientHero }} />
          </div>

          <BackgroundOrbs theme={theme} compact={compactMotion} reducedMotion={Boolean(prefersReducedMotion)} />
          <FloatingParticles seed={particleSeed} color={theme.particle} count={particleCount} reducedMotion={Boolean(prefersReducedMotion)} />
          <div className="sp-hero-topline" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }} />

          <div className="sp-hero-content">
            <motion.button
              className="sp-back-btn"
              onClick={() => navigate("/")}
              whileHover={{ x: -4, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </motion.button>

            <div className="sp-hero-head">
              <motion.div
                className="sp-hero-title-row"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="sp-hero-icon-wrap"
                  animate={{ scale: [1, 1.08, 1], filter: [`drop-shadow(0 0 12px ${theme.accent}99)`, `drop-shadow(0 0 28px ${theme.accent})`, `drop-shadow(0 0 12px ${theme.accent}99)`] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="sp-hero-icon">{theme.icon}</span>
                </motion.div>

                <div className="sp-hero-text">
                  <h1
                    className="sp-hero-title"
                    style={{
                      backgroundImage: `linear-gradient(135deg, #ffffff 20%, ${theme.accent} 60%, ${theme.accent}cc 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {theme.label}
                  </h1>
                  <p className="sp-hero-sub">
                    <span className="sp-hero-sub-dot" style={{ background: theme.accent }} />
                    {theme.sublabel} • {sectorPlants.length} plantas
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="sp-hero-sidecards"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.34, duration: 0.45 }}
              >
                {[
                  { label: "Plantas visibles", value: filteredPlants.length },
                  { label: "En mantenimiento", value: statusCounts.maintenance },
                  { label: "Sin alertas", value: Math.max(sectorPlants.length - statusCounts.alert, 0) },
                ].map((item) => (
                  <div key={item.label} className="sp-side-stat">
                    <div className="sp-side-stat-label">{item.label}</div>
                    <div className="sp-side-stat-value">{item.value}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              className="sp-stats-bar"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
            >
              <HeroStat label="Total" value={sectorPlants.length} color={theme.accent} icon={Zap} index={0} />
              <HeroStat label="Regando" value={statusCounts.active} color="#60a5fa" icon={Droplets} index={1} />
              <HeroStat label="Alertas" value={statusCounts.alert} color={statusCounts.alert > 0 ? "#f87171" : theme.accent} icon={Thermometer} index={2} />
              <HeroStat label="Hum. Prom." value={`${avgHum}%`} color={theme.accent} icon={null} index={3} />
            </motion.div>
          </div>

          <div className="sp-hero-bottomline" style={{ background: `linear-gradient(90deg, transparent, ${theme.accentBorder}, transparent)` }} />
        </motion.div>
      </div>

      <motion.div
        className="sp-filters"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="sp-search-wrap">
          <Search size={14} className="sp-search-icon" />
          <input className="sp-search" placeholder="Buscar planta..." value={search} onChange={(event) => setSearch(event.target.value)} />
          {search && (
            <button className="sp-search-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>

        <div className="sp-sort-wrap">
          <SlidersHorizontal size={13} className="sp-sort-icon" />
          <select className="sp-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="sp-chips">
          {STATUS_CHIPS.map((chip) => (
            <motion.button
              key={chip.value}
              className={`sp-chip ${status === chip.value ? "active" : ""}`}
              onClick={() => setStatus(chip.value)}
              whileTap={{ scale: 0.94 }}
            >
              {chip.icon && <span>{chip.icon}</span>}
              {chip.label}
              {chip.value !== "all" && (
                <span className="sp-chip-count">
                  {chip.value === "active" ? statusCounts.active : chip.value === "alert" ? statusCounts.alert : statusCounts.inactive}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {sectorPlants.length > 0 && (
          <div className="sp-bulk-actions">
            <motion.button
              className={`sp-bulk-btn sp-bulk-maint ${maintenanceSector ? "disabled" : ""}`}
              onClick={handleMaintenanceAll}
              whileTap={{ scale: 0.94 }}
              disabled={maintenanceSector}
            >
              {maintenanceSector
                ? "Actualizando..."
                : allInMaintenance
                  ? "✅ Quitar mantenimiento"
                  : "🔧 Mantenimiento total"}
            </motion.button>

            <motion.button
              className={`sp-bulk-btn sp-bulk-water ${!canWaterAll || wateringSector ? "disabled" : ""}`}
              onClick={handleWaterAll}
              whileTap={{ scale: 0.94 }}
              disabled={!canWaterAll || wateringSector}
            >
              {wateringSector ? "Regando..." : "💧 Regar todas"}
            </motion.button>

            <motion.button
              className={`sp-bulk-btn sp-bulk-stop ${!canStopAll || stoppingSector ? "disabled" : ""}`}
              onClick={handleStopAll}
              whileTap={{ scale: 0.94 }}
              disabled={!canStopAll || stoppingSector}
            >
              {stoppingSector ? "Deteniendo..." : "⏹ Detener todo"}
            </motion.button>
          </div>
        )}

        {sectorPlants.length > 1 && (
          <motion.button className={`sp-drag-btn ${dragEnabled ? "active" : ""}`} onClick={() => setDragEnabled((prev) => !prev)} whileTap={{ scale: 0.94 }}>
            <GripVertical size={13} />
            {dragEnabled ? "Listo" : "Ordenar"}
          </motion.button>
        )}

        <span className="sp-count">
          {filteredPlants.length} / {sectorPlants.length}
        </span>
      </motion.div>

      <div className="sp-grid-wrap">
        <AnimatePresence>
          {isDragging && (
            <motion.div className="sp-drag-banner" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <GripVertical size={14} />
              Arrastra las tarjetas para reorganizar el orden
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="plant-grid"><PlantGridSkeleton count={4} /></div>
        ) : sectorPlants.length === 0 ? (
          <EmptyPlants sector={sector} onAdd={openCreateModal} />
        ) : filteredPlants.length === 0 ? (
          <motion.div className="sp-empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="sp-empty-icon">🔍</span>
            <p>No hay plantas con esos filtros</p>
            {hasFilters && (
              <button className="sp-empty-reset" onClick={() => { setSearch(""); setStatus("all"); }}>
                Limpiar filtros
              </button>
            )}
          </motion.div>
        ) : isDragging ? (
          <Reorder.Group axis="x" values={orderedPlants} onReorder={setOrderedPlants} className="plant-grid" style={{ listStyle: "none", padding: 0, margin: 0 }} as="div">
            {orderedPlants.map((plant, index) => (
              <Reorder.Item
                key={plant._id}
                value={plant}
                onDragEnd={() => handleReorderEnd(orderedPlants)}
                style={{ cursor: "grab" }}
                whileDrag={{ scale: 1.04, zIndex: 50, boxShadow: `0 20px 60px ${theme.glow}` }}
              >
                <div style={{ position: "relative" }}>
                  <div className="sp-drag-handle" style={{ background: theme.accentDim, border: `1px solid ${theme.accentBorder}`, color: theme.accent }}>
                    <GripVertical size={12} />
                  </div>
                  <PlantCard
                    plant={plant}
                    index={index}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggleValve={handleToggleValve}
                    onShowAlerts={setAlertPlant}
                    onMaintenanceUpdate={handleMaintenanceUpdate}
                  />
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="plant-grid">
              {filteredPlants.map((plant, index) => (
                <motion.div
                  key={plant._id}
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.95 }}
                  transition={{ delay: index * 0.04, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PlantCard
                    plant={plant}
                    index={index}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggleValve={handleToggleValve}
                    onShowAlerts={setAlertPlant}
                    onMaintenanceUpdate={handleMaintenanceUpdate}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <motion.button
        className="sp-fab"
        onClick={openCreateModal}
        style={{
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}bb)`,
          boxShadow: `0 8px 32px ${theme.glow}, 0 0 0 1px ${theme.accentBorder}`,
        }}
        whileHover={{ scale: 1.12, boxShadow: `0 12px 40px ${theme.glowStrong}` }}
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.65, type: "spring", bounce: 0.5 }}
      >
        <Plus size={22} color="#000" strokeWidth={2.5} />
      </motion.button>

      <Suspense fallback={null}>
        <PlantModal
          isOpen={showModal}
          onClose={closeModal}
          onSave={handleSave}
          plant={editingPlant}
          defaultSector={sector}
          usedValves={sectorPlants.map((plant) => Number(plant.valveNumber))}
        />
        <AnimatePresence>
          {alertPlant && <AlertHistoryModal plant={alertPlant} onClose={() => setAlertPlant(null)} />}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

export default SectorPage;
