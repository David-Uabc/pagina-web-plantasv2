import { motion } from "framer-motion";

function EmptyPlants({ sector, onAdd }) {
  return (
    <div className="empty-state" style={{ gridColumn: "1 / -1" }}>

      {/* ── Glow de fondo ── */}
      <div style={{
        position: "absolute",
        width: 260, height: 260,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)",
        filter: "blur(40px)",
        pointerEvents: "none",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
      }} />

      {/* ── SVG ilustración ── */}
      <div className="empty-illustration" style={{ position: "relative" }}>
        <svg width="190" height="190" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">

          {/* Círculo de fondo sutil */}
          <motion.circle cx="90" cy="105" r="52"
            fill="rgba(52,211,153,0.04)"
            stroke="rgba(52,211,153,0.10)" strokeWidth="1"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
          />

          {/* Maceta */}
          <motion.path
            d="M60 120 L68 150 H112 L120 120 Z"
            fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.35)" strokeWidth="1.5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          />
          <motion.rect
            x="56" y="112" width="68" height="12" rx="4"
            fill="rgba(34,197,94,0.18)" stroke="rgba(34,197,94,0.35)" strokeWidth="1.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />

          {/* Tierra */}
          <motion.ellipse cx="90" cy="114" rx="30" ry="6"
            fill="rgba(34,197,94,0.10)"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          />

          {/* Tallo */}
          <motion.path
            d="M90 112 Q90 90 90 70"
            stroke="rgba(34,197,94,0.5)" strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />

          {/* Hoja izquierda */}
          <motion.path
            d="M90 90 Q70 75 65 55 Q80 65 90 80"
            fill="rgba(34,197,94,0.18)" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0, transformOrigin: "90px 90px" }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5, type: "spring", bounce: 0.4 }}
          />

          {/* Hoja derecha */}
          <motion.path
            d="M90 80 Q110 65 115 45 Q100 58 90 75"
            fill="rgba(34,197,94,0.18)" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0, transformOrigin: "90px 80px" }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, duration: 0.5, type: "spring", bounce: 0.4 }}
          />

          {/* Signo + arriba (en vez de ?) */}
          <motion.text
            x="84" y="56" fontSize="20" fill="rgba(52,211,153,0.5)"
            fontFamily="'Syne', sans-serif" fontWeight="800"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 1, 0.7, 1], y: [8, 0, -2, 0] }}
            transition={{ delay: 1.2, duration: 0.8, times: [0, 0.4, 0.7, 1] }}
          >+</motion.text>

          {/* Gotitas flotantes */}
          {[
            { cx: 44, cy: 88,  r: 4,   delay: 1.4 },
            { cx: 34, cy: 104, r: 3,   delay: 1.65 },
            { cx: 134, cy: 80, r: 3.5, delay: 1.5 },
            { cx: 145, cy: 97, r: 2.5, delay: 1.75 },
            { cx: 52,  cy: 72, r: 2,   delay: 1.9 },
          ].map((d, i) => (
            <motion.circle key={i} cx={d.cx} cy={d.cy} r={d.r}
              fill="rgba(56,189,248,0.40)"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 0.8, 0], y: [0, -14, -22] }}
              transition={{ delay: d.delay, duration: 2.2, repeat: Infinity, repeatDelay: 1.8 }}
            />
          ))}

          {/* Estrellitas decorativas */}
          {[
            { x: 28, y: 55, size: 6, delay: 1.8 },
            { x: 148, y: 62, size: 5, delay: 2.0 },
            { x: 155, y: 130, size: 4, delay: 2.2 },
          ].map((s, i) => (
            <motion.text key={i} x={s.x} y={s.y} fontSize={s.size}
              fill="rgba(52,211,153,0.3)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.6, 0.3], scale: [0, 1.2, 1] }}
              transition={{ delay: s.delay, duration: 1, repeat: Infinity, repeatDelay: 3 }}
            >✦</motion.text>
          ))}
        </svg>
      </div>

      {/* ── Texto ── */}
      <motion.h3 className="empty-title"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}>
        {sector ? `Sector ${sector} vacío` : "Sin plantas aún"}
      </motion.h3>

      <motion.p className="empty-desc"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}>
        Agrega tu primera planta para comenzar a monitorear<br />
        humedad y gestionar riegos automáticos.
      </motion.p>

      {/* ── Features rápidas ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        style={{
          display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", justifyContent: "center",
        }}
      >
        {[
          { icon: "📊", text: "Monitoreo en tiempo real" },
          { icon: "💧", text: "Riego automático" },
          { icon: "🔔", text: "Alertas de humedad" },
        ].map((f, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 99,
            background: "rgba(52,211,153,0.06)",
            border: "1px solid rgba(52,211,153,0.12)",
            fontSize: 12, color: "rgba(180,212,192,0.7)",
          }}>
            <span>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </motion.div>

      {onAdd && (
        <motion.button className="btn-add empty-add-btn"
          onClick={onAdd}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
          whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(52,211,153,0.35)" }}
          whileTap={{ scale: 0.97 }}
        >
          + Añadir primera planta
        </motion.button>
      )}
    </div>
  );
}

export default EmptyPlants;