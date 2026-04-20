const express  = require("express");
const router   = express.Router();
const Plant    = require("../models/Plant");
const Log      = require("../models/Log");
const { protect }        = require("../middleware/auth");
const { processReading } = require("./iot.routes");
const { publishValveCommand, isConnected } = require("../mqtt/mqttClient");

router.use(protect);

const errProd = (msg, err) =>
  process.env.NODE_ENV === "production" ? msg : err.message;

const CAMPOS_PERMITIDOS = [
  "name", "sector", "minHumidity", "maxHumidity",
  "irrigationType", "imageUrl", "notes", "order",
  "valveStatus", "schedule", "valveNumber",
  "maintenanceMode", "maintenanceNote",
];

const filtrarCampos = (body) => {
  const clean = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (body[campo] !== undefined) clean[campo] = body[campo];
  }
  return clean;
};

// ════════════════════════════════════════
// GET /api/plants
// ════════════════════════════════════════
router.get("/", async (req, res) => {
  try {
    const { sector } = req.query;
    const query = { owner: req.user._id };
    if (sector) {
      if (!["Superior", "Inferior"].includes(sector))
        return res.status(400).json({ error: "sector debe ser Superior o Inferior" });
      query.sector = sector;
    }
    const plants = await Plant.find(query).sort({ order: 1, createdAt: -1 });
    res.json(plants);
  } catch (err) {
    console.error("❌ GET /plants:", err.message);
    res.status(500).json({ error: errProd("Error al obtener las plantas", err) });
  }
});

// ════════════════════════════════════════
// POST /api/plants
// ════════════════════════════════════════
router.post("/", async (req, res) => {
  try {
    const datos = filtrarCampos(req.body);
    if (!datos.name?.trim())
      return res.status(400).json({ error: "El nombre de la planta es requerido" });
    if (!["Superior", "Inferior"].includes(datos.sector))
      return res.status(400).json({ error: "El sector debe ser Superior o Inferior" });
    if (datos.minHumidity === undefined || datos.maxHumidity === undefined)
      return res.status(400).json({ error: "Los umbrales de humedad son requeridos" });
    if (Number(datos.minHumidity) >= Number(datos.maxHumidity))
      return res.status(400).json({ error: "El umbral máximo debe ser mayor que el mínimo" });

    const total = await Plant.countDocuments({ owner: req.user._id });
    if (total >= 50)
      return res.status(400).json({ error: "Límite máximo de 50 plantas por cuenta" });

    const plant = new Plant({ ...datos, owner: req.user._id });
    await plant.save();
    res.status(201).json(plant);
  } catch (err) {
    console.error("❌ POST /plants:", err.message);
    res.status(400).json({ error: errProd("Error al crear la planta", err) });
  }
});

// ════════════════════════════════════════
// PUT /api/plants/:id
// ════════════════════════════════════════
router.put("/:id", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const datos = filtrarCampos(req.body);
    if (datos.minHumidity !== undefined && datos.maxHumidity !== undefined) {
      if (Number(datos.minHumidity) >= Number(datos.maxHumidity))
        return res.status(400).json({ error: "El umbral máximo debe ser mayor que el mínimo" });
    }

    if (datos.maintenanceMode !== undefined && datos.maintenanceMode !== plant.maintenanceMode) {
      plant.alertHistory.push({
        type:     datos.maintenanceMode ? "maintenance_on" : "maintenance_off",
        message:  datos.maintenanceMode
          ? `Modo mantenimiento activado${datos.maintenanceNote ? ": " + datos.maintenanceNote : ""}`
          : "Modo mantenimiento desactivado — riego automático restaurado",
        resolved: true,
      });
      await plant.save();
    }

    const io      = req.app.get("io");
    const updated = await Plant.findByIdAndUpdate(
      req.params.id, datos, { new: true, runValidators: true }
    );

    // ✅ Publicar comando de válvula por MQTT al ESP32
    if (datos.valveStatus !== undefined) {
      const mqttOk = publishValveCommand(
        updated.sector,
        updated.valveNumber,
        datos.valveStatus,
        updated._id.toString()
      );
      console.log(`[plants] Válvula ${updated.valveNumber} → ${datos.valveStatus} | MQTT: ${mqttOk ? "✅" : "⚠️ sin MQTT"}`);
    }

    if (io) {
      io.emit("plant:update", {
        _id:             updated._id.toString(),
        name:            updated.name,
        sector:          updated.sector,
        currentHumidity: updated.currentHumidity,
        valveStatus:     updated.valveStatus,
        lastIrrigation:  updated.lastIrrigation,
        minHumidity:     updated.minHumidity,
        maxHumidity:     updated.maxHumidity,
        alertHistory:    updated.alertHistory,
        schedule:        updated.schedule,
        notes:           updated.notes,
        order:           updated.order,
        maintenanceMode: updated.maintenanceMode,
      });
      io.emit("valve:command", {
        sector:  updated.sector,
        command: updated.valveStatus,
        plantId: updated._id.toString(),
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ PUT /plants/:id:", err.message);
    res.status(400).json({ error: errProd("Error al actualizar la planta", err) });
  }
});

// ════════════════════════════════════════
// DELETE /api/plants/:id
// ════════════════════════════════════════
router.delete("/:id", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    await Plant.findByIdAndDelete(req.params.id);
    await Log.deleteMany({ plantId: req.params.id });

    const io = req.app.get("io");
    if (io) io.emit("plant:deleted", { _id: req.params.id });

    res.json({ message: "Planta eliminada correctamente" });
  } catch (err) {
    console.error("❌ DELETE /plants/:id:", err.message);
    res.status(500).json({ error: errProd("Error al eliminar la planta", err) });
  }
});

