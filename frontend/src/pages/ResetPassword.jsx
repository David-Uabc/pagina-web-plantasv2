import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../api";

export default function ResetPassword() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const [pass,     setPass]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [alert,    setAlert]    = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pass.length < 6) return setAlert({ type: "error", msg: "Mínimo 6 caracteres" });
    if (pass !== confirm) return setAlert({ type: "error", msg: "Las contraseñas no coinciden" });

    setLoading(true);
    try {
      await api.post(`/api/auth/reset-password/${token}`, { password: pass });
      setAlert({ type: "success", msg: "¡Contraseña actualizada! Redirigiendo..." });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.error || "Token inválido o expirado" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1117" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 16, padding: "40px 32px", width: "100%", maxWidth: 400 }}
      >
        <h2 style={{ color: "#34d399", marginBottom: 8, textAlign: "center" }}>💧 Nueva contraseña</h2>
        <p style={{ color: "#8b949e", textAlign: "center", marginBottom: 24, fontSize: 14 }}>
          Ingresa tu nueva contraseña
        </p>

        {alert && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14,
            background: alert.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)",
            color: alert.type === "error" ? "#f87171" : "#34d399",
            border: `1px solid ${alert.type === "error" ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}`,
          }}>
            {alert.msg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#8b949e", fontSize: 12, display: "block", marginBottom: 6 }}>Nueva contraseña</label>
            <div style={{ position: "relative" }}>
              <FaLock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8b949e" }} />
              <input
                type={showPass ? "text" : "password"}
                value={pass} onChange={e => setPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ width: "100%", padding: "10px 40px", background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, color: "#e2e8f0", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#8b949e", cursor: "pointer" }}>
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#8b949e", fontSize: 12, display: "block", marginBottom: 6 }}>Confirmar contraseña</label>
            <div style={{ position: "relative" }}>
              <FaLock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8b949e" }} />
              <input
                type="password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                style={{ width: "100%", padding: "10px 40px", background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, color: "#e2e8f0", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #34d399, #059669)", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}