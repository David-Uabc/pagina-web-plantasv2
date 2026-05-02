import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";

const DEFAULT_FORM = {
  name: "",
  sector: "Superior",
  minHumidity: "",
  maxHumidity: "",
  irrigationType: "Diario",
  imageUrl: "",
  notes: "",
  valveNumber: 1,
  schedule: {
    enabled: false,
    days: [0, 1, 2, 3, 4, 5, 6],
    time: "07:00",
    duration: 10,
    startDate: "",
    dayOfMonth: 1,
  },
};

const IRRIGATION_OPTIONS = [
  { value: "Diario", label: "Diario", desc: "Todos los dias" },
  { value: "Semanal", label: "Semanal", desc: "Dias de la semana" },
  { value: "Quincenal", label: "Quincenal", desc: "Cada 15 dias" },
  { value: "Mensual", label: "Mensual", desc: "Dia del mes" },
  { value: "Por humedad", label: "Por humedad", desc: "Solo por sensor" },
];

const IRRIGATION_HELP = {
  Diario: {
    title: "Riego diario",
    text: "La planta se regara todos los dias a la hora configurada.",
  },
  Semanal: {
    title: "Riego semanal",
    text: "Elige uno o varios dias de la semana. Ejemplo: lunes y jueves.",
  },
  Quincenal: {
    title: "Riego quincenal",
    text: "Selecciona una fecha base. Desde ahi se repetira cada 15 dias.",
  },
  Mensual: {
    title: "Riego mensual",
    text: "Selecciona el dia del mes en que quieres que se riegue.",
  },
  "Por humedad": {
    title: "Riego por humedad",
    text: "No usa calendario. Se activa cuando la humedad baja del minimo y se detiene al llegar al maximo.",
  },
};

const SECTOR_OPTIONS = [
  { value: "Superior", label: "Patio Superior", color: "#34d399" },
  { value: "Inferior", label: "Patio Inferior", color: "#60a5fa" },
];

const VALVE_OPTIONS = [1, 2, 3, 4, 5];

const DAYS = [
  { value: 0, short: "D", label: "Domingo" },
  { value: 1, short: "L", label: "Lunes" },
  { value: 2, short: "M", label: "Martes" },
  { value: 3, short: "X", label: "Miercoles" },
  { value: 4, short: "J", label: "Jueves" },
  { value: 5, short: "V", label: "Viernes" },
  { value: 6, short: "S", label: "Sabado" },
];

function buildInitialForm(plant, defaultSector) {
  if (!plant) {
    return {
      ...DEFAULT_FORM,
      sector: defaultSector,
      schedule: {
        ...DEFAULT_FORM.schedule,
        startDate: new Date().toISOString().split("T")[0],
      },
    };
  }

  return {
    ...DEFAULT_FORM,
    ...plant,
    schedule: {
      ...DEFAULT_FORM.schedule,
      ...(plant.schedule || {}),
      startDate: plant.schedule?.startDate || new Date().toISOString().split("T")[0],
    },
  };
}

function normalizeScheduleForType(irrigationType, schedule) {
  const next = {
    enabled: Boolean(schedule.enabled),
    days: Array.isArray(schedule.days) ? schedule.days : [],
    time: schedule.time || "07:00",
    duration: Number(schedule.duration) || 10,
    startDate: schedule.startDate || "",
    dayOfMonth: Number(schedule.dayOfMonth) || 1,
  };

  if (irrigationType === "Por humedad") {
    next.enabled = false;
    next.days = [];
    next.startDate = "";
    next.dayOfMonth = 1;
    return next;
  }

  if (irrigationType === "Diario") {
    next.days = [0, 1, 2, 3, 4, 5, 6];
    next.startDate = "";
    next.dayOfMonth = 1;
    return next;
  }

  if (irrigationType === "Semanal") {
    if (!next.days.length) next.days = [1];
    next.startDate = "";
    next.dayOfMonth = 1;
    return next;
  }

  if (irrigationType === "Quincenal") {
    if (!next.startDate) next.startDate = new Date().toISOString().split("T")[0];
    next.days = [];
    next.dayOfMonth = 1;
    return next;
  }

  if (irrigationType === "Mensual") {
    next.days = [];
    next.startDate = "";
    return next;
  }

  return next;
}

