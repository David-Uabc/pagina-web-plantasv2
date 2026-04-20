import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Partículas flotantes
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i, x: (i * 8.3) + Math.sin(i) * 5, y: (i * 7.5) + Math.cos(i) * 4,
  size: 2 + (i % 3), dur: 6 + (i % 4) * 2, delay: (i % 5) * 0.8,
}));

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-page" style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#080a0e", position: "relative", overflow: "hidden",
    }}>
      {/* Partículas */}
      {PARTICLES.map(p => (
        <motion.div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: "rgba(52,211,153,0.4)",
          pointerEvents: "none",
        }}
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Orbs */}
      <div style={{
        position: "absolute", width: 500, height: 500, top: -150, left: -150,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 65%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, bottom: -100, right: -100,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 65%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div style={{ textAlign: "center", position: "relative", zIndex: 1, padding: "0 20px" }}>

        {/* Planta triste */}
        <motion.div
          animate={{ rotate: [-4, 4, -4], y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: 80, marginBottom: 8, display: "inline-block" }}
        >🥀</motion.div>

        {/* 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(80px, 18vw, 140px)",
            fontWeight: 800, lineHeight: 1,
            backgroundImage: "linear-gradient(135deg, #34d399, #60a5fa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", marginBottom: 8,
          }}
        >404</motion.div>

        {/* Top accent line sobre el card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{
            background: "rgba(8,14,10,0.97)",
            border: "1px solid rgba(52,211,153,0.15)",
            borderRadius: 24, padding: "28px 36px",
            maxWidth: 460, margin: "0 auto",
            position: "relative", overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
            {/* Accent top */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, transparent, #34d399, #60a5fa, transparent)",
            }} />

            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20, fontWeight: 800, color: "#f0f6fc", marginBottom: 10,
            }}>Página no encontrada</div>

            <p style={{ fontSize: 14, color: "#78909c", lineHeight: 1.6, marginBottom: 24 }}>
              Parece que esta planta no existe en nuestro sistema.<br />
              Vuelve al dashboard para ver tus cultivos.
            </p>

            {/* Botones */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
              <motion.button
                onClick={() => navigate("/")}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: "12px 24px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #059669, #34d399)",
                  color: "#fff", fontFamily: "'Syne', sans-serif",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(52,211,153,0.30)",
                }}
              >🌿 Volver al Dashboard</motion.button>

              <motion.button
                onClick={() => navigate(-1)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: "12px 24px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#b0bec5", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >← Página anterior</motion.button>
            </div>

            {/* Código decorativo */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10, padding: "12px 16px", textAlign: "left",
                fontFamily: "monospace", fontSize: 13, lineHeight: 1.7,
              }}
            >
              <div>
                <span style={{ color: "#78909c" }}>{"// "}</span>
                <span style={{ color: "#34d399" }}>plant</span>
                <span style={{ color: "#b0bec5" }}>.findById(</span>
                <span style={{ color: "#fbbf24" }}>this_page</span>
                <span style={{ color: "#b0bec5" }}>)</span>
              </div>
              <div>
                <span style={{ color: "#f87171" }}>→ null </span>
                <span style={{ color: "#78909c" }}>{"// no encontrado"}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default NotFound;
