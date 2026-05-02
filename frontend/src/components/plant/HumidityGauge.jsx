import { motion } from "framer-motion";

export default function HumidityGauge({ value = 0, min = 30, max = 70, size = 110 }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const sweep = 240;
  const startDeg = 150;
  const radius = 42;
  const centerX = 56;
  const centerY = 58;
  const strokeWidth = 6;

  const degToRad = (deg) => (deg * Math.PI) / 180;

  const arcPoint = (deg) => {
    const rad = degToRad(deg);
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    };
  };

  const describeArc = (arcStart, arcSweep) => {
    const arcEnd = arcStart + arcSweep;
    const start = arcPoint(arcStart);
    const end = arcPoint(arcEnd);
    const largeArc = arcSweep > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const progressSweep = (clampedValue / 100) * sweep;
  const needleDeg = startDeg + (clampedValue / 100) * sweep;

  const getColor = () => {
    if (clampedValue < min) return "#f87171";
    if (clampedValue < min + 10) return "#fbbf24";
    if (clampedValue > max) return "#60a5fa";
    return "#34d399";
  };

  const dynColor = getColor();
  const ticks = Array.from({ length: 11 }, (_, index) => {
    const pct = index / 10;
    const deg = startDeg + pct * sweep;
    const rad = degToRad(deg);
    const isMajor = index % 2 === 0;
    const inner = 33;
    const outer = isMajor ? 43 : 40;

    return {
      x1: centerX + inner * Math.cos(rad),
      y1: centerY + inner * Math.sin(rad),
      x2: centerX + outer * Math.cos(rad),
      y2: centerY + outer * Math.sin(rad),
      isMajor,
    };
  });

  const stateLabel = clampedValue < min
    ? "Crítica"
    : clampedValue < min + 10
      ? "Baja"
      : clampedValue > max
        ? "Alta"
        : "Óptima";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={size} height={size * 0.88} viewBox="0 0 112 100" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`gauge-grad-${value}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={dynColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={dynColor} />
          </linearGradient>

          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="needle-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={describeArc(startDeg, sweep)}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <path
          d={describeArc(startDeg + (min / 100) * sweep, ((max - min) / 100) * sweep)}
          fill="none"
          stroke="rgba(52,211,153,0.20)"
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
        />

        {progressSweep > 0 && (
          <motion.path
            d={describeArc(startDeg, progressSweep)}
            fill="none"
            stroke={`url(#gauge-grad-${value})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#gauge-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        )}

        {ticks.map((tick, index) => (
          <line
            key={index}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.isMajor ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.09)"}
            strokeWidth={tick.isMajor ? 1.5 : 0.8}
            strokeLinecap="round"
          />
        ))}

        <motion.g
          initial={{ rotate: startDeg + 90, originX: "56px", originY: "58px" }}
          animate={{ rotate: needleDeg + 90 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        >
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - 32}
            stroke={dynColor}
            strokeWidth={2}
            strokeLinecap="round"
            filter="url(#needle-glow)"
          />
        </motion.g>

        <circle cx={centerX} cy={centerY} r={4} fill={dynColor} opacity={0.9} />
        <circle cx={centerX} cy={centerY} r={2} fill="rgba(255,255,255,0.8)" />

        <text
          x={centerX}
          y={centerY - 6}
          textAnchor="middle"
          fill={dynColor}
          fontSize="14"
          fontWeight="800"
          fontFamily="'Syne', sans-serif"
          style={{ filter: `drop-shadow(0 0 6px ${dynColor}88)` }}
        >
          {clampedValue}%
        </text>

        {(() => {
          const start = arcPoint(startDeg);
          const end = arcPoint(startDeg + sweep);
          return (
            <>
              <text
                x={start.x - 4}
                y={start.y + 10}
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize="7"
                fontFamily="'DM Mono', monospace"
              >
                0
              </text>
              <text
                x={end.x + 4}
                y={end.y + 10}
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize="7"
                fontFamily="'DM Mono', monospace"
              >
                100
              </text>
            </>
          );
        })()}
      </svg>

      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: dynColor,
          textTransform: "uppercase",
          letterSpacing: "1px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          opacity: 0.9,
          marginTop: -4,
          textShadow: `0 0 10px ${dynColor}66`,
        }}
      >
        {stateLabel}
      </div>
    </div>
  );
}
