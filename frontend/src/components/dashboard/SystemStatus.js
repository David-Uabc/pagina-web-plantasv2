import { useState, useEffect } from "react";
import { useI18n } from "../../i18n";
import { Wifi, WifiOff, Database, DatabaseZap, Droplets, Activity, AlertTriangle } from "lucide-react";

function SystemStatus() {
  const { t } = useI18n();

  const [mqtt,          setMqttState]  = useState(true);
  const [db,            setDbState]    = useState(true);
  const [lastIrrigation, setLastIrr]   = useState(new Date(Date.now() - 10 * 60 * 1000));
  const [reportDevice]                 = useState("monitor");
  const [, setTick]                    = useState(0);

  // Re-render cada segundo para actualizar el tiempo
  useEffect(() => {
    const interval = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Control desde consola (dev)
  useEffect(() => {
    window.setMqtt           = setMqttState;
    window.setDb             = setDbState;
    window.setLastIrrigation = setLastIrr;
  }, []);

  // timeAgo dentro del componente para acceder a t()
  const timeAgo = (date) => {
    if (!date) return t("sys.noRecord");
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60)    return `${s}${t("sys.secAgo")}`;
    if (s < 3600)  return `${Math.floor(s / 60)} ${t("sys.minAgo")}`;
    if (s < 86400) return `${Math.floor(s / 3600)} ${t("sys.hAgo")}`;
    return `${Math.floor(s / 86400)} ${t("sys.daysAgo")}`;
  };

  const allOk = mqtt && db;

  return (
    <div className="card status-card">

      {/* Header */}
      <div className="status-header">
        <h2>{t("sys.title")}</h2>
        <div className={`status-badge ${allOk ? "badge-ok" : "badge-warn"}`}>
          {allOk ? t("sys.operative") : t("sys.attention")}
        </div>
      </div>

      {/* Items */}
      <div className="status-grid">

        {/* MQTT */}
        <div className={`status-row ${mqtt ? "status-ok" : "status-error"}`}>
          <div className="status-icon-wrap">
            {mqtt
              ? <Wifi     size={18} className="s-icon green" />
              : <WifiOff  size={18} className="s-icon red"   />
            }
            {mqtt && <span className="pulse-ring green-ring" />}
          </div>
          <div className="status-text">
            <span className="status-label">{t("sys.mqtt")}</span>
            <span className={`status-value ${mqtt ? "val-green" : "val-red"}`}>
              {mqtt ? t("sys.connected") : t("sys.disconnected")}
            </span>
          </div>
          <div className={`status-dot ${mqtt ? "dot-green" : "dot-red"}`} />
        </div>

        {/* Base de datos */}
        <div className={`status-row ${db ? "status-ok" : "status-error"}`}>
          <div className="status-icon-wrap">
            {db
              ? <DatabaseZap size={18} className="s-icon green" />
              : <Database    size={18} className="s-icon red"   />
            }
            {db && <span className="pulse-ring green-ring" />}
          </div>
          <div className="status-text">
            <span className="status-label">{t("sys.database")}</span>
            <span className={`status-value ${db ? "val-green" : "val-red"}`}>
              {db ? t("sys.dbActive") : t("sys.dbInactive")}
            </span>
          </div>
          <div className={`status-dot ${db ? "dot-green" : "dot-red"}`} />
        </div>

        {/* Último riego */}
        <div className="status-row status-ok">
          <div className="status-icon-wrap">
            <Droplets size={18} className="s-icon blue" />
          </div>
          <div className="status-text">
            <span className="status-label">{t("sys.lastIrr")}</span>
            <span className="status-value val-blue">
              {timeAgo(lastIrrigation)}
            </span>
          </div>
          <div className="status-dot dot-blue" />
        </div>

        {/* Reportando */}
        <div className="status-row status-warn">
          <div className="status-icon-wrap">
            <Activity size={18} className="s-icon yellow" />
            <span className="pulse-ring yellow-ring" />
          </div>
          <div className="status-text">
            <span className="status-label">{t("sys.reporting")}</span>
            <span className="status-value val-yellow">{reportDevice}</span>
          </div>
          <div className="status-dot dot-yellow" />
        </div>

      </div>

      {/* Footer warning si algo falla */}
      {!allOk && (
        <div className="status-alert">
          <AlertTriangle size={14} />
          <span>
            {!mqtt && !db
              ? t("sys.errBoth")
              : !mqtt
              ? t("sys.errMqtt")
              : t("sys.errDb")}
          </span>
        </div>
      )}
    </div>
  );
}

export default SystemStatus;