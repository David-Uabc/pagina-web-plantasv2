import { useState, useEffect } from "react";
import { useI18n } from "../../i18n";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Bell, BellOff, RefreshCw, Sliders, Check, Globe } from "lucide-react";

const SETTINGS_KEY = "iot_settings";
const getSettings  = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
const saveSettings = (s) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));

const DEFAULT = {
  theme:           "dark",
  notifications:   true,
  alertThreshold:  30,
  refreshInterval: 5,
  language:        "es",
  compactMode:     false,
  soundAlerts:     false,
};

// Toggle switch
function Toggle({ checked, onChange, label, description, icon: Icon, accentColor = "var(--green)" }) {
  return (
    <div className="sm-toggle-row">
      <div className="sm-toggle-left">
        <div className="sm-toggle-icon" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}>
          <Icon size={15} color={accentColor} />
        </div>
        <div>
          <span className="sm-toggle-label">{label}</span>
          {description && <span className="sm-toggle-desc">{description}</span>}
        </div>
      </div>
      <button
        className={`sm-switch ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
        style={checked ? { background: accentColor } : {}}>
        <span className="sm-switch-thumb" />
      </button>
    </div>
  );
}

// Slider
function SliderField({ label, icon: Icon, value, onChange, min, max, step = 1, unit, marks }) {
  return (
    <div className="sm-slider-row">
      <div className="sm-slider-header">
        <div className="sm-slider-left">
          <Icon size={14} color="var(--green)" />
          <span className="sm-slider-label">{label}</span>
        </div>
        <span className="sm-slider-val">{value}{unit}</span>
      </div>
      <input type="range" className="sm-slider"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ "--pct": `${((value - min) / (max - min)) * 100}%` }}
      />
      {marks && (
        <div className="sm-slider-marks">
          {marks.map(m => <span key={m}>{m}{unit}</span>)}
        </div>
      )}
    </div>
  );
}

export default function SettingsModal({ onClose }) {
  const { t, setLang } = useI18n();
  const [cfg,     setCfg]     = useState({ ...DEFAULT, ...getSettings() });
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setCfg(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));

    saveSettings(cfg);

    // Aplicar tema
    document.body.classList.toggle("light-mode", cfg.theme === "light");
    localStorage.setItem("theme", cfg.theme);

    // Aplicar compact mode
    document.body.classList.toggle("compact-mode", cfg.compactMode);
    // Aplicar idioma
    setLang(cfg.language);
    if (window.setAppLanguage) window.setAppLanguage(cfg.language);

    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}>

        <motion.div className="sm-modal"
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>

          {/* Header */}
          <div className="sm-header">
            <div className="sm-header-left">
              <div className="sm-header-icon">
                <Sliders size={18} color="var(--green)" />
              </div>
              <div>
                <h2 className="sm-title">Configuración</h2>
                <span className="sm-subtitle">Personaliza tu experiencia</span>
              </div>
            </div>
            <button className="pm-close" onClick={onClose}><X size={16} /></button>
          </div>

          <div className="sm-body">

            {/* APARIENCIA */}
            <div className="sm-section">
              <span className="sm-section-title">Apariencia</span>

              {/* Selector de tema */}
              <div className="sm-theme-selector">
                <button
                  className={`sm-theme-opt ${cfg.theme === "dark" ? "active" : ""}`}
                  onClick={() => set("theme", "dark")}>
                  <Moon size={18} />
                  <span>Oscuro</span>
                  {cfg.theme === "dark" && <Check size={12} className="sm-theme-check" />}
                </button>
                <button
                  className={`sm-theme-opt ${cfg.theme === "light" ? "active" : ""}`}
                  onClick={() => set("theme", "light")}>
                  <Sun size={18} />
                  <span>Claro</span>
                  {cfg.theme === "light" && <Check size={12} className="sm-theme-check" />}
                </button>
              </div>

              <Toggle
                label={t("settings.compact")}
                description={t("settings.compactDesc")}
                icon={Sliders}
                checked={cfg.compactMode}
                onChange={v => set("compactMode", v)}
              />
            </div>

            <div className="sm-divider" />

            {/* NOTIFICACIONES */}
            <div className="sm-section">
              <span className="sm-section-title">Notificaciones</span>

              <Toggle
                label={t("settings.humAlerts")}
                description={t("settings.humAlertsDesc")}
                icon={Bell}
                checked={cfg.notifications}
                onChange={v => set("notifications", v)}
              />

              <Toggle
                label={t("settings.soundAlerts")}
                description={t("settings.soundDesc")}
                icon={BellOff}
                checked={cfg.soundAlerts}
                onChange={v => set("soundAlerts", v)}
                accentColor="var(--blue)"
              />

              <SliderField
                label={t("settings.threshold")}
                icon={Bell}
                value={cfg.alertThreshold}
                onChange={v => set("alertThreshold", v)}
                min={10} max={60} step={5} unit="%"
                marks={[10, 20, 30, 40, 50, 60]}
              />
            </div>

            <div className="sm-divider" />

            {/* SISTEMA */}
            <div className="sm-section">
              <span className="sm-section-title">Sistema</span>

              <SliderField
                label={t("settings.refresh")}
                icon={RefreshCw}
                value={cfg.refreshInterval}
                onChange={v => set("refreshInterval", v)}
                min={3} max={30} step={1} unit="s"
                marks={[3, 10, 20, 30]}
              />

              {/* Idioma */}
              <div className="sm-select-row">
                <div className="sm-toggle-left">
                  <div className="sm-toggle-icon" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <Globe size={15} color="var(--yellow)" />
                  </div>
                  <div>
                    <span className="sm-toggle-label">Idioma</span>
                    <span className="sm-toggle-desc">Idioma de la interfaz</span>
                  </div>
                </div>
                <select className="sm-select"
                  value={cfg.language}
                  onChange={e => set("language", e.target.value)}>
                  <option value="es">🇲🇽 Español</option>
                  <option value="en">🇺🇸 English</option>
                </select>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="sm-footer">
            <button className="sm-cancel-btn" onClick={onClose}>Cancelar</button>
            <button className="sm-save-btn" onClick={handleSave} disabled={loading}>
              {loading ? <><span className="spinner" /> Aplicando...</>
                : saved  ? <><Check size={14} /> ¡Aplicado!</>
                : <><Check size={14} /> Guardar cambios</>}
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}