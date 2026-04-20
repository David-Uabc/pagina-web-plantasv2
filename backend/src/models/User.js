const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const crypto   = require("crypto");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "El nombre es requerido"],
    trim: true,
  },
  username: {
    type: String,
    required: [true, "El usuario es requerido"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, "El email es requerido"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, "Email inválido"],
  },
  password: {
    type: String,
    required: [true, "La contraseña es requerida"],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "viewer"],
    default: "admin",
  },
  avatar: {
    type: String,
    default: "",
  },
  active: {
    type: Boolean,
    default: true,
  },

  // ── Reset password ──────────────────────────────────
  resetPasswordToken:   { type: String },
  resetPasswordExpires: { type: Date   },

  // ✅ NUEVO — Refresh Token
  // Guardamos el hash del refresh token, nunca el token en texto plano
  refreshToken:         { type: String, select: false },
  refreshTokenExpires:  { type: Date,   select: false },

}, { timestamps: true });

// ── Hash password antes de guardar ───────────────────
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Comparar contraseña ───────────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Generar token de reset de contraseña (24h) ────────
UserSchema.methods.getResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken   = crypto.createHash("sha256").update(token).digest("hex");
  this.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

// ✅ NUEVO — Generar Refresh Token (30 días)
// El refresh token es un token opaco de 64 bytes aleatorios
// Se guarda hasheado en la BD, se envía en claro al cliente
UserSchema.methods.generateRefreshToken = function () {
  const token = crypto.randomBytes(64).toString("hex");
  // Guardar hash en BD — nunca el token en texto plano
  this.refreshToken        = crypto.createHash("sha256").update(token).digest("hex");
  this.refreshTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 días
  return token; // este va al cliente como httpOnly cookie
};

// ✅ NUEVO — Verificar si el refresh token es válido
UserSchema.methods.verifyRefreshToken = function (token) {
  if (!this.refreshToken || !this.refreshTokenExpires) return false;
  if (Date.now() > this.refreshTokenExpires) return false;
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  return this.refreshToken === hashed;
};

// ✅ NUEVO — Revocar refresh token (logout seguro)
UserSchema.methods.revokeRefreshToken = function () {
  this.refreshToken        = undefined;
  this.refreshTokenExpires = undefined;
};

module.exports = mongoose.model("User", UserSchema);