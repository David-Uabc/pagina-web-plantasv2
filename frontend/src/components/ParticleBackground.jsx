import { useEffect, useRef } from "react";

/**
 * ParticleBackground — canvas de partículas flotantes
 * Se adapta automáticamente al modo oscuro / día (índigo+magenta)
 */
export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let particles = [];

    // ── Detecta modo claro para cambiar colores ──────────────────
    const isLight = () => document.body.classList.contains("light-mode");

    // ── Colores por modo ─────────────────────────────────────────
    const getColors = () =>
      isLight()
        ? ["#818cf8", "#a78bfa", "#e879f9", "#34d399", "#c084fc"]
        : ["#34d399",  "#60a5fa", "#a78bfa", "#2dd4bf",  "#6ee7b7"];

    // ── Resize ───────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Crear partícula ──────────────────────────────────────────
    const mkParticle = () => {
      const colors = getColors();
      return {
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.8 + 0.4,          // radio 0.4–2.2px
        vx:    (Math.random() - 0.5) * 0.35,        // velocidad muy lenta
        vy:    (Math.random() - 0.5) * 0.35,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.55 + 0.15,         // opacidad 0.15–0.70
        pulse: Math.random() * Math.PI * 2,          // fase de pulso
        pulseSpeed: 0.008 + Math.random() * 0.012,  // velocidad de pulso
      };
    };

    // ── Número de partículas según pantalla ──────────────────────
    const COUNT = Math.min(120, Math.floor((window.innerWidth * window.innerHeight) / 12000));
    particles = Array.from({ length: COUNT }, mkParticle);

    // ── Línea entre partículas cercanas ─────────────────────────
    const drawConnections = () => {
      const maxDist = 130;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isLight()
              ? `rgba(167,139,250,${opacity})`
              : `rgba(52,211,153,${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    // ── Loop principal ───────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawConnections();

      particles.forEach(p => {
        // Pulso de opacidad suave
        p.pulse += p.pulseSpeed;
        const alphaNow = p.alpha * (0.75 + 0.25 * Math.sin(p.pulse));

        // Glow difuso
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
        gradient.addColorStop(0,   hexAlpha(p.color, alphaNow));
        gradient.addColorStop(0.5, hexAlpha(p.color, alphaNow * 0.4));
        gradient.addColorStop(1,   hexAlpha(p.color, 0));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Punto central sólido
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha(p.color, Math.min(alphaNow * 1.4, 0.9));
        ctx.fill();

        // Mover
        p.x += p.vx;
        p.y += p.vy;

        // Rebote suave en bordes
        if (p.x < -20)                  p.x = canvas.width  + 20;
        if (p.x > canvas.width  + 20)   p.x = -20;
        if (p.y < -20)                  p.y = canvas.height + 20;
        if (p.y > canvas.height + 20)   p.y = -20;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    // ── Cleanup ──────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 1,
      }}
    />
  );
}

// ── Helper: hex + alpha ──────────────────────────────────────────
function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}