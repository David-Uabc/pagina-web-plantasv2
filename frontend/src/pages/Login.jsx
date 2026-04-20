import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { useAuth } from "../context/AuthContext";

// ── Campo de formulario reutilizable ─────────────────
function Field({ label, icon, type = "text", placeholder, value, onChange, error, autoComplete, rightEl }) {
  return (
    <div className="lp-field">
      <label className="lp-label">{label}</label>
      <div className="lp-input-wrap">
        <span className="lp-input-icon">{icon}</span>
        <input
          className={`lp-input ${error ? "error" : ""}`}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={!!error}
        />
        {rightEl}
      </div>
      {error && <span className="lp-field-err" role="alert">⚠ {error}</span>}
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button type="button" className="lp-eye-btn" onClick={toggle} tabIndex={-1}
      aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>
      {show ? <FaEyeSlash /> : <FaEye />}
    </button>
  );
}

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i, x: (i * 6.25) + Math.sin(i) * 4, y: (i * 5.9) + Math.cos(i) * 6,
  size: 2 + (i % 3) * 1.5, dur: 7 + (i % 5) * 2, delay: (i % 4) * 1.5,
}));

function Particles() {
  return (
    <div className="lp-particles" aria-hidden="true">
      {PARTICLES.map(p => (
        <motion.div key={p.id} className="lp-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -28, 0], opacity: [0.06, 0.3, 0.06] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ── Mensajes de error legibles ────────────────────────
function mensajeLogin(err) {
  if (err.mensajeUsuario) return err.mensajeUsuario;
  const status = err.response?.status;
  if (status === 401) return "El usuario o la contraseña son incorrectos. Inténtalo de nuevo.";
  if (status === 403) return "Tu cuenta no tiene permiso para entrar.";
  if (status === 429) return "Demasiados intentos. Por favor espera 15 minutos antes de intentarlo de nuevo.";
  if (status === 500) return "El servidor tuvo un problema. Inténtalo de nuevo en unos momentos.";
  if (!err.response)  return "No hay conexión con el servidor. Verifica tu internet e inténtalo de nuevo.";
  return err.response?.data?.error || "Ocurrió un error al iniciar sesión.";
}

function mensajeRegistro(err) {
  if (err.mensajeUsuario) return err.mensajeUsuario;
  const status = err.response?.status;
  if (status === 409) return "Ya existe una cuenta con ese usuario o email. Prueba con otro.";
  if (status === 400) return err.response?.data?.error || "Revisa los datos del formulario.";
  if (status === 429) return "Demasiados intentos. Por favor espera unos minutos.";
  if (!err.response)  return "No hay conexión con el servidor. Verifica tu internet.";
  return err.response?.data?.error || "No se pudo crear la cuenta. Inténtalo de nuevo.";
}

// ═══════════════════════════════════════════════════════
function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [tab,     setTab]     = useState("login");
  const [loading, setLoading] = useState(false);
  const [alert,   setAlert]   = useState(null);
  const [showP,   setShowP]   = useState(false);
  const [showP2,  setShowP2]  = useState(false);

  const [lUser, setLUser] = useState("");
  const [lPass, setLPass] = useState("");
  const [lErr,  setLErr]  = useState({});

  const [rName,    setRName]    = useState("");
  const [rUser,    setRUser]    = useState("");
  const [rEmail,   setREmail]   = useState("");
  const [rPass,    setRPass]    = useState("");
  const [rConfirm, setRConfirm] = useState("");
  const [rErr,     setRErr]     = useState({});

  const [fEmail, setFEmail] = useState("");
  const [fErr,   setFErr]   = useState("");

  const changeTab      = (t) => { setTab(t); setAlert(null); setLErr({}); setRErr({}); setFErr(""); };
  const clearAlertOnType = () => { if (alert) setAlert(null); };

  // ── LOGIN ─────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null);
    const errs = {};
    if (!lUser.trim()) errs.user = "Escribe tu nombre de usuario";
    if (!lPass)        errs.pass = "Escribe tu contraseña";
    if (Object.keys(errs).length) { setLErr(errs); return; }
    setLErr({});
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", {
        username: lUser.trim(),
        password: lPass,
      });

      // ✅ NUEVO SISTEMA — el backend devuelve accessToken
      // El refresh token llega automáticamente como cookie httpOnly
      const { user, accessToken, token } = res.data;

      // Compatibilidad: si el backend todavía devuelve "token" (viejo sistema)
      const finalToken = accessToken || token;
      login(user, finalToken);

      // Mantener ambas claves mientras el resto de la UI aún lee iot_session.

      // Llamar onLogin con user Y token para que App.js los tenga
      navigate("/");
    } catch (err) {
      setAlert({ type: "error", msg: mensajeLogin(err) });
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTRO ──────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert(null);
    const errs = {};
    if (!rName.trim())                 errs.name    = "Escribe tu nombre completo";
    if (!rUser.trim())                 errs.user    = "Escribe un nombre de usuario";
    if (rUser.trim().length < 3)       errs.user    = "El usuario debe tener al menos 3 caracteres";
    if (!/\S+@\S+\.\S+/.test(rEmail)) errs.email   = "Escribe un email válido";
    if (rPass.length < 6)             errs.pass    = "La contraseña debe tener al menos 6 caracteres";
    if (rPass !== rConfirm)           errs.confirm = "Las contraseñas no coinciden";
    if (Object.keys(errs).length) { setRErr(errs); return; }
    setRErr({});
    setLoading(true);
    try {
      await api.post("/api/auth/register", {
        name:     rName.trim(),
        username: rUser.trim().toLowerCase(),
        email:    rEmail.trim().toLowerCase(),
        password: rPass,
      });
      setAlert({ type: "success", msg: "¡Cuenta creada exitosamente! Ahora puedes iniciar sesión." });
      changeTab("login");
      setRName(""); setRUser(""); setREmail(""); setRPass(""); setRConfirm("");
    } catch (err) {
      setAlert({ type: "error", msg: mensajeRegistro(err) });
    } finally {
      setLoading(false);
    }
  };

  // ── OLVIDÉ CONTRASEÑA ─────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    setAlert(null);
    if (!/\S+@\S+\.\S+/.test(fEmail)) { setFErr("Escribe un email válido"); return; }
    setFErr("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: fEmail.trim().toLowerCase() });
      setAlert({ type: "success", msg: "Si ese correo está registrado, recibirás instrucciones en unos minutos. Revisa también tu carpeta de spam." });
      setFEmail("");
    } catch {
      setAlert({ type: "success", msg: "Si ese correo está registrado, recibirás instrucciones en unos minutos." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-page">

      {/* Panel izquierdo */}
      <motion.div className="lp-brand"
        initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Particles />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-brand-content">
          <motion.div className="lp-logo-wrap"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
            <div className="lp-logo-ring lp-ring-1" />
            <div className="lp-logo-ring lp-ring-2" />
            <span className="lp-logo-drop">💧</span>
          </motion.div>
          <motion.h1 className="lp-brand-title"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}>
            Sistema de<br />Riego IoT
          </motion.h1>
          <motion.p className="lp-brand-sub"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}>
            Monitoreo y control inteligente<br />de cultivos en tiempo real
          </motion.p>
          <motion.div className="lp-features"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}>
            {[
              ["🌿", "Monitoreo en tiempo real"],
              ["📊", "Historial de humedad"],
              ["🔔", "Alertas automáticas"],
              ["📱", "Acceso desde cualquier pantalla"],
            ].map(([icon, text], i) => (
              <motion.div key={text} className="lp-feature"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}>
                <span>{icon}</span><span>{text}</span>
              </motion.div>
            ))}
          </motion.div>
          <motion.div className="lp-stats"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}>
            {[["99%","Uptime"],["ESP32","Compatible"],["MQTT","Protocolo"]].map(([v,l]) => (
              <div key={l} className="lp-stat">
                <span className="lp-stat-val">{v}</span>
                <span className="lp-stat-lbl">{l}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="lp-divider" />

      {/* Panel derecho */}
      <motion.div className="lp-form-panel"
        initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-form-inner">
          {tab !== "forgot" && (
            <div className="lp-tabs">
              <button className={`lp-tab ${tab === "login"    ? "active" : ""}`} onClick={() => changeTab("login")}>Iniciar Sesión</button>
              <button className={`lp-tab ${tab === "register" ? "active" : ""}`} onClick={() => changeTab("register")}>Registrarse</button>
            </div>
          )}

          <div className="lp-form-card">
            <div className="lp-card-topbar" />

            <AnimatePresence>
              {alert && (
                <motion.div className={`lp-alert ${alert.type}`}
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} role="alert" aria-live="polite">
                  {alert.type === "success" ? "✅ " : "⚠️ "}{alert.msg}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">

              {/* LOGIN */}
              {tab === "login" && (
                <motion.form key="login" onSubmit={handleLogin}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} noValidate>
                  <h2 className="lp-form-title">Bienvenido de vuelta</h2>
                  <p className="lp-form-sub">Ingresa tus datos para continuar</p>
                  <Field label="Usuario" icon={<FaUser />} placeholder="Tu nombre de usuario"
                    value={lUser} onChange={e => { setLUser(e.target.value); clearAlertOnType(); }}
                    error={lErr.user} autoComplete="username" />
                  <Field label="Contraseña" icon={<FaLock />} type={showP ? "text" : "password"}
                    placeholder="Tu contraseña" value={lPass}
                    onChange={e => { setLPass(e.target.value); clearAlertOnType(); }}
                    error={lErr.pass} autoComplete="current-password"
                    rightEl={<EyeBtn show={showP} toggle={() => setShowP(v => !v)} />} />
                  <div className="lp-forgot">
                    <button type="button" onClick={() => changeTab("forgot")}>¿Olvidaste tu contraseña?</button>
                  </div>
                  <button className="lp-submit-btn" type="submit" disabled={loading}>
                    {loading && <span className="spinner" />}
                    {loading ? "Verificando..." : "Iniciar Sesión →"}
                  </button>
                  <p className="lp-switch">¿No tienes cuenta?{" "}
                    <button type="button" onClick={() => changeTab("register")}>Regístrate aquí</button>
                  </p>
                </motion.form>
              )}

              {/* REGISTRO */}
              {tab === "register" && (
                <motion.form key="register" onSubmit={handleRegister}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} noValidate>
                  <h2 className="lp-form-title">Crear cuenta</h2>
                  <p className="lp-form-sub">Completa el formulario para comenzar</p>
                  <Field label="Nombre completo" icon={<FaUser />} placeholder="Tu nombre"
                    value={rName} onChange={e => { setRName(e.target.value); clearAlertOnType(); }}
                    error={rErr.name} autoComplete="name" />
                  <Field label="Usuario" icon={<FaUser />} placeholder="ej: david_riego"
                    value={rUser} onChange={e => { setRUser(e.target.value); clearAlertOnType(); }}
                    error={rErr.user} autoComplete="username" />
                  <Field label="Email" icon={<FaEnvelope />} type="email" placeholder="tu@email.com"
                    value={rEmail} onChange={e => { setREmail(e.target.value); clearAlertOnType(); }}
                    error={rErr.email} autoComplete="email" />
                  <Field label="Contraseña" icon={<FaLock />} type={showP ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres" value={rPass}
                    onChange={e => { setRPass(e.target.value); clearAlertOnType(); }}
                    error={rErr.pass} autoComplete="new-password"
                    rightEl={<EyeBtn show={showP} toggle={() => setShowP(v => !v)} />} />
                  <Field label="Confirmar contraseña" icon={<FaLock />} type={showP2 ? "text" : "password"}
                    placeholder="Repite tu contraseña" value={rConfirm}
                    onChange={e => { setRConfirm(e.target.value); clearAlertOnType(); }}
                    error={rErr.confirm} autoComplete="new-password"
                    rightEl={<EyeBtn show={showP2} toggle={() => setShowP2(v => !v)} />} />
                  <button className="lp-submit-btn" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                    {loading && <span className="spinner" />}
                    {loading ? "Creando cuenta..." : "Crear Cuenta →"}
                  </button>
                  <p className="lp-switch">¿Ya tienes cuenta?{" "}
                    <button type="button" onClick={() => changeTab("login")}>Inicia sesión aquí</button>
                  </p>
                </motion.form>
              )}

              {/* OLVIDÉ */}
              {tab === "forgot" && (
                <motion.form key="forgot" onSubmit={handleForgot}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} noValidate>
                  <h2 className="lp-form-title">Recuperar acceso</h2>
                  <p className="lp-form-sub">Escribe tu correo y te enviaremos instrucciones para crear una nueva contraseña.</p>
                  <Field label="Tu correo electrónico" icon={<FaEnvelope />} type="email"
                    placeholder="tu@email.com" value={fEmail}
                    onChange={e => { setFEmail(e.target.value); clearAlertOnType(); }}
                    error={fErr} autoComplete="email" />
                  <button className="lp-submit-btn" type="submit" disabled={loading}>
                    {loading && <span className="spinner" />}
                    {loading ? "Enviando..." : "Enviar Instrucciones →"}
                  </button>
                  <p className="lp-switch">
                    <button type="button" onClick={() => changeTab("login")}>← Volver al inicio de sesión</button>
                  </p>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
