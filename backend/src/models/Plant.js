const mongoose = require("mongoose");

const PlantSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:  { type: String, required: true },
    sector: { type: String, enum: ["Superior", "Inferior"], required: true },
    minHumidity:     { type: Number, required: true },
    maxHumidity:     { type: Number, required: true },
    currentHumidity: { type: Number, default: 0 },
    irrigationType: {
      type: String, enum: ["Diario", "Semanal", "Quincenal", "Por humedad"], required: true,
    },
    lastIrrigation: { type: Date },
    valveStatus: { type: String, enum: ["OPEN", "CLOSED"], default: "CLOSED" },
    imageUrl: { type: String },

    // ✅ Notas del usuario
    notes: { type: String, default: "", maxlength: 500 },

    // ✅ Orden drag-and-drop
    order: { type: Number, default: 0 },

    // ✅ Programación de riego automático
    schedule: {
      enabled:  { type: Boolean, default: false },
      days:     { type: [Number], default: [] },   // 0=Dom…6=Sáb
      time:     { type: String,  default: "07:00" },
      duration: { type: Number,  default: 10 },    // minutos
    },

    // ✅ Historial de alertas
    alertHistory: [
      {
        type:      { type: String, enum: ["low_humidity","high_humidity","valve_on","valve_off"], default: "low_humidity" },
        message:   { type: String },
        humidity:  { type: Number },
        resolved:  { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    humidityHistory: [
      { humidity: Number, date: { type: Date, default: Date.now } },
    ],
  },
  { timestamps: true }
);

PlantSchema.index({ owner: 1, sector: 1 });
PlantSchema.index({ owner: 1, order:  1 });

module.exports = mongoose.model("Plant", PlantSchema);