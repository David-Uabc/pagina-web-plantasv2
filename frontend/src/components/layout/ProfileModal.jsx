import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { X, Camera, Save, Calendar, Droplets, Award, Mail, UserRound } from "lucide-react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

function getDaysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function ProfileModal({ onClose, onUpdate }) {
  const { user } = useAuth();
  const session = user || {};
  const [name, setName] = useState(session.name || session.username || "");
  const [avatar, setAvatar] = useState(session.avatar || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewOk, setPreviewOk] = useState(!!session.avatar);
  const fileRef = useRef(null);

  const initial = name.charAt(0).toUpperCase();
  const joinDate = session.createdAt || session.joinDate || null;
  const daysSince = getDaysSince(joinDate);

  function getAllTimeSummary() {
    let totalIrrig = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("iot_day_summary_")) {
        try {
          const d = JSON.parse(localStorage.getItem(key) || "{}");
          totalIrrig += d.irrigations || 0;
        } catch {}
      }
    }
    return { totalIrrig };
  }

  const { totalIrrig } = getAllTimeSummary();

  const handleSave = async () => {
    setSaving(true);
    try {
      let updated = { ...session, name, avatar };

      try {
        const res = await api.put("/api/auth/me", { name, avatar });
        updated = { ...updated, ...(res.data?.user || {}) };
      } catch {}

      onUpdate?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target?.result || "");
      setPreviewOk(true);
    };
    reader.readAsDataURL(file);
  };

  const stats = [
    { icon: <Calendar size={16} color="#60a5fa" />, label: "Días en el sistema", value: daysSince || "-", color: "#60a5fa" },
    { icon: <Droplets size={16} color="#38bdf8" />, label: "Riegos realizados", value: totalIrrig, color: "#38bdf8" },
    {
      icon: <Award size={16} color="#fbbf24" />,
      label: "Nivel",
      value: totalIrrig > 50 ? "Experto" : totalIrrig > 10 ? "Intermedio" : "Inicial",
      color: "#fbbf24",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.88, y: 32, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%",
            maxWidth: 440,
            background: "rgba(8,14,10,0.97)",
            border: "1px solid rgba(52,211,153,0.18)",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#34d399,#60a5fa,transparent)" }} />

          <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#f0f6fc", fontFamily: "'Syne',sans-serif" }}>Mi perfil</div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.05)",
                color: "#78909c",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ padding: "20px 24px 28px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "linear-gradient(135deg,rgba(52,211,153,0.3),rgba(96,165,250,0.2))",
                    border: "3px solid rgba(52,211,153,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#34d399",
                    fontFamily: "'Syne',sans-serif",
                  }}
                >
                  {avatar && previewOk ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={() => setPreviewOk(false)}
                    />
                  ) : (
                    initial
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "2px solid rgba(8,14,10,0.9)",
                    background: "linear-gradient(135deg,#059669,#34d399)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Camera size={13} color="#000" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
              </div>
              <div style={{ fontSize: 13, color: "#4d7a5e" }}>Toca el icono de cámara para cambiar tu foto</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: "#78909c",
                  marginBottom: 7,
                }}
              >
                Nombre visible
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 11,
                  border: "1px solid rgba(52,211,153,0.22)",
                  background: "rgba(52,211,153,0.05)",
                  color: "#f0f6fc",
                  fontSize: 14,
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                marginBottom: 16,
                background: "rgba(52,211,153,0.04)",
                border: "1px solid rgba(52,211,153,0.10)",
              }}
            >
              {[
                { icon: <UserRound size={14} color="#34d399" />, label: "Usuario", value: session.username || "-" },
                { icon: <Mail size={14} color="#60a5fa" />, label: "Correo", value: session.email || "-" },
              ].map((row, index) => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: index === 0 ? 8 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8fb3a0", fontSize: 12 }}>
                    {row.icon}
                    <span>{row.label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, textAlign: "right" }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 14,
                    textAlign: "center",
                    background: `${s.color}0d`,
                    border: `1px solid ${s.color}20`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "'Syne',sans-serif", marginBottom: 3 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 9, color: "#78909c", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                marginBottom: 20,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: 11, color: "#78909c", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 }}>
                Información de cuenta
              </div>
              {[
                {
                  label: "Miembro desde",
                  value: joinDate ? new Date(joinDate).toLocaleDateString("es-MX", { year: "numeric", month: "long" }) : "-",
                },
                { label: "Rol", value: session.role || "admin" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#78909c" }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: "#b0bec5", fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={handleSave}
              disabled={saving}
              whileTap={{ scale: 0.97 }}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg,#059669,#34d399)",
                color: "#fff",
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: 15,
                boxShadow: "0 4px 20px rgba(52,211,153,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saved ? "✓ Guardado" : <><Save size={16} /> Guardar cambios</>}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
