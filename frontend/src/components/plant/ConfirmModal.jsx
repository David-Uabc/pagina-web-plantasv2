import { motion, AnimatePresence } from "framer-motion";

function ConfirmModal({ isOpen, plantName, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="modal-card confirm-modal"
          initial={{ scale: 0.85, y: -20, opacity: 0 }}
          animate={{ scale: 1,    y: 0,   opacity: 1 }}
          exit={{    scale: 0.85, y: -20, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Icono */}
          <div className="confirm-icon">🗑</div>

          <h2 className="confirm-title">¿Eliminar planta?</h2>
          <p className="confirm-desc">
            Vas a eliminar <strong>"{plantName}"</strong>.<br />
            Esta acción no se puede deshacer.
          </p>

          <div className="confirm-actions">
            <button className="btn-danger-solid" onClick={onConfirm}>
              Sí, eliminar
            </button>
            <button className="btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ConfirmModal;