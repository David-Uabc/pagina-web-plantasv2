const mongoose = require("mongoose");

const PlantSchema = new mongoose.Schema(
  {
    // ── Dueño de la planta ────────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    sector: {
      type: String,
      enum: ["Superior", "Inferior"],
      required: true,
    },

    minHumidity: {
      type: Number,
      required: true,
    },

    maxHumidity: {
      type: Number,
      required: true,
    },

    currentHumidity: {
      type: Number,
      default: 0,
    },

    irrigationType: {
      type: String,
      enum: ["Diario", "Semanal", "Quincenal", "Por humedad"],
      required: true,
    },

    lastIrrigation: {
      type: Date,
    },

    valveStatus: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "CLOSED",
    },

    imageUrl: {
      type: String,
    },

    humidityHistory: [
      {
        humidity: Number,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plant", PlantSchema);