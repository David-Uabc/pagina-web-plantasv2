import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";

const DEFAULT_FORM = {
  name: "", sector: "Superior", minHumidity: "", maxHumidity: "",
  irrigationType: "Diario", imageUrl: "", notes: "",
  schedule: { enabled: false, days: [], time: "07:00", duration: 10 },
};

const IRRIGATION_OPTIONS = [
  { value: "Diario",      label: "Diario",      icon: "🌤", desc: "Cada 24 horas" },
  { value: "Semanal",     label: "Semanal",     icon: "📅", desc: "Una vez por semana" },
  { value: "Quincenal",   label: "Quincenal",   icon: "🗓", desc: "Cada 15 días" },
  { value: "Por humedad", label: "Por humedad", icon: "💧", desc: "Según sensor" },
];
const SECTOR_OPTIONS = [
  { value: "Superior", label: "Patio Superior", icon: "🌿", color: "#34d399" },
  { value: "Inferior", label: "Patio Inferior", icon: "🌱", color: "#60a5fa" },
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
  { short:"D", label:"Dom", value:0 }, { short:"L", label:"Lun", value:1 },
  { short:"M", label:"Mar", value:2 }, { short:"X", label:"Mié", value:3 },
  { short:"J", label:"Jue", value:4 }, { short:"V", label:"Vie", value:5 },
  { short:"S", label:"Sáb", value:6 },
];

