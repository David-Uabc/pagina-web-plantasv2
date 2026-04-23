import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Leaf, Droplets, AlertTriangle, BarChart2 } from "lucide-react";

function getHumGradient(pct) {
  if (pct < 20) return "linear-gradient(135deg, #ef4444, #f87171)";
  if (pct < 40) return "linear-gradient(135deg, #f59e0b, #fbbf24)";
  if (pct < 70) return "linear-gradient(135deg, #34d399, #6ee7b7)";
  return              "linear-gradient(135deg, #38bdf8, #60a5fa)";
}

function AnimatedCounter({ to, unit, gradient, delay = 0 }) {
  const count      = useMotionValue(0);
  const rounded    = useTransform(count, v => Math.round(v));
  const displayRef = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      animate(count, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    }, delay * 1000 + 200);
    return () => clearTimeout(timeout);
  }, [count, to, delay]);

  useEffect(() => {
    return rounded.on("change", v => {
      if (displayRef.current) displayRef.current.textContent = v + unit;
    });
  }, [rounded, unit]);

  return (
    <motion.span
      className="qs-value"
      initial={{ opacity: 0, scale: 0.6, y: 12, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundImage: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        display: "inline-block",
        lineHeight: 1,
      }}
    >
      <span ref={displayRef}>0{unit}</span>
    </motion.span>
  );
}

