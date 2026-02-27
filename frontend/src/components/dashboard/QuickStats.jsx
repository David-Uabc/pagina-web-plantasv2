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

  const isDark = !document.body.classList.contains("light-mode");

  const stats = [
    {
      Icon: Leaf,
      label: "Total Plantas",
      value: total, unit: "",
      gradient: "linear-gradient(135deg, #059669, #34d399)",
      color: isDark ? "#34d399" : "#059669",
      darkBg:     "rgba(5,150,105,0.09)",
      darkBorder: "rgba(52,211,153,0.18)",
      lightBg:     "linear-gradient(145deg, rgba(236,253,245,1) 0%, rgba(209,250,229,0.80) 100%)",
      lightBorder: "rgba(16,185,129,0.25)",
      lightIcon:   "rgba(16,185,129,0.15)",
      glow: "rgba(52,211,153,0.10)",
    },
    {
      Icon: Droplets,
      label: "Regando Ahora",
      value: watering, unit: "",
      gradient: watering > 0
        ? "linear-gradient(135deg, #0284c7, #38bdf8)"
        : "linear-gradient(135deg, #64748b, #94a3b8)",
      color: isDark
        ? (watering > 0 ? "#60a5fa" : "#6b7280")
        : (watering > 0 ? "#0284c7" : "#64748b"),
      darkBg:     watering > 0 ? "rgba(56,189,248,0.09)" : "rgba(255,255,255,0.03)",
      darkBorder: watering > 0 ? "rgba(96,165,250,0.18)" : "rgba(255,255,255,0.07)",
      lightBg:     watering > 0
        ? "linear-gradient(145deg, rgba(239,246,255,1) 0%, rgba(219,234,254,0.80) 100%)"
        : "linear-gradient(145deg, rgba(248,250,252,1) 0%, rgba(241,245,249,0.80) 100%)",
      lightBorder: watering > 0 ? "rgba(59,130,246,0.22)" : "rgba(148,163,184,0.20)",
      lightIcon:   watering > 0 ? "rgba(59,130,246,0.12)" : "rgba(148,163,184,0.12)",
      glow: "rgba(96,165,250,0.09)",
    },
    {
      Icon: AlertTriangle,
      label: "Alertas Activas",
      value: alerts, unit: "",
      gradient: alerts > 0
        ? "linear-gradient(135deg, #dc2626, #ef4444)"
        : "linear-gradient(135deg, #059669, #34d399)",
      color: isDark
        ? (alerts > 0 ? "#f87171" : "#34d399")
        : (alerts > 0 ? "#dc2626" : "#059669"),
      darkBg:     alerts > 0 ? "rgba(248,113,113,0.09)" : "rgba(52,211,153,0.06)",
      darkBorder: alerts > 0 ? "rgba(248,113,113,0.20)" : "rgba(52,211,153,0.14)",
      lightBg:     alerts > 0
        ? "linear-gradient(145deg, rgba(254,242,242,1) 0%, rgba(254,226,226,0.80) 100%)"
        : "linear-gradient(145deg, rgba(236,253,245,1) 0%, rgba(209,250,229,0.80) 100%)",
      lightBorder: alerts > 0 ? "rgba(220,38,38,0.22)" : "rgba(16,185,129,0.22)",
      lightIcon:   alerts > 0 ? "rgba(220,38,38,0.12)" : "rgba(16,185,129,0.12)",
      glow: alerts > 0 ? "rgba(239,68,68,0.09)" : "rgba(52,211,153,0.08)",
    },
    {
      Icon: BarChart2,
      label: "Humedad Promedio",
      value: avgHum, unit: "%",
      gradient: getHumGradient(avgHum),
      color: isDark
        ? (avgHum < 30 ? "#f87171" : avgHum < 50 ? "#fbbf24" : "#34d399")
        : (avgHum < 30 ? "#dc2626" : avgHum < 50 ? "#d97706" : "#059669"),
      darkBg:     "rgba(52,211,153,0.07)",
      darkBorder: "rgba(52,211,153,0.16)",
      lightBg:    avgHum < 30
        ? "linear-gradient(145deg, rgba(254,242,242,1) 0%, rgba(254,226,226,0.80) 100%)"
        : avgHum < 50
        ? "linear-gradient(145deg, rgba(255,251,235,1) 0%, rgba(254,243,199,0.80) 100%)"
        : "linear-gradient(145deg, rgba(236,253,245,1) 0%, rgba(209,250,229,0.80) 100%)",
      lightBorder: avgHum < 30 ? "rgba(220,38,38,0.20)" : avgHum < 50 ? "rgba(217,119,6,0.22)" : "rgba(16,185,129,0.22)",
      lightIcon:   avgHum < 30 ? "rgba(220,38,38,0.12)" : avgHum < 50 ? "rgba(217,119,6,0.12)" : "rgba(16,185,129,0.12)",
      glow: "rgba(52,211,153,0.09)",
    },
  ];

  return (
    <div style={{ padding: "20px 0 0", width: "100%" }}>
      {/* ── 4 stat cards ── */}
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
            <div
              className="stat-card-inner"
              style={{
                background: isDark ? s.darkBg : s.lightBg,
                border: `1px solid ${isDark ? s.darkBorder : s.lightBorder}`,
              }}
            >
              <div className="stat-card-line" style={{ background: s.gradient }} />

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isDark ? "rgba(255,255,255,0.07)" : s.lightIcon,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.60)"}`,
                  boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <s.Icon size={16} color={s.color} strokeWidth={2.2} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.9px",
                  color: isDark ? "rgba(176,190,197,0.80)" : "rgba(40,60,50,0.65)",
                }}>
                  {s.label}
                </span>
              </div>

              <AnimatedCounter to={s.value} unit={s.unit} gradient={s.gradient} delay={i * 0.09} />

              <div className="stat-accent" style={{ background: s.gradient, opacity: isDark ? 0.35 : 0.50 }} />

              <div style={{
                position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
                background: `radial-gradient(ellipse 90% 70% at 10% 90%, ${s.glow} 0%, transparent 65%)`,
              }} />
            </div>
          </motion.div>
        ))}
      </div>


    </div>
  );
}

export default QuickStats;