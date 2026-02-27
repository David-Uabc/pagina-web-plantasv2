// hooks/useNotifications.js — Push notifications del navegador
import { useCallback, useRef } from "react";

const STORAGE_KEY = "iot_notified_plants";
const COOLDOWN_MS = 10 * 60 * 1000; // 10 min

function getNotified() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function setNotified(obj) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch {}
}

export function useNotifications() {
  const permRef = useRef(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied";
    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      permRef.current = result;
      return result;
    }
    permRef.current = Notification.permission;
    return Notification.permission;
  }, []);

  const notify = useCallback((plant) => {
    if (permRef.current !== "granted") return;
    const now      = Date.now();
    const notified = getNotified();
    if (now - (notified[plant._id] || 0) < COOLDOWN_MS) return;

    const n = new Notification(`⚠️ ${plant.name} necesita agua`, {
      body: `Humedad: ${plant.currentHumidity ?? 0}% (mín: ${plant.minHumidity}%)`,
      icon: "/favicon.ico",
      tag:  `plant-${plant._id}`,
    });
    n.onclick = () => { window.focus(); n.close(); };
    notified[plant._id] = now;
    setNotified(notified);
  }, []);

  const checkPlants = useCallback((plants = []) => {
    if (permRef.current !== "granted") return;
    plants.forEach(p => {
      if ((p.currentHumidity ?? 0) < p.minHumidity) notify(p);
    });
  }, [notify]);

  return { requestPermission, checkPlants, notify };
}

export default useNotifications;