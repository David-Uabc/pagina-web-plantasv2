const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        error: "No autorizado. Por favor inicia sesión para continuar."
      });
    }

    // ✅ FIX 1: JWT_SECRET siempre del .env — sin fallback inseguro
    // El original tenía: jwt.verify(token, process.env.JWT_SECRET || "riego_secret_2026")
    // Eso significa que si JWT_SECRET no está definido, cualquiera que
    // conozca ese string puede generar tokens válidos
    if (!process.env.JWT_SECRET) {
      console.error("❌ CRÍTICO: JWT_SECRET no está definido en las variables de entorno");
      return res.status(500).json({
        error: "Error de configuración del servidor."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIX 2: Excluir campos sensibles del usuario
    // El original traía TODO el documento incluyendo password hasheado
    // Ahora solo traemos lo que necesitamos
    req.user = await User.findById(decoded.id)
      .select("-password -resetPasswordToken -resetPasswordExpires");

    if (!req.user) {
      return res.status(401).json({
        error: "La sesión no es válida. Por favor inicia sesión de nuevo."
      });
    }

    // ✅ FIX 3: Soporte para desactivar cuentas en el futuro
    if (req.user.active === false) {
      return res.status(403).json({
        error: "Tu cuenta está desactivada. Contacta al administrador."
      });
    }

    next();

  } catch (error) {
    // ✅ FIX 4: Mensajes de error diferenciados y legibles
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Tu sesión ha vencido. Por favor inicia sesión de nuevo."
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "La sesión no es válida. Por favor inicia sesión de nuevo."
      });
    }
    console.error("❌ Error en middleware auth:", error.message);
    return res.status(500).json({
      error: "Error al verificar la sesión. Inténtalo de nuevo."
    });
  }
};

module.exports = { protect };