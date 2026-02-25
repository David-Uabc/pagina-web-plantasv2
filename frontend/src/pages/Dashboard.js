import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";
import Navbar from "../components/layout/Navbar";
import SystemStatus from "../components/dashboard/SystemStatus";
import AverageHumidity from "../components/dashboard/AverageHumidity";
import PlantCard from "../components/plant/PlantCard";
import { PlantGridSkeleton } from "../components/plant/PlantCardSkeleton";

// ── Stats rápidas ─────────────────────────────────────
function QuickStats({ plants }) {
  const total    = plants.length;
  const watering = plants.filter(p => p.valveStatus === true || p.valveStatus === "OPEN").length;
  const alerts   = plants.filter(p => p.currentHumidity < p.minHumidity).length;
  const avgHum   = total > 0
    ? Math.round(plants.reduce((s, p) => s + (p.currentHumidity || 0), 0) / total)
    : 0;

  const stats = [
    { icon: "🌿", label: "Total Plantas",   value: total,    color: "var(--green)"  },
    { icon: "💧", label: "Regando Ahora",   value: watering, color: "var(--blue)"   },
    { icon: "⚠",  label: "Alertas",         value: alerts,   color: alerts > 0 ? "var(--red)" : "var(--green)" },
    { icon: "📊", label: "Humedad Promedio", value: `${avgHum}%`, color: "var(--teal)" },
  ];

  return (
    <div className="quick-stats">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ duration: 0.3, delay: i * 0.07 }}
        >
          <span className="stat-icon">{s.icon}</span>
          <div className="stat-info">
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────
function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const toast    = useToast();

  const [plants,       setPlants]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);

  // ─── Fetch ──────────────────────────────────────────
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const res = await api.get("/api/plants");
        setPlants(res.data);
      } catch {
        // Sin backend — sin datos de ejemplo en dashboard, dejar vacío
      } finally {
        setLoading(false);
      }
    };
    fetchPlants();
    const interval = setInterval(fetchPlants, 5000);
    return () => clearInterval(interval);
  }, []);

  // ─── CRUD ────────────────────────────────────────────
  const handleSavePlant = async (data) => {
    try {
      if (editingPlant) {
        const res = await axios.put(`http://localhost:5000/api/plants/${editingPlant._id}`, data);
        setPlants(prev => prev.map(p => p._id === editingPlant._id ? res.data : p));
        toast(`${data.name} actualizada ✓`, "success");
      } else {
        const res = await axios.post("http://localhost:5000/api/plants", data);
        setPlants(prev => [...prev, res.data]);
        toast(`${data.name} agregada ✓`, "success");
      }
    } catch {
      toast("Error al guardar la planta", "error");
    }
    setShowModal(false);
    setEditingPlant(null);
  };

  const handleDeletePlant = async (id) => {
    try { await api.delete(`/api/plants/${id}`); } catch {}
    setPlants(prev => prev.filter(p => p._id !== id));
  };

  const openEdit = (plant) => { setEditingPlant(plant); setShowModal(true); };

  // Solo primeras 2 por sector en dashboard
  const sectorSuperior = plants.filter(p => p.sector === "Superior");
  const sectorInferior = plants.filter(p => p.sector === "Inferior");
  const previewSup     = sectorSuperior.slice(0, 2);
  const previewInf     = sectorInferior.slice(0, 2);

  return (
    <div className="dashboard-full">
      <Navbar onLogout={onLogout} />

      {/* ── Stats rápidas ── */}
      <QuickStats plants={plants} />

      {/* ── Top section ── */}
      <div className="top-section">
        <SystemStatus />
        <AverageHumidity plants={plants} />
      </div>

      {/* ── Sector Superior ── */}
      <div className="section-header">
        <h2 className="section-title">🌿 Patio Superior</h2>
        {sectorSuperior.length > 2 && (
          <button className="btn-see-all" onClick={() => navigate("/superior")}>
            Ver todas ({sectorSuperior.length}) →
          </button>
        )}
      </div>

      <div className="plant-grid">
        {loading ? (
          <PlantGridSkeleton count={2} />
        ) : previewSup.length === 0 ? (
          <div className="plant-grid-empty">
            <span>🌱</span>Sin plantas en este sector.
          </div>
        ) : (
          previewSup.map((plant, i) => (
            <PlantCard key={plant._id} plant={plant} index={i}
              onEdit={openEdit} onDelete={handleDeletePlant} />
          ))
        )}
      </div>

      {/* ── Sector Inferior ── */}
      <div className="section-header">
        <h2 className="section-title">🌱 Patio Inferior</h2>
        {sectorInferior.length > 2 && (
          <button className="btn-see-all" onClick={() => navigate("/inferior")}>
            Ver todas ({sectorInferior.length}) →
          </button>
        )}
      </div>

      <div className="plant-grid">
        {loading ? (
          <PlantGridSkeleton count={2} />
        ) : previewInf.length === 0 ? (
          <div className="plant-grid-empty">
            <span>🌱</span>Sin plantas en este sector.
          </div>
        ) : (
          previewInf.map((plant, i) => (
            <PlantCard key={plant._id} plant={plant} index={i}
              onEdit={openEdit} onDelete={handleDeletePlant} />
          ))
        )}
      </div>

      <div className="add-button-container">
        <button className="btn-add" onClick={() => { setEditingPlant(null); setShowModal(true); }}>
          + Añadir Planta
        </button>
      </div>

      <PlantModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPlant(null); }}
        onSave={handleSavePlant}
        plant={editingPlant}
      />
    </div>
  );
}

export default Dashboard;