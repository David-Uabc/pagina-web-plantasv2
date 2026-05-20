const mongoose = require("mongoose");

const PlantSchema = new mongoose.Schema(
  {
    owner:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:   { type: String, required: true },
    sector: { type: String, enum: ["Superior", "Inferior"], required: true },
    node:   { type: String, enum: ["A", "B", "C"], required: false },

    minHumidity:     { type: Number, required: true },
    maxHumidity:     { type: Number, required: true },
    currentHumidity: { type: Number, default: 0 },

    irrigationType: {
      type: String,
      enum: ["Diario", "Semanal", "Quincenal", "Mensual", "Por humedad"],
      required: true,
    },

    lastIrrigation: { type: Date },
    valveStatus:    { type: String, enum: ["OPEN", "CLOSED"], default: "CLOSED" },
    valveNumber:    { type: Number, enum: [1, 2, 3, 4, 5], required: true, default: 1 },
    imageUrl:       { type: String },
    notes:          { type: String, default: "", maxlength: 500 },
    order:          { type: Number, default: 0 },

    // ✅ NUEVO — Modo mantenimiento
    // Cuando está activo el sistema NO riega automáticamente
    // El usuario puede hacer cambios sin que el scheduler interfiera
    maintenanceMode: { type: Boolean, default: false },

    // ✅ NUEVO — Motivo del modo mantenimiento (opcional)
    maintenanceNote: { type: String, default: "", maxlength: 200 },

    // Programación de riego automático
    schedule: {
      enabled:    { type: Boolean, default: false },
      days:       { type: [Number], default: [] },
      time:       { type: String,  default: "07:00" },
      duration:   { type: Number,  default: 10 },
      startDate:  { type: String,  default: "" },
      dayOfMonth: { type: Number,  default: 1 },
    },

    // Historial de alertas
    alertHistory: [
      {
        type:      { type: String, enum: ["low_humidity","high_humidity","valve_on","valve_off","maintenance_on","maintenance_off"], default: "low_humidity" },
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

PlantSchema.pre("validate", function(next) {
  if (!this.node && Number.isInteger(this.valveNumber)) {
    if (this.valveNumber === 1 || this.valveNumber === 2) this.node = "A";
    else if (this.valveNumber === 3 || this.valveNumber === 4) this.node = "B";
    else if (this.valveNumber === 5) this.node = "C";
  }
  next();
});

module.exports = mongoose.model("Plant", PlantSchema);
