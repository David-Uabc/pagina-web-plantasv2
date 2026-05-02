import { startTransition, useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import api from "../api";
import Navbar from "../components/layout/Navbar";
import SystemStatus from "../components/dashboard/SystemStatus";
import AverageHumidity from "../components/dashboard/AverageHumidity";
import PlantCard from "../components/plant/PlantCard";
import { PlantGridSkeleton } from "../components/plant/PlantCardSkeleton";
import QuickStats from "../components/dashboard/QuickStats";
import WelcomeToast from "../components/dashboard/WelcomeToast";
import { useNotifications } from "../hooks/useNotifications";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../context/ToastProvider";

const ComparePlantsModal = lazy(() => import("../components/plant/ComparePlantsModal"));

function SectorEmpty({ sector, onGo }) {
  return (
    <motion.div
      className="dashboard-sector-empty"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        textAlign: "center",
        padding: "32px 20px",
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(52,211,153,0.15)",
        borderRadius: 16,
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 10 }}>🌱</div>
      <p style={{ color: "#78909c", fontSize: 14, marginBottom: 14 }}>
        No hay plantas en este sector todavía
      </p>
      <button className="btn-see-all" onClick={onGo} style={{ fontSize: 13 }}>
        Ir a Sector {sector} para agregar →
      </button>
    </motion.div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
  const { checkPlants } = useNotifications();
  const prefersReducedMotion = useReducedMotion();

  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompare, setShowCompare] = useState(false);
  const [devices, setDevices] = useState({});
  const [wateringSector, setWateringSector] = useState(null);
  const [maintenanceSector, setMaintenanceSector] = useState(null);

  const fetchPlants = useCallback(async (signal) => {
    try {
      const res = await api.get("/api/plants", {
        signal,
        meta: { cancelPrevious: false },
      });
      setPlants((prev) => {
        const next = res.data;
        if (
          prev.length === next.length &&
          prev.every(
            (plant, index) =>
              plant._id === next[index]?._id &&
              plant.currentHumidity === next[index]?.currentHumidity &&
              plant.valveStatus === next[index]?.valveStatus &&
              plant.maintenanceMode === next[index]?.maintenanceMode
          )
        ) {
          return prev;
        }
        return next;
      });
      checkPlants(res.data);
    } catch (error) {
      if (error.code === "ERR_CANCELED" || error.name === "CanceledError") return;
    } finally {
      setLoading(false);
    }
  }, [checkPlants]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPlants(controller.signal);

    let intervalId = null;
    const schedule = () => {
      if (intervalId) clearInterval(intervalId);
      if (document.hidden) return;
      intervalId = setInterval(() => fetchPlants(), 90000);
    };

    const handleVisibility = () => {
      if (!document.hidden) fetchPlants();
      schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      controller.abort();
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchPlants]);

  useSocket({
    onPlantUpdate: useCallback((data) => {
      setPlants((prev) => {
        const target = prev.find((plant) => plant._id === data._id);
        if (!target) return prev;
        const merged = { ...target, ...data };
        if (
          merged.currentHumidity === target.currentHumidity &&
          merged.valveStatus === target.valveStatus &&
          merged.maintenanceMode === target.maintenanceMode &&
          merged.updatedAt === target.updatedAt
        ) {
          return prev;
        }
        return prev.map((plant) => (plant._id === data._id ? merged : plant));
      });
    }, []),
    onPlantDeleted: useCallback((data) => {
      setPlants((prev) => prev.filter((plant) => plant._id !== data._id));
    }, []),
    onAlert: useCallback((data) => {
      toast(`⚠ ${data.name} — humedad crítica: ${data.humidity}%`, "error");
      checkPlants([data]);
    }, [checkPlants, toast]),
    onDeviceHeartbeat: useCallback((data) => {
      setDevices((prev) => {
        const current = prev[data.deviceId];
        if (current?.status === data.status && current?.lastConnection === data.lastConnection) {
          return prev;
        }
        return { ...prev, [data.deviceId]: { ...data, lastSeen: new Date() } };
      });
    }, []),
    onScheduleTriggered: useCallback((data) => {
      toast(`⏰ Riego programado iniciado — ${data.name}`, "info");
    }, [toast]),
  });

  const handleDelete = useCallback(async (id) => {
    try {
      await api.delete(`/api/plants/${id}`);
    } catch {
    }
    setPlants((prev) => prev.filter((plant) => plant._id !== id));
  }, []);

  const handleToggleValve = useCallback(async (plant) => {
    const newStatus = plant.valveStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      const res = await api.put(`/api/plants/${plant._id}`, { valveStatus: newStatus });
      setPlants((prev) => prev.map((item) => (item._id === plant._id ? res.data : item)));
    } catch {
    }
  }, []);

  const handleMaintenanceUpdate = useCallback((updatedPlant) => {
    setPlants((prev) => prev.map((plant) => (plant._id === updatedPlant._id ? { ...plant, ...updatedPlant } : plant)));
  }, []);

  const handleWaterSector = useCallback(async (sector) => {
    const sectorPlants = plants.filter((plant) => plant.sector === sector);
    const targets = sectorPlants.filter((plant) => !plant.maintenanceMode && plant.valveStatus !== "OPEN");

    if (targets.length === 0) {
      toast(`No hay plantas disponibles para regar en ${sector}`, "warning");
      return;
    }

    setWateringSector(sector);
    try {
      const results = await Promise.all(
        targets.map((plant) => api.put(`/api/plants/${plant._id}`, { valveStatus: "OPEN" }))
      );
      const updated = new Map(results.map((res) => [res.data._id, res.data]));
      setPlants((prev) => prev.map((plant) => updated.get(plant._id) || plant));
      toast(`💧 Riego activado en ${targets.length} planta${targets.length !== 1 ? "s" : ""} de ${sector}`, "success");
    } catch (error) {
      toast(error?.response?.data?.error || `No se pudo regar todo el sector ${sector}`, "error");
    } finally {
      setWateringSector(null);
    }
  }, [plants, toast]);

  const handleMaintenanceSector = useCallback(async (sector) => {
    const sectorPlants = plants.filter((plant) => plant.sector === sector);
    const activate = !sectorPlants.every((plant) => plant.maintenanceMode);
    const targets = sectorPlants.filter((plant) => plant.maintenanceMode !== activate);

    if (targets.length === 0) {
      toast(
        activate
          ? `Todas las plantas de ${sector} ya estaban en mantenimiento`
          : `No hay plantas en mantenimiento para restaurar en ${sector}`,
        "warning"
      );
      return;
    }

    setMaintenanceSector(sector);
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
      setPlants((prev) => prev.map((plant) => updated.get(plant._id) || plant));
      toast(
        activate
          ? `🔧 Mantenimiento activado en ${targets.length} planta${targets.length !== 1 ? "s" : ""} de ${sector}`
          : `✅ Mantenimiento desactivado en ${targets.length} planta${targets.length !== 1 ? "s" : ""} de ${sector}`,
        "success"
      );
    } catch (error) {
      toast(error?.response?.data?.error || `No se pudo actualizar mantenimiento en ${sector}`, "error");
    } finally {
      setMaintenanceSector(null);
    }
  }, [plants, toast]);

  const allSup = useMemo(() => plants.filter((plant) => plant.sector === "Superior"), [plants]);
  const allInf = useMemo(() => plants.filter((plant) => plant.sector === "Inferior"), [plants]);
  const prevSup = useMemo(() => allSup.slice(0, 2), [allSup]);
  const prevInf = useMemo(() => allInf.slice(0, 2), [allInf]);
  const canCompare = plants.length >= 2;
  const goSuperior = useCallback(() => startTransition(() => navigate("/superior")), [navigate]);
  const goInferior = useCallback(() => startTransition(() => navigate("/inferior")), [navigate]);
  const openCompare = useCallback(() => startTransition(() => setShowCompare(true)), []);
  const closeCompare = useCallback(() => startTransition(() => setShowCompare(false)), []);
  const canWaterSuperior = allSup.some((plant) => !plant.maintenanceMode && plant.valveStatus !== "OPEN");
  const canWaterInferior = allInf.some((plant) => !plant.maintenanceMode && plant.valveStatus !== "OPEN");
  const allMaintSuperior = allSup.length > 0 && allSup.every((plant) => plant.maintenanceMode);
  const allMaintInferior = allInf.length > 0 && allInf.every((plant) => plant.maintenanceMode);

  return (
    <div className="dashboard-full">
      <Navbar plants={plants} onCompare={canCompare ? openCompare : undefined} />
      <WelcomeToast />

      {loading ? <PlantGridSkeleton count={4} /> : <QuickStats plants={plants} />}

      <div className="top-section">
        <SystemStatus devices={devices} plants={plants} />
        <AverageHumidity plants={plants} />
      </div>

      <div className="sectors-wrapper">
        <div className="sector-column">
          <div className="section-header">
            <h2 className="section-title">🌿 Patio Superior</h2>
            <div className="sector-actions">
              {allSup.length > 0 && (
                <button
                  className={`btn-see-all btn-maintenance-sector ${maintenanceSector === "Superior" ? "disabled" : ""}`}
                  onClick={() => handleMaintenanceSector("Superior")}
                  disabled={maintenanceSector === "Superior"}
                >
                  {maintenanceSector === "Superior"
                    ? "Actualizando..."
                    : allMaintSuperior
                      ? "✅ Quitar mantenimiento"
                      : "🔧 Mantenimiento total"}
                </button>
              )}
              {allSup.length > 0 && (
                <button
                  className={`btn-see-all btn-water-sector ${!canWaterSuperior || wateringSector === "Superior" ? "disabled" : ""}`}
                  onClick={() => handleWaterSector("Superior")}
                  disabled={!canWaterSuperior || wateringSector === "Superior"}
                >
                  {wateringSector === "Superior" ? "Regando..." : "💧 Regar todas"}
                </button>
              )}
              {allSup.length > 0 && (
                <button className="btn-see-all" onClick={goSuperior}>
                  {allSup.length > 2 ? `${t("dash.seeAll")} (${allSup.length}) →` : t("dash.goSector")}
                </button>
              )}
            </div>
          </div>
          <div className="plant-grid">
            {loading ? (
              <PlantGridSkeleton count={2} />
            ) : prevSup.length === 0 ? (
              <SectorEmpty sector="Superior" onGo={goSuperior} />
            ) : (
              prevSup.map((plant, index) => (
                <PlantCard
                  key={plant._id}
                  plant={plant}
                  index={index}
                  onEdit={goSuperior}
                  onDelete={handleDelete}
                  onToggleValve={handleToggleValve}
                  onMaintenanceUpdate={handleMaintenanceUpdate}
                />
              ))
            )}
          </div>
        </div>

        <div className="sector-column">
          <div className="section-header">
            <h2 className="section-title">🌱 Patio Inferior</h2>
            <div className="sector-actions">
              {allInf.length > 0 && (
                <button
                  className={`btn-see-all btn-maintenance-sector ${maintenanceSector === "Inferior" ? "disabled" : ""}`}
                  onClick={() => handleMaintenanceSector("Inferior")}
                  disabled={maintenanceSector === "Inferior"}
                >
                  {maintenanceSector === "Inferior"
                    ? "Actualizando..."
                    : allMaintInferior
                      ? "✅ Quitar mantenimiento"
                      : "🔧 Mantenimiento total"}
                </button>
              )}
              {allInf.length > 0 && (
                <button
                  className={`btn-see-all btn-water-sector ${!canWaterInferior || wateringSector === "Inferior" ? "disabled" : ""}`}
                  onClick={() => handleWaterSector("Inferior")}
                  disabled={!canWaterInferior || wateringSector === "Inferior"}
                >
                  {wateringSector === "Inferior" ? "Regando..." : "💧 Regar todas"}
                </button>
              )}
              {allInf.length > 0 && (
                <button className="btn-see-all" onClick={goInferior}>
                  {allInf.length > 2 ? `${t("dash.seeAll")} (${allInf.length}) →` : t("dash.goSector")}
                </button>
              )}
            </div>
          </div>
          <div className="plant-grid">
            {loading ? (
              <PlantGridSkeleton count={2} />
            ) : prevInf.length === 0 ? (
              <SectorEmpty sector="Inferior" onGo={goInferior} />
            ) : (
              prevInf.map((plant, index) => (
                <PlantCard
                  key={plant._id}
                  plant={plant}
                  index={index}
                  onEdit={goInferior}
                  onDelete={handleDelete}
                  onToggleValve={handleToggleValve}
                  onMaintenanceUpdate={handleMaintenanceUpdate}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCompare && (
          <Suspense fallback={null}>
            <ComparePlantsModal plants={plants} onClose={closeCompare} reducedMotion={Boolean(prefersReducedMotion)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
