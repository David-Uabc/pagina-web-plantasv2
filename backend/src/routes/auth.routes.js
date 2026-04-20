const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const User     = require("../models/User");
const { protect } = require("../middleware/auth");
const { sendResetEmail } = require("../config/mailer");

// ── Helpers ───────────────────────────────────────────
const sanitize  = (str) => (typeof str === "string" ? str.trim() : "");
const errProd   = (msg, err) =>
  process.env.NODE_ENV === "production" ? msg : err.message;
const userResp  = (user) => ({
  _id: user._id, name: user.name, username: user.username,
  email: user.email, role: user.role,
});

// ── Generar Access Token (15 min) ────────────────────
// ✅ Access token de vida corta — si se roba solo dura 15 minutos
const generateAccessToken = (id) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET no definido");
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// ── Enviar Refresh Token como cookie httpOnly ─────────
// ✅ httpOnly = JavaScript del navegador NO puede leer esta cookie
// ✅ secure = solo se envía por HTTPS
// ✅ sameSite = protección CSRF
const setRefreshCookie = (res, token) => {
  res.cookie("riego_refresh", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   30 * 24 * 60 * 60 * 1000, // 30 días en ms
    path:     "/api/auth",               // solo se envía a rutas de auth
  });
};

// ============================================
// POST /api/auth/register
// ============================================
router.post("/register", async (req, res) => {
  try {
    const name     = sanitize(req.body.name);
    const username = sanitize(req.body.username).toLowerCase();
    const email    = sanitize(req.body.email).toLowerCase();
    const password = req.body.password || "";

    if (!name || !username || !email || !password)
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    if (name.length < 2)
      return res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
    if (username.length < 3)
      return res.status(400).json({ error: "El usuario debe tener al menos 3 caracteres" });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return res.status(400).json({ error: "El usuario solo puede tener letras, números y guiones bajos" });
    if (!/\S+@\S+\.\S+/.test(email))
      return res.status(400).json({ error: "El email no es válido" });
    if (password.length < 6)
      return res.status(400).json({ error: "La contraseña debe tener mínimo 6 caracteres" });

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      const field = existing.username === username ? "usuario" : "email";
      return res.status(409).json({ error: `Ese ${field} ya está registrado. Prueba con otro.` });
    }

    const user         = await User.findOne({ $or: [{ username }, { email }] }).select("+refreshToken +refreshTokenExpires") || new User({ name, username, email, password });
    const newUser      = await User.create({ name, username, email, password });
    const refreshToken = newUser.generateRefreshToken();
    await newUser.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken(newUser._id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      message:     "Cuenta creada exitosamente",
      accessToken,
      user:        userResp(newUser),
    });
  } catch (err) {
    console.error("❌ Error en registro:", err.message);
    res.status(500).json({ error: errProd("Error al crear la cuenta.", err) });
  }
});

// ============================================
// POST /api/auth/login
// ============================================
router.post("/login", async (req, res) => {
  try {
    const username = sanitize(req.body.username).toLowerCase();
    const password = req.body.password || "";

    if (!username || !password)
      return res.status(400).json({ error: "Usuario y contraseña son requeridos" });

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select("+password +refreshToken +refreshTokenExpires");

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

    if (user.active === false)
      return res.status(403).json({ error: "Tu cuenta está desactivada. Contacta al administrador." });

    // Generar tokens
    const refreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.json({
      message:     "Login exitoso",
      accessToken,
      user:        userResp(user),
    });
  } catch (err) {
    console.error("❌ Error en login:", err.message);
    res.status(500).json({ error: errProd("Error al iniciar sesión.", err) });
  }
});

// ============================================
// POST /api/auth/refresh
// ✅ NUEVO — Renovar access token sin pedir contraseña
// El cliente llama esto cuando el access token vence (15 min)
// ============================================
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.riego_refresh;

    if (!token)
      return res.status(401).json({ error: "No hay sesión activa. Por favor inicia sesión." });

    // Buscar usuario por hash del refresh token
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user   = await User.findOne({ refreshToken: hashed })
      .select("+refreshToken +refreshTokenExpires");

    if (!user || !user.verifyRefreshToken(token))
      return res.status(401).json({ error: "Sesión inválida o expirada. Por favor inicia sesión de nuevo." });

    if (user.active === false)
      return res.status(403).json({ error: "Tu cuenta está desactivada." });

    // ✅ Rotar el refresh token — cada uso genera uno nuevo
    // Así si alguien roba el token viejo, ya no sirve
    const newRefreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken(user._id);
    setRefreshCookie(res, newRefreshToken);

    res.json({
      accessToken,
      user: userResp(user),
    });
  } catch (err) {
    console.error("❌ Error en refresh:", err.message);
    res.status(500).json({ error: errProd("Error al renovar la sesión.", err) });
  }
});

