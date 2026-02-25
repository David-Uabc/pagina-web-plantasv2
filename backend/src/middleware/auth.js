const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "No autorizado — token requerido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "riego_secret_2026");
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};

module.exports = { protect };