function PlantModal({ isOpen, onClose, onSave, plant, defaultSector = "Superior" }) {
  const [formData, setFormData] = useState({ ...DEFAULT_FORM, sector: defaultSector });
  const [errors,   setErrors]   = useState({});
  const [step,     setStep]     = useState(1);
  const [imgPreviewOk, setImgPreviewOk] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(plant
        ? { ...DEFAULT_FORM, ...plant, schedule: { ...DEFAULT_FORM.schedule, ...(plant.schedule || {}) } }
        : { ...DEFAULT_FORM, sector: defaultSector }
      );
      setErrors({}); setStep(1); setImgPreviewOk(false);
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
    if (!formData.name?.trim()) errs.name = "El nombre es requerido";
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
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(formData);
  };
  const handleClose = () => { setErrors({}); onClose(); };

  const minH = Number(formData.minHumidity) || 0;
  const maxH = Number(formData.maxHumidity) || 0;
  const rangeValid = maxH > minH && minH >= 0 && maxH <= 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
          backdropFilter:"blur(16px)", display:"flex", alignItems:"center",
          justifyContent:"center", zIndex:99999, padding:16,
        }}
      >
        <motion.div
          initial={{ scale:0.88, y:32, opacity:0 }}
          animate={{ scale:1, y:0, opacity:1 }}
          exit={{ scale:0.88, y:20, opacity:0 }}
          transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}
          style={{
            width:"100%", maxWidth:500,
            background:"rgba(8,14,10,0.97)",
            border:"1px solid rgba(52,211,153,0.18)",
            borderRadius:24, overflow:"hidden",
            boxShadow:"0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
            position:"relative", maxHeight:"90vh", overflowY:"auto",
          }}
        >
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,#34d399,#60a5fa,transparent)" }} />

          {/* Header */}
          <div style={{ padding:"28px 28px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{
                width:46, height:46, borderRadius:13,
                background:"linear-gradient(135deg,rgba(52,211,153,0.2),rgba(96,165,250,0.15))",
                border:"1px solid rgba(52,211,153,0.25)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, overflow:"hidden",
              }}>
                {formData.imageUrl && imgPreviewOk
                  ? <img src={formData.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : (plant ? "✏️" : "🌱")}
              </div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:19, fontWeight:800, color:"#f0f6fc", marginBottom:2 }}>
                  {plant ? "Editar Planta" : "Nueva Planta"}
                </div>
                <div style={{ fontSize:12, color:"#78909c" }}>
                  {step===1 ? "Información básica" : "Humedad, horario y notas"}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {!plant && (
                <div style={{ display:"flex", gap:5 }}>
                  {[1,2].map(s => (
                    <div key={s} style={{
                      width:s===step?20:7, height:7, borderRadius:99,
                      background:s===step?"#34d399":s<step?"rgba(52,211,153,0.4)":"rgba(255,255,255,0.1)",
                      transition:"all 0.3s ease",
                    }} />
                  ))}
                </div>
              )}
              <button onClick={handleClose} style={{
                width:32, height:32, borderRadius:9,
                border:"1px solid rgba(255,255,255,0.08)",
                background:"rgba(255,255,255,0.05)", color:"#78909c", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
              }}>✕</button>
            </div>
          </div>

          <div style={{ padding:"24px 28px 28px" }}>
            <AnimatePresence mode="wait">

              {/* STEP 1 */}
              {step===1 && (
                <motion.div key="step1"
                  initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}
                  exit={{opacity:0,x:-20}} transition={{duration:0.22}}>

                  <div style={{marginBottom:14}}>
                    <label style={labelStyle}>🌿 Nombre de la planta</label>
                    <input name="name" placeholder="ej. Rosa, Cactus, Albahaca..."
                      value={formData.name} onChange={handleChange} autoFocus
                      style={{...inputStyle, borderColor:errors.name?"rgba(248,113,113,0.5)":"rgba(255,255,255,0.08)"}} />
                    {errors.name && <span style={errorStyle}>{errors.name}</span>}
                  </div>

                  <div style={{marginBottom:14}}>
                    <label style={labelStyle}>📍 Sector</label>
                    <div style={{display:"flex",gap:10}}>
                      {SECTOR_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={()=>setFormData(p=>({...p,sector:opt.value}))}
                          style={{
                            flex:1, padding:"14px 10px", borderRadius:13,
                            border:formData.sector===opt.value?`1px solid ${opt.color}50`:"1px solid rgba(255,255,255,0.07)",
                            background:formData.sector===opt.value?`rgba(${opt.value==="Superior"?"52,211,153":"96,165,250"},0.10)`:"rgba(255,255,255,0.03)",
                            cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                            transition:"all 0.2s", position:"relative", overflow:"hidden",
                          }}>
                          {formData.sector===opt.value && (
                            <div style={{position:"absolute",top:7,right:7,width:16,height:16,borderRadius:"50%",background:opt.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#000",fontWeight:700}}>✓</div>
                          )}
                          <span style={{fontSize:24}}>{opt.icon}</span>
                          <span style={{fontSize:12,fontWeight:700,color:formData.sector===opt.value?opt.color:"#78909c"}}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{marginBottom:14}}>
                    <label style={labelStyle}>💧 Tipo de riego</label>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {IRRIGATION_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={()=>setFormData(p=>({...p,irrigationType:opt.value}))}
                          style={{
                            padding:"11px 12px", borderRadius:11,
                            border:formData.irrigationType===opt.value?"1px solid rgba(52,211,153,0.4)":"1px solid rgba(255,255,255,0.07)",
                            background:formData.irrigationType===opt.value?"rgba(52,211,153,0.10)":"rgba(255,255,255,0.03)",
                            cursor:"pointer", display:"flex", alignItems:"center", gap:9, transition:"all 0.2s", textAlign:"left",
                          }}>
                          <span style={{fontSize:18}}>{opt.icon}</span>
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:formData.irrigationType===opt.value?"#34d399":"#b0bec5"}}>{opt.label}</div>
                            <div style={{fontSize:10,color:"#78909c"}}>{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{marginBottom:20}}>
                    <label style={labelStyle}>🖼 Imagen (opcional)</label>
                    <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                      {QUICK_IMAGES.map(img => (
                        <button key={img.label} type="button"
                          onClick={()=>{setFormData(p=>({...p,imageUrl:img.url}));setImgPreviewOk(true);}}
                          style={{
                            padding:"5px 10px", borderRadius:99, fontSize:11,
                            border:formData.imageUrl===img.url?"1px solid rgba(52,211,153,0.5)":"1px solid rgba(255,255,255,0.08)",
                            background:formData.imageUrl===img.url?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.03)",
                            color:formData.imageUrl===img.url?"#34d399":"#78909c", cursor:"pointer", transition:"all 0.2s",
                          }}>{img.emoji} {img.label}</button>
                      ))}
                      {formData.imageUrl && (
                        <button type="button" onClick={()=>{setFormData(p=>({...p,imageUrl:""}));setImgPreviewOk(false);}}
                          style={{padding:"5px 10px",borderRadius:99,fontSize:11,border:"1px solid rgba(248,113,113,0.3)",background:"rgba(248,113,113,0.08)",color:"#f87171",cursor:"pointer"}}>
                          ✕ Quitar</button>
                      )}
                    </div>
                    <div style={{position:"relative"}}>
                      <input name="imageUrl" placeholder="O pega una URL de imagen..."
                        value={formData.imageUrl} onChange={e=>{handleChange(e);setImgPreviewOk(false);}}
                        style={{...inputStyle,paddingRight:formData.imageUrl?40:14}} />
                      {formData.imageUrl && imgPreviewOk && (
                        <FaCheckCircle style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#34d399",fontSize:14}} />
                      )}
                    </div>
                    {formData.imageUrl && (
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} style={{marginTop:8}}>
                        <img src={formData.imageUrl} alt="preview"
                          onLoad={()=>setImgPreviewOk(true)} onError={()=>setImgPreviewOk(false)}
                          style={{width:"100%",height:80,objectFit:"cover",borderRadius:10,border:"1px solid rgba(52,211,153,0.2)",display:imgPreviewOk?"block":"none"}} />
                        {!imgPreviewOk && <div style={{fontSize:11,color:"#f87171",marginTop:4}}>⚠ URL de imagen inválida</div>}
                      </motion.div>
                    )}
                  </div>

                  <button type="button" onClick={plant?()=>handleSubmit():handleNext} style={submitStyle}>
                    {plant?"💾 Guardar cambios":"Continuar →"}
                  </button>
                </motion.div>
              )}

              {/* STEP 2 */}
              {step===2 && (
                <motion.div key="step2"
                  initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}
                  exit={{opacity:0,x:-20}} transition={{duration:0.22}}>

                  {/* Humedad */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                    <div>
                      <label style={labelStyle}>🔻 Humedad mínima (%)</label>
                      <input type="number" name="minHumidity" placeholder="ej. 30"
                        value={formData.minHumidity} onChange={handleChange} min={0} max={100}
                        style={{...inputStyle,borderColor:errors.minHumidity?"rgba(248,113,113,0.5)":"rgba(255,255,255,0.08)"}} />
                      {errors.minHumidity && <span style={errorStyle}>{errors.minHumidity}</span>}
                    </div>
                    <div>
                      <label style={labelStyle}>🔺 Humedad máxima (%)</label>
                      <input type="number" name="maxHumidity" placeholder="ej. 70"
                        value={formData.maxHumidity} onChange={handleChange} min={0} max={100}
                        style={{...inputStyle,borderColor:errors.maxHumidity?"rgba(248,113,113,0.5)":"rgba(255,255,255,0.08)"}} />
                      {errors.maxHumidity && <span style={errorStyle}>{errors.maxHumidity}</span>}
                    </div>
                  </div>

                  {/* Preview rango */}
                  <div style={{padding:14,borderRadius:14,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:20}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#78909c",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Vista previa del rango</div>
                    <div style={{position:"relative",height:8,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden",marginBottom:6}}>
                      {rangeValid && (
                        <div style={{position:"absolute",top:0,bottom:0,left:`${minH}%`,width:`${maxH-minH}%`,background:"linear-gradient(90deg,#34d399,#60a5fa)",borderRadius:99}} />
                      )}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#78909c"}}>
                      <span>0%</span>
                      {rangeValid && <span style={{color:"#34d399",fontWeight:700}}>Zona óptima: {minH}% — {maxH}%</span>}
                      <span>100%</span>
                    </div>
                  </div>

                  {/* ✅ Programar riego */}
                  <div style={{marginBottom:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <label style={{...labelStyle,marginBottom:0}}>⏰ Programar riego automático</label>
                      <button type="button" onClick={()=>handleScheduleChange("enabled",!formData.schedule.enabled)}
                        style={{
                          width:42, height:24, borderRadius:99, border:"none", cursor:"pointer",
                          background:formData.schedule.enabled?"linear-gradient(135deg,#059669,#34d399)":"rgba(255,255,255,0.1)",
                          position:"relative", transition:"background 0.25s", flexShrink:0,
                        }}>
                        <motion.div animate={{x:formData.schedule.enabled?18:0}}
                          transition={{type:"spring",stiffness:500,damping:32}}
                          style={{position:"absolute",top:3,left:3,width:18,height:18,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}} />
                      </button>
                    </div>
                    <AnimatePresence>
                      {formData.schedule.enabled && (
                        <motion.div
                          initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
                          exit={{opacity:0,height:0}} transition={{duration:0.25}} style={{overflow:"hidden"}}>
                          <div style={{padding:14,borderRadius:13,background:"rgba(52,211,153,0.05)",border:"1px solid rgba(52,211,153,0.15)"}}>
                            <div style={{marginBottom:12}}>
                              <div style={{fontSize:11,color:"#78909c",fontWeight:600,marginBottom:8}}>Días de riego</div>
                              <div style={{display:"flex",gap:6}}>
                                {DAYS.map(d => (
                                  <button key={d.value} type="button" onClick={()=>toggleDay(d.value)}
                                    style={{
                                      width:32, height:32, borderRadius:9, border:"none", cursor:"pointer",
                                      background:formData.schedule.days?.includes(d.value)?"linear-gradient(135deg,#059669,#34d399)":"rgba(255,255,255,0.06)",
                                      color:formData.schedule.days?.includes(d.value)?"#fff":"#78909c",
                                      fontSize:11, fontWeight:700, transition:"all 0.15s",
                                    }} title={d.label}>{d.short}</button>
                                ))}
                              </div>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                              <div>
                                <div style={{fontSize:11,color:"#78909c",fontWeight:600,marginBottom:6}}>Hora de inicio</div>
                                <input type="time" value={formData.schedule.time}
                                  onChange={e=>handleScheduleChange("time",e.target.value)}
                                  style={{...inputStyle,padding:"9px 12px"}} />
                              </div>
                              <div>
                                <div style={{fontSize:11,color:"#78909c",fontWeight:600,marginBottom:6}}>Duración (min)</div>
                                <input type="number" min={1} max={120} value={formData.schedule.duration}
                                  onChange={e=>handleScheduleChange("duration",Number(e.target.value))}
                                  style={{...inputStyle,padding:"9px 12px"}} />
                              </div>
                            </div>
                            {formData.schedule.days?.length>0 && (
                              <div style={{marginTop:10,fontSize:11,color:"#34d399"}}>
                                ✓ Regará {formData.schedule.days.map(d=>DAYS[d].label).join(", ")} a las {formData.schedule.time} por {formData.schedule.duration} min
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ✅ Notas */}
                  <div style={{marginBottom:24}}>
                    <label style={labelStyle}>📝 Notas (opcional)</label>
                    <textarea name="notes"
                      placeholder="ej. Trasplantada el 15 feb, abonada con NPK, prefiere sombra parcial..."
                      value={formData.notes||""} onChange={handleChange}
                      rows={3} maxLength={500}
                      style={{...inputStyle,resize:"vertical",minHeight:70,lineHeight:1.5,fontFamily:"'Plus Jakarta Sans',sans-serif"}} />
                    <div style={{fontSize:10,color:"#4d7a5e",textAlign:"right",marginTop:3}}>
                      {(formData.notes||"").length}/500
                    </div>
                  </div>

                  <div style={{display:"flex",gap:10}}>
                    <button type="button" onClick={()=>setStep(1)} style={{
                      flex:1, padding:13, borderRadius:12, border:"1px solid rgba(255,255,255,0.08)",
                      background:"rgba(255,255,255,0.04)", color:"#b0bec5",
                      fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
                    }}>← Atrás</button>
                    <button type="button" onClick={handleSubmit} style={{...submitStyle,flex:2}}>
                      💾 {plant?"Guardar cambios":"Crear planta"}
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

const labelStyle  = { display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", color:"#78909c", marginBottom:7 };
const inputStyle  = { width:"100%", padding:"12px 14px", borderRadius:11, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:"#f0f6fc", fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s,background 0.2s" };
const submitStyle = { width:"100%", padding:13, borderRadius:12, border:"none", background:"linear-gradient(135deg,#059669,#34d399)", color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, cursor:"pointer", boxShadow:"0 4px 20px rgba(52,211,153,0.30)", transition:"box-shadow 0.2s,transform 0.15s" };
const errorStyle  = { fontSize:11, color:"#f87171", marginTop:4, display:"block" };

export default PlantModal;