// ════════════════════════════════════════
// PATCH /api/plants/:id/maintenance
// ════════════════════════════════════════
router.patch("/:id/maintenance", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const { active, note } = req.body;
    if (typeof active !== "boolean")
      return res.status(400).json({ error: "El campo active debe ser true o false" });

    if (plant.maintenanceMode === active)
      return res.json({ message: `Modo mantenimiento ya estaba ${active ? "activo" : "inactivo"}`, plant });

    plant.maintenanceMode = active;
    plant.maintenanceNote = active ? (note || "") : "";

    if (active && plant.valveStatus === "OPEN") {
      plant.valveStatus = "CLOSED";
      publishValveCommand(plant.sector, plant.valveNumber, "CLOSED", plant._id.toString());
    }

    plant.alertHistory.push({
      type:     active ? "maintenance_on" : "maintenance_off",
      message:  active
        ? `🔧 Mantenimiento activado${note ? ": " + note : ""} — riego automático pausado`
        : "✅ Mantenimiento finalizado — riego automático restaurado",
      resolved: true,
    });
    if (plant.alertHistory.length > 100) {
      plant.alertHistory = plant.alertHistory.slice(-100);
    }

    await plant.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("plant:update", {
        _id:             plant._id.toString(),
        name:            plant.name,
        sector:          plant.sector,
        valveStatus:     plant.valveStatus,
        maintenanceMode: plant.maintenanceMode,
        alertHistory:    plant.alertHistory,
      });
    }

    res.json({
      message: active
        ? "🔧 Modo mantenimiento activado. El riego automático está pausado."
        : "✅ Modo mantenimiento desactivado. El riego automático se ha restaurado.",
      plant,
    });
  } catch (err) {
    console.error("❌ PATCH /plants/:id/maintenance:", err.message);
    res.status(500).json({ error: errProd("Error al cambiar modo mantenimiento", err) });
  }
});

// ════════════════════════════════════════
// POST /api/plants/:id/humidity
// ════════════════════════════════════════
router.post("/:id/humidity", async (req, res) => {
  try {
    const humidity = Number(req.body.humidity);
    if (isNaN(humidity) || humidity < 0 || humidity > 100)
      return res.status(400).json({ error: "humidity debe ser un número entre 0 y 100" });

    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const io = req.app.get("io");
    await processReading(plant, humidity, req.body.deviceId || "manual", io);
    res.json({ message: "Humedad actualizada", plant });
  } catch (err) {
    console.error("❌ POST /plants/:id/humidity:", err.message);
    res.status(400).json({ error: errProd("Error al actualizar la humedad", err) });
  }
});

// ════════════════════════════════════════
// GET /api/plants/:id/history
// ════════════════════════════════════════
router.get("/:id/history", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const days   = Math.min(parseInt(req.query.days) || 14, 90);
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
    const history = plant.humidityHistory
      .filter(h => new Date(h.date) >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(history);
  } catch (err) {
    console.error("❌ GET /plants/:id/history:", err.message);
    res.status(500).json({ error: errProd("Error al obtener el historial", err) });
  }
});

