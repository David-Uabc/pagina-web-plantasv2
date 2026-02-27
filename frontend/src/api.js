import axios from "axios";

export const API_URL = process.env.REACT_APP_API_URL || "https://riego-iot-backend.onrender.com";

// ── Clave para caché offline ──────────────────────────
const CACHE_KEY   = "iot_offline_cache";
const CACHE_TTL   = 5 * 60 * 1000; // 5 minutos

// ── Helpers de caché ─────────────────────────────────
function saveCache(url, data) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    cache[url]  = { data, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function loadCache(url) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    const entry = cache[url];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  } catch {}
  return null;
}

// ── Instancia axios ───────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// ── Request: agrega JWT ───────────────────────────────
api.interceptors.request.use((config) => {
  const session = localStorage.getItem("iot_session");
  if (session) {
    const { token } = JSON.parse(session);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: caché offline + manejo de errores ───────
api.interceptors.response.use(
  (response) => {
    // Cachear GETs exitosos
    if (response.config.method === "get") {
      saveCache(response.config.url, response.data);
    }
    // Limpiar bandera offline si vuelve la conexión
    if (localStorage.getItem("iot_offline")) {
      localStorage.removeItem("iot_offline");
      window.dispatchEvent(new CustomEvent("iot_online"));
    }
    return response;
  },
  (error) => {
    // 401 → logout
    if (error.response?.status === 401) {
      localStorage.removeItem("iot_session");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Sin conexión → intentar caché
    const isNetworkError = !error.response;
    if (isNetworkError && error.config?.method === "get") {
      const cached = loadCache(error.config.url);
      if (cached) {
        localStorage.setItem("iot_offline", "1");
        window.dispatchEvent(new CustomEvent("iot_offline"));
        // Devolver como respuesta válida con bandera
        return Promise.resolve({
          data: cached,
          _fromCache: true,
          status: 200,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;