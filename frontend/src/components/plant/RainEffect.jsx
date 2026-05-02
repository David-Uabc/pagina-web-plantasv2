import { useCallback, useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";

export default function RainEffect({ active = false, intensity = "medium" }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const dropsRef = useRef([]);
  const fadeTimerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const configs = useMemo(() => ({
    light: { count: 14, speed: [2, 4], length: [8, 14], opacity: [0.25, 0.45], width: [0.8, 1.2] },
    medium: { count: 24, speed: [3, 6], length: [10, 18], opacity: [0.28, 0.5], width: [0.9, 1.4] },
    heavy: { count: 40, speed: [5, 9], length: [14, 24], opacity: [0.32, 0.58], width: [1.0, 1.7] },
  }), []);

  const cfg = configs[intensity] || configs.medium;
  const rand = (min, max) => Math.random() * (max - min) + min;

  const getAdaptiveCount = useCallback((width) => {
    if (prefersReducedMotion) return 0;
    if (width < 420) return Math.max(6, Math.round(cfg.count * 0.25));
    if (width < 768) return Math.max(10, Math.round(cfg.count * 0.45));
    return cfg.count;
  }, [cfg.count, prefersReducedMotion]);

  const initDrops = useCallback((w, h) => {
    const count = getAdaptiveCount(w);
    dropsRef.current = Array.from({ length: count }, () => ({
      x: rand(0, w),
      y: rand(-h, 0),
      speed: rand(...cfg.speed),
      length: rand(...cfg.length),
      opacity: rand(...cfg.opacity),
      width: rand(...cfg.width),
      angle: rand(8, 18),
    }));
  }, [cfg, getAdaptiveCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return undefined;

    const w = canvas.offsetWidth || 300;
    const h = canvas.offsetHeight || 200;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (!active || prefersReducedMotion) {
      ctx.clearRect(0, 0, w, h);
      cancelAnimationFrame(animRef.current);
      if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
      return undefined;
    }

    initDrops(w, h);

    let opacity = 0;
    let frameCount = 0;
    const skipEveryOtherFrame = w < 768;
    let lastFrameTime = 0;

    fadeTimerRef.current = setInterval(() => {
      opacity = Math.min(opacity + 0.05, 1);
      if (opacity >= 1 && fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    }, 22);

    const draw = (timestamp = 0) => {
      if (timestamp - lastFrameTime < 32) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime = timestamp;

      frameCount += 1;
      if (skipEveryOtherFrame && frameCount % 2 === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      dropsRef.current.forEach((drop) => {
        const angleRad = (drop.angle * Math.PI) / 180;
        const dx = Math.sin(angleRad) * drop.length;
        const dy = Math.cos(angleRad) * drop.length;

        const grad = ctx.createLinearGradient(drop.x, drop.y, drop.x + dx, drop.y + dy);
        grad.addColorStop(0, "rgba(96, 200, 255, 0)");
        grad.addColorStop(0.4, `rgba(120, 210, 255, ${drop.opacity * opacity * 0.6})`);
        grad.addColorStop(1, `rgba(160, 230, 255, ${drop.opacity * opacity})`);

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + dx, drop.y + dy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = drop.width;
        ctx.lineCap = "round";
        ctx.stroke();

        if (drop.y + dy > h - 4) {
          ctx.beginPath();
          ctx.arc(drop.x + dx * 0.9, h - 2, drop.width * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(140, 220, 255, ${drop.opacity * opacity * 0.4})`;
          ctx.fill();
        }

        drop.y += drop.speed;
        drop.x += Math.sin(angleRad) * drop.speed * 0.35;

        if (drop.y > h + drop.length) {
          drop.y = rand(-40, -10);
          drop.x = rand(0, w);
        }
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
      if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
    };
  }, [active, cfg, initDrops, intensity, prefersReducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const resizeCanvas = (width, height) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (active && !prefersReducedMotion) initDrops(width, height);
    };

    const ro = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width, height } = entry.contentRect;
        resizeCanvas(width, height);
      });
    });

    ro.observe(canvas.parentElement || canvas);
    return () => ro.disconnect();
  }, [active, initDrops, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
        borderRadius: "inherit",
        opacity: active && !prefersReducedMotion ? 1 : 0,
        transition: "opacity 0.45s ease",
      }}
    />
  );
}
