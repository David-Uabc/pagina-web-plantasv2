// QuickStats — stat cards con gradiente dinámico + contador animado
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Leaf, Droplets, AlertTriangle, BarChart2 } from "lucide-react";

function getHumGradient(pct) {
  if (pct < 20)  return "linear-gradient(135deg, #ef4444, #f87171)";
  if (pct < 40)  return "linear-gradient(135deg, #f59e0b, #fbbf24)";
  if (pct < 70)  return "linear-gradient(135deg, #34d399, #6ee7b7)";
  return               "linear-gradient(135deg, #38bdf8, #60a5fa)";
}

// ── Contador animado que sube desde 0 hasta `to` ──
function AnimatedCounter({ to, unit, gradient, delay = 0 }) {
  const count     = useMotionValue(0);
  const rounded   = useTransform(count, v => Math.round(v));
  const displayRef = useRef(null);

  useEffect(() => {
    // Pequeño delay para que la card aparezca primero
    const timeout = setTimeout(() => {
      const controls = animate(count, to, {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
      });
      return () => controls.stop();
    }, delay * 1000 + 200);

    return () => clearTimeout(timeout);
  }, [to, delay]);

  // Suscribirse al motionValue para actualizar el DOM directamente (más eficiente)
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
      value: total,
      unit: "",
      gradient: "linear-gradient(135deg, #34d399, #6ee7b7)",
      color: "#34d399",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.18)",
      glowColor: "rgba(52,211,153,0.12)",
    },
    {
      Icon: Droplets,
      label: "Regando Ahora",
      value: watering,
      unit: "",
      gradient: watering > 0
        ? "linear-gradient(135deg, #38bdf8, #60a5fa)"
        : "linear-gradient(135deg, #4a5568, #6b7280)",
      color: watering > 0 ? "#60a5fa" : "#6b7280",
      bg: watering > 0 ? "rgba(96,165,250,0.08)" : "rgba(255,255,255,0.03)",
      border: watering > 0 ? "rgba(96,165,250,0.18)" : "rgba(255,255,255,0.07)",
      glowColor: "rgba(96,165,250,0.10)",
    },
    {
      Icon: AlertTriangle,
      label: "Alertas Activas",
      value: alerts,
      unit: "",
      gradient: alerts > 0
        ? "linear-gradient(135deg, #ef4444, #f87171)"
        : "linear-gradient(135deg, #34d399, #6ee7b7)",
      color: alerts > 0 ? "#f87171" : "#34d399",
      bg: alerts > 0 ? "rgba(248,113,113,0.08)" : "rgba(52,211,153,0.05)",
      border: alerts > 0 ? "rgba(248,113,113,0.20)" : "rgba(52,211,153,0.12)",
      glowColor: alerts > 0 ? "rgba(248,113,113,0.12)" : "rgba(52,211,153,0.08)",
    },
    {
      Icon: BarChart2,
      label: "Humedad Promedio",
      value: avgHum,
      unit: "%",
      gradient: getHumGradient(avgHum),
      color: avgHum < 30 ? "#f87171" : avgHum < 50 ? "#fbbf24" : "#34d399",
      bg: "rgba(52,211,153,0.06)",
      border: "rgba(52,211,153,0.15)",
      glowColor: "rgba(52,211,153,0.10)",
    },
  ];

  return (
    <div className="quick-stats">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="stat-card"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          transition={{ duration: 0.42, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          style={{ "--card-glow": s.glowColor }}
        >
          {/* Icono */}
          <div className="stat-icon-wrap" style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            boxShadow: `0 0 16px ${s.glowColor}`,
          }}>
            <s.Icon size={20} color={s.color} strokeWidth={1.8} />
          </div>

          <div className="stat-info">
            {/* ✅ Contador animado en vez de valor estático */}
            <AnimatedCounter
              to={s.value}
              unit={s.unit}
              gradient={s.gradient}
              delay={i * 0.09}
            />
            <span className="stat-label">{s.label}</span>
          </div>

          {/* Barra accent inferior */}
          <div className="stat-accent" style={{ background: s.gradient }} />

          {/* Glow de fondo */}
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "inherit",
            background: `radial-gradient(ellipse 80% 60% at 20% 80%, ${s.glowColor} 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
        </motion.div>
      ))}
    </div>
  );
}

export default QuickStats;