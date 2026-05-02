const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  // owner es opcional — el ESP32 no tiene usuario, se asocia por sector
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  sector: {
    type: String,
    enum: ["Superior", "Inferior"],
    required: false, // el simulador no siempre lo envía en el upsert inicial
  },
  status: {
    type: String,
    enum: ["Online", "Offline"],
    default: "Offline",
  },
  lastConnection: {
    type: Date,
  },
  lastSeen: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model("Device", DeviceSchema);
