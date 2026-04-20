import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaInfoCircle } from "react-icons/fa";

// ── Datos del formulario por defecto ─────────────────
const DEFAULT_FORM = {
  name: "", sector: "Superior", minHumidity: "", maxHumidity: "",
  irrigationType: "Diario", imageUrl: "", notes: "",
  valveNumber: 1,
  schedule: { enabled: false, days: [], time: "07:00", duration: 10 },
};

const IRRIGATION_OPTIONS = [
  { value: "Diario",      label: "Diario",      icon: "🌤", desc: "Cada 24 horas" },
  { value: "Semanal",     label: "Semanal",     icon: "📅", desc: "Una vez por semana" },
  { value: "Quincenal",   label: "Quincenal",   icon: "🗓", desc: "Cada 15 días" },
  { value: "Por humedad", label: "Por humedad", icon: "💧", desc: "Según sensor" },
];
const SECTOR_OPTIONS = [
  { value: "Superior", label: "Patio Superior", icon: "🌿", color: "#34d399", rgb: "52,211,153" },
  { value: "Inferior", label: "Patio Inferior", icon: "🌱", color: "#60a5fa", rgb: "96,165,250" },
];
const QUICK_IMAGES = [
  { label: "Rosa",     url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",  emoji: "🌹" },
  { label: "Cactus",  url: "https://images.unsplash.com/photo-1512427691650-6c1e8d3bfa63?w=600&q=80",  emoji: "🌵" },
  { label: "Lavanda", url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&q=80",  emoji: "💜" },
  { label: "Tomate",  url: "https://images.unsplash.com/photo-1546470427-e2a4e5eaccf5?w=600&q=80",     emoji: "🍅" },
  { label: "Menta",   url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80",  emoji: "🌿" },
  { label: "Girasol", url: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&q=80",  emoji: "🌻" },
];
const DAYS = [
  { short: "D", label: "Domingo",   value: 0 },
  { short: "L", label: "Lunes",     value: 1 },
  { short: "M", label: "Martes",    value: 2 },
  { short: "X", label: "Miércoles", value: 3 },
  { short: "J", label: "Jueves",    value: 4 },
  { short: "V", label: "Viernes",   value: 5 },
  { short: "S", label: "Sábado",    value: 6 },
];

// ── Válvulas físicas ──────────────────────────────────
// valveNumber 1-5 → relé D2-D6 → pin ESP32 26,27,14,12,13
const VALVE_OPTIONS = [
  { value: 1, pin: "D2", pinNum: 26, color: "#34d399" },
  { value: 2, pin: "D3", pinNum: 27, color: "#60a5fa" },
  { value: 3, pin: "D4", pinNum: 14, color: "#a78bfa" },
  { value: 4, pin: "D5", pinNum: 12, color: "#fbbf24" },
  { value: 5, pin: "D6", pinNum: 13, color: "#f87171" },
];

// ═══════════════════════════════════════════════════════
function PlantModal({ isOpen, onClose, onSave, plant, defaultSector = "Superior", usedValves = [] }) {
  const [formData,    setFormData]    = useState({ ...DEFAULT_FORM, sector: defaultSector });
  const [errors,      setErrors]      = useState({});
  const [step,        setStep]        = useState(1);
  const [imgPreviewOk,setImgPreviewOk]= useState(false);
  const [tooltip,     setTooltip]     = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(plant
        ? { ...DEFAULT_FORM, ...plant, schedule: { ...DEFAULT_FORM.schedule, ...(plant.schedule || {}) } }
        : { ...DEFAULT_FORM, sector: defaultSector }
      );
      setErrors({}); setStep(1); setImgPreviewOk(false); setTooltip(null);
    }
  }, [isOpen, plant, defaultSector]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
  };
  const handleScheduleChange = (key, value) =>
    setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, [key]: value } }));
  const toggleDay = (day) => {
    const days = formData.schedule.days || [];
    handleScheduleChange("days", days.includes(day) ? days.filter(d => d !== day) : [...days, day]);
  };
  const validateStep1 = () => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = "Escribe el nombre de la planta";
    return errs;
  };
  const validateStep2 = () => {
    const errs = {};
    if (formData.minHumidity === "") errs.minHumidity = "Requerido";
    if (formData.maxHumidity === "") errs.maxHumidity = "Requerido";
    if (formData.minHumidity !== "" && formData.maxHumidity !== "" &&
      Number(formData.minHumidity) >= Number(formData.maxHumidity))
      errs.maxHumidity = "El máximo debe ser mayor que el mínimo";
    return errs;
  };
  const handleNext = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(2);
  };
  const handleSubmit = () => {
    const errs = validateStep2();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(formData);
  };
  const handleClose = () => { setErrors({}); onClose(); };

  const minH       = Number(formData.minHumidity) || 0;
  const maxH       = Number(formData.maxHumidity) || 0;
  const rangeValid = maxH > minH && minH >= 0 && maxH <= 100;
  const sectorColor = SECTOR_OPTIONS.find(s => s.value === formData.sector)?.color || "#34d399";
  const sectorRgb   = SECTOR_OPTIONS.find(s => s.value === formData.sector)?.rgb   || "52,211,153";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.80)",
          backdropFilter: "blur(20px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 99999, padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.88, y: 32, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.88, y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%", maxWidth: 520,
            background: "rgba(6, 12, 8, 0.98)",
            border: `1px solid rgba(${sectorRgb}, 0.22)`,
            borderRadius: 26, overflow: "hidden",
            boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 40px rgba(${sectorRgb},0.06), inset 0 1px 0 rgba(255,255,255,0.06)`,
            position: "relative", maxHeight: "92vh", overflowY: "auto",
            transition: "border-color 0.4s ease, box-shadow 0.4s ease",
          }}
        >
          {/* Top accent animado */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${sectorColor}, #60a5fa, transparent)`,
            transition: "background 0.4s ease",
          }} />

          {/* ── HEADER ── */}
          <div style={{ padding: "28px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Avatar con imagen preview */}
              <div style={{
                width: 52, height: 52, borderRadius: 15,
                background: `linear-gradient(135deg, rgba(${sectorRgb},0.2), rgba(96,165,250,0.12))`,
                border: `1px solid rgba(${sectorRgb},0.28)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, overflow: "hidden", flexShrink: 0,
                boxShadow: `0 4px 20px rgba(${sectorRgb},0.15)`,
              }}>
                {formData.imageUrl && imgPreviewOk
                  ? <img src={formData.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (plant ? "✏️" : "🌱")}
              </div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#f0f6fc", marginBottom: 3, letterSpacing: "-0.3px" }}>
                  {plant ? "Editar Planta" : "Nueva Planta"}
                </div>
                <div style={{ fontSize: 13, color: "#78909c", fontWeight: 500 }}>
                  {step === 1 ? "Paso 1 — Información básica" : "Paso 2 — Humedad y programación"}
                </div>
              </div>
            </div>

            {/* Indicador de pasos + botón cerrar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {!plant && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {[1, 2].map(s => (
                    <div key={s} style={{
                      width: s === step ? 24 : 8, height: 8, borderRadius: 99,
                      background: s === step ? sectorColor : s < step ? `rgba(${sectorRgb},0.45)` : "rgba(255,255,255,0.1)",
                      transition: "all 0.35s ease",
                    }} />
                  ))}
                </div>
              )}
              <button onClick={handleClose} style={{
                width: 36, height: 36, borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.05)", color: "#78909c",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.12)"; e.currentTarget.style.color = "#f87171"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#78909c"; }}
              >✕</button>
            </div>
          </div>

          {/* ── CONTENIDO ── */}
          <div style={{ padding: "22px 28px 30px" }}>
            <AnimatePresence mode="wait">

              {/* ══════════════ STEP 1 ══════════════ */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>

                  {/* NOMBRE */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>🌿 Nombre de la planta</label>
                    <input
                      name="name"
                      placeholder="ej. Rosa, Cactus, Albahaca..."
                      value={formData.name}
                      onChange={handleChange}
                      autoFocus
                      autoComplete="off"
                      style={{
                        ...inputStyle,
                        fontSize: 15,
                        borderColor: errors.name ? "rgba(248,113,113,0.55)" : "rgba(255,255,255,0.09)",
                        minHeight: 48,
                      }}
                    />
                    {errors.name && <span style={errorStyle}>⚠ {errors.name}</span>}
                  </div>

                  {/* SECTOR */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>📍 Sector</label>
                    <div style={{ display: "flex", gap: 12 }}>
                      {SECTOR_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setFormData(p => ({ ...p, sector: opt.value }))}
                          style={{
                            flex: 1, padding: "16px 12px", borderRadius: 15,
                            border: formData.sector === opt.value
                              ? `1.5px solid ${opt.color}60`
                              : "1px solid rgba(255,255,255,0.07)",
                            background: formData.sector === opt.value
                              ? `rgba(${opt.rgb},0.12)`
                              : "rgba(255,255,255,0.03)",
                            cursor: "pointer", display: "flex", flexDirection: "column",
                            alignItems: "center", gap: 8, transition: "all 0.22s",
                            position: "relative", overflow: "hidden",
                            boxShadow: formData.sector === opt.value
                              ? `0 4px 20px rgba(${opt.rgb},0.12)`
                              : "none",
                          }}>
                          {formData.sector === opt.value && (
                            <div style={{
                              position: "absolute", top: 8, right: 8,
                              width: 18, height: 18, borderRadius: "50%",
                              background: opt.color,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 10, color: "#000", fontWeight: 800,
                            }}>✓</div>
                          )}
                          <span style={{ fontSize: 28 }}>{opt.icon}</span>
                          <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: formData.sector === opt.value ? opt.color : "#78909c",
                          }}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VÁLVULA ASIGNADA */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>🔧 Válvula asignada al ESP32</label>
                      <div
                        style={{ color: "#4d7a5e", cursor: "pointer", fontSize: 13 }}
                        onMouseEnter={() => setTooltip("Cada válvula controla un relé físico en la caja de control. Asigna una válvula diferente a cada planta.")}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <FaInfoCircle />
                      </div>
                    </div>

                    {/* Tooltip */}
                    <AnimatePresence>
                      {tooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{
                            padding: "9px 13px", borderRadius: 10, marginBottom: 10,
                            background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
                            fontSize: 12, color: "#94a3b8", lineHeight: 1.5,
                          }}
                        >
                          💡 {tooltip}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                      {VALVE_OPTIONS.map(opt => {
                        const ocupada    = usedValves.includes(opt.value) && opt.value !== formData.valveNumber;
                        const seleccion  = formData.valveNumber === opt.value;
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => !ocupada && setFormData(p => ({ ...p, valveNumber: opt.value }))}
                            title={ocupada ? `Válvula ${opt.value} ya está asignada a otra planta` : `Pin ${opt.pin} — GPIO ${opt.pinNum}`}
                            style={{
                              padding: "14px 6px", borderRadius: 13,
                              border: seleccion
                                ? `1.5px solid ${opt.color}70`
                                : ocupada
                                  ? "1px solid rgba(255,255,255,0.04)"
                                  : "1px solid rgba(255,255,255,0.08)",
                              background: seleccion
                                ? `rgba(${opt.color.replace("#","")},0.05)`  // fallback
                                : ocupada
                                  ? "rgba(255,255,255,0.02)"
                                  : "rgba(255,255,255,0.03)",
                              cursor: ocupada ? "not-allowed" : "pointer",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                              transition: "all 0.2s", opacity: ocupada ? 0.38 : 1,
                              boxShadow: seleccion ? `0 4px 16px rgba(52,211,153,0.15)` : "none",
                            }}>
                            <span style={{ fontSize: 18 }}>{ocupada ? "🔒" : "💧"}</span>
                            <span style={{
                              fontSize: 13, fontWeight: 800,
                              color: seleccion ? opt.color : ocupada ? "#4d5e52" : "#94a3b8",
                            }}>V{opt.value}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 600,
                              color: seleccion ? `${opt.color}90` : "#3d5444",
                            }}>{opt.pin}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: "#4d7a5e", marginTop: 7, display: "flex", alignItems: "center", gap: 5 }}>
                      <span>⚡</span>
                      <span>V{formData.valveNumber} → Relé {formData.valveNumber} → Pin {VALVE_OPTIONS[formData.valveNumber-1]?.pin} (GPIO {VALVE_OPTIONS[formData.valveNumber-1]?.pinNum})</span>
                    </div>
                  </div>

                  {/* TIPO DE RIEGO */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>💧 Tipo de riego</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {IRRIGATION_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setFormData(p => ({ ...p, irrigationType: opt.value }))}
                          style={{
                            padding: "13px 14px", borderRadius: 13,
                            border: formData.irrigationType === opt.value
                              ? "1.5px solid rgba(52,211,153,0.45)"
                              : "1px solid rgba(255,255,255,0.07)",
                            background: formData.irrigationType === opt.value
                              ? "rgba(52,211,153,0.10)"
                              : "rgba(255,255,255,0.03)",
                            cursor: "pointer", display: "flex", alignItems: "center",
                            gap: 10, transition: "all 0.2s", textAlign: "left",
                            boxShadow: formData.irrigationType === opt.value
                              ? "0 4px 16px rgba(52,211,153,0.10)"
                              : "none",
                          }}>
                          <span style={{ fontSize: 20 }}>{opt.icon}</span>
                          <div>
                            <div style={{
                              fontSize: 13, fontWeight: 700,
                              color: formData.irrigationType === opt.value ? "#34d399" : "#b0bec5",
                              marginBottom: 2,
                            }}>{opt.label}</div>
                            <div style={{ fontSize: 11, color: "#5a7a66" }}>{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* IMAGEN */}
                  <div style={{ marginBottom: 22 }}>
                    <label style={labelStyle}>🖼 Imagen (opcional)</label>
                    <div style={{ display: "flex", gap: 7, marginBottom: 10, flexWrap: "wrap" }}>
                      {QUICK_IMAGES.map(img => (
                        <button key={img.label} type="button"
                          onClick={() => { setFormData(p => ({ ...p, imageUrl: img.url })); setImgPreviewOk(true); }}
                          style={{
                            padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                            border: formData.imageUrl === img.url
                              ? "1.5px solid rgba(52,211,153,0.5)"
                              : "1px solid rgba(255,255,255,0.08)",
                            background: formData.imageUrl === img.url
                              ? "rgba(52,211,153,0.12)"
                              : "rgba(255,255,255,0.03)",
                            color: formData.imageUrl === img.url ? "#34d399" : "#78909c",
                            cursor: "pointer", transition: "all 0.18s",
                          }}>{img.emoji} {img.label}</button>
                      ))}
                      {formData.imageUrl && (
                        <button type="button"
                          onClick={() => { setFormData(p => ({ ...p, imageUrl: "" })); setImgPreviewOk(false); }}
                          style={{
                            padding: "6px 12px", borderRadius: 99, fontSize: 12,
                            border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)",
                            color: "#f87171", cursor: "pointer",
                          }}>✕ Quitar</button>
                      )}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input name="imageUrl" placeholder="O pega una URL de imagen..."
                        value={formData.imageUrl}
                        onChange={e => { handleChange(e); setImgPreviewOk(false); }}
                        style={{ ...inputStyle, paddingRight: formData.imageUrl ? 42 : 14, fontSize: 13 }}
                      />
                      {formData.imageUrl && imgPreviewOk && (
                        <FaCheckCircle style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: "#34d399", fontSize: 15 }} />
                      )}
                    </div>
                    {formData.imageUrl && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: 10 }}>
                        <img src={formData.imageUrl} alt="preview"
                          onLoad={() => setImgPreviewOk(true)} onError={() => setImgPreviewOk(false)}
                          style={{
                            width: "100%", height: 90, objectFit: "cover",
                            borderRadius: 12, border: "1px solid rgba(52,211,153,0.2)",
                            display: imgPreviewOk ? "block" : "none",
                          }} />
                        {!imgPreviewOk && (
                          <div style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>⚠ URL de imagen inválida</div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <button type="button"
                    onClick={plant ? handleSubmit : handleNext}
                    style={btnPrimary(sectorColor)}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    {plant ? "💾 Guardar cambios" : "Continuar →"}
                  </button>
                </motion.div>
              )}

              {/* ══════════════ STEP 2 ══════════════ */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>

                  {/* HUMEDAD */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                    <div>
                      <label style={labelStyle}>🔻 Humedad mínima (%)</label>
                      <input type="number" name="minHumidity" placeholder="ej. 30"
                        value={formData.minHumidity} onChange={handleChange} min={0} max={100}
                        style={{
                          ...inputStyle, fontSize: 16, fontWeight: 700, minHeight: 50,
                          borderColor: errors.minHumidity ? "rgba(248,113,113,0.55)" : "rgba(255,255,255,0.09)",
                        }}
                      />
                      {errors.minHumidity && <span style={errorStyle}>⚠ {errors.minHumidity}</span>}
                    </div>
                    <div>
                      <label style={labelStyle}>🔺 Humedad máxima (%)</label>
                      <input type="number" name="maxHumidity" placeholder="ej. 70"
                        value={formData.maxHumidity} onChange={handleChange} min={0} max={100}
                        style={{
                          ...inputStyle, fontSize: 16, fontWeight: 700, minHeight: 50,
                          borderColor: errors.maxHumidity ? "rgba(248,113,113,0.55)" : "rgba(255,255,255,0.09)",
                        }}
                      />
                      {errors.maxHumidity && <span style={errorStyle}>⚠ {errors.maxHumidity}</span>}
                    </div>
                  </div>

                  {/* VISTA PREVIA DEL RANGO */}
                  <div style={{
                    padding: "16px 18px", borderRadius: 16,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    marginBottom: 20,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#5a7a66", textTransform: "uppercase", letterSpacing: "0.9px", marginBottom: 12 }}>
                      Vista previa del rango de humedad
                    </div>
                    <div style={{ position: "relative", height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                      {rangeValid && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${maxH - minH}%`, left: `${minH}%` }}
                          style={{ position: "absolute", top: 0, bottom: 0, background: "linear-gradient(90deg,#34d399,#60a5fa)", borderRadius: 99 }}
                        />
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5a7a66" }}>
                      <span>0% — Muy seco</span>
                      {rangeValid && (
                        <span style={{ color: "#34d399", fontWeight: 700, fontSize: 12 }}>
                          ✓ Zona óptima: {minH}% — {maxH}%
                        </span>
                      )}
                      <span>100% — Muy húmedo</span>
                    </div>
                  </div>

                  {/* PROGRAMAR RIEGO */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: 2 }}>⏰ Riego automático programado</label>
                        <div style={{ fontSize: 12, color: "#4d7a5e" }}>
                          El sistema regará en los días y hora que elijas
                        </div>
                      </div>
                      {/* Toggle switch */}
                      <button type="button"
                        onClick={() => handleScheduleChange("enabled", !formData.schedule.enabled)}
                        style={{
                          width: 48, height: 27, borderRadius: 99, border: "none", cursor: "pointer",
                          background: formData.schedule.enabled
                            ? "linear-gradient(135deg,#059669,#34d399)"
                            : "rgba(255,255,255,0.10)",
                          position: "relative", transition: "background 0.28s", flexShrink: 0,
                        }}>
                        <motion.div
                          animate={{ x: formData.schedule.enabled ? 21 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          style={{
                            position: "absolute", top: 3, left: 3,
                            width: 21, height: 21, borderRadius: "50%",
                            background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                          }}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {formData.schedule.enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }}
                          style={{ overflow: "hidden" }}>
                          <div style={{
                            padding: "16px 16px", borderRadius: 16,
                            background: "rgba(52,211,153,0.05)",
                            border: "1px solid rgba(52,211,153,0.16)",
                          }}>
                            {/* Días */}
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 12, color: "#78909c", fontWeight: 600, marginBottom: 10 }}>
                                Días de riego
                              </div>
                              <div style={{ display: "flex", gap: 7 }}>
                                {DAYS.map(d => (
                                  <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                                    title={d.label}
                                    style={{
                                      width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
                                      background: formData.schedule.days?.includes(d.value)
                                        ? "linear-gradient(135deg,#059669,#34d399)"
                                        : "rgba(255,255,255,0.06)",
                                      color: formData.schedule.days?.includes(d.value) ? "#fff" : "#78909c",
                                      fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                                    }}>{d.short}</button>
                                ))}
                              </div>
                            </div>

                            {/* Hora y duración */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 12, color: "#78909c", fontWeight: 600, marginBottom: 7 }}>
                                  Hora de inicio
                                </div>
                                <input type="time" value={formData.schedule.time}
                                  onChange={e => handleScheduleChange("time", e.target.value)}
                                  style={{ ...inputStyle, padding: "11px 12px", fontSize: 14, minHeight: 44 }}
                                />
                              </div>
                              <div>
                                <div style={{ fontSize: 12, color: "#78909c", fontWeight: 600, marginBottom: 7 }}>
                                  Duración (minutos)
                                </div>
                                <input type="number" min={1} max={120} value={formData.schedule.duration}
                                  onChange={e => handleScheduleChange("duration", Number(e.target.value))}
                                  style={{ ...inputStyle, padding: "11px 12px", fontSize: 14, minHeight: 44 }}
                                />
                              </div>
                            </div>

                            {formData.schedule.days?.length > 0 && (
                              <div style={{ marginTop: 12, fontSize: 12, color: "#34d399", lineHeight: 1.6 }}>
                                ✓ Regará {formData.schedule.days.map(d => DAYS[d].label).join(", ")} a las {formData.schedule.time} por {formData.schedule.duration} min
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* NOTAS */}
                  <div style={{ marginBottom: 26 }}>
                    <label style={labelStyle}>📝 Notas personales (opcional)</label>
                    <textarea name="notes"
                      placeholder="ej. Trasplantada el 15 feb, prefiere sombra parcial, abonada con NPK..."
                      value={formData.notes || ""} onChange={handleChange}
                      rows={3} maxLength={500}
                      style={{
                        ...inputStyle, resize: "vertical", minHeight: 80,
                        lineHeight: 1.6, fontFamily: "'Inter',sans-serif",
                        fontSize: 14, padding: "12px 14px",
                      }}
                    />
                    <div style={{ fontSize: 11, color: "#4d5e52", textAlign: "right", marginTop: 4 }}>
                      {(formData.notes || "").length}/500
                    </div>
                  </div>

                  {/* BOTONES */}
                  <div style={{ display: "flex", gap: 12 }}>
                    <button type="button" onClick={() => setStep(1)} style={{
                      flex: 1, padding: "14px 0", borderRadius: 13,
                      border: "1px solid rgba(255,255,255,0.09)",
                      background: "rgba(255,255,255,0.04)", color: "#b0bec5",
                      fontWeight: 600, fontSize: 14, cursor: "pointer",
                      fontFamily: "'Inter',sans-serif", transition: "all 0.18s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    >← Atrás</button>

                    <button type="button" onClick={handleSubmit}
                      style={{ ...btnPrimary(sectorColor), flex: 2 }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      💾 {plant ? "Guardar cambios" : "Crear planta"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Estilos ───────────────────────────────────────────
const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.9px",
  color: "#6b8f7a", marginBottom: 8,
};
const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(255,255,255,0.04)", color: "#f0f6fc",
  fontSize: 14, fontFamily: "'Inter',sans-serif",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
};
const errorStyle = {
  fontSize: 12, color: "#f87171", marginTop: 5,
  display: "block", fontWeight: 500,
};
const btnPrimary = (color = "#34d399") => ({
  width: "100%", padding: "14px 0", borderRadius: 13, border: "none",
  background: `linear-gradient(135deg, #059669, ${color})`,
  color: "#fff", fontFamily: "'Inter',sans-serif",
  fontWeight: 700, fontSize: 15, cursor: "pointer",
  boxShadow: `0 4px 24px rgba(5,150,105,0.30)`,
  transition: "box-shadow 0.2s, transform 0.18s",
});

export default PlantModal;