function QuickStats({ plants }) {
  const [hovered, setHovered] = useState(null);
  const isDark = !document.body.classList.contains("light-mode");

  const total    = plants.length;
  const watering = plants.filter(p => p.valveStatus === true || p.valveStatus === "OPEN").length;
  const alerts   = plants.filter(p => (p.currentHumidity ?? 0) < p.minHumidity).length;
  const avgHum   = total > 0
    ? Math.round(plants.reduce((s, p) => s + (p.currentHumidity || 0), 0) / total)
    : 0;

  const stats = [
    {
      Icon: Leaf,
      label: "Total Plantas",
      sublabel: `${total} registradas`,
      value: total, unit: "",
      gradient: "linear-gradient(135deg, #059669, #34d399)",
      color: "#34d399",
      bg: "rgba(52,211,153,0.06)",
      border: "rgba(52,211,153,0.20)",
      borderHover: "rgba(52,211,153,0.55)",
      glow: "rgba(52,211,153,0.18)",
      iconBg: "rgba(52,211,153,0.12)",
      topLine: "linear-gradient(90deg, #059669, #34d399, #6ee7b7)",
      dot: "#34d399",
      pulse: false,
    },
    {
      Icon: Droplets,
      label: "Regando Ahora",
      sublabel: watering > 0 ? "💧 activo" : "sin riego activo",
      value: watering, unit: "",
      gradient: watering > 0
        ? "linear-gradient(135deg, #0284c7, #38bdf8)"
        : "linear-gradient(135deg, #64748b, #94a3b8)",
      color: watering > 0 ? "#60a5fa" : "#6b7280",
      bg: watering > 0 ? "rgba(56,189,248,0.06)" : "rgba(255,255,255,0.02)",
      border: watering > 0 ? "rgba(96,165,250,0.20)" : "rgba(255,255,255,0.07)",
      borderHover: watering > 0 ? "rgba(96,165,250,0.55)" : "rgba(255,255,255,0.18)",
      glow: watering > 0 ? "rgba(96,165,250,0.18)" : "transparent",
      iconBg: watering > 0 ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.05)",
      topLine: watering > 0
        ? "linear-gradient(90deg, #0284c7, #38bdf8, #7dd3fc)"
        : "linear-gradient(90deg, #475569, #64748b, #94a3b8)",
      dot: watering > 0 ? "#60a5fa" : "#6b7280",
      pulse: watering > 0,
    },
    {
      Icon: AlertTriangle,
      label: "Alertas Activas",
      sublabel: alerts > 0 ? `⚠️ ${alerts} crítica${alerts > 1 ? "s" : ""}` : "✅ todo bien",
      value: alerts, unit: "",
      gradient: alerts > 0
        ? "linear-gradient(135deg, #dc2626, #ef4444)"
        : "linear-gradient(135deg, #059669, #34d399)",
      color: alerts > 0 ? "#f87171" : "#34d399",
      bg: alerts > 0 ? "rgba(248,113,113,0.07)" : "rgba(52,211,153,0.06)",
      border: alerts > 0 ? "rgba(248,113,113,0.22)" : "rgba(52,211,153,0.16)",
      borderHover: alerts > 0 ? "rgba(248,113,113,0.55)" : "rgba(52,211,153,0.45)",
      glow: alerts > 0 ? "rgba(239,68,68,0.20)" : "rgba(52,211,153,0.12)",
      iconBg: alerts > 0 ? "rgba(239,68,68,0.12)" : "rgba(52,211,153,0.12)",
      topLine: alerts > 0
        ? "linear-gradient(90deg, #dc2626, #ef4444, #fca5a5)"
        : "linear-gradient(90deg, #059669, #34d399, #6ee7b7)",
      dot: alerts > 0 ? "#f87171" : "#34d399",
      pulse: alerts > 0,
      urgent: alerts > 0,
    },
    {
      Icon: BarChart2,
      label: "Humedad Promedio",
      sublabel: avgHum < 30 ? "🔴 crítica" : avgHum < 50 ? "🟡 baja" : avgHum < 75 ? "🟢 óptima" : "🔵 alta",
      value: avgHum, unit: "%",
      gradient: getHumGradient(avgHum),
      color: avgHum < 30 ? "#f87171" : avgHum < 50 ? "#fbbf24" : "#34d399",
      bg: "rgba(52,211,153,0.06)",
      border: "rgba(52,211,153,0.18)",
      borderHover: "rgba(52,211,153,0.50)",
      glow: "rgba(52,211,153,0.16)",
      iconBg: "rgba(52,211,153,0.12)",
      topLine: getHumGradient(avgHum),
      dot: avgHum < 30 ? "#f87171" : avgHum < 50 ? "#fbbf24" : "#34d399",
      pulse: false,
    },
  ];

  return (
    <div style={{ padding: "20px 0 0", width: "100%" }}>
      <div className="quick-stats">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className={`stat-card ${s.urgent ? "qs-urgent" : ""}`}
            onHoverStart={() => setHovered(i)}
            onHoverEnd={() => setHovered(null)}
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{ cursor: "default" }}
          >
            <div
              className="stat-card-inner"
              style={{
                background: s.bg,
                border: `1px solid ${hovered === i ? s.borderHover : s.border}`,
                boxShadow: hovered === i
                  ? `0 14px 40px rgba(0,0,0,0.5), 0 0 30px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.10)`
                  : `0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`,
                transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                padding: "18px 18px 16px",
              }}
            >
              {/* Línea de color superior */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: s.topLine,
                borderRadius: "16px 16px 0 0",
                opacity: hovered === i ? 1 : 0.7,
                transition: "opacity 0.3s ease",
              }} />

              {/* Glow de fondo al hover */}
              <motion.div
                style={{
                  position: "absolute", inset: 0,
                  background: `radial-gradient(ellipse 70% 55% at 50% 100%, ${s.glow} 0%, transparent 70%)`,
                  borderRadius: 16,
                  pointerEvents: "none",
                }}
                animate={{ opacity: hovered === i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />

              {/* Header: icono + label */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 10, position: "relative",
              }}>
                {/* Icono con fondo */}
                <motion.div
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: s.iconBg,
                    border: `1px solid ${s.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                  animate={hovered === i ? { scale: 1.12, rotate: -5 } : { scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <s.Icon size={16} color={s.color} strokeWidth={2.2} />
                </motion.div>

                {/* Label + sublabel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    color: "#e2eaf0",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.3,
                  }}>
                    {s.label}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "rgba(180,200,215,0.70)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.2,
                  }}>
                    {s.sublabel}
                  </span>
                </div>

                {/* Dot pulsante si hay actividad */}
                {s.pulse && (
                  <motion.div
                    style={{
                      position: "absolute", top: 0, right: 0,
                      width: 8, height: 8, borderRadius: "50%",
                      background: s.dot,
                      boxShadow: `0 0 8px ${s.dot}`,
                    }}
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </div>

              {/* Valor numérico */}
              <AnimatedCounter
                to={s.value}
                unit={s.unit}
                gradient={s.gradient}
                delay={i * 0.09}
              />

              {/* Barra de progreso — solo humedad */}
              {s.unit === "%" && (
                <div style={{ marginTop: 10 }}>
                  <div style={{
                    height: 3, borderRadius: 99,
                    background: "rgba(255,255,255,0.07)",
                    overflow: "hidden",
                  }}>
                    <motion.div
                      style={{ height: "100%", borderRadius: 99, background: s.topLine }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(s.value, 100)}%` }}
                      transition={{ duration: 1.4, delay: i * 0.09 + 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    marginTop: 4, fontSize: 9, fontWeight: 600,
                    color: "rgba(180,200,215,0.55)",
                  }}>
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              {/* Dots animados — solo cuando hay plantas regando */}
              {s.label === "Regando Ahora" && watering > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {Array.from({ length: Math.min(watering, 5) }).map((_, idx) => (
                    <motion.div
                      key={idx}
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#60a5fa",
                        boxShadow: "0 0 6px rgba(96,165,250,0.6)",
                      }}
                      animate={{ opacity: [1, 0.3, 1], scale: [1, 0.7, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.2 }}
                    />
                  ))}
                  {watering > 5 && (
                    <span style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700 }}>
                      +{watering - 5}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default QuickStats;