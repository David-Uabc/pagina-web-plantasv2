import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * HumidityGauge — medidor circular tipo velocímetro
 * Props: value (0-100), min, max, size (px), color
 */
export default function HumidityGauge({ value = 0, min = 30, max = 70, size = 110, color = "#34d399" }) {
  const clampedValue = Math.min(100, Math.max(0, value));

  // Arco: 240° de barrido (empieza en 150° = abajo-izquierda)
  const SWEEP    = 240;
  const START_DEG = 150;
  const R  = 42;
  const CX = 56;
  const CY = 58;
  const strokeW = 6;

  const deg2rad = d => (d * Math.PI) / 180;

  // Calcula punto en el arco
  const arcPoint = (deg) => {
    const rad = deg2rad(deg);
    return {
      x: CX + R * Math.cos(rad),
      y: CY + R * Math.sin(rad),
    };
  };

  // Path del arco completo (background)
  const describeArc = (startDeg, sweepDeg) => {
    const endDeg  = startDeg + sweepDeg;
    const start   = arcPoint(startDeg);
    const end     = arcPoint(endDeg);
    const large   = sweepDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  // Progreso actual
  const progressSweep = (clampedValue / 100) * SWEEP;

  // Color dinámico según valor vs min/max
  const getColor = () => {
    if (clampedValue < min)       return "#f87171"; // crítico
    if (clampedValue < min + 10)  return "#fbbf24"; // bajo
    if (clampedValue > max)       return "#60a5fa"; // alto
    return "#34d399";                               // óptimo
  };
  const dynColor = getColor();

  // Tick marks
  const TICKS = 10;
  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => {
    const pct     = i / TICKS;
    const deg     = START_DEG + pct * SWEEP;
    const rad     = deg2rad(deg);
    const isMajor = i % 2 === 0;
    const inner   = 33;
    const outerR  = isMajor ? 43 : 40;
    return {
      x1: CX + inner * Math.cos(rad),
      y1: CY + inner * Math.sin(rad),
      x2: CX + outerR * Math.cos(rad),
      y2: CY + outerR * Math.sin(rad),
      isMajor,
    };
  });

  // Aguja: parte desde el centro, apunta al valor
  const needleDeg = START_DEG + (clampedValue / 100) * SWEEP;
  const needleRad = deg2rad(needleDeg);
  const needleLen = 32;
  const needleX   = CX + needleLen * Math.cos(needleRad);
  const needleY   = CY + needleLen * Math.sin(needleRad);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg
        width={size}
        height={size * 0.88}
        viewBox="0 0 112 100"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Gradiente del arco de progreso */}
          <linearGradient id={`gauge-grad-${value}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={dynColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={dynColor} />
          </linearGradient>

          {/* Glow filter */}
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glow para aguja */}
          <filter id="needle-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Track background ── */}
        <path
          d={describeArc(START_DEG, SWEEP)}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* ── Zona óptima (min-max) en el track ── */}
        <path
          d={describeArc(
            START_DEG + (min / 100) * SWEEP,
            ((max - min) / 100) * SWEEP
          )}
          fill="none"
          stroke="rgba(52,211,153,0.20)"
          strokeWidth={strokeW + 2}
          strokeLinecap="round"
        />

        {/* ── Arco de progreso animado ── */}
        {progressSweep > 0 && (
          <motion.path
            d={describeArc(START_DEG, progressSweep)}
            fill="none"
            stroke={`url(#gauge-grad-${value})`}
            strokeWidth={strokeW}
            strokeLinecap="round"
            filter="url(#gauge-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        )}

        {/* ── Tick marks ── */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1}
            x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.09)"}
            strokeWidth={t.isMajor ? 1.5 : 0.8}
            strokeLinecap="round"
          />
        ))}

        {/* ── Aguja animada — rotate en grupo para evitar bug SVG ── */}
        <motion.g
          initial={{ rotate: START_DEG + 90, originX: "56px", originY: "58px" }}
          animate={{ rotate: needleDeg + 90 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <line
            x1={CX} y1={CY}
            x2={CX} y2={CY - 32}
            stroke={dynColor}
            strokeWidth={2}
            strokeLinecap="round"
            filter="url(#needle-glow)"
          />
        </motion.g>

        {/* Pivote de la aguja */}
        <circle cx={CX} cy={CY} r={4} fill={dynColor} opacity={0.9} />
        <circle cx={CX} cy={CY} r={2} fill="rgba(255,255,255,0.8)" />

        {/* ── Valor central ── */}
        <text
          x={CX} y={CY - 6}
          textAnchor="middle"
          fill={dynColor}
          fontSize="14"
          fontWeight="800"
          fontFamily="'Syne', sans-serif"
          style={{ filter: `drop-shadow(0 0 6px ${dynColor}88)` }}
        >
          {clampedValue}%
        </text>

        {/* Labels 0% y 100% */}
        {(() => {
          const s = arcPoint(START_DEG);
          const e = arcPoint(START_DEG + SWEEP);
          return (
            <>
              <text x={s.x - 4} y={s.y + 10} textAnchor="middle"
                fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="'DM Mono', monospace">
                0
              </text>
              <text x={e.x + 4} y={e.y + 10} textAnchor="middle"
                fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="'DM Mono', monospace">
                100
              </text>
            </>
          );
        })()}
      </svg>

      {/* Label de estado */}
      <div style={{
        fontSize: 10, fontWeight: 700,
        color: dynColor,
        textTransform: "uppercase", letterSpacing: "1px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        opacity: 0.9,
        marginTop: -4,
        textShadow: `0 0 10px ${dynColor}66`,
      }}>
        {clampedValue < min ? "Crítica" :
         clampedValue < min + 10 ? "Baja" :
         clampedValue > max ? "Alta" : "Óptima"}
      </div>
    </div>
  );
}