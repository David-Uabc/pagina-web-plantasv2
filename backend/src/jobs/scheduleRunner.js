// jobs/scheduleRunner.js
// Cron job que revisa cada minuto si hay riegos programados
const Plant = require("../models/Plant");
const { publishValveCommand } = require("../mqtt/mqttClient");
const { emitToUser } = require("../utils/socketRooms");

const DAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

let runnerInterval = null;

function sameMinute(a, b) {
  return (
    a &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours() &&
    a.getMinutes() === b.getMinutes()
  );
}

function matchesQuincenal(now, startDate) {
  if (!startDate) return false;
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return false;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const diffDays = Math.floor((today - startDay) / 86400000);
  return diffDays >= 0 && diffDays % 15 === 0;
}

function matchesMensual(now, dayOfMonth) {
  const wantedDay = Math.max(1, Math.min(31, Number(dayOfMonth) || 1));
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return now.getDate() === Math.min(wantedDay, lastDayOfMonth);
}

function shouldRunPlant(plant, now, dayOfWeek, timeNow) {
  const schedule = plant.schedule || {};
  if (!schedule.enabled || schedule.time !== timeNow) return false;
  if (plant.irrigationType === "Por humedad") return false;
  if (plant.lastIrrigation && sameMinute(new Date(plant.lastIrrigation), now)) return false;

  switch (plant.irrigationType) {
    case "Diario":
      return true;
    case "Semanal":
      return Array.isArray(schedule.days) && schedule.days.includes(dayOfWeek);
    case "Quincenal":
      return matchesQuincenal(now, schedule.startDate);
    case "Mensual":
      return matchesMensual(now, schedule.dayOfMonth);
    default:
      return false;
  }
}

async function runSchedules(io) {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const timeNow = `${hh}:${mm}`;

    const plants = await Plant.find({ "schedule.enabled": true });
    const plantsToRun = plants.filter((plant) => shouldRunPlant(plant, now, dayOfWeek, timeNow));

    if (plantsToRun.length === 0) return;

    console.log(`[Scheduler] ${timeNow} - ${plantsToRun.length} riego(s) programado(s)`);

    for (const plant of plantsToRun) {
      if (plant.valveStatus === "OPEN") continue;
      if (plant.maintenanceMode) continue;

      plant.valveStatus = "OPEN";
      plant.lastIrrigation = now;

      plant.alertHistory.push({
        type: "valve_on",
        message: `Riego automatico programado - ${DAYS[dayOfWeek]} ${timeNow}`,
        humidity: plant.currentHumidity,
        resolved: true,
      });

      await plant.save();
      publishValveCommand(plant.sector, plant.valveNumber, "OPEN", plant._id.toString());

      console.log(`   ${plant.name} (${plant.sector}) - valvula abierta por ${plant.schedule.duration} min`);

      if (io) {
        emitToUser(io, plant.owner, "plant:update", {
          _id: plant._id.toString(),
          name: plant.name,
          sector: plant.sector,
          node: plant.node,
          valveStatus: "OPEN",
          lastIrrigation: now,
          currentHumidity: plant.currentHumidity,
          minHumidity: plant.minHumidity,
          maxHumidity: plant.maxHumidity,
        });
        emitToUser(io, plant.owner, "schedule:triggered", {
          plantId: plant._id.toString(),
          name: plant.name,
          sector: plant.sector,
          node: plant.node,
          time: timeNow,
          duration: plant.schedule.duration,
        });
      }

      const duration = (plant.schedule.duration || 10) * 60 * 1000;
      const plantId = plant._id;
      setTimeout(async () => {
        try {
          const p = await Plant.findById(plantId);
          if (p && p.valveStatus === "OPEN") {
            p.valveStatus = "CLOSED";
            p.alertHistory.push({
              type: "valve_off",
              message: `Riego automatico finalizado - duracion: ${plant.schedule.duration} min`,
              humidity: p.currentHumidity,
              resolved: true,
            });
            await p.save();
            publishValveCommand(p.sector, p.valveNumber, "CLOSED", p._id.toString());
            console.log(`   ${p.name} - valvula cerrada (fin de schedule)`);

            if (io) {
              emitToUser(io, p.owner, "plant:update", {
                _id: p._id.toString(),
                name: p.name,
                sector: p.sector,
                node: p.node,
                valveStatus: "CLOSED",
                currentHumidity: p.currentHumidity,
                minHumidity: p.minHumidity,
                maxHumidity: p.maxHumidity,
              });
            }
          }
        } catch (e) {
          console.error("[Scheduler] Error cerrando valvula:", e.message);
        }
      }, duration);
    }
  } catch (err) {
    console.error("[Scheduler] Error:", err.message);
  }
}

function start(io) {
  if (runnerInterval) return;
  const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
  setTimeout(() => {
    runSchedules(io);
    runnerInterval = setInterval(() => runSchedules(io), 60 * 1000);
  }, msToNextMinute);
  console.log("[Scheduler] Scheduler de riegos iniciado");
}

function stop() {
  if (runnerInterval) {
    clearInterval(runnerInterval);
    runnerInterval = null;
  }
}

module.exports = { start, stop };
