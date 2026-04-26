import { memo, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useTransform, animate } from "framer-motion";
import { Leaf, Droplets, AlertTriangle, BarChart2 } from "lucide-react";

function getHumGradient(pct) {
  if (pct < 20) return "linear-gradient(135deg, #ef4444, #f87171)";
  if (pct < 40) return "linear-gradient(135deg, #f59e0b, #fbbf24)";
  if (pct < 70) return "linear-gradient(135deg, #34d399, #6ee7b7)";
  return "linear-gradient(135deg, #38bdf8, #60a5fa)";
}

function AnimatedCounter({ to, unit, gradient, delay = 0, reducedMotion = false }) {
  const count = useMotionValue(reducedMotion ? to : 0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const displayRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) {
      if (displayRef.current) displayRef.current.textContent = `${to}${unit}`;
      return undefined;
    }

    const timeout = setTimeout(() => {
      animate(count, to, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    }, delay * 1000 + 120);

    return () => clearTimeout(timeout);
  }, [count, delay, reducedMotion, to, unit]);

  useEffect(() => rounded.on("change", (v) => {
    if (displayRef.current) displayRef.current.textContent = `${v}${unit}`;
  }), [rounded, unit]);

  return (
    <motion.span
      className="qs-value"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.82, y: 8 }}
      animate={reducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundImage: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        display: "inline-block",
        lineHeight: 1,
      }}
    >
      <span ref={displayRef}>{reducedMotion ? `${to}${unit}` : `0${unit}`}</span>
    </motion.span>
  );
}

function QuickStats({ plants }) {
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(null);
  const [isTouch, setIsTouch] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  ));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(pointer: coarse)");
    const sync = () => setIsTouch(media.matches);
    sync();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  const interactive = !prefersReducedMotion && !isTouch;

  const total = plants.length;
  const watering = plants.filter((p) => p.valveStatus === true || p.valveStatus === "OPEN").length;
  const alerts = plants.filter((p) => (p.currentHumidity ?? 0) < p.minHumidity).length;
  const avgHum = total > 0
    ? Math.round(plants.reduce((s, p) => s + (p.currentHumidity || 0), 0) / total)
    : 0;

  const stats = [
    {
      Icon: Leaf,
      label: "Total Plantas",
      sublabel: `${total} registradas`,
      value: total,
      unit: "",
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
      sublabel: watering > 0 ? "\uD83D\uDCA7 activo" : "sin riego activo",
      value: watering,
      unit: "",
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
      sublabel: alerts > 0 ? `\u26A0\uFE0F ${alerts} cr\u00EDtica${alerts > 1 ? "s" : ""}` : "\u2705 todo bien",
      value: alerts,
      unit: "",
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
      sublabel: avgHum < 30 ? "\uD83D\uDD34 cr\u00EDtica" : avgHum < 50 ? "\uD83D\uDFE1 baja" : avgHum < 75 ? "\uD83D\uDFE2 \u00F3ptima" : "\uD83D\uDD35 alta",
      value: avgHum,
      unit: "%",
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
        {stats.map((s, i) => {
          const isHovered = hovered === i;
          return (
            <motion.div
              key={s.label}
              className={`stat-card ${s.urgent ? "qs-urgent" : ""}`}
              onHoverStart={interactive ? () => setHovered(i) : undefined}
              onHoverEnd={interactive ? () => setHovered(null) : undefined}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.38, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              whileHover={interactive ? { y: -4, scale: 1.01 } : undefined}
              whileTap={interactive ? { scale: 0.99 } : undefined}
              style={{ cursor: "default" }}
            >
              <div
                className="stat-card-inner"
                style={{
                  background: s.bg,
                  border: `1px solid ${interactive && isHovered ? s.borderHover : s.border}`,
                  boxShadow: interactive && isHovered
                    ? `0 14px 34px rgba(0,0,0,0.42), 0 0 24px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.10)`
                    : `0 4px 18px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)`,
                  transition: interactive ? "all 0.24s ease" : "border-color 0.2s ease, box-shadow 0.2s ease",
                  padding: "18px 18px 16px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: s.topLine,
                    borderRadius: "16px 16px 0 0",
                    opacity: interactive && isHovered ? 1 : 0.78,
                    transition: "opacity 0.24s ease",
                  }}
                />

                {!prefersReducedMotion && (
                  <motion.div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `radial-gradient(ellipse 70% 55% at 50% 100%, ${s.glow} 0%, transparent 70%)`,
                      borderRadius: 16,
                      pointerEvents: "none",
                    }}
                    animate={{ opacity: interactive && isHovered ? 1 : 0 }}
                    transition={{ duration: 0.24 }}
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                    position: "relative",
                  }}
                >
                  <motion.div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: s.iconBg,
                      border: `1px solid ${s.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                    animate={interactive && isHovered ? { scale: 1.08, rotate: -4 } : { scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  >
                    <s.Icon size={16} color={s.color} strokeWidth={2.2} />
                  </motion.div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        color: "#e2eaf0",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.3,
                      }}
                    >
                      {s.label}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: "rgba(180,200,215,0.70)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.2,
                      }}
                    >
                      {s.sublabel}
                    </span>
                  </div>

                  {s.pulse && !prefersReducedMotion && (
                    <motion.div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: s.dot,
                        boxShadow: `0 0 8px ${s.dot}`,
                      }}
                      animate={{ scale: [1, 1.45, 1], opacity: [1, 0.45, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>

                <AnimatedCounter
                  to={s.value}
                  unit={s.unit}
                  gradient={s.gradient}
                  delay={i * 0.05}
                  reducedMotion={Boolean(prefersReducedMotion || isTouch)}
                />

                {s.unit === "%" && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        height: 3,
                        borderRadius: 99,
                        background: "rgba(255,255,255,0.07)",
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        style={{ height: "100%", borderRadius: 99, background: s.topLine }}
                        initial={prefersReducedMotion ? false : { width: 0 }}
                        animate={{ width: `${Math.min(s.value, 100)}%` }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: i * 0.04 + 0.16, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 4,
                        fontSize: 9,
                        fontWeight: 600,
                        color: "rgba(180,200,215,0.55)",
                      }}
                    >
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {s.label === "Regando Ahora" && watering > 0 && !prefersReducedMotion && (
                  <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {Array.from({ length: Math.min(watering, isTouch ? 3 : 5) }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#60a5fa",
                          boxShadow: "0 0 6px rgba(96,165,250,0.6)",
                        }}
                        animate={{ opacity: [1, 0.35, 1], scale: [1, 0.78, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.2 }}
                      />
                    ))}
                    {watering > (isTouch ? 3 : 5) && (
                      <span style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700 }}>
                        +{watering - (isTouch ? 3 : 5)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(QuickStats);
