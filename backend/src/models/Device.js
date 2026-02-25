const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  sector: {
    type: String,
    enum: ["Superior", "Inferior"],
    required: true
  },
  status: {
    type: String,
    enum: ["Online", "Offline"],
    default: "Offline"
  },
  lastConnection: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("Device", DeviceSchema);
