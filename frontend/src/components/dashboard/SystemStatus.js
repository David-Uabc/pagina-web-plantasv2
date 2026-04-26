import { memo, useState, useEffect } from "react";
import { useI18n } from "../../i18n";
import { Wifi, WifiOff, Database, DatabaseZap, Droplets, Activity, Cpu } from "lucide-react";
import api from "../../api";

function timeAgo(date, t) {
  if (!date) return t("sys.noRecord");
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}${t("sys.secAgo")}`;
  if (s < 3600) return `${Math.floor(s / 60)} ${t("sys.minAgo")}`;
  if (s < 86400) return `${Math.floor(s / 3600)} ${t("sys.hAgo")}`;
  return `${Math.floor(s / 86400)} ${t("sys.daysAgo")}`;
}

function isOnline(device) {
  if (!device?.lastSeen && !device?.lastConnection) return false;
  const last = new Date(device.lastSeen || device.lastConnection).getTime();
  return Date.now() - last < 60000;
}

function DeviceRow({ device, label }) {
  const online = isOnline(device);
  const lastStr = device?.lastSeen || device?.lastConnection
    ? new Date(device.lastSeen || device.lastConnection).toLocaleTimeString("es-MX", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
    : "—";

  return (
    <div className={`status-row ${online ? "status-ok" : "status-error"}`}>
      <div className="status-icon-wrap">
        <Cpu size={18} className={`s-icon ${online ? "green" : "red"}`} />
        {online && <span className="pulse-ring green-ring" />}
      </div>
      <div className="status-text">
        <span className="status-label">{label}</span>
        <span className={`status-value ${online ? "val-green" : "val-red"}`}>
          {online ? `Online · ${lastStr}` : "Sin señal"}
        </span>
      </div>
      <div className={`status-dot ${online ? "dot-green" : "dot-red"}`} />
    </div>
  );
}

function SystemStatus({ devices = {} }) {
  const { t } = useI18n();

  const [mqtt, setMqttState] = useState(true);
  const [db, setDbState] = useState(true);
  const [lastIrrigation, setLastIrr] = useState(null);
  const [apiDevices, setApiDevices] = useState({});
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await api.get("/api/devices");
        const map = {};
        res.data.forEach((d) => { map[d.deviceId] = d; });
        setApiDevices(map);
      } catch {}
    };
    fetchDevices();
    const i = setInterval(fetchDevices, 15000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const fetchLastIrr = async () => {
      try {
        const res = await api.get("/api/plants");
        const dates = res.data
          .map((p) => p.lastIrrigation)
          .filter(Boolean)
          .map((d) => new Date(d));
        if (dates.length) setLastIrr(new Date(Math.max(...dates)));
      } catch {}
    };
    fetchLastIrr();
    const i = setInterval(fetchLastIrr, 30000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    window.setMqtt = setMqttState;
    window.setDb = setDbState;
  }, []);

  const allOk = mqtt && db;
  const mergedDevices = { ...apiDevices, ...devices };
  const esp32Sup = mergedDevices["ESP32-SUP-01"] || null;
  const esp32Inf = mergedDevices["ESP32-INF-01"] || null;
  const anyEsp32 = esp32Sup || esp32Inf;

  return (
    <div className="card status-card">
      <div className="status-header">
        <h2>{t("sys.title")}</h2>
        <div className={`status-badge ${allOk ? "badge-ok" : "badge-warn"}`}>
          {allOk ? t("sys.operative") : t("sys.attention")}
        </div>
      </div>

      <div className="status-grid">
        <div className={`status-row ${mqtt ? "status-ok" : "status-error"}`}>
          <div className="status-icon-wrap">
            {mqtt ? <Wifi size={18} className="s-icon green" /> : <WifiOff size={18} className="s-icon red" />}
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

        <div className={`status-row ${db ? "status-ok" : "status-error"}`}>
          <div className="status-icon-wrap">
            {db ? <DatabaseZap size={18} className="s-icon green" /> : <Database size={18} className="s-icon red" />}
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

        <div className="status-row status-ok">
          <div className="status-icon-wrap">
            <Droplets size={18} className="s-icon blue" />
          </div>
          <div className="status-text">
            <span className="status-label">{t("sys.lastIrr")}</span>
            <span className="status-value val-blue">{timeAgo(lastIrrigation, t)}</span>
          </div>
          <div className="status-dot dot-blue" />
        </div>

        <DeviceRow device={esp32Sup} label="ESP32 Patio Superior" />
        <DeviceRow device={esp32Inf} label="ESP32 Patio Inferior" />
      </div>

      {!anyEsp32 && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 11,
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.18)",
            color: "#fbbf24",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Activity size={12} />
          Esperando conexión ESP32...
        </div>
      )}
    </div>
  );
}

export default memo(SystemStatus);
