// RainEffect.jsx — Partículas de agua animadas cuando la válvula está abierta
import { useEffect, useRef } from "react";

const DROP_COUNT = 18;

function randomBetween(a, b) { return a + Math.random() * (b - a); }

export default function RainEffect({ active }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const dropsRef  = useRef([]);

  function initDrops() {
    dropsRef.current = Array.from({ length: DROP_COUNT }, (_, i) => ({
      x:       randomBetween(5, 95),   // % del ancho
      y:       randomBetween(-40, 0),  // empieza arriba del contenedor
      speed:   randomBetween(1.2, 2.8),
      opacity: randomBetween(0.4, 0.9),
      length:  randomBetween(7, 14),
      width:   randomBetween(1, 2),
      delay:   i * (1000 / DROP_COUNT), // ms de delay inicial
      born:    Date.now() + i * (1000 / DROP_COUNT),
    }));
  }

  useEffect(() => {
    if (!active) { cancelAnimationFrame(rafRef.current); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    initDrops();

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      dropsRef.current.forEach(drop => {
        if (now < drop.born) return;

        // Advance position
        drop.y += drop.speed;
        if (drop.y > canvas.height + 20) {
          drop.y     = randomBetween(-20, -5);
          drop.x     = randomBetween(5, 95);
          drop.speed = randomBetween(1.2, 2.8);
        }

        const x = (drop.x / 100) * canvas.width;
        const y = drop.y;

        // Draw raindrop (line + circle at bottom)
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 1, y + drop.length);
        ctx.strokeStyle = `rgba(96,200,255,${drop.opacity})`;
        ctx.lineWidth   = drop.width;
        ctx.lineCap     = "round";
        ctx.stroke();

        // Tiny splash when near bottom
        if (y > canvas.height - 12) {
          const splashOp = (1 - (y - (canvas.height - 12)) / 12) * 0.6;
          ctx.beginPath();
          ctx.arc(x, canvas.height - 2, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(96,200,255,${splashOp})`;
          ctx.fill();
        }
      });

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        borderRadius: "inherit",
        opacity: active ? 1 : 0,
        transition: "opacity 0.6s ease",
        zIndex: 3,
      }}
    />
  );
}