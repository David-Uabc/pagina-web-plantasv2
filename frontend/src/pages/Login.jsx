import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { useAuth } from "../context/AuthContext";

// ══════════════════════════════════════════════════════
//  PARTÍCULAS — 32 puntos con trayectorias variadas
// ══════════════════════════════════════════════════════
const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id:    i,
  x:     (i * 3.1 + Math.sin(i * 0.8) * 9) % 100,
  y:     (i * 3.0 + Math.cos(i * 0.7) * 8) % 95,
  size:  1.2 + (i % 5) * 0.9,
  dur:   5 + (i % 7) * 1.6,
  delay: (i % 8) * 0.7,
  dy:    -(20 + (i % 6) * 14),
  dx:    (i % 2 === 0 ? 1 : -1) * (6 + (i % 5) * 5),
  op:    0.4 + (i % 3) * 0.2,
}));

function Particles() {
  return (
    <div className="lp-particles" aria-hidden="true">
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="lp-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            x:       [0, p.dx, 0],
            y:       [0, p.dy, 0],
            opacity: [0, p.op, 0],
            scale:   [0.3, 1.5, 0.3],
          }}
          transition={{
            duration: p.dur,
            delay:    p.delay,
            repeat:   Infinity,
            ease:     "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  GRID DE FONDO ANIMADO
// ══════════════════════════════════════════════════════
function AnimatedGrid() {
  return (
    <div className="lp-grid-bg" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <motion.div key={`h${i}`} className="lp-grid-h"
          style={{ top: `${i * 5.6}%` }}
          animate={{ opacity: [0.015, 0.055, 0.015] }}
          transition={{ duration: 3 + (i % 4), delay: i * 0.22, repeat: Infinity }}
        />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <motion.div key={`v${i}`} className="lp-grid-v"
          style={{ left: `${i * 7.14}%` }}
          animate={{ opacity: [0.015, 0.045, 0.015] }}
          transition={{ duration: 4 + (i % 3), delay: i * 0.18, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  CAMPO DE FORMULARIO — con animación de focus
// ══════════════════════════════════════════════════════
function Field({ label, icon, type = "text", placeholder, value, onChange, error, autoComplete, rightEl }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="lp-field">
      <label className="lp-label">{label}</label>
      <motion.div
        className="lp-input-wrap"
        animate={{
          boxShadow: focused
            ? "0 0 0 2px rgba(52,211,153,0.35), 0 0 20px rgba(52,211,153,0.10)"
            : "0 0 0 0px rgba(52,211,153,0)",
        }}
        transition={{ duration: 0.22 }}
        style={{ borderRadius: 12 }}
      >
        <motion.span
          className="lp-input-icon"
          animate={{ color: focused ? "#34d399" : undefined }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.span>
        <input
          className={`lp-input ${error ? "error" : ""}`}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightEl}
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.span
            className="lp-field-err"
            role="alert"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            ⚠ {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <motion.button
      type="button"
      className="lp-eye-btn"
      onClick={toggle}
      tabIndex={-1}
      aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      whileTap={{ scale: 0.85 }}
    >
      <AnimatePresence mode="wait">
        <motion.span key={show ? "hide" : "show"}
          initial={{ opacity: 0, rotate: -15, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 15, scale: 0.7 }}
          transition={{ duration: 0.15 }}
          style={{ display: "flex" }}
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
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

// ══════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL — LÓGICA ORIGINAL INTACTA
// ══════════════════════════════════════════════════════
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

  const changeTab       = (t) => { setTab(t); setAlert(null); setLErr({}); setRErr({}); setFErr(""); };
  const clearAlertOnType = ()  => { if (alert) setAlert(null); };

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
      const { user, accessToken, token } = res.data;
      const finalToken = accessToken || token;
      login(user, finalToken);
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

  // ══════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div className="lp-page">

      {/* ════════════════════════════════════════
          PANEL IZQUIERDO — BRANDING VIBRANTE
      ════════════════════════════════════════ */}
      <motion.div
        className="lp-brand"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Grid sutil de fondo */}
        <AnimatedGrid />

        {/* Partículas flotantes */}
        <Particles />

        {/* Orbs grandes animados */}
        <motion.div
          className="lp-orb lp-orb-1"
          animate={{ scale: [1, 1.22, 1], x: [0, 32, 0], y: [0, -25, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="lp-orb lp-orb-2"
          animate={{ scale: [1, 1.28, 1], x: [0, -26, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Tercer orb central sutil */}
        <motion.div
          className="lp-orb lp-orb-3"
          animate={{ scale: [1, 1.15, 1], x: [0, 16, 0], y: [0, 18, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        />

        {/* Línea de brillo superior */}
        <motion.div
          className="lp-brand-topline"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Contenido */}
        <div className="lp-brand-content">

          {/* Logo con anillos + glow pulsante */}
          <motion.div
            className="lp-logo-wrap"
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div className="lp-logo-ring lp-ring-1"
              animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div className="lp-logo-ring lp-ring-2"
              animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            />
            <motion.div className="lp-logo-ring lp-ring-3"
              animate={{ scale: [1, 1.35, 1], opacity: [0.08, 0.25, 0.08] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
            />
            <motion.span
              className="lp-logo-drop"
              animate={{
                filter: [
                  "drop-shadow(0 0 14px rgba(52,211,153,0.5))",
                  "drop-shadow(0 0 36px rgba(52,211,153,1.0))",
                  "drop-shadow(0 0 14px rgba(52,211,153,0.5))",
                ],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              💧
            </motion.span>
          </motion.div>

          {/* Título */}
          <motion.h1
            className="lp-brand-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            Sistema de<br />Riego IoT
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            className="lp-brand-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42 }}
          >
            Monitoreo y control inteligente<br />de cultivos en tiempo real
          </motion.p>

          {/* Features con hover lift */}
          <motion.div
            className="lp-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.58 }}
          >
            {[
              ["🌿", "Monitoreo en tiempo real"],
              ["📊", "Historial de humedad"],
              ["🔔", "Alertas automáticas"],
              ["📱", "Acceso desde cualquier pantalla"],
            ].map(([icon, text], i) => (
              <motion.div
                key={text}
                className="lp-feature"
                initial={{ opacity: 0, x: -22 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.68 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ x: 6, scale: 1.02, transition: { duration: 0.16 } }}
              >
                <motion.span
                  style={{ fontSize: 18, flexShrink: 0 }}
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.8 }}
                >
                  {icon}
                </motion.span>
                <span>{text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats con pop-in */}
          <motion.div
            className="lp-stats"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.08 }}
          >
            {[["99%", "Uptime"], ["ESP32", "Compatible"], ["MQTT", "Protocolo"]].map(([v, l], i) => (
              <motion.div
                key={l}
                className="lp-stat"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.12 + i * 0.09, ease: [0.34, 1.56, 0.64, 1] }}
                whileHover={{ scale: 1.06, transition: { duration: 0.16 } }}
              >
                <span className="lp-stat-val">{v}</span>
                <span className="lp-stat-lbl">{l}</span>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </motion.div>

      {/* Divisor con brillo animado */}
      <motion.div
        className="lp-divider"
        animate={{
          background: [
            "linear-gradient(to bottom, transparent, rgba(52,211,153,0.25) 50%, transparent)",
            "linear-gradient(to bottom, transparent, rgba(52,211,153,0.55) 50%, transparent)",
            "linear-gradient(to bottom, transparent, rgba(52,211,153,0.25) 50%, transparent)",
          ],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ════════════════════════════════════════
          PANEL DERECHO — FORMULARIO
      ════════════════════════════════════════ */}
      <motion.div
        className="lp-form-panel"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-form-inner">

          {/* Tabs */}
          {tab !== "forgot" && (
            <motion.div
              className="lp-tabs"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                className={`lp-tab ${tab === "login"    ? "active" : ""}`}
                onClick={() => changeTab("login")}
              >
                Iniciar Sesión
              </button>
              <button
                className={`lp-tab ${tab === "register" ? "active" : ""}`}
                onClick={() => changeTab("register")}
              >
                Registrarse
              </button>
            </motion.div>
          )}

          {/* Card principal */}
          <motion.div
            className="lp-form-card"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Línea sweep animada */}
            <motion.div
              className="lp-card-topbar"
              animate={{
                background: [
                  "linear-gradient(90deg, transparent 0%, #34d399 40%, #60a5fa 60%, transparent 100%)",
                  "linear-gradient(90deg, transparent 20%, #60a5fa 50%, #34d399 70%, transparent 100%)",
                  "linear-gradient(90deg, transparent 0%, #34d399 40%, #60a5fa 60%, transparent 100%)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Alerta global */}
            <AnimatePresence>
              {alert && (
                <motion.div
                  className={`lp-alert ${alert.type}`}
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  role="alert" aria-live="polite"
                >
                  {alert.type === "success" ? "✅ " : "⚠️ "}{alert.msg}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">

              {/* ── LOGIN ── */}
              {tab === "login" && (
                <motion.form
                  key="login"
                  onSubmit={handleLogin}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  noValidate
                >
                  <h2 className="lp-form-title">Bienvenido de vuelta 👋</h2>
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
                    <button type="button" onClick={() => changeTab("forgot")}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <motion.button
                    className="lp-submit-btn"
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.025, y: loading ? 0 : -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading
                      ? <><span className="spinner" /> Verificando...</>
                      : "Iniciar Sesión →"
                    }
                  </motion.button>

                  <p className="lp-switch">
                    ¿No tienes cuenta?{" "}
                    <button type="button" onClick={() => changeTab("register")}>Regístrate aquí</button>
                  </p>
                </motion.form>
              )}

              {/* ── REGISTRO ── */}
              {tab === "register" && (
                <motion.form
                  key="register"
                  onSubmit={handleRegister}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  noValidate
                >
                  <h2 className="lp-form-title">Crear cuenta 🌱</h2>
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

                  <motion.button
                    className="lp-submit-btn"
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.025, y: loading ? 0 : -1 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ marginTop: 8 }}
                  >
                    {loading
                      ? <><span className="spinner" /> Creando cuenta...</>
                      : "Crear Cuenta →"
                    }
                  </motion.button>

                  <p className="lp-switch">
                    ¿Ya tienes cuenta?{" "}
                    <button type="button" onClick={() => changeTab("login")}>Inicia sesión aquí</button>
                  </p>
                </motion.form>
              )}

              {/* ── OLVIDÉ ── */}
              {tab === "forgot" && (
                <motion.form
                  key="forgot"
                  onSubmit={handleForgot}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  noValidate
                >
                  <h2 className="lp-form-title">Recuperar acceso 🔑</h2>
                  <p className="lp-form-sub">
                    Escribe tu correo y te enviaremos instrucciones para crear una nueva contraseña.
                  </p>

                  <Field label="Tu correo electrónico" icon={<FaEnvelope />} type="email"
                    placeholder="tu@email.com" value={fEmail}
                    onChange={e => { setFEmail(e.target.value); clearAlertOnType(); }}
                    error={fErr} autoComplete="email" />

                  <motion.button
                    className="lp-submit-btn"
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.025, y: loading ? 0 : -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading
                      ? <><span className="spinner" /> Enviando...</>
                      : "Enviar Instrucciones →"
                    }
                  </motion.button>

                  <p className="lp-switch">
                    <button type="button" onClick={() => changeTab("login")}>
                      ← Volver al inicio de sesión
                    </button>
                  </p>
                </motion.form>
              )}

            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;