function PlantModal({ isOpen, onClose, onSave, plant, defaultSector = "Superior", usedValves = [] }) {
  const [formData, setFormData] = useState(buildInitialForm(plant, defaultSector));
  const [errors, setErrors] = useState({});
  const [previewOk, setPreviewOk] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(buildInitialForm(plant, defaultSector));
    setErrors({});
    setPreviewOk(false);
  }, [defaultSector, isOpen, plant]);

  const sectorColor = useMemo(
    () => SECTOR_OPTIONS.find((option) => option.value === formData.sector)?.color || "#34d399",
    [formData.sector]
  );
  const irrigationHelp = IRRIGATION_HELP[formData.irrigationType] || IRRIGATION_HELP.Diario;
  const scheduleLabel = formData.schedule.enabled
    ? formData.irrigationType === "Por humedad"
      ? "Sensor activo"
      : "Programacion activa"
    : "Programacion desactivada";

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const setScheduleField = (key, value) => {
    setFormData((prev) => ({ ...prev, schedule: { ...prev.schedule, [key]: value } }));
    setErrors((prev) => ({ ...prev, schedule: null }));
  };

  const changeIrrigationType = (value) => {
    setFormData((prev) => ({
      ...prev,
      irrigationType: value,
      schedule: normalizeScheduleForType(value, prev.schedule),
    }));
  };

  const toggleDay = (day) => {
    const current = formData.schedule.days || [];
    const next = current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort((a, b) => a - b);
    setScheduleField("days", next);
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) nextErrors.name = "Escribe el nombre de la planta";
    if (formData.minHumidity === "" || formData.maxHumidity === "") nextErrors.humidity = "Define humedad minima y maxima";
    if (Number(formData.minHumidity) >= Number(formData.maxHumidity)) nextErrors.humidity = "La humedad maxima debe ser mayor que la minima";

    const selectedValve = Number(formData.valveNumber);
    if (usedValves.includes(selectedValve) && selectedValve !== Number(plant?.valveNumber || 0)) {
      nextErrors.valveNumber = `La valvula V${selectedValve} ya esta ocupada en este sector`;
    }

    if (formData.schedule.enabled && formData.irrigationType === "Semanal" && !(formData.schedule.days || []).length) {
      nextErrors.schedule = "Selecciona al menos un dia para el riego semanal";
    }

    if (formData.schedule.enabled && formData.irrigationType === "Quincenal" && !formData.schedule.startDate) {
      nextErrors.schedule = "Selecciona la fecha base del riego quincenal";
    }

    if (formData.schedule.enabled && formData.irrigationType === "Mensual") {
      const dayOfMonth = Number(formData.schedule.dayOfMonth);
      if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
        nextErrors.schedule = "Selecciona un dia del mes valido";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = () => {
    if (!validate()) return;

    const payload = {
      ...formData,
      valveNumber: Number(formData.valveNumber),
      minHumidity: Number(formData.minHumidity),
      maxHumidity: Number(formData.maxHumidity),
      schedule: normalizeScheduleForType(formData.irrigationType, formData.schedule),
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "rgba(0,0,0,0.76)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.985 }}
          transition={{ duration: 0.14 }}
          style={{
            width: "100%",
            maxWidth: 620,
            maxHeight: "92vh",
            overflowY: "auto",
            borderRadius: 24,
            background: "linear-gradient(180deg, rgba(10,18,24,0.99) 0%, rgba(7,13,18,0.99) 100%)",
            border: `1px solid ${sectorColor}33`,
            boxShadow: `0 28px 70px rgba(0,0,0,0.75), 0 0 0 1px ${sectorColor}18, 0 0 40px ${sectorColor}10`,
          }}
        >
          <div
            style={{
              height: 3,
              width: "100%",
              background: `linear-gradient(90deg, transparent 0%, ${sectorColor} 18%, rgba(255,255,255,0.9) 50%, ${sectorColor} 82%, transparent 100%)`,
              opacity: 0.9,
            }}
          />
          <div style={{ padding: "24px 24px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#f8fbff", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                {plant ? "Editar planta" : "Nueva planta"}
              </div>
              <div style={{ fontSize: 14, color: "#a7bac6", marginTop: 8, lineHeight: 1.5 }}>
                Configura sector, valvula, tipo de riego y programacion.
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#9fb1bb",
                cursor: "pointer",
                transition: "transform 0.18s ease, background 0.18s ease, border-color 0.18s ease",
              }}
            >
              X
            </button>
          </div>

          <div style={{ padding: 24, display: "grid", gap: 18 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                padding: 14,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <InfoPill label="Sector" value={formData.sector === "Superior" ? "Patio Superior" : "Patio Inferior"} tone={sectorColor} />
              <InfoPill label="Valvula" value={`V${formData.valveNumber}`} tone="#60a5fa" />
              <InfoPill label="Riego" value={formData.irrigationType} tone="#f59e0b" />
              <InfoPill label="Estado" value={scheduleLabel} tone={formData.schedule.enabled || formData.irrigationType === "Por humedad" ? "#34d399" : "#94a3b8"} />
            </div>

            <div>
              <label style={labelStyle}>Nombre</label>
              <input value={formData.name} onChange={(e) => setField("name", e.target.value)} style={inputStyle} placeholder="Ej. Lavanda" />
              {errors.name && <div style={errorStyle}>{errors.name}</div>}
            </div>

            <div style={responsiveTwoColStyle}>
              <div>
                <label style={labelStyle}>Sector</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {SECTOR_OPTIONS.map((option) => {
                    const active = formData.sector === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setField("sector", option.value)}
                        style={{
                          ...chipButtonStyle,
                          borderColor: active ? `${option.color}66` : "rgba(255,255,255,0.08)",
                          background: active ? `${option.color}16` : "rgba(255,255,255,0.03)",
                          color: active ? "#effcf7" : "#b6c7d1",
                          boxShadow: active ? `0 8px 18px ${option.color}14` : "none",
                        }}
                      >
                        <span style={{ ...dotStyle, background: option.color, boxShadow: `0 0 12px ${option.color}66` }} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Valvula del ESP32</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
                  {VALVE_OPTIONS.map((value) => {
                    const active = Number(formData.valveNumber) === value;
                    const blocked = usedValves.includes(value) && value !== Number(plant?.valveNumber || 0);
                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={blocked}
                        onClick={() => setField("valveNumber", value)}
                        style={{
                          ...chipButtonStyle,
                          justifyContent: "center",
                          padding: "12px 0",
                          opacity: blocked ? 0.35 : 1,
                          cursor: blocked ? "not-allowed" : "pointer",
                          borderColor: active ? `${sectorColor}66` : blocked ? "rgba(248,113,113,0.18)" : "rgba(255,255,255,0.08)",
                          background: active ? `${sectorColor}18` : blocked ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.03)",
                          color: active ? "#effcf7" : blocked ? "#fca5a5" : "#b6c7d1",
                          boxShadow: active ? `0 8px 18px ${sectorColor}14` : "none",
                        }}
                        title={blocked ? `V${value} ya esta ocupada` : `Valvula V${value}`}
                      >
                        {`V${value}`}
                      </button>
                    );
                  })}
                </div>
                {errors.valveNumber && <div style={errorStyle}>{errors.valveNumber}</div>}
              </div>
            </div>

            <div style={responsiveTwoColStyle}>
              <div>
                <label style={labelStyle}>Humedad minima (%)</label>
                <input type="number" min={0} max={100} value={formData.minHumidity} onChange={(e) => setField("minHumidity", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Humedad maxima (%)</label>
                <input type="number" min={0} max={100} value={formData.maxHumidity} onChange={(e) => setField("maxHumidity", e.target.value)} style={inputStyle} />
              </div>
            </div>
            {errors.humidity && <div style={errorStyle}>{errors.humidity}</div>}

            <div>
              <label style={labelStyle}>Tipo de riego</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                {IRRIGATION_OPTIONS.map((option) => {
                  const active = formData.irrigationType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => changeIrrigationType(option.value)}
                      style={{
                        padding: "14px 12px",
                        borderRadius: 14,
                        border: active ? `1px solid ${sectorColor}66` : "1px solid rgba(255,255,255,0.08)",
                        background: active ? `${sectorColor}18` : "rgba(255,255,255,0.03)",
                        color: active ? "#ecfdf5" : "#b0bec5",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease",
                        boxShadow: active ? `0 10px 24px ${sectorColor}18` : "none",
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>{option.label}</div>
                      <div style={{ fontSize: 12, marginTop: 5, color: active ? "#d9fff1" : "#8ca1ad", lineHeight: 1.45 }}>{option.desc}</div>
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  marginTop: 12,
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: `1px solid ${sectorColor}22`,
                  background: `${sectorColor}10`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 900, color: "#ecfdf5", marginBottom: 5 }}>
                  {irrigationHelp.title}
                </div>
                <div style={{ fontSize: 13, color: "#c4d3dc", lineHeight: 1.6 }}>
                  {irrigationHelp.text}
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#ecfdf5" }}>Programacion automatica</div>
                  <div style={{ fontSize: 12, color: "#9fb1bb", marginTop: 5, lineHeight: 1.5 }}>
                    {formData.irrigationType === "Por humedad"
                      ? "En este modo la planta riega automaticamente cuando la humedad baja del minimo."
                      : "Configura hora y reglas segun el tipo de riego."}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={formData.irrigationType === "Por humedad"}
                  onClick={() => setScheduleField("enabled", !formData.schedule.enabled)}
                  style={{
                    width: 50,
                    height: 28,
                    borderRadius: 999,
                    border: "none",
                    cursor: formData.irrigationType === "Por humedad" ? "not-allowed" : "pointer",
                    opacity: formData.irrigationType === "Por humedad" ? 0.45 : 1,
                    background: formData.schedule.enabled ? `linear-gradient(135deg, ${sectorColor}, #059669)` : "rgba(255,255,255,0.12)",
                    position: "relative",
                  }}
                >
                  <motion.div
                    animate={{ x: formData.schedule.enabled ? 22 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                    style={{
                      position: "absolute",
                      left: 3,
                      top: 3,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#fff",
                    }}
                  />
                </button>
              </div>

              {formData.schedule.enabled && formData.irrigationType !== "Por humedad" && (
                <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
                  <div style={responsiveTwoColStyle}>
                    <div>
                      <label style={labelStyle}>Hora</label>
                      <input type="time" value={formData.schedule.time} onChange={(e) => setScheduleField("time", e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Duracion (min)</label>
                      <input type="number" min={1} max={120} value={formData.schedule.duration} onChange={(e) => setScheduleField("duration", Number(e.target.value))} style={inputStyle} />
                    </div>
                  </div>

                  {formData.irrigationType === "Semanal" && (
                    <div>
                      <label style={labelStyle}>Dias de la semana</label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {DAYS.map((day) => {
                          const active = (formData.schedule.days || []).includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleDay(day.value)}
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                border: "none",
                                background: active ? `linear-gradient(135deg, ${sectorColor}, #059669)` : "rgba(255,255,255,0.07)",
                                color: active ? "#fff" : "#90a4ae",
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                              title={day.label}
                            >
                              {day.short}
                            </button>
                          );
                        })}
                      </div>
                      <div style={helperStyle}>Marca exactamente los dias en los que quieres regar esta planta.</div>
                    </div>
                  )}

                  {formData.irrigationType === "Quincenal" && (
                    <div>
                      <label style={labelStyle}>Fecha base</label>
                      <input type="date" value={formData.schedule.startDate || ""} onChange={(e) => setScheduleField("startDate", e.target.value)} style={inputStyle} />
                      <div style={helperStyle}>Ejemplo: si eliges 2026-05-02, volvera a regarse el 2026-05-17, 2026-06-01 y asi sucesivamente.</div>
                    </div>
                  )}

                  {formData.irrigationType === "Mensual" && (
                    <div>
                      <label style={labelStyle}>Dia del mes</label>
                      <input type="number" min={1} max={31} value={formData.schedule.dayOfMonth || 1} onChange={(e) => setScheduleField("dayOfMonth", Number(e.target.value))} style={inputStyle} />
                      <div style={helperStyle}>Ejemplo: si eliges 15, la planta se regara el dia 15 de cada mes. Si el mes no tiene ese dia, se usa el ultimo disponible.</div>
                    </div>
                  )}

                  {formData.irrigationType === "Diario" && (
                    <div style={helperStyle}>Regara todos los dias a la hora configurada.</div>
                  )}
                </div>
              )}

              {errors.schedule && <div style={{ ...errorStyle, marginTop: 12 }}>{errors.schedule}</div>}
            </div>

            <div>
              <label style={labelStyle}>Imagen (opcional)</label>
              <div style={{ position: "relative" }}>
                <input
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setField("imageUrl", e.target.value);
                    setPreviewOk(false);
                  }}
                  style={{ ...inputStyle, paddingRight: 38 }}
                  placeholder="https://..."
                />
                {formData.imageUrl && previewOk && (
                  <FaCheckCircle style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#34d399" }} />
                )}
              </div>
              {formData.imageUrl && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={formData.imageUrl}
                    alt=""
                    onLoad={() => setPreviewOk(true)}
                    onError={() => setPreviewOk(false)}
                    style={{
                      display: previewOk ? "block" : "none",
                      width: "100%",
                      height: 110,
                      objectFit: "cover",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  {!previewOk && <div style={helperStyle}>La imagen se mostrara cuando la URL sea valida.</div>}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Notas</label>
              <textarea
                rows={3}
                maxLength={500}
                value={formData.notes || ""}
                onChange={(e) => setField("notes", e.target.value)}
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                placeholder="Observaciones, cuidados o recordatorios"
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 4 }}>
              <button type="button" onClick={onClose} style={secondaryButtonStyle}>Cancelar</button>
              <button type="button" onClick={submit} style={{ ...primaryButtonStyle, background: `linear-gradient(135deg, ${sectorColor}, #059669)` }}>
                {plant ? "Guardar cambios" : "Crear planta"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoPill({ label, value, tone }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        minWidth: 0,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: tone,
          boxShadow: `0 0 14px ${tone}66`,
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7f94a0", fontWeight: 800 }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: "#eef6fb", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#86b49d",
};

const inputStyle = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#f7fbff",
  boxSizing: "border-box",
  outline: "none",
  fontSize: 14,
  lineHeight: 1.45,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

const chipButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 48,
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "#b6c7d1",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.2,
  transition: "background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease, box-shadow 0.14s ease",
};

const dotStyle = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  flexShrink: 0,
};

const responsiveTwoColStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const errorStyle = {
  fontSize: 12,
  color: "#fca5a5",
  fontWeight: 600,
};

const helperStyle = {
  marginTop: 8,
  fontSize: 12,
  color: "#8fa5b2",
  lineHeight: 1.6,
};

const cardStyle = {
  padding: 18,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.025) 100%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

const secondaryButtonStyle = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#d7e3ea",
  cursor: "pointer",
  fontWeight: 800,
  transition: "transform 0.16s ease, background 0.16s ease",
};

const primaryButtonStyle = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
  boxShadow: "0 14px 30px rgba(16,185,129,0.18)",
  transition: "transform 0.16s ease, box-shadow 0.16s ease",
};

export default PlantModal;
