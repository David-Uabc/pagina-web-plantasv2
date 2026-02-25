import { motion } from "framer-motion";

function EmptyPlants({ sector, onAdd }) {
  return (
    <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
      {/* SVG ilustración animada */}
      <div className="empty-illustration">
        <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Maceta */}
          <motion.path
            d="M60 120 L68 150 H112 L120 120 Z"
            fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          />
          <motion.rect
            x="56" y="112" width="68" height="12" rx="4"
            fill="rgba(34,197,94,0.2)" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />

          {/* Tierra */}
          <motion.ellipse
            cx="90" cy="114" rx="30" ry="6"
            fill="rgba(34,197,94,0.12)"
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
            fill="rgba(34,197,94,0.2)" stroke="rgba(34,197,94,0.45)" strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0, transformOrigin: "90px 90px" }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5, type: "spring", bounce: 0.4 }}
          />

          {/* Hoja derecha */}
          <motion.path
            d="M90 80 Q110 65 115 45 Q100 58 90 75"
            fill="rgba(34,197,94,0.2)" stroke="rgba(34,197,94,0.45)" strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0, transformOrigin: "90px 80px" }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, duration: 0.5, type: "spring", bounce: 0.4 }}
          />

          {/* Punto de interrogación arriba */}
          <motion.text
            x="82" y="58" fontSize="22" fill="rgba(34,197,94,0.4)"
            fontFamily="serif" fontWeight="bold"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: [0, 1, 0.6, 1], y: [8, 0, -2, 0] }}
            transition={{ delay: 1.2, duration: 0.8, times: [0, 0.4, 0.7, 1] }}
          >?</motion.text>

          {/* Gotitas flotantes */}
          {[
            { cx: 48, cy: 85, r: 4, delay: 1.4 },
            { cx: 38, cy: 100, r: 3, delay: 1.6 },
            { cx: 132, cy: 78, r: 3.5, delay: 1.5 },
            { cx: 142, cy: 95, r: 2.5, delay: 1.7 },
          ].map((d, i) => (
            <motion.circle key={i} cx={d.cx} cy={d.cy} r={d.r}
              fill="rgba(56,189,248,0.35)"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 0.7, 0], y: [0, -12, -20] }}
              transition={{ delay: d.delay, duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
            />
          ))}
        </svg>
      </div>

      <motion.h3 className="empty-title"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}>
        Sin plantas en {sector ? `Sector ${sector}` : "este sector"}
      </motion.h3>

      <motion.p className="empty-desc"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}>
        Agrega tu primera planta para comenzar a monitorear<br />humedad y gestionar riegos automáticos.
      </motion.p>

      {onAdd && (
        <motion.button className="btn-add empty-add-btn"
          onClick={onAdd}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          + Añadir primera planta
        </motion.button>
      )}
    </div>
  );
}

export default EmptyPlants;