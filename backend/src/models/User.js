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

  // ── Reset password ────────────────────────────────
  resetPasswordToken:   { type: String },
  resetPasswordExpires: { type: Date   },

}, { timestamps: true });

// Hash password antes de guardar
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseña
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generar token de reset
UserSchema.methods.getResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken   = crypto.createHash("sha256").update(token).digest("hex");
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hora
  return token;
};

module.exports = mongoose.model("User", UserSchema);