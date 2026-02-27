import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";
import Navbar         from "../components/layout/Navbar";
import SystemStatus   from "../components/dashboard/SystemStatus";
import AverageHumidity from "../components/dashboard/AverageHumidity";
import PlantCard      from "../components/plant/PlantCard";
import { PlantGridSkeleton } from "../components/plant/PlantCardSkeleton";
import QuickStats     from "../components/dashboard/QuickStats";
import { getGreeting } from "../App";
import WelcomeToast from "../components/dashboard/WelcomeToast";

// Skeletons para las stat cards del dashboard
function DashboardSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          height: 80, borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
}

function SectorEmpty({ sector, onGo }) {
  const { t } = useI18n();
  return (
    <motion.div className="dashboard-sector-empty"
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      style={{
        gridColumn: "1 / -1", textAlign: "center", padding: "32px 20px",
        background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(52,211,153,0.15)",
        borderRadius: 16,
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 10 }}>🌱</div>
      <p style={{ color: "#78909c", fontSize: 14, marginBottom: 14 }}>
        No hay plantas en este sector todavía
      </p>
      <button className="btn-see-all" onClick={onGo}
        style={{ fontSize: 13 }}>
        Ir a Sector {sector} para agregar →
      </button>
    </motion.div>
  );
}

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const { t }    = useI18n();

  const [plants,  setPlants]  = useState([]);
  const [loading, setLoading] = useState(true);

  // Saludo personalizado
  const session  = JSON.parse(localStorage.getItem("iot_session") || "{}");
  const userName = session.name || session.username || "";
  const greeting = getGreeting(userName);

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

  const allSup  = plants.filter(p => p.sector === "Superior");
  const allInf  = plants.filter(p => p.sector === "Inferior");
  const prevSup = allSup.slice(0, 2);
  const prevInf = allInf.slice(0, 2);

  return (
    <div className="dashboard-full">
      <Navbar onLogout={onLogout} plants={plants} />

      {/* ✅ Toast de bienvenida — aparece solo una vez por sesión */}
      <WelcomeToast />

      {/* Stats — con skeleton mientras carga */}
      {loading ? (
        <div style={{ padding: "20px 24px 0", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
          <DashboardSkeleton />
        </div>
      ) : (
        <QuickStats plants={plants} />
      )}

      <div className="top-section">
        <SystemStatus />
        <AverageHumidity plants={plants} />
      </div>

      {/* Sectores */}
      <div className="sectors-wrapper">

        {/* Sector Superior */}
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
               />
             ))}
          </div>
        </div>

        {/* Sector Inferior */}
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
               />
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;