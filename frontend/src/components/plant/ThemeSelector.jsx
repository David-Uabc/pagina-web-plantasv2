// components/ThemeSelector.jsx
// Modal de personalización: tema, modo compacto y tamaño de fuente
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, THEMES } from "../context/ThemeContext";

export default function ThemeSelector({ isOpen, onClose }) {
  const { themeId, changeTheme, compact, toggleCompact, fontSize, changeFontSize } = useTheme();
  const [preview, setPreview] = useState(null); // ID del tema en hover

  if (!isOpen) return null;

  const currentTheme = THEMES[preview || themeId] || THEMES.dark;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 99999, padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.88, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%", maxWidth: 520,
            background: "rgba(6,12,8,0.99)",
            border: `1px solid ${currentTheme["--accent"] || "#34d399"}30`,
            borderRadius: 26, overflow: "hidden",
            boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 40px ${currentTheme["--accent"] || "#34d399"}10`,
            transition: "border-color 0.4s ease, box-shadow 0.4s ease",
            position: "relative",
          }}
        >
          {/* Accent top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${currentTheme["--accent"] || "#34d399"}, transparent)`,
            transition: "background 0.4s ease",
          }} />

          {/* Header */}
          <div style={{
            padding: "24px 24px 0",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#f0f6fc", marginBottom: 3 }}>
                🎨 Personalizar apariencia
              </div>
              <div style={{ fontSize: 13, color: "#5a7a66" }}>
                Los cambios se guardan automáticamente
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.04)",
              color: "#78909c", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          <div style={{ padding: "20px 24px 28px" }}>

            {/* ── TEMAS ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={sectionLabel}>Tema de color</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                {Object.values(THEMES).map(t => (
                  <button
                    key={t.id}
                    onClick={() => changeTheme(t.id)}
                    onMouseEnter={() => setPreview(t.id)}
                    onMouseLeave={() => setPreview(null)}
                    style={{
                      padding: "14px 6px", borderRadius: 14,
                      border: themeId === t.id
                        ? `1.5px solid ${t["--accent"]}60`
                        : "1px solid rgba(255,255,255,0.08)",
                      background: themeId === t.id
                        ? `${t["--accent"]}12`
                        : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      transition: "all 0.22s",
                      boxShadow: themeId === t.id ? `0 4px 20px ${t["--accent"]}18` : "none",
                      position: "relative",
                    }}
                  >
                    {/* Check de selección */}
                    {themeId === t.id && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{
                          position: "absolute", top: 6, right: 6,
                          width: 16, height: 16, borderRadius: "50%",
                          background: t["--accent"],
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, color: "#000", fontWeight: 900,
                        }}
                      >✓</motion.div>
                    )}

                    {/* Preview swatch */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: `linear-gradient(135deg, ${t["--bg-base"]}, ${t["--bg-card-solid"]})`,
                      border: `2px solid ${t["--accent"]}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                    }}>
                      {t.icon}
                    </div>

                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: themeId === t.id ? t["--accent"] : "#78909c",
                    }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── MODO COMPACTO ── */}
            <div style={{
              marginBottom: 22, padding: "16px 18px", borderRadius: 16,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f6fc", marginBottom: 3 }}>
                    📐 Modo compacto
                  </div>
                  <div style={{ fontSize: 12, color: "#5a7a66" }}>
                    Reduce el tamaño de las tarjetas para ver más plantas en pantalla
                  </div>
                </div>
                {/* Toggle animado */}
                <button onClick={toggleCompact} style={{
                  width: 52, height: 28, borderRadius: 99, border: "none",
                  background: compact
                    ? `linear-gradient(135deg, ${currentTheme["--accent"]}aa, ${currentTheme["--accent"]})`
                    : "rgba(255,255,255,0.10)",
                  cursor: "pointer", position: "relative",
                  transition: "background 0.28s", flexShrink: 0,
                }}>
                  <motion.div
                    animate={{ x: compact ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    style={{
                      position: "absolute", top: 3, left: 3,
                      width: 22, height: 22, borderRadius: "50%",
                      background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    }}
                  />
                </button>
              </div>

              {/* Preview del modo compacto */}
              <AnimatePresence>
                {compact && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      marginTop: 12, padding: "10px 12px", borderRadius: 10,
                      background: `${currentTheme["--accent"]}08`,
                      border: `1px solid ${currentTheme["--accent"]}20`,
                      fontSize: 12, color: currentTheme["--text-2"],
                    }}>
                      ✓ Modo compacto activo — las tarjetas se ven más pequeñas, caben más en pantalla
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── TAMAÑO DE FUENTE ── */}
            <div style={{
              padding: "16px 18px", borderRadius: 16,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f6fc", marginBottom: 3 }}>
                    🔡 Tamaño de texto
                  </div>
                  <div style={{ fontSize: 12, color: "#5a7a66" }}>
                    Ajusta el tamaño para facilitar la lectura
                  </div>
                </div>
                <div style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 18, fontWeight: 800,
                  color: currentTheme["--accent"],
                  background: `${currentTheme["--accent"]}12`,
                  padding: "4px 12px", borderRadius: 8,
                  minWidth: 52, textAlign: "center",
                }}>
                  {fontSize}px
                </div>
              </div>

              {/* Slider */}
              <input
                type="range" min={13} max={20} value={fontSize}
                onChange={e => changeFontSize(Number(e.target.value))}
                style={{
                  width: "100%", appearance: "none", height: 5, borderRadius: 99,
                  background: `linear-gradient(to right, ${currentTheme["--accent"]} ${((fontSize - 13) / 7) * 100}%, rgba(255,255,255,0.10) ${((fontSize - 13) / 7) * 100}%)`,
                  outline: "none", cursor: "pointer",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                {[13, 15, 17, 20].map(s => (
                  <button key={s} onClick={() => changeFontSize(s)} style={{
                    padding: "4px 10px", borderRadius: 7, fontSize: s === fontSize ? 12 : 11,
                    border: s === fontSize
                      ? `1px solid ${currentTheme["--accent"]}50`
                      : "1px solid rgba(255,255,255,0.08)",
                    background: s === fontSize ? `${currentTheme["--accent"]}12` : "transparent",
                    color: s === fontSize ? currentTheme["--accent"] : "#5a7a66",
                    cursor: "pointer", fontWeight: s === fontSize ? 700 : 500,
                    transition: "all 0.18s",
                  }}>{s}px</button>
                ))}
              </div>

              {/* Preview del texto */}
              <div style={{
                marginTop: 14, padding: "12px 14px", borderRadius: 10,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize, lineHeight: 1.6, color: "#b0bec5",
                transition: "font-size 0.2s ease",
              }}>
                <span style={{ fontWeight: 700, color: "#f0f6fc" }}>Ejemplo de texto: </span>
                Humedad actual 65% — La planta está bien hidratada
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const sectionLabel = {
  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.9px", color: "#5a7a66", marginBottom: 12,
};