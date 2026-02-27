// GlobalSearch.jsx — Búsqueda global accesible desde el Navbar
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Leaf, AlertTriangle, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";

function plantStatus(p) {
  if (p.valveStatus === "OPEN") return { label: "Regando", color: "#60a5fa", icon: <Droplets size={10} /> };
  if ((p.currentHumidity ?? 0) < p.minHumidity) return { label: "Alerta", color: "#f87171", icon: <AlertTriangle size={10} /> };
  return { label: "OK", color: "#34d399", icon: <Leaf size={10} /> };
}

export default function GlobalSearch({ plants = [] }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Ctrl+K o Cmd+K para abrir
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
    else setQuery("");
  }, [open]);

  const results = query.trim().length < 1 ? [] : plants.filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase()) ||
    p.sector?.toLowerCase().includes(query.toLowerCase()) ||
    p.irrigationType?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (plant) => {
    const path = plant.sector === "Superior" ? "/superior" : "/inferior";
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Buscar planta (Ctrl+K)"
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "6px 12px", borderRadius: 99,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#78909c", cursor: "pointer", fontSize: 12,
          transition: "all 0.2s",
        }}
      >
        <Search size={13} />
        <span style={{ display: "none" }}>Buscar</span>
        <span style={{
          display: "flex", gap: 3, alignItems: "center",
          padding: "1px 6px", borderRadius: 5, fontSize: 10,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.10)", color: "#4d7a5e",
        }}>⌘K</span>
      </button>

      {/* Modal de búsqueda */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 999999,
              background: "rgba(0,0,0,0.70)", backdropFilter: "blur(14px)",
              display: "flex", alignItems: "flex-start", justifyContent: "center",
              paddingTop: "12vh", padding: "12vh 16px 16px",
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: -10, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: "100%", maxWidth: 500,
                background: "rgba(8,14,10,0.98)",
                border: "1px solid rgba(52,211,153,0.22)",
                borderRadius: 20, overflow: "hidden",
                boxShadow: "0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(52,211,153,0.08)",
              }}
            >
              {/* Input */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Search size={16} color="#4d7a5e" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar plantas, sectores, tipos de riego..."
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    color: "#f0f6fc", fontSize: 15, fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                />
                {query && (
                  <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#78909c", display: "flex" }}>
                    <X size={14} />
                  </button>
                )}
                <kbd style={{
                  padding: "2px 6px", borderRadius: 5, fontSize: 11,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
                  color: "#4d7a5e", cursor: "pointer",
                }} onClick={() => setOpen(false)}>Esc</kbd>
              </div>

              {/* Resultados */}
              <div style={{ maxHeight: 340, overflowY: "auto" }}>
                {query.trim().length === 0 && (
                  <div style={{ padding: "20px 18px" }}>
                    <div style={{ fontSize: 11, color: "#4d7a5e", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, marginBottom: 10 }}>
                      Todas las plantas
                    </div>
                    {plants.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#78909c", padding: "12px 0" }}>No hay plantas registradas.</div>
                    ) : plants.slice(0, 8).map(p => (
                      <ResultItem key={p._id} plant={p} onSelect={handleSelect} />
                    ))}
                  </div>
                )}

                {query.trim().length > 0 && results.length === 0 && (
                  <div style={{ padding: "28px 18px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                    <div style={{ fontSize: 14, color: "#78909c" }}>Sin resultados para "{query}"</div>
                  </div>
                )}

                {results.length > 0 && (
                  <div style={{ padding: "12px 18px" }}>
                    <div style={{ fontSize: 11, color: "#4d7a5e", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, marginBottom: 8 }}>
                      {results.length} resultado{results.length !== 1 ? "s" : ""}
                    </div>
                    {results.map(p => (
                      <ResultItem key={p._id} plant={p} onSelect={handleSelect} query={query} />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: "10px 18px", borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex", gap: 14, fontSize: 11, color: "#4d7a5e",
              }}>
                <span>↑↓ navegar</span>
                <span>↵ ir a sector</span>
                <span>Esc cerrar</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function highlight(text = "", query = "") {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(52,211,153,0.25)", color: "#34d399", borderRadius: 3, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function ResultItem({ plant, onSelect, query = "" }) {
  const status = plantStatus(plant);
  return (
    <motion.button
      whileHover={{ x: 4, background: "rgba(52,211,153,0.06)" }}
      onClick={() => onSelect(plant)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 8px",
        borderRadius: 10, background: "transparent", border: "none", cursor: "pointer",
        textAlign: "left", transition: "background 0.15s",
      }}
    >
      {/* Imagen o emoji */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0, overflow: "hidden",
        background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
      }}>
        {plant.imageUrl
          ? <img src={plant.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : "🌱"}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f6fc" }}>
          {highlight(plant.name, query)}
        </div>
        <div style={{ fontSize: 11, color: "#78909c", marginTop: 1 }}>
          {plant.sector} · {plant.irrigationType} · {plant.currentHumidity ?? 0}% humedad
        </div>
      </div>

      {/* Status */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "3px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
        background: `${status.color}15`, border: `1px solid ${status.color}25`, color: status.color,
      }}>
        {status.icon}
        {status.label}
      </div>
    </motion.button>
  );
}