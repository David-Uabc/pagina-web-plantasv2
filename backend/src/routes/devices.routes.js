const express = require("express");
const crypto = require("crypto");
const Device = require("../models/Device");
const Log = require("../models/Log");
const { protect } = require("../middleware/auth");
const { findVisibleDevicesForUser } = require("../utils/deviceOwnership");

const router = express.Router();

const VALID_SECTORS = ["Superior", "Inferior"];
const VALID_ROLES = ["sensor", "relay"];
const VALID_NODES = ["A", "B", "C"];

const errProd = (msg, err) =>
  process.env.NODE_ENV === "production" ? msg : err.message;

function readDeviceApiKey(req) {
  const apiKey = req.headers["x-api-key"];
  return typeof apiKey === "string" ? apiKey : "";
}

function hasValidDeviceKey(req) {
  if (!process.env.IOT_API_KEY) return false;

  const provided = Buffer.from(readDeviceApiKey(req));
  const expected = Buffer.from(process.env.IOT_API_KEY);

  return (
    provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected)
  );
}

async function protectOrDeviceKey(req, res, next) {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return protect(req, res, next);
  }

  if (hasValidDeviceKey(req)) {
    return next();
  }

  return res.status(401).json({ error: "No autorizado" });
}

function normalizeRole(value) {
  const role = String(value || "relay").trim().toLowerCase();
  return VALID_ROLES.includes(role) ? role : null;
}

function normalizeNode(value) {
  const node = String(value || "").trim().toUpperCase();
  return VALID_NODES.includes(node) ? node : null;
}

async function resolveVisibleDevices(req) {
  return findVisibleDevicesForUser(req.user._id);
}

router.get("/", protect, async (req, res) => {
  try {
    const devices = await resolveVisibleDevices(req);
    res.json(devices);
  } catch (error) {
    res
      .status(500)
      .json({ error: errProd("Error al obtener dispositivos", error) });
  }
});

router.post("/", protectOrDeviceKey, async (req, res) => {
  try {
    const { deviceId, sector } = req.body;
    const role = normalizeRole(req.body.role) || "relay";
    const node = normalizeNode(req.body.node);

    if (!deviceId || !sector || !node) {
      return res
        .status(400)
        .json({ error: "deviceId, sector y node son requeridos" });
    }

    if (!VALID_SECTORS.includes(sector)) {
      return res
        .status(400)
        .json({ error: "sector debe ser Superior o Inferior" });
    }

    const update = {
      deviceId,
      role,
      node,
      sector,
      status: "Online",
      lastConnection: new Date(),
      lastSeen: new Date(),
    };

    if (req.user?._id) {
      update.owner = req.user._id;
    }

    const device = await Device.findOneAndUpdate({ deviceId }, update, {
      upsert: true,
      new: true,
    });

    res
      .status(201)
      .json({ message: "Dispositivo registrado/actualizado", device });
  } catch (error) {
    res
      .status(400)
      .json({ error: errProd("Error al registrar dispositivo", error) });
  }
});

router.put("/:deviceId/heartbeat", protectOrDeviceKey, async (req, res) => {
  try {
    const role = normalizeRole(req.body.role) || undefined;
    const node = normalizeNode(req.body.node) || undefined;
    const sector = VALID_SECTORS.includes(req.body.sector)
      ? req.body.sector
      : undefined;

    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      {
        status: "Online",
        lastConnection: new Date(),
        lastSeen: new Date(),
        ...(role ? { role } : {}),
        ...(node ? { node } : {}),
        ...(sector ? { sector } : {}),
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: "Dispositivo no encontrado" });
    }

    res.json({ message: "Heartbeat recibido", device });
  } catch (error) {
    res
      .status(500)
      .json({ error: errProd("Error al procesar heartbeat", error) });
  }
});

router.put("/:deviceId/offline", protectOrDeviceKey, async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { status: "Offline" },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: "Dispositivo no encontrado" });
    }

    res.json({ message: "Dispositivo marcado offline", device });
  } catch (error) {
    res
      .status(500)
      .json({ error: errProd("Error al actualizar dispositivo", error) });
  }
});

router.delete("/:deviceId", protect, async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({
      deviceId: req.params.deviceId,
      owner: req.user._id,
    });

    if (!device) {
      return res.status(404).json({ error: "Dispositivo no encontrado" });
    }

    res.json({ message: "Dispositivo eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ error: errProd("Error al eliminar dispositivo", error) });
  }
});

router.get("/:deviceId/logs", protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const visibleDevices = await resolveVisibleDevices(req);
    const allowedDeviceIds = new Set(
      visibleDevices.map((device) => device.deviceId)
    );

    if (!allowedDeviceIds.has(req.params.deviceId)) {
      return res.status(404).json({ error: "Dispositivo no encontrado" });
    }

    const logs = await Log.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("plantId", "name sector");

    res.json(logs);
  } catch (error) {
    res
      .status(500)
      .json({ error: errProd("Error al obtener logs del dispositivo", error) });
  }
});

module.exports = router;
