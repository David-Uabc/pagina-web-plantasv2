import { memo, startTransition, useState, useEffect, useMemo, useCallback } from "react";
import { useI18n } from "../../i18n";
import { Wifi, WifiOff, Database, DatabaseZap, Droplets, Activity, Cpu } from "lucide-react";
import api from "../../api";
import { useToast } from "../../context/ToastProvider";

function timeAgo(date, t) {
  if (!date) return t("sys.noRecord");
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}${t("sys.secAgo")}`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t("sys.minAgo")}`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t("sys.hAgo")}`;
  return `${Math.floor(seconds / 86400)} ${t("sys.daysAgo")}`;
}

function isOnline(device, now) {
  if (!device?.lastSeen && !device?.lastConnection) return false;
  const last = new Date(device.lastSeen || device.lastConnection).getTime();
  return now - last < 90000;
}

const DeviceRow = memo(function DeviceRow({ device, label, now, onToggle }) {
  const online = isOnline(device, now);
  const lastStr = device?.lastSeen || device?.lastConnection
    ? new Date(device.lastSeen || device.lastConnection).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`status-row ${online ? "status-ok" : "status-error"}`}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: device?.deviceId ? "pointer" : "default",
        appearance: "none",
        WebkitAppearance: "none",
        font: "inherit",
        color: "inherit",
      }}
    >
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
    </button>
  );
});

function findDeviceForSector(deviceMap, sector) {
  return Object.values(deviceMap).find((device) => device?.sector === sector) || null;
}

function SystemStatus({ devices = {}, plants = [] }) {
  const { t } = useI18n();
  const toast = useToast();

  const [mqtt, setMqttState] = useState(true);
  const [db, setDbState] = useState(true);
  const [apiDevices, setApiDevices] = useState({});
  const [now, setNow] = useState(Date.now());
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linking, setLinking] = useState(false);
  const [form, setForm] = useState({ deviceId: "", sector: "Superior" });
  const [expandedSector, setExpandedSector] = useState(null);

  const fetchDevices = useCallback(async (signal) => {
    try {
      const res = await api.get("/api/devices", {
        signal,
        meta: { cancelPrevious: false },
      });
      const map = {};
      res.data.forEach((device) => {
        map[device.deviceId] = device;
      });
      setApiDevices(map);
    } catch (error) {
      if (error.code === "ERR_CANCELED" || error.name === "CanceledError") return;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchDevices(controller.signal);
    const interval = setInterval(() => fetchDevices(), 45000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchDevices]);

  useEffect(() => {
    window.setMqtt = setMqttState;
    window.setDb = setDbState;
  }, []);

  const lastIrrigation = useMemo(() => {
    const dates = plants
      .map((plant) => plant.lastIrrigation)
      .filter(Boolean)
      .map((date) => new Date(date));
    if (!dates.length) return null;
    return new Date(Math.max(...dates));
  }, [plants]);

  const allOk = mqtt && db;
  const mergedDevices = { ...apiDevices, ...devices };
  const esp32Sup = findDeviceForSector(mergedDevices, "Superior");
  const esp32Inf = findDeviceForSector(mergedDevices, "Inferior");
  const anyEsp32 = esp32Sup || esp32Inf;

  const submitLinkDevice = useCallback(async (event) => {
    event.preventDefault();
    const deviceId = form.deviceId.trim();

    if (!deviceId) {
      toast("Escribe el deviceId del ESP32", "warning");
      return;
    }

    setLinking(true);
    try {
      await api.post("/api/devices", {
        deviceId,
        sector: form.sector,
      });
      await fetchDevices();
      toast(`ESP32 ${deviceId} vinculado al sector ${form.sector}`, "success");
      setForm((prev) => ({ ...prev, deviceId: "" }));
      setShowLinkForm(false);
    } catch (error) {
      const message = error?.response?.data?.error || "No se pudo vincular el ESP32";
      toast(message, "error");
    } finally {
      setLinking(false);
    }
  }, [fetchDevices, form.deviceId, form.sector, toast]);

  const handleUnlinkDevice = useCallback(async (device) => {
    if (!device?.deviceId) return;
    const confirmed = window.confirm(`¿Desvincular ${device.deviceId} del sector ${device.sector || "sin sector"}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/devices/${device.deviceId}`);
      await fetchDevices();
      toast(`ESP32 ${device.deviceId} desvinculado`, "success");
    } catch (error) {
      const message = error?.response?.data?.error || "No se pudo desvincular el ESP32";
      toast(message, "error");
    }
  }, [fetchDevices, toast]);

  return (
    <div className="card status-card">
      <div className="status-header">
        <h2>{t("sys.title")}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn-see-all"
            onClick={() => startTransition(() => setShowLinkForm((prev) => !prev))}
            style={{ fontSize: 12, padding: "8px 12px" }}
          >
            {showLinkForm ? "Cerrar vinculo" : "Vincular ESP32"}
          </button>
          <div className={`status-badge ${allOk ? "badge-ok" : "badge-warn"}`}>
            {allOk ? t("sys.operative") : t("sys.attention")}
          </div>
        </div>
      </div>

      {showLinkForm && (
        <form
          onSubmit={submitLinkDevice}
          style={{
            marginBottom: 14,
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(52,211,153,0.14)",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, color: "#9fb1bb", lineHeight: 1.5 }}>
            Registra aqui el ESP32 de esta cuenta. El <strong>deviceId</strong> debe coincidir exactamente con el valor `DEVICE_ID` cargado en el firmware.
          </div>
          <input
            value={form.deviceId}
            onChange={(event) => setForm((prev) => ({ ...prev, deviceId: event.target.value }))}
            placeholder="Ej. ESP32-SUP-MARIA-01"
            maxLength={50}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(7,16,24,0.72)",
              color: "#ecfdf5",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={form.sector}
              onChange={(event) => setForm((prev) => ({ ...prev, sector: event.target.value }))}
              style={{
                minWidth: 160,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(7,16,24,0.72)",
                color: "#ecfdf5",
              }}
            >
              <option value="Superior">Sector Superior</option>
              <option value="Inferior">Sector Inferior</option>
            </select>
            <button
              type="submit"
              className="btn-see-all"
              disabled={linking}
              style={{ fontSize: 12, padding: "10px 14px", opacity: linking ? 0.7 : 1 }}
            >
              {linking ? "Vinculando..." : "Guardar dispositivo"}
            </button>
          </div>
        </form>
      )}

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

        <DeviceRow
          device={esp32Sup}
          label="ESP32 Patio Superior"
          now={now}
          onToggle={() => esp32Sup?.deviceId && startTransition(() => setExpandedSector((prev) => (prev === "Superior" ? null : "Superior")))}
        />
        {esp32Sup?.deviceId && expandedSector === "Superior" && (
          <div style={{ marginTop: -6, marginBottom: 6, paddingLeft: 48, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#9fb1bb" }}>{esp32Sup.deviceId}</span>
            <button
              type="button"
              onClick={() => handleUnlinkDevice(esp32Sup)}
              style={{
                fontSize: 11,
                padding: "5px 9px",
                borderRadius: 999,
                border: "1px solid rgba(248,113,113,0.28)",
                background: "rgba(248,113,113,0.08)",
                color: "#fca5a5",
                cursor: "pointer",
              }}
            >
              Desvincular
            </button>
          </div>
        )}
        <DeviceRow
          device={esp32Inf}
          label="ESP32 Patio Inferior"
          now={now}
          onToggle={() => esp32Inf?.deviceId && startTransition(() => setExpandedSector((prev) => (prev === "Inferior" ? null : "Inferior")))}
        />
        {esp32Inf?.deviceId && expandedSector === "Inferior" && (
          <div style={{ marginTop: -6, paddingLeft: 48, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#9fb1bb" }}>{esp32Inf.deviceId}</span>
            <button
              type="button"
              onClick={() => handleUnlinkDevice(esp32Inf)}
              style={{
                fontSize: 11,
                padding: "5px 9px",
                borderRadius: 999,
                border: "1px solid rgba(248,113,113,0.28)",
                background: "rgba(248,113,113,0.08)",
                color: "#fca5a5",
                cursor: "pointer",
              }}
            >
              Desvincular
            </button>
          </div>
        )}
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
