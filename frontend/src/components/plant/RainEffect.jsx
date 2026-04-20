// components/RainEffect.jsx
// Animación de lluvia en canvas sobre la PlantCard cuando está regando
// Uso: <RainEffect active={plant.valveStatus === "OPEN"} />
import { useEffect, useRef } from "react";

export default function RainEffect({ active = false, intensity = "medium" }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const dropsRef  = useRef([]);

  const CONFIGS = {
    light:  { count: 18, speed: [2, 4],   length: [8, 14],  opacity: [0.25, 0.45], width: [0.8, 1.2] },
    medium: { count: 32, speed: [3, 6],   length: [10, 20], opacity: [0.30, 0.55], width: [0.9, 1.5] },
    heavy:  { count: 55, speed: [5, 9],   length: [14, 26], opacity: [0.35, 0.65], width: [1.0, 1.8] },
  };

  const cfg = CONFIGS[intensity] || CONFIGS.medium;

  const rand = (min, max) => Math.random() * (max - min) + min;

  const initDrops = (w, h) => {
    dropsRef.current = Array.from({ length: cfg.count }, () => ({
      x:       rand(0, w),
      y:       rand(-h, 0),          // empezar fuera del canvas arriba
      speed:   rand(...cfg.speed),
      length:  rand(...cfg.length),
      opacity: rand(...cfg.opacity),
      width:   rand(...cfg.width),
      angle:   rand(8, 18),          // inclinación en grados
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const w   = canvas.offsetWidth  || 300;
    const h   = canvas.offsetHeight || 200;
    canvas.width  = w;
    canvas.height = h;

    if (!active) {
      ctx.clearRect(0, 0, w, h);
      cancelAnimationFrame(animRef.current);
      return;
    }

    initDrops(w, h);

    let opacity = 0; // fade-in al activarse
    const fadeIn = setInterval(() => {
      opacity = Math.min(opacity + 0.04, 1);
      if (opacity >= 1) clearInterval(fadeIn);
    }, 20);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      dropsRef.current.forEach(drop => {
        const angleRad = (drop.angle * Math.PI) / 180;
        const dx = Math.sin(angleRad) * drop.length;
        const dy = Math.cos(angleRad) * drop.length;

        // Gradiente por gota — más brillante en la punta
        const grad = ctx.createLinearGradient(
          drop.x, drop.y,
          drop.x + dx, drop.y + dy
        );
        grad.addColorStop(0, `rgba(96, 200, 255, 0)`);
        grad.addColorStop(0.4, `rgba(120, 210, 255, ${drop.opacity * opacity * 0.6})`);
        grad.addColorStop(1, `rgba(160, 230, 255, ${drop.opacity * opacity})`);

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + dx, drop.y + dy);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = drop.width;
        ctx.lineCap     = "round";
        ctx.stroke();

        // Pequeño splash al llegar al fondo
        if (drop.y + dy > h - 4) {
          ctx.beginPath();
          ctx.arc(drop.x + dx * 0.9, h - 2, drop.width * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(140, 220, 255, ${drop.opacity * opacity * 0.4})`;
          ctx.fill();
        }

        // Mover la gota
        drop.y += drop.speed;
        drop.x += Math.sin(angleRad) * drop.speed * 0.35;

        // Reiniciar al salir por abajo
        if (drop.y > h + drop.length) {
          drop.y = rand(-40, -10);
          drop.x = rand(0, w);
        }
        // Reiniciar al salir por los lados
        if (drop.x > w + 20 || drop.x < -20) {
          drop.x = rand(0, w);
          drop.y = rand(-40, -10);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(fadeIn);
    };
  }, [active, intensity]);

  // Resize observer para que el canvas se adapte al tamaño de la card
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width  = width;
        canvas.height = height;
        if (active) initDrops(width, height);
      }
    });
    ro.observe(canvas.parentElement || canvas);
    return () => ro.disconnect();
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      "absolute",
        inset:         0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        zIndex:        10,
        borderRadius:  "inherit",
        opacity:       active ? 1 : 0,
        transition:    "opacity 0.8s ease",
      }}
    />
  );
}