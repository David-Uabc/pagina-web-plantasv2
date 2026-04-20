import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Droplets, X } from "lucide-react";

const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

// ── Config por tipo ───────────────────────────────────
const TYPE_CONFIG = {
  success: {
    Icon: CheckCircle2,
    color: "#34d399",
    bg:   "rgba(52,211,153,0.08)",
    border:"rgba(52,211,153,0.25)",
    glow: "rgba(52,211,153,0.15)",
    bar:  "linear-gradient(90deg, #34d399, #6ee7b7)",
  },
  error: {
    Icon: XCircle,
    color: "#f87171",
    bg:   "rgba(248,113,113,0.08)",
    border:"rgba(248,113,113,0.25)",
    glow: "rgba(248,113,113,0.15)",
    bar:  "linear-gradient(90deg, #ef4444, #f87171)",
  },
  warning: {
    Icon: AlertTriangle,
    color: "#fbbf24",
    bg:   "rgba(251,191,36,0.08)",
    border:"rgba(251,191,36,0.25)",
    glow: "rgba(251,191,36,0.12)",
    bar:  "linear-gradient(90deg, #f59e0b, #fbbf24)",
  },
  info: {
    Icon: Droplets,
    color: "#60a5fa",
    bg:   "rgba(96,165,250,0.08)",
    border:"rgba(96,165,250,0.25)",
    glow: "rgba(96,165,250,0.15)",
    bar:  "linear-gradient(90deg, #3b82f6, #60a5fa)",
  },
};

// ── Toast individual ──────────────────────────────────
function Toast({ id, msg, type = "success", duration = 3500, onRemove }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.success;
  const { Icon } = cfg;
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);
  const pausedRef   = useRef(false);
  const startRef    = useRef(Date.now());
  const remainRef   = useRef(duration);

  useEffect(() => {
    const tick = () => {
      if (pausedRef.current) return;
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / remainRef.current) * 100);
      setProgress(pct);
      if (pct <= 0) {
        clearInterval(intervalRef.current);
        onRemove(id);
      }
    };
    intervalRef.current = setInterval(tick, 30);
    return () => clearInterval(intervalRef.current);
  }, [id, onRemove]);

  const pause = () => {
    pausedRef.current = true;
    remainRef.current -= Date.now() - startRef.current;
  };
  const resume = () => {
    pausedRef.current = false;
    startRef.current  = Date.now();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.88, filter: "blur(6px)" }}
      animate={{ opacity: 1, x: 0,  scale: 1,    filter: "blur(0px)" }}
      exit={{    opacity: 0, x: 80, scale: 0.92,  filter: "blur(4px)" }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={pause}
      onMouseLeave={resume}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px 18px",
        minWidth: 300,
        maxWidth: 380,
        background: `rgba(13,17,23,0.92)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${cfg.border}`,
        borderRadius: 16,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.border}, 0 0 20px ${cfg.glow}`,
        cursor: "pointer",
        overflow: "hidden",
      }}
      onClick={() => onRemove(id)}
    >
      {/* Glow accent izquierdo */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: cfg.bar, borderRadius: "16px 0 0 16px",
      }} />

      {/* Icono */}
      <div style={{
        flexShrink: 0,
        width: 34, height: 34,
        borderRadius: 10,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginLeft: 6,
      }}>
        <Icon size={17} color={cfg.color} strokeWidth={2} />
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: "#f0f6fc",
          lineHeight: 1.45,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {msg}
        </div>
        <div style={{
          fontSize: 11, color: cfg.color, opacity: 0.7,
          marginTop: 3, fontWeight: 500,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          textTransform: "uppercase", letterSpacing: "0.5px",
        }}>
          {type === "success" ? "Éxito" : type === "error" ? "Error" : type === "warning" ? "Atención" : "Info"}
        </div>
      </div>

      {/* Cerrar */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(id); }}
        style={{
          flexShrink: 0, background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 7, padding: "4px 5px",
          cursor: "pointer", color: "rgba(255,255,255,0.4)",
          display: "flex", alignItems: "center",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
      >
        <X size={12} />
      </button>

      {/* Progress bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
        background: "rgba(255,255,255,0.06)",
      }}>
        <motion.div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: cfg.bar,
            borderRadius: 2,
            boxShadow: `0 0 8px ${cfg.color}88`,
          }}
        />
      </div>
    </motion.div>
  );
}

// ── Provider ──────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((msg, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, msg, type, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          display: "flex", flexDirection: "column-reverse", gap: 10,
          zIndex: 999999, pointerEvents: "none",
          alignItems: "flex-end",
        }}>
          <AnimatePresence mode="popLayout">
            {toasts.map(t => (
              <div key={t.id} style={{ pointerEvents: "all" }}>
                <Toast {...t} onRemove={remove} />
              </div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
