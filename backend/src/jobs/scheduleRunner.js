// jobs/scheduleRunner.js
// Cron job que revisa cada minuto si hay riegos programados
const Plant = require("../models/Plant");

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

let runnerInterval = null;

async function runSchedules(io) {
  try {
    const now     = new Date();
    const dayOfWeek = now.getDay();          // 0=Dom … 6=Sáb
    const hh      = String(now.getHours()).padStart(2, "0");
    const mm      = String(now.getMinutes()).padStart(2, "0");
    const timeNow = `${hh}:${mm}`;

    // Buscar plantas con schedule activo para hoy a esta hora
    const plants = await Plant.find({
      "schedule.enabled": true,
      "schedule.days":    { $in: [dayOfWeek] },
      "schedule.time":    timeNow,
    });

    if (plants.length === 0) return;

    console.log(`⏰ [Scheduler] ${timeNow} — ${plants.length} riego(s) programado(s)`);

    for (const plant of plants) {
      if (plant.valveStatus === "OPEN") continue; // ya está regando

      plant.valveStatus    = "OPEN";
      plant.lastIrrigation = now;

      plant.alertHistory.push({
        type:     "valve_on",
        message:  `Riego automático programado — ${DAYS[dayOfWeek]} ${timeNow}`,
        humidity: plant.currentHumidity,
        resolved: true,
      });

      await plant.save();

      console.log(`   💧 ${plant.name} (${plant.sector}) — válvula abierta por ${plant.schedule.duration} min`);

      // Notificar al frontend en tiempo real
      if (io) {
        io.emit("plant:update", {
          _id:            plant._id.toString(),
          name:           plant.name,
          sector:         plant.sector,
          valveStatus:    "OPEN",
          lastIrrigation: now,
          currentHumidity: plant.currentHumidity,
          minHumidity:    plant.minHumidity,
          maxHumidity:    plant.maxHumidity,
        });
        io.emit("schedule:triggered", {
          plantId:  plant._id.toString(),
          name:     plant.name,
          sector:   plant.sector,
          time:     timeNow,
          duration: plant.schedule.duration,
        });
      }

      // Cerrar válvula después de la duración programada
      const duration = (plant.schedule.duration || 10) * 60 * 1000; // ms
      const plantId  = plant._id;
      setTimeout(async () => {
        try {
          const p = await Plant.findById(plantId);
          if (p && p.valveStatus === "OPEN") {
            p.valveStatus = "CLOSED";
            p.alertHistory.push({
              type:     "valve_off",
              message:  `Riego automático finalizado — duración: ${plant.schedule.duration} min`,
              humidity: p.currentHumidity,
              resolved: true,
            });
            await p.save();
            console.log(`   ✅ ${p.name} — válvula cerrada (fin de schedule)`);

            if (io) {
              io.emit("plant:update", {
                _id:            p._id.toString(),
                name:           p.name,
                sector:         p.sector,
                valveStatus:    "CLOSED",
                currentHumidity: p.currentHumidity,
                minHumidity:    p.minHumidity,
                maxHumidity:    p.maxHumidity,
              });
            }
          }
        } catch (e) {
          console.error("❌ [Scheduler] Error cerrando válvula:", e.message);
        }
      }, duration);
    }
  } catch (err) {
    console.error("❌ [Scheduler] Error:", err.message);
  }
}

function start(io) {
  if (runnerInterval) return;
  // Ejecutar al inicio del próximo minuto, luego cada 60s
  const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
  setTimeout(() => {
    runSchedules(io);
    runnerInterval = setInterval(() => runSchedules(io), 60 * 1000);
  }, msToNextMinute);
  console.log("⏰ [Scheduler] Scheduler de riegos iniciado");
}

function stop() {
  if (runnerInterval) {
    clearInterval(runnerInterval);
    runnerInterval = null;
  }
}

module.exports = { start, stop };