// ============================================
// POST /api/auth/logout
// ✅ NUEVO — Cerrar sesión revocando el refresh token
// ============================================
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.riego_refresh;

    if (token) {
      const hashed = crypto.createHash("sha256").update(token).digest("hex");
      const user   = await User.findOne({ refreshToken: hashed })
        .select("+refreshToken +refreshTokenExpires");

      if (user) {
        user.revokeRefreshToken();
        await user.save({ validateBeforeSave: false });
      }
    }

    // Borrar la cookie del navegador
    res.clearCookie("riego_refresh", { path: "/api/auth" });
    res.json({ message: "Sesión cerrada correctamente" });
  } catch (err) {
    console.error("❌ Error en logout:", err.message);
    res.status(500).json({ error: errProd("Error al cerrar sesión.", err) });
  }
});

// ============================================
// GET /api/auth/me
// ============================================
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -resetPasswordToken -resetPasswordExpires -refreshToken -refreshTokenExpires");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(userResp(user));
  } catch (err) {
    console.error("❌ Error en GET /me:", err.message);
    res.status(500).json({ error: errProd("Error al obtener el perfil.", err) });
  }
});

// ============================================
// PUT /api/auth/me
// ============================================
router.put("/me", protect, async (req, res) => {
  try {
    const name     = sanitize(req.body.name);
    const email    = sanitize(req.body.email).toLowerCase();
    const avatar   = sanitize(req.body.avatar);
    const password = req.body.password || "";

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    if (name && name.length >= 2)                    user.name   = name;
    if (email && /\S+@\S+\.\S+/.test(email))         user.email  = email;
    if (avatar)                                       user.avatar = avatar;
    if (password) {
      if (password.length < 6)
        return res.status(400).json({ error: "La contraseña debe tener mínimo 6 caracteres" });
      user.password = password;
    }

    await user.save();
    res.json({ message: "Perfil actualizado correctamente", user: userResp(user) });
  } catch (err) {
    console.error("❌ Error en PUT /me:", err.message);
    res.status(500).json({ error: errProd("Error al actualizar el perfil.", err) });
  }
});

// ============================================
// POST /api/auth/forgot-password
// ============================================
router.post("/forgot-password", async (req, res) => {
  try {
    const email    = sanitize(req.body.email).toLowerCase();
    const RESPUESTA = { message: "Si ese correo está registrado, recibirás instrucciones en unos minutos. Revisa también tu carpeta de spam." };

    if (!email || !/\S+@\S+\.\S+/.test(email))
      return res.status(400).json({ error: "Escribe un email válido" });

    const user = await User.findOne({ email });
    if (!user) return res.json(RESPUESTA);

    const token    = user.getResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    try {
      await sendResetEmail(user.email, resetUrl);
    } catch (emailError) {
      user.resetPasswordToken   = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ error: "No se pudo enviar el correo. Inténtalo de nuevo más tarde." });
    }

    res.json(RESPUESTA);
  } catch (err) {
    console.error("❌ Error en forgot-password:", err.message);
    res.status(500).json({ error: errProd("Error al procesar la solicitud.", err) });
  }
});

// ============================================
// POST /api/auth/reset-password/:token
// ============================================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const password = req.body.password || "";
    if (!password || password.length < 6)
      return res.status(400).json({ error: "La contraseña debe tener mínimo 6 caracteres" });

    const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user   = await User.findOne({
      resetPasswordToken:   hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ error: "El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo." });

    user.password             = password;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    // ✅ Revocar refresh tokens al resetear contraseña — seguridad extra
    user.revokeRefreshToken();
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión." });
  } catch (err) {
    console.error("❌ Error en reset-password:", err.message);
    res.status(500).json({ error: errProd("Error al restablecer la contraseña.", err) });
  }
});

module.exports = router;