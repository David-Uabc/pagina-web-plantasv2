// public/sw.js
// Service Worker para notificaciones push PWA de RiegoIQ
// Coloca este archivo en la carpeta /public de tu proyecto React

const CACHE_NAME   = "riegoiq-v1";
const STATIC_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ── Instalación ───────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker instalando...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_CACHE).catch(() => {
        // Si falla el caché de algún recurso, seguir igual
      });
    })
  );
  self.skipWaiting();
});

// ── Activación ────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activo");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch — caché básico ──────────────────────────────
self.addEventListener("fetch", (event) => {
  // Solo cachear GETs de nuestra app
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(res => {
        // Actualizar caché con la respuesta nueva
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Push Notifications ────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title:   "RiegoIQ",
      body:    event.data.text(),
      type:    "info",
    };
  }

  const {
    title   = "RiegoIQ — Sistema de Riego",
    body    = "Tienes una notificación nueva",
    type    = "info",       // "alert", "water", "ok", "maintenance"
    plantId = null,
    sector  = null,
    url     = "/",
  } = data;

  // Icono según el tipo de notificación
  const iconMap = {
    alert:       "/icons/icon-alert.png",
    water:       "/icons/icon-water.png",
    ok:          "/icons/icon-ok.png",
    maintenance: "/icons/icon-wrench.png",
    info:        "/icons/icon-192.png",
  };

  // Color de badge según tipo
  const badgeMap = {
    alert:       "/icons/badge-red.png",
    water:       "/icons/badge-blue.png",
    ok:          "/icons/badge-green.png",
    maintenance: "/icons/badge-yellow.png",
    info:        "/icons/badge-green.png",
  };

  const options = {
    body,
    icon:              iconMap[type]  || "/icons/icon-192.png",
    badge:             badgeMap[type] || "/icons/badge-green.png",
    vibrate:           type === "alert" ? [200, 100, 200, 100, 200] : [100, 50, 100],
    tag:               `riegoiq-${type}-${plantId || Date.now()}`,
    renotify:          true,
    requireInteraction: type === "alert", // alerta se queda hasta que el usuario la toca
    data:              { url, plantId, sector, type },
    actions: type === "alert" ? [
      { action: "view",    title: "🌱 Ver planta" },
      { action: "dismiss", title: "Ignorar"       },
    ] : [
      { action: "view", title: "Ver dashboard" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Click en notificación ─────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { url, plantId, sector } = event.notification.data || {};

  let targetUrl = "/";
  if (event.action === "dismiss") return;

  if (sector === "Superior")  targetUrl = "/sector/superior";
  else if (sector === "Inferior") targetUrl = "/sector/inferior";
  else if (url) targetUrl = url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.postMessage({ type: "NAVIGATE", url: targetUrl });
          return;
        }
      }
      // Si no hay ventana, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Push subscription change ──────────────────────────
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: self.__VAPID_PUBLIC_KEY__,
    }).then(subscription => {
      // Enviar la nueva suscripción al servidor
      return fetch("/api/notifications/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(subscription),
      });
    })
  );
});