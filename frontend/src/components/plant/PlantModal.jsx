import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const DEFAULT_FORM = {
  name: "",
  sector: "Superior",
  minHumidity: "",
  maxHumidity: "",
  irrigationType: "Diario",
};

function PlantModal({ isOpen, onClose, onSave, plant, defaultSector = "Superior" }) {
  const [formData, setFormData] = useState({ ...DEFAULT_FORM, sector: defaultSector });
  const [errors, setErrors] = useState({});

  // Cargar datos al editar, o resetear al abrir nuevo
  useEffect(() => {
    if (isOpen) {
      setFormData(plant ? { ...plant } : { ...DEFAULT_FORM, sector: defaultSector });
      setErrors({});
    }
  }, [isOpen, plant, defaultSector]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Limpiar error del campo al escribir
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim())        errs.name        = "El nombre es requerido";
    if (formData.minHumidity === "")   errs.minHumidity = "Requerido";
    if (formData.maxHumidity === "")   errs.maxHumidity = "Requerido";
    if (
      formData.minHumidity !== "" &&
      formData.maxHumidity !== "" &&
      Number(formData.minHumidity) >= Number(formData.maxHumidity)
    ) {
      errs.maxHumidity = "El máximo debe ser mayor que el mínimo";
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(formData);
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <motion.div
          className="modal-card"
          initial={{ scale: 0.85, y: -30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: -20, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <h2>{plant ? "✏ Editar Planta" : "🌱 Nueva Planta"}</h2>

          <form onSubmit={handleSubmit}>

            {/* Nombre */}
            <div className="modal-field">
              <input
                name="name"
                placeholder="Nombre de la planta"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && <span className="modal-error">{errors.name}</span>}
            </div>

            {/* Sector */}
            <select name="sector" value={formData.sector} onChange={handleChange}>
              <option value="Superior">Superior</option>
              <option value="Inferior">Inferior</option>
            </select>

            {/* Humedad mínima */}
            <div className="modal-field">
              <input
                type="number" name="minHumidity"
                placeholder="Humedad mínima (%)"
                value={formData.minHumidity}
                onChange={handleChange}
                min={0} max={100}
                className={errors.minHumidity ? "input-error" : ""}
              />
              {errors.minHumidity && <span className="modal-error">{errors.minHumidity}</span>}
            </div>

            {/* Humedad máxima */}
            <div className="modal-field">
              <input
                type="number" name="maxHumidity"
                placeholder="Humedad máxima (%)"
                value={formData.maxHumidity}
                onChange={handleChange}
                min={0} max={100}
                className={errors.maxHumidity ? "input-error" : ""}
              />
              {errors.maxHumidity && <span className="modal-error">{errors.maxHumidity}</span>}
            </div>

            {/* Tipo de riego */}
            <select name="irrigationType" value={formData.irrigationType} onChange={handleChange}>
              <option value="Diario">Diario</option>
              <option value="Semanal">Semanal</option>
              <option value="Quincenal">Quincenal</option>
              <option value="Por humedad">Por humedad</option>
            </select>

            <div className="modal-actions">
              <button type="submit"  className="btn-primary">Guardar</button>
              <button type="button" onClick={handleClose} className="btn-danger">Cancelar</button>
            </div>

          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PlantModal;