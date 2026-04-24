import { useEffect, useState, useCallback } from "react";
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import Navbar             from "../components/layout/Navbar";
import SystemStatus       from "../components/dashboard/SystemStatus";
import AverageHumidity    from "../components/dashboard/AverageHumidity";
import PlantCard          from "../components/plant/PlantCard";
import { PlantGridSkeleton } from "../components/plant/PlantCardSkeleton";
import QuickStats         from "../components/dashboard/QuickStats";
import WelcomeToast       from "../components/dashboard/WelcomeToast";
import ComparePlantsModal from "../components/plant/ComparePlantsModal";
import { useNotifications } from "../hooks/useNotifications";
import { useSocket }        from "../hooks/useSocket";
import { useToast }         from "../context/ToastProvider";

function SectorEmpty({ sector, onGo }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      style={{
        gridColumn: "1 / -1", textAlign: "center", padding: "32px 20px",
        background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(52,211,153,0.15)",
        borderRadius: 16,
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 10 }}>🌱</div>
      <p style={{ color: "#78909c", fontSize: 14, marginBottom: 14 }}>No hay plantas en este sector todavía</p>
      <button className="btn-see-all" onClick={onGo} style={{ fontSize: 13 }}>
        Ir a Sector {sector} para agregar →
      </button>
    </motion.div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { t }    = useI18n();
  const toast    = useToast();
  const { checkPlants } = useNotifications();

  const [plants,      setPlants]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCompare, setShowCompare] = useState(false);
  const [devices,     setDevices]     = useState({});

  const fetchPlants = useCallback(async () => {
    try {
      const res = await api.get("/api/plants");
      setPlants(res.data);
      checkPlants(res.data);
    } catch {}
    finally { setLoading(false); }
  }, [checkPlants]);

  useEffect(() => {
    fetchPlants();
    const interval = setInterval(fetchPlants, 30000);
    return () => clearInterval(interval);
  }, [fetchPlants]);

  useSocket({
    onPlantUpdate: useCallback((data) => {
      setPlants(prev => {
        const exists = prev.some(p => p._id === data._id);
        if (exists) return prev.map(p => p._id === data._id ? { ...p, ...data } : p);
        return prev;
      });
    }, []),
    onPlantDeleted: useCallback((data) => {
      setPlants(prev => prev.filter(p => p._id !== data._id));
    }, []),
    onAlert: useCallback((data) => {
      toast(`⚠️ ${data.name} — humedad crítica: ${data.humidity}%`, "error");
      checkPlants([data]);
    }, [checkPlants, toast]),
    onDeviceHeartbeat: useCallback((data) => {
      setDevices(prev => ({ ...prev, [data.deviceId]: { ...data, lastSeen: new Date() } }));
    }, []),
    onScheduleTriggered: useCallback((data) => {
      toast(`⏰ Riego programado iniciado — ${data.name}`, "info");
    }, [toast]),
  });

  const handleDelete = async (id) => {
    try { await api.delete(`/api/plants/${id}`); } catch {}
    setPlants(prev => prev.filter(p => p._id !== id));
  };

  const handleToggleValve = async (plant) => {
    const newStatus = plant.valveStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      const res = await api.put(`/api/plants/${plant._id}`, { valveStatus: newStatus });
      setPlants(prev => prev.map(p => p._id === plant._id ? res.data : p));
    } catch {}
  };

  const handleMaintenanceUpdate = useCallback((updatedPlant) => {
    setPlants((prev) => prev.map((plant) => (
      plant._id === updatedPlant._id ? { ...plant, ...updatedPlant } : plant
    )));
  }, []);

  const allSup  = plants.filter(p => p.sector === "Superior");
  const allInf  = plants.filter(p => p.sector === "Inferior");
  const prevSup = allSup.slice(0, 2);
  const prevInf = allInf.slice(0, 2);

  return (
    <div className="dashboard-full">
      <Navbar
        plants={plants}
        onCompare={plants.length >= 2 ? () => setShowCompare(true) : undefined}
      />
      <WelcomeToast />

      {loading ? <PlantGridSkeleton count={4} /> : <QuickStats plants={plants} />}

      <div className="top-section">
        <SystemStatus devices={devices} />
        <AverageHumidity plants={plants} />
      </div>

      <div className="sectors-wrapper">
        <div className="sector-column">
          <div className="section-header">
            <h2 className="section-title">🌿 Patio Superior</h2>
            {allSup.length > 0 && (
              <button className="btn-see-all" onClick={() => navigate("/superior")}>
                {allSup.length > 2 ? `${t("dash.seeAll")} (${allSup.length}) →` : t("dash.goSector")}
              </button>
            )}
          </div>
          <div className="plant-grid">
            {loading ? <PlantGridSkeleton count={2} /> :
             prevSup.length === 0 ? <SectorEmpty sector="Superior" onGo={() => navigate("/superior")} /> :
             prevSup.map((plant, i) => (
                <PlantCard key={plant._id} plant={plant} index={i}
                  onEdit={() => navigate("/superior")}
                  onDelete={handleDelete}
                  onToggleValve={handleToggleValve}
                  onMaintenanceUpdate={handleMaintenanceUpdate}
                />
             ))}
          </div>
        </div>

        <div className="sector-column">
          <div className="section-header">
            <h2 className="section-title">🌱 Patio Inferior</h2>
            {allInf.length > 0 && (
              <button className="btn-see-all" onClick={() => navigate("/inferior")}>
                {allInf.length > 2 ? `${t("dash.seeAll")} (${allInf.length}) →` : t("dash.goSector")}
              </button>
            )}
          </div>
          <div className="plant-grid">
            {loading ? <PlantGridSkeleton count={2} /> :
             prevInf.length === 0 ? <SectorEmpty sector="Inferior" onGo={() => navigate("/inferior")} /> :
             prevInf.map((plant, i) => (
                <PlantCard key={plant._id} plant={plant} index={i}
                  onEdit={() => navigate("/inferior")}
                  onDelete={handleDelete}
                  onToggleValve={handleToggleValve}
                  onMaintenanceUpdate={handleMaintenanceUpdate}
                />
             ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCompare && <ComparePlantsModal plants={plants} onClose={() => setShowCompare(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
