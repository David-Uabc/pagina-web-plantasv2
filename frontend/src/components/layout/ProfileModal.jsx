import { useState, useEffect } from "react";
import { useI18n } from "../../i18n";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Lock, Eye, EyeOff, Check, Camera } from "lucide-react";

const getUsers   = () => JSON.parse(localStorage.getItem("iot_users")   || "[]");
const saveUsers  = (u) => localStorage.setItem("iot_users", JSON.stringify(u));
const getSession = () => JSON.parse(localStorage.getItem("iot_session") || "{}");
const saveSession= (s) => localStorage.setItem("iot_session", JSON.stringify(s));

// Input field reutilizable
function Field({ label, icon: Icon, type = "text", value, onChange, error, placeholder, rightEl, autoComplete }) {
  return (
    <div className="pm-field">
      <label className="pm-label">{label}</label>
      <div className="pm-input-wrap">
        <Icon size={14} className="pm-input-icon" />
        <input
          className={`pm-input ${error ? "error" : ""}`}
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
        />
        {rightEl}
      </div>
      {error && <span className="pm-error">{error}</span>}
    </div>
  );
}

export default function ProfileModal({ onClose, onUpdate }) {
  const { t } = useI18n();
  const session  = getSession();
  const users    = getUsers();
  const current  = users.find(u => u.username === session.username) || {};

  const [tab,      setTab]      = useState("info");
  const [name,     setName]     = useState(session.name || "");
  const [email,    setEmail]    = useState(current.email || "");
  const [oldPass,  setOldPass]  = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showOld,  setShowOld]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [saved,    setSaved]    = useState(false);
  const [loading,  setLoading]  = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const saveInfo = async () => {
    const errs = {};
    if (!name.trim())                errs.name  = t("profile.errName");
    if (!/\S+@\S+\.\S+/.test(email)) errs.email = t("profile.errEmail");
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({}); setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    // Actualizar en users array
    const updated = users.map(u =>
      u.username === session.username ? { ...u, name, email } : u
    );
    saveUsers(updated);
    saveSession({ ...session, name });
    if (onUpdate) onUpdate({ name });

    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const savePassword = async () => {
    const errs = {};
    if (!oldPass)            errs.oldPass = t("profile.errOldPass");
    if (current.password !== oldPass) errs.oldPass = t("profile.errWrongPass");
    if (newPass.length < 6)  errs.newPass = t("profile.errMinPass");
    if (newPass !== confirm)  errs.confirm = t("profile.errMatch");
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({}); setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const updated = users.map(u =>
      u.username === session.username ? { ...u, password: newPass } : u
    );
    saveUsers(updated);
    setOldPass(""); setNewPass(""); setConfirm("");
    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initial = (session.name || session.username || "U").charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}>

        <motion.div className="pm-modal"
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>

          {/* Header */}
          <div className="pm-header">
            <div className="pm-header-left">
              {/* Avatar grande */}
              <div className="pm-avatar-wrap">
                <div className="pm-avatar-lg">{initial}</div>
                <div className="pm-avatar-edit"><Camera size={12} /></div>
              </div>
              <div>
                <h2 className="pm-title">{session.name || session.username}</h2>
                <span className="pm-handle">@{session.username}</span>
              </div>
            </div>
            <button className="pm-close" onClick={onClose}><X size={16} /></button>
          </div>

          {/* Tabs */}
          <div className="pm-tabs">
            <button className={`pm-tab ${tab === "info"     ? "active" : ""}`} onClick={() => { setTab("info");     setErrors({}); setSaved(false); }}>
              <User size={14} /> Información
            </button>
            <button className={`pm-tab ${tab === "password" ? "active" : ""}`} onClick={() => { setTab("password"); setErrors({}); setSaved(false); }}>
              <Lock size={14} /> Contraseña
            </button>
          </div>

          {/* Content */}
          <div className="pm-body">
            <AnimatePresence mode="wait">

              {tab === "info" && (
                <motion.div key="info"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>

                  <Field label={t("profile.fullName")} icon={User}
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder={t("profile.fullName")} error={errors.name} autoComplete="name" />

                  <Field label={t("profile.email")} icon={Mail} type="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="user@email.com" error={errors.email} autoComplete="email" />

                  {/* Usuario (no editable) */}
                  <div className="pm-field">
                    <label className="pm-label">Usuario</label>
                    <div className="pm-input-wrap">
                      <User size={14} className="pm-input-icon" />
                      <input className="pm-input pm-input-readonly"
                        value={`@${session.username}`} readOnly />
                    </div>
                    <span className="pm-hint">El nombre de usuario no se puede cambiar</span>
                  </div>

                  <button className="pm-save-btn" onClick={saveInfo} disabled={loading}>
                    {loading ? <><span className="spinner" /> Guardando...</>
                      : saved  ? <><Check size={15} /> ¡Guardado!</>
                      : t("profile.save")}
                  </button>
                </motion.div>
              )}

              {tab === "password" && (
                <motion.div key="password"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>

                  <Field label={t("profile.oldPass")} icon={Lock}
                    type={showOld ? "text" : "password"}
                    value={oldPass} onChange={e => setOldPass(e.target.value)}
                    placeholder="Tu contraseña actual" error={errors.oldPass}
                    autoComplete="current-password"
                    rightEl={
                      <button type="button" className="pm-eye" onClick={() => setShowOld(v => !v)}>
                        {showOld ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    } />

                  <Field label={t("profile.newPass")} icon={Lock}
                    type={showNew ? "text" : "password"}
                    value={newPass} onChange={e => setNewPass(e.target.value)}
                    placeholder={t("profile.errMinPass")} error={errors.newPass}
                    autoComplete="new-password"
                    rightEl={
                      <button type="button" className="pm-eye" onClick={() => setShowNew(v => !v)}>
                        {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    } />

                  <Field label={t("profile.confirmPass")} icon={Lock}
                    type="password"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder={t("profile.confirmPass")} error={errors.confirm}
                    autoComplete="new-password" />

                  {/* Indicador de seguridad */}
                  {newPass && (
                    <div className="pm-strength">
                      <div className="pm-strength-bars">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`pm-strength-bar ${
                            newPass.length >= i * 3 ? (newPass.length >= 10 ? "strong" : newPass.length >= 6 ? "medium" : "weak") : ""
                          }`} />
                        ))}
                      </div>
                      <span className="pm-strength-label">
                        {newPass.length < 6 ? t("profile.weak") : newPass.length < 10 ? t("profile.medium") : t("profile.strong")}
                      </span>
                    </div>
                  )}

                  <button className="pm-save-btn" onClick={savePassword} disabled={loading}>
                    {loading ? <><span className="spinner" /> Actualizando...</>
                      : saved  ? <><Check size={15} /> ¡Contraseña actualizada!</>
                      : "Actualizar contraseña"}
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}