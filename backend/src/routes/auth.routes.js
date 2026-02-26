const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const User     = require("../models/User");
const { protect } = require("../middleware/auth");
const { sendResetEmail } = require("../config/mailer");

// ── Generar JWT ───────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "riego_secret_2026", {
    expiresIn: "7d",
  });

// ============================================
// 🔹 REGISTRO
// POST /api/auth/register
// ============================================
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener mínimo 6 caracteres" });
    }

    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });
    if (existingUser) {
      const field = existingUser.username === username.toLowerCase() ? "usuario" : "email";
      return res.status(400).json({ error: `Ese ${field} ya está registrado` });
    }

    const user = await User.create({ name, username, email, password });

    res.status(201).json({
      message: "Cuenta creada exitosamente",
      token: generateToken(user._id),
      user: {
        _id:      user._id,
        name:     user.name,
        username: user.username,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 LOGIN
// POST /api/auth/login
// ============================================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
    }

    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email:    username.toLowerCase() },
      ],
    }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    res.json({
      message: "Login exitoso",
      token: generateToken(user._id),
      user: {
        _id:      user._id,
        name:     user.name,
        username: user.username,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 PERFIL (requiere token)
// GET /api/auth/me
// ============================================
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id:      user._id,
      name:     user.name,
      username: user.username,
      email:    user.email,
      role:     user.role,
      avatar:   user.avatar,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 ACTUALIZAR PERFIL
// PUT /api/auth/me
// ============================================
router.put("/me", protect, async (req, res) => {
  try {
    const { name, email, avatar, password } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (name)   user.name   = name;
    if (email)  user.email  = email;
    if (avatar) user.avatar = avatar;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: "La contraseña debe tener mínimo 6 caracteres" });
      }
      user.password = password;
    }

    await user.save();
    res.json({
      message: "Perfil actualizado",
      user: { _id: user._id, name: user.name, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 OLVIDÉ CONTRASEÑA
// POST /api/auth/forgot-password
// ============================================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });

    const user = await User.findOne({ email: email.toLowerCase() });

    // Siempre responder igual para no revelar si el email existe
    if (!user) {
      return res.json({ message: "Si ese email existe, recibirás instrucciones." });
    }

    const token  = user.getResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "https://riego-iot-frontend.onrender.com"}/reset-password/${token}`;
    await sendResetEmail(user.email, resetUrl);

    res.json({ message: "Si ese email existe, recibirás instrucciones." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🔹 RESET CONTRASEÑA
// POST /api/auth/reset-password/:token
// ============================================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ error: "La contraseña debe tener mínimo 6 caracteres" });

    const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken:   hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ error: "Token inválido o expirado" });

    user.password             = password;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;