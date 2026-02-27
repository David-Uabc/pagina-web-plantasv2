import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
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
      const controls = animate(count, to, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
      return () => controls.stop();
    }, delay * 1000 + 200);
    return () => clearTimeout(timeout);
  }, [to, delay]);

  useEffect(() => {
    return rounded.on("change", v => {
      if (displayRef.current) displayRef.current.textContent = v + unit;
    });
  }, [rounded, unit]);

  return (
    <motion.span
      className="stat-value"
      initial={{ opacity: 0, scale: 0.7, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1,   filter: "blur(0px)" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundImage: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        display: "inline-block",
      }}
    >
      <span ref={displayRef}>0{unit}</span>
    </motion.span>
  );
}

function QuickStats({ plants }) {
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
      value: total, unit: "",
      gradient: "linear-gradient(135deg, #34d399, #6ee7b7)",
      color: "#34d399",
      lightBg:    "rgba(52,211,153,0.08)",
      lightBorder:"rgba(52,211,153,0.20)",
      lightLine:  "linear-gradient(135deg, #34d399, #6ee7b7)",
      darkBg:     "rgba(52,211,153,0.07)",
      darkBorder: "rgba(52,211,153,0.16)",
      glow: "rgba(52,211,153,0.10)",
    },
    {
      Icon: Droplets,
      label: "Regando Ahora",
      value: watering, unit: "",
      gradient: watering > 0
        ? "linear-gradient(135deg, #38bdf8, #60a5fa)"
        : "linear-gradient(135deg, #94a3b8, #cbd5e1)",
      color: watering > 0 ? "#60a5fa" : "#94a3b8",
      lightBg:    watering > 0 ? "rgba(96,165,250,0.08)"  : "rgba(148,163,184,0.06)",
      lightBorder:watering > 0 ? "rgba(96,165,250,0.22)"  : "rgba(148,163,184,0.18)",
      lightLine:  watering > 0 ? "linear-gradient(135deg, #38bdf8, #60a5fa)" : "linear-gradient(135deg, #94a3b8, #cbd5e1)",
      darkBg:     watering > 0 ? "rgba(96,165,250,0.07)"  : "rgba(255,255,255,0.03)",
      darkBorder: watering > 0 ? "rgba(96,165,250,0.16)"  : "rgba(255,255,255,0.07)",
      glow: "rgba(96,165,250,0.09)",
    },
    {
      Icon: AlertTriangle,
      label: "Alertas Activas",
      value: alerts, unit: "",
      gradient: alerts > 0
        ? "linear-gradient(135deg, #ef4444, #f87171)"
        : "linear-gradient(135deg, #34d399, #6ee7b7)",
      color: alerts > 0 ? "#ef4444" : "#34d399",
      lightBg:    alerts > 0 ? "rgba(239,68,68,0.07)"   : "rgba(52,211,153,0.06)",
      lightBorder:alerts > 0 ? "rgba(239,68,68,0.22)"   : "rgba(52,211,153,0.18)",
      lightLine:  alerts > 0 ? "linear-gradient(135deg,#ef4444,#f87171)" : "linear-gradient(135deg,#34d399,#6ee7b7)",
      darkBg:     alerts > 0 ? "rgba(248,113,113,0.07)" : "rgba(52,211,153,0.05)",
      darkBorder: alerts > 0 ? "rgba(248,113,113,0.18)" : "rgba(52,211,153,0.12)",
      glow: alerts > 0 ? "rgba(239,68,68,0.09)" : "rgba(52,211,153,0.08)",
    },
    {
      Icon: BarChart2,
      label: "Humedad Promedio",
      value: avgHum, unit: "%",
      gradient: getHumGradient(avgHum),
      color: avgHum < 30 ? "#ef4444" : avgHum < 50 ? "#f59e0b" : "#34d399",
      lightBg:    "rgba(52,211,153,0.07)",
      lightBorder:"rgba(52,211,153,0.20)",
      lightLine:  getHumGradient(avgHum),
      darkBg:     "rgba(52,211,153,0.06)",
      darkBorder: "rgba(52,211,153,0.14)",
      glow: "rgba(52,211,153,0.09)",
    },
  ];

  const isDark = !document.body.classList.contains("light-mode");

  return (
    <div className="quick-stats">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="stat-card"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          transition={{ duration: 0.42, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4, transition: { duration: 0.18 } }}
        >
          <div className="stat-card-inner" style={{
            /* ✅ Fondo adaptivo según modo */
            background: isDark
              ? `${s.darkBg}`
              : `${s.lightBg}`,
            border: `1px solid ${isDark ? s.darkBorder : s.lightBorder}`,
            backdropFilter: isDark ? "blur(20px)" : "blur(12px)",
            WebkitBackdropFilter: isDark ? "blur(20px)" : "blur(12px)",
            boxShadow: isDark
              ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`
              : `0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.80)`,
          }}>

            {/* Línea top color */}
            <div className="stat-card-line" style={{ background: s.lightLine }} />

            {/* Icono + label */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isDark ? `rgba(255,255,255,0.06)` : `rgba(255,255,255,0.70)`,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.90)"}`,
                boxShadow: isDark ? "none" : `0 2px 8px rgba(0,0,0,0.08)`,
                flexShrink: 0,
              }}>
                <s.Icon size={16} color={s.color} strokeWidth={2} />
              </div>
              <span className="stat-label" style={{
                color: isDark ? "rgba(176,190,197,0.85)" : "rgba(60,80,70,0.75)",
                fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.8px",
              }}>
                {s.label}
              </span>
            </div>

            {/* Número */}
            <AnimatedCounter
              to={s.value}
              unit={s.unit}
              gradient={s.gradient}
              delay={i * 0.09}
            />

            {/* Accent bottom */}
            <div className="stat-accent" style={{ background: s.lightLine, opacity: isDark ? 0.4 : 0.6 }} />

            {/* Glow radial de fondo */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
              background: `radial-gradient(ellipse 90% 70% at 10% 90%, ${s.glow} 0%, transparent 65%)`,
            }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default QuickStats;