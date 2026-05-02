// hooks/usePushNotifications.js
// Hook completo para gestionar notificaciones push PWA
// Registra el SW, pide permisos, suscribe al servidor y muestra notificaciones locales

import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

// ── Clave pública VAPID ───────────────────────────────
// Esta clave la generas en el servidor y la pones en el .env del frontend
// REACT_APP_VAPID_PUBLIC_KEY=tu_clave_publica_vapid
const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY || "";

// Convertir la clave VAPID de base64 a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export default function usePushNotifications() {
  const [permiso,      setPermiso]      = useState("default");  // "default" | "granted" | "denied"
  const [suscrito,     setSuscrito]     = useState(false);
  const [swRegistrado, setSwRegistrado] = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [error,        setError]        = useState(null);

  // ── Registrar el Service Worker al montar ─────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setError("Tu navegador no soporta notificaciones push");
      return;
    }

    navigator.serviceWorker
      .register("/Sw.js")
      .then(reg => {
        console.log("✅ Service Worker registrado:", reg.scope);
        setSwRegistrado(true);

        // Verificar si ya hay suscripción activa
        return reg.pushManager.getSubscription();
      })
      .then(sub => {
        setSuscrito(!!sub);
      })
      .catch(err => {
        console.error("❌ Error registrando SW:", err);
        setError("No se pudo registrar el Service Worker");
      });

    // Verificar permiso actual
    if ("Notification" in window) {
      setPermiso(Notification.permission);
    }
  }, []);

  // ── Pedir permiso y suscribirse ───────────────────────
  const activar = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setError("Tu navegador no soporta notificaciones push");
      return false;
    }

    setCargando(true);
    setError(null);

    try {
      // 1. Pedir permiso al usuario
      const perm = await Notification.requestPermission();
      setPermiso(perm);

      if (perm !== "granted") {
        setError("Para recibir alertas debes permitir las notificaciones en tu navegador");
        return false;
      }

      // 2. Obtener el registro del SW
      const reg = await navigator.serviceWorker.ready;

      // 3. Suscribirse al servidor VAPID
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 4. Enviar la suscripción al backend para guardarla
      await api.post("/api/notifications/subscribe", {
        subscription: sub.toJSON(),
      });

      setSuscrito(true);
      console.log("✅ Suscripción push activa");

      // 5. Mostrar notificación de bienvenida
      mostrarLocal({
        title: "🌿 RiegoIQ — Notificaciones activas",
        body:  "Ahora recibirás alertas cuando tus plantas necesiten agua",
        type:  "ok",
      });

      return true;

    } catch (err) {
      console.error("❌ Error activando notificaciones:", err);
      setError("No se pudieron activar las notificaciones. Intenta de nuevo.");
      return false;
    } finally {
      setCargando(false);
    }
  }, []);

  // ── Desuscribirse ─────────────────────────────────────
  const desactivar = useCallback(async () => {
    setCargando(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        await api.delete("/api/notifications/unsubscribe");
      }

      setSuscrito(false);
    } catch (err) {
      console.error("❌ Error desactivando notificaciones:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  // ── Mostrar notificación local (sin servidor) ─────────
  // Útil para alertas inmediatas desde Socket.io
  const mostrarLocal = useCallback(({ title, body, type = "info", url = "/" }) => {
    if (!swRegistrado || permiso !== "granted") return;

    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body,
        icon:    "/icons/icon-192.png",
        badge:   "/icons/badge-green.png",
        vibrate: type === "alert" ? [200, 100, 200] : [100],
        tag:     `riegoiq-local-${Date.now()}`,
        data:    { url },
      });
    });
  }, [swRegistrado, permiso]);

  // ── Escuchar eventos Socket.io para notificar ─────────
  // Llama esto en el componente principal con el socket
  const conectarSocket = useCallback((socket) => {
    if (!socket) return;

    // Alerta de humedad baja
    socket.on("plant:alert", (data) => {
      if (permiso !== "granted") return;
      mostrarLocal({
        title: `🚨 ${data.name} necesita agua`,
        body:  `Humedad al ${data.humidity}% — por debajo del mínimo configurado`,
        type:  "alert",
        url:   `/sector/${data.sector?.toLowerCase()}`,
      });
    });

    // Riego ejecutado
    socket.on("plant:update", (data) => {
      if (permiso !== "granted" || data.valveStatus !== "OPEN") return;
      mostrarLocal({
        title: `💧 Regando ${data.name}`,
        body:  `El riego automático se activó en ${data.sector}`,
        type:  "water",
        url:   `/sector/${data.sector?.toLowerCase()}`,
      });
    });

    return () => {
      socket.off("plant:alert");
      socket.off("plant:update");
    };
  }, [permiso, mostrarLocal]);

  return {
    permiso,        // "default" | "granted" | "denied"
    suscrito,       // bool — si hay suscripción activa
    swRegistrado,   // bool — si el SW está registrado
    cargando,       // bool — mientras pide permisos
    error,          // string | null
    activar,        // función para pedir permiso y suscribirse
    desactivar,     // función para desuscribirse
    mostrarLocal,   // función para notificación inmediata sin servidor
    conectarSocket, // función para conectar con Socket.io
  };
}
