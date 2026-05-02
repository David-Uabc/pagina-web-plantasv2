import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Leaf, AlertTriangle, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";

function plantStatus(plant) {
  if (plant.valveStatus === "OPEN") return { label: "Regando", color: "#60a5fa", icon: <Droplets size={10} /> };
  if ((plant.currentHumidity ?? 0) < plant.minHumidity) return { label: "Alerta", color: "#f87171", icon: <AlertTriangle size={10} /> };
  return { label: "OK", color: "#34d399", icon: <Leaf size={10} /> };
}

function GlobalSearch({ plants = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return undefined;
    }

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return plants.filter((plant) =>
      plant.name?.toLowerCase().includes(normalizedQuery) ||
      plant.sector?.toLowerCase().includes(normalizedQuery) ||
      plant.irrigationType?.toLowerCase().includes(normalizedQuery)
    );
  }, [plants, normalizedQuery]);

  const previewPlants = useMemo(() => plants.slice(0, 8), [plants]);

  const handleSelect = (plant) => {
    navigate(plant.sector === "Superior" ? "/superior" : "/inferior");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Buscar planta (Ctrl+K)"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "6px 12px",
          borderRadius: 99,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#78909c",
          cursor: "pointer",
          fontSize: 12,
          transition: "all 0.2s",
        }}
      >
        <Search size={13} />
        <span style={{ display: "none" }}>Buscar</span>
        <span
          style={{
            display: "flex",
            gap: 3,
            alignItems: "center",
            padding: "1px 6px",
            borderRadius: 5,
            fontSize: 10,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#4d7a5e",
          }}
        >
          ⌘K
        </span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="global-search-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(event) => event.target === event.currentTarget && setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 999999,
                background: "rgba(0,0,0,0.70)",
                backdropFilter: "blur(14px)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingTop: "12vh",
                padding: "12vh 16px 16px",
              }}
            >
              <motion.div
                initial={{ scale: 0.92, y: -20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: -10, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: "100%",
                  maxWidth: 500,
                  background: "rgba(8,14,10,0.98)",
                  border: "1px solid rgba(52,211,153,0.22)",
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(52,211,153,0.08)",
                }}
              >
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Search size={16} color="#4d7a5e" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar plantas, sectores, tipos de riego..."
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "#f0f6fc",
                    fontSize: 15,
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                />
                {query && (
                  <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#78909c", display: "flex" }}>
                    <X size={14} />
                  </button>
                )}
                <kbd
                  style={{
                    padding: "2px 6px",
                    borderRadius: 5,
                    fontSize: 11,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "#4d7a5e",
                    cursor: "pointer",
                  }}
                  onClick={() => setOpen(false)}
                >
                  Esc
                </kbd>
              </div>

              <div style={{ maxHeight: 340, overflowY: "auto" }}>
                {normalizedQuery.length === 0 && (
                  <div style={{ padding: "20px 18px" }}>
                    <div style={{ fontSize: 11, color: "#4d7a5e", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, marginBottom: 10 }}>
                      Todas las plantas
                    </div>
                    {plants.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#78909c", padding: "12px 0" }}>No hay plantas registradas.</div>
                    ) : (
                      previewPlants.map((plant) => <ResultItem key={plant._id} plant={plant} onSelect={handleSelect} />)
                    )}
                  </div>
                )}

                {normalizedQuery.length > 0 && results.length === 0 && (
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
                    {results.map((plant) => (
                      <ResultItem key={plant._id} plant={plant} onSelect={handleSelect} query={query} />
                    ))}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "10px 18px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  gap: 14,
                  fontSize: 11,
                  color: "#4d7a5e",
                }}
              >
                <span>↑↓ navegar</span>
                <span>↵ ir a sector</span>
                <span>Esc cerrar</span>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function highlight(text = "", query = "") {
  if (!query.trim()) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark style={{ background: "rgba(52,211,153,0.25)", color: "#34d399", borderRadius: 3, padding: "0 1px" }}>
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

const ResultItem = memo(function ResultItem({ plant, onSelect, query = "" }) {
  const status = plantStatus(plant);

  return (
    <motion.button
      whileHover={{ x: 4, background: "rgba(52,211,153,0.06)" }}
      onClick={() => onSelect(plant)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 8px",
        borderRadius: 10,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          flexShrink: 0,
          overflow: "hidden",
          background: "rgba(52,211,153,0.08)",
          border: "1px solid rgba(52,211,153,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        {plant.imageUrl ? <img src={plant.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🌱"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f6fc" }}>{highlight(plant.name, query)}</div>
        <div style={{ fontSize: 11, color: "#78909c", marginTop: 1 }}>
          {plant.sector} · {plant.irrigationType} · {plant.currentHumidity ?? 0}% humedad
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          borderRadius: 99,
          fontSize: 10,
          fontWeight: 700,
          background: `${status.color}15`,
          border: `1px solid ${status.color}25`,
          color: status.color,
        }}
      >
        {status.icon}
        {status.label}
      </div>
    </motion.button>
  );
});

export default memo(GlobalSearch);