// ════════════════════════════════════════
// GET /api/plants/:id/logs
// ════════════════════════════════════════
router.get("/:id/logs", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page  = Math.max(parseInt(req.query.page)  || 1,   1);
    const skip  = (page - 1) * limit;

    const filtro = { plantId: req.params.id };
    if (req.query.from) filtro.createdAt = { $gte: new Date(req.query.from) };
    if (req.query.to)   filtro.createdAt = { ...filtro.createdAt, $lte: new Date(req.query.to) };
    if (req.query.onlyIrrigation === "true") filtro.irrigationExecuted = true;

    const [logs, total] = await Promise.all([
      Log.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Log.countDocuments(filtro),
    ]);

    res.json({
      logs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("❌ GET /plants/:id/logs:", err.message);
    res.status(500).json({ error: errProd("Error al obtener los logs", err) });
  }
});

// ════════════════════════════════════════
// GET /api/plants/:id/export/csv
// ════════════════════════════════════════
router.get("/:id/export/csv", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });

    const days   = Math.min(parseInt(req.query.days) || 30, 90);
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);

    const history = plant.humidityHistory
      .filter(h => new Date(h.date) >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const logs = await Log.find({
      plantId:            plant._id,
      createdAt:          { $gte: cutoff },
      irrigationExecuted: true,
    }).sort({ createdAt: 1 });

    const lines = [
      `RiegoIQ — Reporte de ${plant.name}`,
      `Sector: ${plant.sector} | Válvula: V${plant.valveNumber} | Generado: ${new Date().toLocaleString("es-MX")}`,
      `Período: últimos ${days} días | Riego mínimo: ${plant.minHumidity}% | Riego máximo: ${plant.maxHumidity}%`,
      ``,
      `HISTORIAL DE HUMEDAD`,
      `Fecha,Hora,Humedad (%),Estado`,
      ...history.map(h => {
        const d      = new Date(h.date);
        const estado = h.humidity < plant.minHumidity ? "Bajo mínimo" :
                       h.humidity > plant.maxHumidity ? "Sobre máximo" : "Normal";
        return `${d.toLocaleDateString("es-MX")},${d.toLocaleTimeString("es-MX")},${h.humidity},${estado}`;
      }),
      ``,
      `RIEGOS EJECUTADOS`,
      `Fecha,Hora,Humedad al regar,Dispositivo`,
      ...logs.map(l => {
        const d = new Date(l.createdAt);
        return `${d.toLocaleDateString("es-MX")},${d.toLocaleTimeString("es-MX")},${l.humidity || ""},${l.deviceId || "manual"}`;
      }),
    ];

    const csv      = lines.join("\n");
    const filename = `riegoiq_${plant.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv);
  } catch (err) {
    console.error("❌ GET /plants/:id/export/csv:", err.message);
    res.status(500).json({ error: errProd("Error al exportar CSV", err) });
  }
});

// ════════════════════════════════════════
// GET /api/plants/export/csv/all
// ════════════════════════════════════════
router.get("/export/csv/all", async (req, res) => {
  try {
    const plants = await Plant.find({ owner: req.user._id }).sort({ sector: 1, order: 1 });
    if (!plants.length)
      return res.status(404).json({ error: "No tienes plantas registradas" });

    const days   = Math.min(parseInt(req.query.days) || 7, 30);
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);

    const lines = [
      `RiegoIQ — Reporte General`,
      `Generado: ${new Date().toLocaleString("es-MX")} | Período: últimos ${days} días`,
      ``,
      `Planta,Sector,Válvula,Humedad Actual (%),Mín (%),Máx (%),Estado Válvula,Modo Mantenimiento,Último Riego`,
      ...plants.map(p => {
        const ult = p.lastIrrigation ? new Date(p.lastIrrigation).toLocaleString("es-MX") : "Sin datos";
        return `"${p.name}",${p.sector},V${p.valveNumber},${p.currentHumidity},${p.minHumidity},${p.maxHumidity},${p.valveStatus},${p.maintenanceMode ? "Sí" : "No"},${ult}`;
      }),
    ];

    const csv      = lines.join("\n");
    const filename = `riegoiq_general_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv);
  } catch (err) {
    console.error("❌ GET /plants/export/csv/all:", err.message);
    res.status(500).json({ error: errProd("Error al exportar CSV general", err) });
  }
});

// ════════════════════════════════════════
// GET /api/plants/:id/alerts
// ════════════════════════════════════════
router.get("/:id/alerts", async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!plant) return res.status(404).json({ error: "Planta no encontrada" });
    res.json([...plant.alertHistory].reverse());
  } catch (err) {
    console.error("❌ GET /plants/:id/alerts:", err.message);
    res.status(500).json({ error: errProd("Error al obtener las alertas", err) });
  }
});

module.exports = router;