// context/ThemeContext.jsx
// Proveedor de tema global con 5 temas + modo compacto
// Persiste en localStorage — el usuario no pierde su elección al recargar
import { createContext, useContext, useState, useEffect, useCallback } from "react";

// ── Definición de temas ───────────────────────────────
export const THEMES = {
  // Tema por defecto — carbón + esmeralda
  dark: {
    id:         "dark",
    label:      "Oscuro",
    icon:       "🌑",
    "--bg-base":       "#080a0e",
    "--bg-surface":    "#0d1117",
    "--bg-card":       "rgba(13,17,23,0.90)",
    "--bg-card-solid": "#111520",
    "--bg-input":      "rgba(255,255,255,0.055)",
    "--green":         "#34d399",
    "--green-light":   "#6ee7b7",
    "--green-dim":     "rgba(52,211,153,0.09)",
    "--text-1":        "#f0f6fc",
    "--text-2":        "#c8d6e0",
    "--text-3":        "#8fa8b8",
    "--border":        "rgba(240,246,252,0.08)",
    "--border-hover":  "rgba(240,246,252,0.20)",
    "--accent":        "#34d399",
  },

  // Tema claro — blanco + verde profundo
  light: {
    id:         "light",
    label:      "Claro",
    icon:       "☀️",
    "--bg-base":       "#f0f7f4",
    "--bg-surface":    "#e8f5f0",
    "--bg-card":       "rgba(255,255,255,0.95)",
    "--bg-card-solid": "#ffffff",
    "--bg-input":      "rgba(0,0,0,0.04)",
    "--green":         "#059669",
    "--green-light":   "#34d399",
    "--green-dim":     "rgba(5,150,105,0.10)",
    "--text-1":        "#0f2e1e",
    "--text-2":        "#2d5c42",
    "--text-3":        "#5a8a6e",
    "--border":        "rgba(0,0,0,0.10)",
    "--border-hover":  "rgba(0,0,0,0.20)",
    "--accent":        "#059669",
  },

  // Tema océano — azul profundo + cyan
  ocean: {
    id:         "ocean",
    label:      "Océano",
    icon:       "🌊",
    "--bg-base":       "#060d18",
    "--bg-surface":    "#0a1628",
    "--bg-card":       "rgba(10,22,40,0.92)",
    "--bg-card-solid": "#0e1e38",
    "--bg-input":      "rgba(255,255,255,0.055)",
    "--green":         "#22d3ee",
    "--green-light":   "#67e8f9",
    "--green-dim":     "rgba(34,211,238,0.09)",
    "--text-1":        "#e0f2fe",
    "--text-2":        "#93c5fd",
    "--text-3":        "#60a5fa",
    "--border":        "rgba(96,165,250,0.12)",
    "--border-hover":  "rgba(96,165,250,0.28)",
    "--accent":        "#22d3ee",
  },

  // Tema tierra — café + naranja cálido
  earth: {
    id:         "earth",
    label:      "Tierra",
    icon:       "🌿",
    "--bg-base":       "#0e0a06",
    "--bg-surface":    "#1a1208",
    "--bg-card":       "rgba(26,18,8,0.92)",
    "--bg-card-solid": "#1e1608",
    "--bg-input":      "rgba(255,255,255,0.05)",
    "--green":         "#d97706",
    "--green-light":   "#fbbf24",
    "--green-dim":     "rgba(217,119,6,0.10)",
    "--text-1":        "#fef3c7",
    "--text-2":        "#d4a96a",
    "--text-3":        "#92683c",
    "--border":        "rgba(217,119,6,0.14)",
    "--border-hover":  "rgba(217,119,6,0.30)",
    "--accent":        "#d97706",
  },

  // Tema noche violeta — morado + lavanda
  violet: {
    id:         "violet",
    label:      "Violeta",
    icon:       "🔮",
    "--bg-base":       "#08060f",
    "--bg-surface":    "#100d1f",
    "--bg-card":       "rgba(16,13,31,0.92)",
    "--bg-card-solid": "#14102a",
    "--bg-input":      "rgba(255,255,255,0.05)",
    "--green":         "#a78bfa",
    "--green-light":   "#c4b5fd",
    "--green-dim":     "rgba(167,139,250,0.10)",
    "--text-1":        "#ede9fe",
    "--text-2":        "#c4b5fd",
    "--text-3":        "#8b5cf6",
    "--border":        "rgba(167,139,250,0.12)",
    "--border-hover":  "rgba(167,139,250,0.28)",
    "--accent":        "#a78bfa",
  },
};

// ── Context ───────────────────────────────────────────
const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId,  setThemeId]  = useState(() => localStorage.getItem("riego_theme")  || "dark");
  const [compact,  setCompact]  = useState(() => localStorage.getItem("riego_compact") === "true");
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem("riego_fontsize")) || 15);

  // Aplicar tema al :root
  const applyTheme = useCallback((id) => {
    const theme = THEMES[id] || THEMES.dark;
    const root  = document.documentElement;

    Object.entries(theme).forEach(([key, val]) => {
      if (key.startsWith("--")) root.style.setProperty(key, val);
    });

    // Clase en body para overrides CSS
    document.body.className = document.body.className
      .replace(/\briego-theme-\S+/g, "")
      .trim();
    document.body.classList.add(`riego-theme-${id}`);

    // Modo claro/oscuro en body
    if (id === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, []);

  // Aplicar modo compacto
  const applyCompact = useCallback((val) => {
    if (val) {
      document.body.classList.add("compact-mode");
    } else {
      document.body.classList.remove("compact-mode");
    }
  }, []);

  // Aplicar tamaño de fuente
  const applyFontSize = useCallback((size) => {
    document.documentElement.style.setProperty("--base-font-size", `${size}px`);
    document.body.style.fontSize = `${size}px`;
  }, []);

  // Inicializar al montar
  useEffect(() => {
    applyTheme(themeId);
    applyCompact(compact);
    applyFontSize(fontSize);
  }, []);

  const changeTheme = (id) => {
    if (!THEMES[id]) return;
    setThemeId(id);
    localStorage.setItem("riego_theme", id);
    applyTheme(id);
  };

  const toggleCompact = () => {
    const next = !compact;
    setCompact(next);
    localStorage.setItem("riego_compact", String(next));
    applyCompact(next);
  };

  const changeFontSize = (size) => {
    const clamped = Math.max(13, Math.min(20, size));
    setFontSize(clamped);
    localStorage.setItem("riego_fontsize", String(clamped));
    applyFontSize(clamped);
  };

  return (
    <ThemeCtx.Provider value={{
      themeId, theme: THEMES[themeId] || THEMES.dark,
      themes: THEMES, changeTheme,
      compact, toggleCompact,
      fontSize, changeFontSize,
    }}>
      {children}
    </ThemeCtx.Provider>
  );
}

// Hook de acceso rápido
export const useTheme = () => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
};