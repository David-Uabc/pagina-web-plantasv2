import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const getUsers  = () => JSON.parse(localStorage.getItem("iot_users")  || "[]");
const saveUsers = (u) => localStorage.setItem("iot_users", JSON.stringify(u));

// ─────────────────────────────────────────────────────
// CRÍTICO: Field definido FUERA del componente Login
// para que React no lo recree en cada render (bug de foco)
// ─────────────────────────────────────────────────────
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
        />
        {rightEl}
      </div>
      {error && <span className="lp-field-err">{error}</span>}
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button type="button" className="lp-eye-btn" onClick={toggle} tabIndex={-1}>
      {show ? <FaEyeSlash /> : <FaEye />}
    </button>
  );
}

// ─────────────────────────────────────────────────────
// Partículas flotantes (solo decoración)
// ─────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: (i * 6.25) + Math.sin(i) * 4,
  y: (i * 5.9)  + Math.cos(i) * 6,
  size: 2 + (i % 3) * 1.5,
  dur:  7 + (i % 5) * 2,
  delay: (i % 4) * 1.5,
}));

function Particles() {
  return (
    <div className="lp-particles" aria-hidden="true">
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="lp-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -28, 0], opacity: [0.06, 0.3, 0.06] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Login principal
// ─────────────────────────────────────────────────────
function Login({ onLogin }) {
  const navigate = useNavigate();

  const [tab,      setTab]      = useState("login");
  const [loading,  setLoading]  = useState(false);
  const [alert,    setAlert]    = useState(null);
  const [showP,    setShowP]    = useState(false);
  const [showP2,   setShowP2]   = useState(false);

  // Campos login
  const [lUser, setLUser] = useState("");
  const [lPass, setLPass] = useState("");
  const [lErr,  setLErr]  = useState({});

  // Campos registro
  const [rName,    setRName]    = useState("");
  const [rUser,    setRUser]    = useState("");
  const [rEmail,   setREmail]   = useState("");
  const [rPass,    setRPass]    = useState("");
  const [rConfirm, setRConfirm] = useState("");
  const [rErr,     setRErr]     = useState({});

  // Forgot
  const [fEmail, setFEmail] = useState("");
  const [fErr,   setFErr]   = useState("");

  const changeTab = (t) => { setTab(t); setAlert(null); setLErr({}); setRErr({}); setFErr(""); };

  // ── Login ───────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault(); setAlert(null);
    const errs = {};
    if (!lUser.trim()) errs.user = "Requerido";
    if (!lPass)        errs.pass = "Requerido";
    if (Object.keys(errs).length) { setLErr(errs); return; }
    setLErr({}); setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const user = getUsers().find(u => u.username === lUser && u.password === lPass);
    setLoading(false);
    if (!user) { setAlert({ type: "error", msg: "Usuario o contraseña incorrectos." }); return; }
    localStorage.setItem("iot_session", JSON.stringify({ name: user.name, username: user.username }));
    if (onLogin) onLogin(user);
    navigate("/");
  };

  // ── Registro ────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault(); setAlert(null);
    const errs = {};
    if (!rName.trim())                errs.name    = "Requerido";
    if (!rUser.trim())                errs.user    = "Requerido";
    if (!/\S+@\S+\.\S+/.test(rEmail)) errs.email   = "Email inválido";
    if (rPass.length < 6)             errs.pass    = "Mínimo 6 caracteres";
    if (rPass !== rConfirm)           errs.confirm = "No coinciden";
    if (Object.keys(errs).length) { setRErr(errs); return; }
    setRErr({}); setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const users = getUsers();
    if (users.find(u => u.username === rUser)) {
      setLoading(false); setAlert({ type: "error", msg: "Ese usuario ya existe." }); return;
    }
    users.push({ name: rName, username: rUser, email: rEmail, password: rPass });
    saveUsers(users); setLoading(false);
    setAlert({ type: "success", msg: "¡Cuenta creada! Inicia sesión." });
    changeTab("login");
    setRName(""); setRUser(""); setREmail(""); setRPass(""); setRConfirm("");
  };

  // ── Forgot ──────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault(); setAlert(null);
    if (!/\S+@\S+\.\S+/.test(fEmail)) { setFErr("Email inválido"); return; }
    setFErr(""); setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setAlert({ type: "success", msg: "Si ese email existe, recibirás instrucciones." });
    setFEmail("");
  };

  return (
    <div className="lp-page">

      {/* ══ PANEL IZQUIERDO — BRANDING ══ */}
      <div className="lp-brand">
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
            transition={{ delay: 0.2 }}>
            Sistema de<br />Riego IoT
          </motion.h1>

          <motion.p className="lp-brand-sub"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}>
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
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
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
      </div>

      {/* Divisor */}
      <div className="lp-divider" />

      {/* ══ PANEL DERECHO — FORMULARIO ══ */}
      <div className="lp-form-panel">
        <div className="lp-form-inner">

          {/* Tabs — solo en login y registro */}
          {tab !== "forgot" && (
            <div className="lp-tabs">
              <button className={`lp-tab ${tab === "login"    ? "active" : ""}`} onClick={() => changeTab("login")}>
                Iniciar Sesión
              </button>
              <button className={`lp-tab ${tab === "register" ? "active" : ""}`} onClick={() => changeTab("register")}>
                Registrarse
              </button>
            </div>
          )}

          <div className="lp-form-card">
            <div className="lp-card-topbar" />

            {/* Alert */}
            <AnimatePresence>
              {alert && (
                <motion.div className={`lp-alert ${alert.type}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}>
                  {alert.type === "success" ? "✅" : "⚠️"} {alert.msg}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">

              {/* ── LOGIN ── */}
              {tab === "login" && (
                <motion.form key="login" onSubmit={handleLogin}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>

                  <h2 className="lp-form-title">Bienvenido de vuelta</h2>
                  <p className="lp-form-sub">Ingresa tus credenciales para continuar</p>

                  <Field
                    label="Usuario" icon={<FaUser />}
                    placeholder="Tu nombre de usuario"
                    value={lUser} onChange={e => setLUser(e.target.value)}
                    error={lErr.user} autoComplete="username"
                  />
                  <Field
                    label="Contraseña" icon={<FaLock />}
                    type={showP ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={lPass} onChange={e => setLPass(e.target.value)}
                    error={lErr.pass} autoComplete="current-password"
                    rightEl={<EyeBtn show={showP} toggle={() => setShowP(v => !v)} />}
                  />

                  <div className="lp-forgot">
                    <button type="button" onClick={() => changeTab("forgot")}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button className="lp-submit-btn" type="submit" disabled={loading}>
                    {loading && <span className="spinner" />}
                    {loading ? "Verificando..." : "Iniciar Sesión →"}
                  </button>

                  <p className="lp-switch">¿No tienes cuenta?{" "}
                    <button type="button" onClick={() => changeTab("register")}>Regístrate</button>
                  </p>
                </motion.form>
              )}

              {/* ── REGISTRO ── */}
              {tab === "register" && (
                <motion.form key="register" onSubmit={handleRegister}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>

                  <h2 className="lp-form-title">Crear cuenta</h2>
                  <p className="lp-form-sub">Completa el formulario para comenzar</p>

                  <Field
                    label="Nombre completo" icon={<FaUser />}
                    placeholder="Tu nombre"
                    value={rName} onChange={e => setRName(e.target.value)}
                    error={rErr.name}
                  />
                  <Field
                    label="Usuario" icon={<FaUser />}
                    placeholder="ej: david_riego"
                    value={rUser} onChange={e => setRUser(e.target.value)}
                    error={rErr.user} autoComplete="username"
                  />
                  <Field
                    label="Email" icon={<FaEnvelope />} type="email"
                    placeholder="tu@email.com"
                    value={rEmail} onChange={e => setREmail(e.target.value)}
                    error={rErr.email} autoComplete="email"
                  />
                  <Field
                    label="Contraseña" icon={<FaLock />}
                    type={showP ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={rPass} onChange={e => setRPass(e.target.value)}
                    error={rErr.pass} autoComplete="new-password"
                    rightEl={<EyeBtn show={showP} toggle={() => setShowP(v => !v)} />}
                  />
                  <Field
                    label="Confirmar contraseña" icon={<FaLock />}
                    type={showP2 ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={rConfirm} onChange={e => setRConfirm(e.target.value)}
                    error={rErr.confirm} autoComplete="new-password"
                    rightEl={<EyeBtn show={showP2} toggle={() => setShowP2(v => !v)} />}
                  />

                  <button className="lp-submit-btn" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                    {loading && <span className="spinner" />}
                    {loading ? "Creando cuenta..." : "Crear Cuenta →"}
                  </button>

                  <p className="lp-switch">¿Ya tienes cuenta?{" "}
                    <button type="button" onClick={() => changeTab("login")}>Inicia sesión</button>
                  </p>
                </motion.form>
              )}

              {/* ── RECUPERAR ── */}
              {tab === "forgot" && (
                <motion.form key="forgot" onSubmit={handleForgot}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>

                  <h2 className="lp-form-title">Recuperar acceso</h2>
                  <p className="lp-form-sub">Te enviaremos instrucciones por email</p>

                  <Field
                    label="Email registrado" icon={<FaEnvelope />} type="email"
                    placeholder="tu@email.com"
                    value={fEmail} onChange={e => setFEmail(e.target.value)}
                    error={fErr} autoComplete="email"
                  />

                  <button className="lp-submit-btn" type="submit" disabled={loading}>
                    {loading && <span className="spinner" />}
                    {loading ? "Enviando..." : "Enviar Instrucciones →"}
                  </button>

                  <p className="lp-switch">
                    <button type="button" onClick={() => changeTab("login")}>← Volver al inicio</button>
                  </p>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;