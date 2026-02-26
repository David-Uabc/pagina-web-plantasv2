import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import api from "../api";

export default function ResetPassword() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const [pass,     setPass]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [alert,    setAlert]    = useState(null);
  const [success,  setSuccess]  = useState(false);

  // Fuerza de contraseña
  const strength = !pass ? 0 : pass.length < 6 ? 1 : pass.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Débil", "Media", "Fuerte"];
  const strengthColor = ["", "#f87171", "#fbbf24", "#34d399"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pass.length < 6) return setAlert("Mínimo 6 caracteres");
    if (pass !== confirm) return setAlert("Las contraseñas no coinciden");
    setAlert(null);
    setLoading(true);
    try {
      await api.post(`/api/auth/reset-password/${token}`, { password: pass });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setAlert(err.response?.data?.error || "Token inválido o expirado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#080a0e", padding: 16,
      position: "relative", overflow: "hidden",
    }}>
      {/* Orbs de fondo */}
      <div style={{
        position: "absolute", width: 500, height: 500,
        top: -150, left: -150, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(52,211,153,0.10) 0%, transparent 65%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400,
        bottom: -100, right: -100, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 65%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%", maxWidth: 420,
          background: "rgba(8,14,10,0.97)",
          border: "1px solid rgba(52,211,153,0.15)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
          position: "relative",
        }}
      >
        {/* Top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, #34d399, #60a5fa, transparent)",
        }} />

        <div style={{ padding: "36px 32px" }}>

          <AnimatePresence mode="wait">
            {/* ── SUCCESS STATE ── */}
            {success ? (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "20px 0" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  style={{ fontSize: 64, marginBottom: 20 }}
                >
                  ✅
                </motion.div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 22, fontWeight: 800, color: "#f0f6fc", marginBottom: 8,
                }}>¡Contraseña actualizada!</div>
                <div style={{ fontSize: 14, color: "#78909c", marginBottom: 24 }}>
                  Redirigiendo al inicio de sesión...
                </div>
                <div style={{
                  width: "100%", height: 4, background: "rgba(255,255,255,0.06)",
                  borderRadius: 99, overflow: "hidden",
                }}>
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "linear" }}
                    style={{ height: "100%", background: "linear-gradient(90deg, #34d399, #60a5fa)", borderRadius: 99 }}
                  />
                </div>
              </motion.div>
            ) : (
              /* ── FORM STATE ── */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* Logo + título */}
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 16, margin: "0 auto 16px",
                    background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(96,165,250,0.15))",
                    border: "1px solid rgba(52,211,153,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28,
                  }}>💧</div>
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 22, fontWeight: 800, color: "#f0f6fc", marginBottom: 6,
                  }}>Nueva contraseña</div>
                  <div style={{ fontSize: 13, color: "#78909c", lineHeight: 1.5 }}>
                    Elige una contraseña segura para tu cuenta
                  </div>
                </div>

                {/* Alert */}
                <AnimatePresence>
                  {alert && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        padding: "11px 14px", borderRadius: 10, marginBottom: 16,
                        fontSize: 13, fontWeight: 500,
                        background: "rgba(248,113,113,0.10)",
                        border: "1px solid rgba(248,113,113,0.25)",
                        color: "#f87171",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      ⚠️ {alert}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>

                  {/* Nueva contraseña */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Nueva contraseña</label>
                    <div style={{ position: "relative" }}>
                      <FaLock style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#78909c", fontSize: 13 }} />
                      <input
                        type={showPass ? "text" : "password"}
                        value={pass}
                        onChange={e => { setPass(e.target.value); setAlert(null); }}
                        placeholder="Mínimo 6 caracteres"
                        style={inputStyle}
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)} style={eyeStyle}>
                        {showPass ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    {/* Barra de fuerza */}
                    {pass && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                          {[1,2,3].map(i => (
                            <div key={i} style={{
                              flex: 1, height: 4, borderRadius: 99,
                              background: i <= strength ? strengthColor[strength] : "rgba(255,255,255,0.06)",
                              transition: "background 0.3s ease",
                            }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: strengthColor[strength], fontWeight: 600 }}>
                          {strengthLabel[strength]}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Confirmar */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Confirmar contraseña</label>
                    <div style={{ position: "relative" }}>
                      <FaLock style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#78909c", fontSize: 13 }} />
                      <input
                        type={showConf ? "text" : "password"}
                        value={confirm}
                        onChange={e => { setConfirm(e.target.value); setAlert(null); }}
                        placeholder="Repite la contraseña"
                        style={{
                          ...inputStyle,
                          borderColor: confirm && pass !== confirm
                            ? "rgba(248,113,113,0.4)"
                            : confirm && pass === confirm
                            ? "rgba(52,211,153,0.4)"
                            : "rgba(255,255,255,0.08)",
                        }}
                      />
                      <button type="button" onClick={() => setShowConf(v => !v)} style={eyeStyle}>
                        {showConf ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      {/* Check si coinciden */}
                      {confirm && pass === confirm && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          style={{ position: "absolute", right: 38, top: "50%", transform: "translateY(-50%)", color: "#34d399", fontSize: 14 }}>
                          <FaCheckCircle />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <button type="submit" disabled={loading} style={{
                    width: "100%", padding: "13px",
                    borderRadius: 12, border: "none",
                    background: loading ? "rgba(52,211,153,0.3)" : "linear-gradient(135deg, #059669, #34d399)",
                    color: loading ? "#78909c" : "#fff",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700, fontSize: 15,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 4px 20px rgba(52,211,153,0.30)",
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {loading ? (
                      <>
                        <div style={{
                          width: 16, height: 16, borderRadius: "50%",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                          animation: "spin 0.7s linear infinite",
                        }} />
                        Actualizando...
                      </>
                    ) : "Actualizar contraseña"}
                  </button>

                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    <button type="button" onClick={() => navigate("/login")}
                      style={{ background: "none", border: "none", color: "#34d399", fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      ← Volver al inicio de sesión
                    </button>
                  </div>

                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.8px",
  color: "#78909c", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "11px 40px 11px 38px",
  borderRadius: 11, border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)", color: "#f0f6fc",
  fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s, background 0.2s",
};

const eyeStyle = {
  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", color: "#78909c",
  cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center",
};