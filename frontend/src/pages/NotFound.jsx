import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      {/* Orbs de fondo */}
      <div className="nf-orb nf-orb-1" aria-hidden="true"/>
      <div className="nf-orb nf-orb-2" aria-hidden="true"/>

      <div className="notfound-content">
        {/* Planta triste animada */}
        <motion.div className="nf-plant"
          animate={{ rotate:[-3,3,-3], y:[0,-6,0] }}
          transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }}>
          🥀
        </motion.div>

        <motion.h1 className="nf-code"
          initial={{ opacity:0, scale:0.8 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.5 }}>
          404
        </motion.h1>

        <motion.h2 className="nf-title"
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.15, duration:0.4 }}>
          Página no encontrada
        </motion.h2>

        <motion.p className="nf-desc"
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.25, duration:0.4 }}>
          Parece que esta planta no existe en nuestro sistema.<br/>
          Vuelve al dashboard para ver tus cultivos.
        </motion.p>

        <motion.div className="nf-actions"
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.35, duration:0.4 }}>
          <button className="btn-primary nf-btn" onClick={() => navigate("/")}>
            🌿 Volver al Dashboard
          </button>
          <button className="btn-edit nf-btn-sec" onClick={() => navigate(-1)}>
            ← Página anterior
          </button>
        </motion.div>

        {/* Código decorativo */}
        <motion.div className="nf-code-block"
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:0.5 }}>
          <span className="nf-code-line">
            <span style={{color:"var(--text-3)"}}>// </span>
            <span style={{color:"var(--green-light)"}}>plant</span>
            <span style={{color:"var(--text-2)"}}>.findById(</span>
            <span style={{color:"var(--yellow)"}}>this_page</span>
            <span style={{color:"var(--text-2)"}}>)</span>
          </span>
          <span className="nf-code-line">
            <span style={{color:"var(--red)"}}>→ null</span>
            <span style={{color:"var(--text-3)"}}> // no encontrado</span>
          </span>
        </motion.div>
      </div>
    </div>
  );
}

export default NotFound;