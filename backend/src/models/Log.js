const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plant",
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  sector: {
    type: String,
    enum: ["Superior", "Inferior"],
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  irrigationExecuted: {
    type: Boolean,
    required: true
  },
  valveStatus: {
    type: String,
    enum: ["OPEN", "CLOSED"],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Log", LogSchema);

