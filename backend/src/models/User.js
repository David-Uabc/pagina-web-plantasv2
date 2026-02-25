const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

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
    select: false, // nunca se devuelve en queries
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

module.exports = mongoose.model("User", UserSchema);