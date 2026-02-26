import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";
import Navbar from "../components/layout/Navbar";
import SystemStatus from "../components/dashboard/SystemStatus";
import AverageHumidity from "../components/dashboard/AverageHumidity";
import PlantCard from "../components/plant/PlantCard";
import { PlantGridSkeleton } from "../components/plant/PlantCardSkeleton";
import QuickStats from "../components/dashboard/QuickStats";

// ── Vacío con link al sector ──────────────────────────
function SectorEmpty({ sector, onGo }) {
  const { t } = useI18n();
  return (
    <div className="dashboard-sector-empty">
      <span className="dse-icon">🌱</span>
      <p>{t("dash.noPlants")}</p>
      <button className="btn-see-all" onClick={onGo}>
        Ir a Sector {sector} para agregar →
      </button>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────
function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const { t }    = useI18n();

  const [plants,  setPlants]  = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch cada 5s
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const res = await api.get("/api/plants");
        setPlants(res.data);
      } catch {
        // sin backend — vacío
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

  // Solo las 2 primeras de cada sector
  const allSup  = plants.filter(p => p.sector === "Superior");
  const allInf  = plants.filter(p => p.sector === "Inferior");
  const prevSup = allSup.slice(0, 2);
  const prevInf = allInf.slice(0, 2);

  return (
    <div className="dashboard-full">
      <Navbar onLogout={onLogout} plants={plants} />

      <QuickStats plants={plants} />

      <div className="top-section">
        <SystemStatus />
        <AverageHumidity plants={plants} />
      </div>

      {/* ── Sectores lado a lado ── */}
      <div className="sectors-wrapper">

        {/* Sector Superior */}
        <div className="sector-column">
          <div className="section-header">
            <h2 className="section-title">🌿 Patio Superior</h2>
            {allSup.length > 0 && (
              <button className="btn-see-all" onClick={() => navigate("/superior")}>
                {allSup.length > 2
                  ? `${t("dash.seeAll")} (${allSup.length}) →`
                  : t("dash.goSector")}
              </button>
            )}
          </div>
          <div className="plant-grid">
            {loading ? (
              <PlantGridSkeleton count={2} />
            ) : prevSup.length === 0 ? (
              <SectorEmpty sector="Superior" onGo={() => navigate("/superior")} />
            ) : (
              prevSup.map((plant, i) => (
                <PlantCard
                  key={plant._id} plant={plant} index={i}
                  onEdit={() => navigate("/superior")}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>

        {/* Sector Inferior */}
        <div className="sector-column">
          <div className="section-header">
            <h2 className="section-title">🌱 Patio Inferior</h2>
            {allInf.length > 0 && (
              <button className="btn-see-all" onClick={() => navigate("/inferior")}>
                {allInf.length > 2
                  ? `${t("dash.seeAll")} (${allInf.length}) →`
                  : t("dash.goSector")}
              </button>
            )}
          </div>
          <div className="plant-grid">
            {loading ? (
              <PlantGridSkeleton count={2} />
            ) : prevInf.length === 0 ? (
              <SectorEmpty sector="Inferior" onGo={() => navigate("/inferior")} />
            ) : (
              prevInf.map((plant, i) => (
                <PlantCard
                  key={plant._id} plant={plant} index={i}
                  onEdit={() => navigate("/inferior")}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;