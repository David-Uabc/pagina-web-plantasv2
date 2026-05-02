import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const THEMES = {
  dark: {
    id: "dark",
    label: "Oscuro",
    icon: "🌑",
    "--bg-base": "#080a0e",
    "--bg-surface": "#0d1117",
    "--bg-card": "rgba(13,17,23,0.90)",
    "--bg-card-solid": "#111520",
    "--bg-input": "rgba(255,255,255,0.055)",
    "--green": "#34d399",
    "--green-light": "#6ee7b7",
    "--green-dim": "rgba(52,211,153,0.09)",
    "--text-1": "#f0f6fc",
    "--text-2": "#c8d6e0",
    "--text-3": "#8fa8b8",
    "--border": "rgba(240,246,252,0.08)",
    "--border-hover": "rgba(240,246,252,0.20)",
    "--accent": "#34d399",
  },
  light: {
    id: "light",
    label: "Claro",
    icon: "☀️",
    "--bg-base": "#f0f7f4",
    "--bg-surface": "#e8f5f0",
    "--bg-card": "rgba(255,255,255,0.95)",
    "--bg-card-solid": "#ffffff",
    "--bg-input": "rgba(0,0,0,0.04)",
    "--green": "#059669",
    "--green-light": "#34d399",
    "--green-dim": "rgba(5,150,105,0.10)",
    "--text-1": "#0f2e1e",
    "--text-2": "#2d5c42",
    "--text-3": "#5a8a6e",
    "--border": "rgba(0,0,0,0.10)",
    "--border-hover": "rgba(0,0,0,0.20)",
    "--accent": "#059669",
  },
  ocean: {
    id: "ocean",
    label: "Océano",
    icon: "🌊",
    "--bg-base": "#060d18",
    "--bg-surface": "#0a1628",
    "--bg-card": "rgba(10,22,40,0.92)",
    "--bg-card-solid": "#0e1e38",
    "--bg-input": "rgba(255,255,255,0.055)",
    "--green": "#22d3ee",
    "--green-light": "#67e8f9",
    "--green-dim": "rgba(34,211,238,0.09)",
    "--text-1": "#e0f2fe",
    "--text-2": "#93c5fd",
    "--text-3": "#60a5fa",
    "--border": "rgba(96,165,250,0.12)",
    "--border-hover": "rgba(96,165,250,0.28)",
    "--accent": "#22d3ee",
  },
  earth: {
    id: "earth",
    label: "Tierra",
    icon: "🌿",
    "--bg-base": "#0e0a06",
    "--bg-surface": "#1a1208",
    "--bg-card": "rgba(26,18,8,0.92)",
    "--bg-card-solid": "#1e1608",
    "--bg-input": "rgba(255,255,255,0.05)",
    "--green": "#d97706",
    "--green-light": "#fbbf24",
    "--green-dim": "rgba(217,119,6,0.10)",
    "--text-1": "#fef3c7",
    "--text-2": "#d4a96a",
    "--text-3": "#92683c",
    "--border": "rgba(217,119,6,0.14)",
    "--border-hover": "rgba(217,119,6,0.30)",
    "--accent": "#d97706",
  },
  violet: {
    id: "violet",
    label: "Violeta",
    icon: "🔮",
    "--bg-base": "#08060f",
    "--bg-surface": "#100d1f",
    "--bg-card": "rgba(16,13,31,0.92)",
    "--bg-card-solid": "#14102a",
    "--bg-input": "rgba(255,255,255,0.05)",
    "--green": "#a78bfa",
    "--green-light": "#c4b5fd",
    "--green-dim": "rgba(167,139,250,0.10)",
    "--text-1": "#ede9fe",
    "--text-2": "#c4b5fd",
    "--text-3": "#8b5cf6",
    "--border": "rgba(167,139,250,0.12)",
    "--border-hover": "rgba(167,139,250,0.28)",
    "--accent": "#a78bfa",
  },
};

const ThemeCtx = createContext(null);

function readLocalStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return value ?? fallback;
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => readLocalStorage("riego_theme", "dark"));
  const [compact, setCompact] = useState(() => readLocalStorage("riego_compact", "false") === "true");
  const [fontSize, setFontSize] = useState(() => {
    const parsed = Number.parseInt(readLocalStorage("riego_fontsize", "15"), 10);
    return Number.isFinite(parsed) ? parsed : 15;
  });

  const applyTheme = useCallback((id) => {
    const theme = THEMES[id] || THEMES.dark;
    const root = document.documentElement;

    Object.entries(theme).forEach(([key, value]) => {
      if (key.startsWith("--")) root.style.setProperty(key, value);
    });

    document.body.className = document.body.className.replace(/\briego-theme-\S+/g, "").trim();
    document.body.classList.add(`riego-theme-${id}`);
    document.body.classList.toggle("light-mode", id === "light");
  }, []);

  const applyCompact = useCallback((enabled) => {
    document.body.classList.toggle("compact-mode", enabled);
  }, []);

  const applyFontSize = useCallback((size) => {
    document.documentElement.style.setProperty("--base-font-size", `${size}px`);
    document.body.style.fontSize = `${size}px`;
  }, []);

  useEffect(() => {
    applyTheme(themeId);
  }, [applyTheme, themeId]);

  useEffect(() => {
    applyCompact(compact);
  }, [applyCompact, compact]);

  useEffect(() => {
    applyFontSize(fontSize);
  }, [applyFontSize, fontSize]);

  const changeTheme = useCallback((id) => {
    if (!THEMES[id]) return;
    setThemeId((prev) => {
      if (prev === id) return prev;
      window.localStorage.setItem("riego_theme", id);
      return id;
    });
  }, []);

  const toggleCompact = useCallback(() => {
    setCompact((prev) => {
      const next = !prev;
      window.localStorage.setItem("riego_compact", String(next));
      return next;
    });
  }, []);

  const changeFontSize = useCallback((size) => {
    const clamped = Math.max(13, Math.min(20, size));
    setFontSize((prev) => {
      if (prev === clamped) return prev;
      window.localStorage.setItem("riego_fontsize", String(clamped));
      return clamped;
    });
  }, []);

  const value = useMemo(() => ({
    themeId,
    theme: THEMES[themeId] || THEMES.dark,
    themes: THEMES,
    changeTheme,
    compact,
    toggleCompact,
    fontSize,
    changeFontSize,
  }), [themeId, changeTheme, compact, toggleCompact, fontSize, changeFontSize]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
