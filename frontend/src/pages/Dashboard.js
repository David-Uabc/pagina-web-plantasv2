import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/layout/Navbar";
import SystemStatus from "../components/dashboard/SystemStatus";
import AverageHumidity from "../components/dashboard/AverageHumidity";
import PlantCard from "../components/plant/PlantCard";
import { PlantGridSkeleton } from "../components/plant/PlantCardSkeleton";
import QuickStats from "../components/dashboard/QuickStats";
import PlantModal from "../components/plant/PlantModal";
import { useToast } from "../context/ToastProvider";

function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const { t }    = useI18n();
  const toast    = useToast();

  const [plants,       setPlants]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const res = await api.get("/api/plants");
        setPlants(res.data);
      } catch {
        // sin backend
      } finally {
        setLoading(false);
      }
    };
    fetchPlants();
    const interval = setInterval(fetchPlants, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePlant = async (data) => {
    try {
      if (editingPlant) {
        const res = await api.put(`/api/plants/${editingPlant._id}`, data);
        setPlants(prev => prev.map(p => p._id === editingPlant._id ? res.data : p));
        toast(`${data.name} actualizada ✓`, "success");
      } else {
        const res = await api.post("/api/plants", data);
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

  const sectorSuperior = plants.filter(p => p.sector === "Superior");
  const sectorInferior = plants.filter(p => p.sector === "Inferior");
  const previewSup     = sectorSuperior.slice(0, 2);
  const previewInf     = sectorInferior.slice(0, 2);

  return (
    <div className="dashboard-full">
      <Navbar onLogout={onLogout} />
      <QuickStats plants={plants} />
      <div className="top-section">
        <SystemStatus />
        <AverageHumidity plants={plants} />
      </div>

      <div className="section-header">
        <h2 className="section-title">🌿 Patio Superior</h2>
        {sectorSuperior.length > 2 && (
          <button className="btn-see-all" onClick={() => navigate("/superior")}>
            Ver todas ({sectorSuperior.length}) →
          </button>
        )}
      </div>
      <div className="plant-grid">
        {loading ? <PlantGridSkeleton count={2} /> :
         previewSup.length === 0 ? (
          <div className="plant-grid-empty"><span>🌱</span>Sin plantas en este sector.</div>
        ) : previewSup.map((plant, i) => (
          <PlantCard key={plant._id} plant={plant} index={i}
            onEdit={openEdit} onDelete={handleDeletePlant} />
        ))}
      </div>

      <div className="section-header">
        <h2 className="section-title">🌱 Patio Inferior</h2>
        {sectorInferior.length > 2 && (
          <button className="btn-see-all" onClick={() => navigate("/inferior")}>
            Ver todas ({sectorInferior.length}) →
          </button>
        )}
      </div>
      <div className="plant-grid">
        {loading ? <PlantGridSkeleton count={2} /> :
         previewInf.length === 0 ? (
          <div className="plant-grid-empty"><span>🌱</span>Sin plantas en este sector.</div>
        ) : previewInf.map((plant, i) => (
          <PlantCard key={plant._id} plant={plant} index={i}
            onEdit={openEdit} onDelete={handleDeletePlant} />
        ))}
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