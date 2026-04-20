// components/ExportButton.jsx
// Botón de exportación rápida desde el dashboard
// Exporta todas las plantas a CSV o una planta específica
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.REACT_APP_API_URL || "https://riego-iot-backend.onrender.com";

export default function ExportButton({ plantId = null, plantName = "" }) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

  const exportar = async (tipo, dias) => {
    setLoading(true);
    try {
      let url;
      if (tipo === "planta" && plantId) {
        url = `${API}/api/plants/${plantId}/export/csv?days=${dias}`;
      } else {
        url = `${API}/api/plants/export/csv/all?days=${dias}`;
      }

      // Descargar el CSV con el token de autenticación
      const token = window._accessToken || "";
      const res   = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al exportar");

      // Crear enlace de descarga
      const blob     = await res.blob();
      const blobUrl  = window.URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href         = blobUrl;
      a.download     = `riegoiq_${plantName || "general"}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

    } catch (err) {
      console.error("Error exportando:", err);
      alert("No se pudo exportar el archivo. Intenta de nuevo.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const opciones = plantId ? [
    { label: `📊 ${plantName} — últimos 7 días`,  action: () => exportar("planta", 7)  },
    { label: `📊 ${plantName} — últimos 30 días`, action: () => exportar("planta", 30) },
    { label: `📊 ${plantName} — últimos 90 días`, action: () => exportar("planta", 90) },
    null, // separador
    { label: "📋 Todas las plantas — 7 días",  action: () => exportar("all", 7)  },
    { label: "📋 Todas las plantas — 30 días", action: () => exportar("all", 30) },
  ] : [
    { label: "📋 Todas las plantas — últimos 7 días",  action: () => exportar("all", 7)  },
    { label: "📋 Todas las plantas — últimos 30 días", action: () => exportar("all", 30) },
    { label: "📋 Todas las plantas — últimos 90 días", action: () => exportar("all", 90) },
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        style={{
          padding: "9px 16px", borderRadius: 11, fontSize: 13, fontWeight: 700,
          border: "1px solid rgba(96,165,250,0.3)",
          background: open ? "rgba(96,165,250,0.14)" : "rgba(96,165,250,0.08)",
          color: "#60a5fa", cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 7,
          transition: "all 0.18s",
        }}
      >
        {loading ? (
          <div style={spinnerStyle} />
        ) : (
          <span style={{ fontSize: 15 }}>📥</span>
        )}
        {loading ? "Exportando..." : "Exportar CSV"}
        {!loading && <span style={{ fontSize: 10, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 999,
              background: "rgba(6,12,8,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, overflow: "hidden",
              boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
              minWidth: 280,
            }}
          >
            <div style={{ padding: "10px 14px 6px", fontSize: 10, fontWeight: 700, color: "#4d7a5e", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              Selecciona el período
            </div>
            {opciones.map((opt, i) =>
              opt === null ? (
                <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
              ) : (
                <button key={i} onClick={opt.action} style={{
                  width: "100%", padding: "11px 16px", textAlign: "left",
                  background: "transparent", border: "none",
                  color: "#b0bec5", fontSize: 13, fontWeight: 500,
                  cursor: "pointer", transition: "background 0.15s",
                  fontFamily: "'Inter',sans-serif",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(96,165,250,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {opt.label}
                </button>
              )
            )}
            <div style={{ padding: "8px 14px", fontSize: 11, color: "#3d5444", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              📌 Se descarga como archivo .csv — ábrelo en Excel o Google Sheets
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const spinnerStyle = {
  width: 14, height: 14, borderRadius: "50%",
  border: "2px solid rgba(96,165,250,0.3)",
  borderTopColor: "#60a5fa",
  animation: "spin 0.7s linear infinite",
  flexShrink: 0,
};