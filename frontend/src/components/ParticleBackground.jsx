import { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return undefined;

    let animId = null;
    let particles = [];
    let frame = 0;
    let hidden = document.hidden;
    let lastFrameTime = 0;

    const isLight = () => document.body.classList.contains("light-mode");
    const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = () => window.innerWidth < 768;

    const getColors = () => (
      isLight()
        ? ["#818cf8", "#a78bfa", "#e879f9", "#34d399", "#c084fc"]
        : ["#34d399", "#60a5fa", "#a78bfa", "#2dd4bf", "#6ee7b7"]
    );

    const getCount = () => {
      if (prefersReducedMotion()) return 0;
      const area = window.innerWidth * window.innerHeight;
      const base = Math.min(72, Math.floor(area / 24000));
      if (window.innerWidth < 480) return Math.max(10, Math.round(base * 0.32));
      if (window.innerWidth < 768) return Math.max(14, Math.round(base * 0.45));
      return Math.max(18, base);
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, isMobile() ? 1 : 1.35);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: getCount() }, mkParticle);
    };

    const mkParticle = () => {
      const colors = getColors();
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + 0.4,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.45 + 0.12,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.007 + Math.random() * 0.01,
      };
    };

    const drawConnections = () => {
      const maxDist = isMobile() ? 90 : 118;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * (isMobile() ? 0.1 : 0.16);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isLight() ? `rgba(167,139,250,${opacity})` : `rgba(52,211,153,${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    const draw = (timestamp = 0) => {
      if (hidden || prefersReducedMotion()) {
        animId = requestAnimationFrame(draw);
        return;
      }

      const targetFrameMs = isMobile() ? 34 : 32;
      if (timestamp - lastFrameTime < targetFrameMs) {
        animId = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime = timestamp;

      frame += 1;
      const skipFrame = isMobile() && frame % 2 === 0;
      if (skipFrame) {
        animId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (!isMobile() && frame % 2 === 0) drawConnections();

      particles.forEach((particle) => {
        particle.pulse += particle.pulseSpeed;
        const alphaNow = particle.alpha * (0.75 + 0.25 * Math.sin(particle.pulse));

        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.r * 3.2);
        gradient.addColorStop(0, hexAlpha(particle.color, alphaNow));
        gradient.addColorStop(0.5, hexAlpha(particle.color, alphaNow * 0.35));
        gradient.addColorStop(1, hexAlpha(particle.color, 0));

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha(particle.color, Math.min(alphaNow * 1.3, 0.85));
        ctx.fill();

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -20) particle.x = window.innerWidth + 20;
        if (particle.x > window.innerWidth + 20) particle.x = -20;
        if (particle.y < -20) particle.y = window.innerHeight + 20;
        if (particle.y > window.innerHeight + 20) particle.y = -20;
      });

      animId = requestAnimationFrame(draw);
    };

    const onVisibilityChange = () => {
      hidden = document.hidden;
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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

function hexAlpha(hex, alpha) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}
