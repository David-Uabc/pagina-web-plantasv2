import axios from "axios";

export const API_URL =
  process.env.REACT_APP_API_URL || "https://riego-iot-backend.onrender.com";

const CACHE_KEY = "iot_offline_cache";
const CACHE_TTL = 5 * 60 * 1000;
const SESSION_HINT_KEY = "iot_has_session";
const inFlightGetControllers = new Map();

function buildRequestKey(config) {
  const params = config.params ? JSON.stringify(config.params) : "";
  return `${config.method || "get"}:${config.baseURL || ""}:${config.url || ""}:${params}`;
}

function saveCache(url, data) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    cache[url] = { data, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
  }
}

function loadCache(url) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    const entry = cache[url];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  } catch {
  }
  return null;
}

function mensajeDeError(error) {
  if (!error.response) {
    return "No hay conexión con el servidor. Verifica tu internet e intenta de nuevo.";
  }

  switch (error.response.status) {
    case 400:
      return error.response.data?.error || "Los datos ingresados no son válidos.";
    case 401:
      return "Tu sesión ha vencido. Por favor inicia sesión de nuevo.";
    case 403:
      return "No tienes permiso para realizar esta acción.";
    case 404:
      return "No se encontró la información solicitada.";
    case 409:
      return error.response.data?.error || "Ya existe un registro con esos datos.";
    case 429:
      return "Demasiados intentos. Por favor espera unos minutos.";
    case 500:
      return "Ocurrió un error en el servidor. Intenta de nuevo en unos momentos.";
    default:
      return error.response.data?.error || "Ocurrió un error inesperado.";
  }
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue = [];
let accessToken = null;

const processQueue = (error, token = null) => {
  refreshQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token);
  });
  refreshQueue = [];
};

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

export const markSessionHint = () => localStorage.setItem(SESSION_HINT_KEY, "1");
export const clearSessionHint = () => localStorage.removeItem(SESSION_HINT_KEY);
export const hasSessionHint = () => localStorage.getItem(SESSION_HINT_KEY) === "1";

export const tryRestoreSession = async () => {
  if (!hasSessionHint()) return null;

  try {
    const res = await axios.post(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    if (res.data.accessToken) {
      setAccessToken(res.data.accessToken);
      markSessionHint();
      return res.data.user;
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearSessionHint();
    }
    return null;
  }

  return null;
};

export const logout = async () => {
  try {
    await api.post("/api/auth/logout");
  } catch {
  }
  clearAccessToken();
  clearSessionHint();
  localStorage.removeItem("iot_user");
  localStorage.removeItem("iot_session");
  window.location.href = "/login";
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const shouldCancelPrevious =
      config.method === "get" &&
      config.meta?.cancelPrevious !== false &&
      !config.signal;

    if (shouldCancelPrevious) {
      const requestKey = buildRequestKey(config);
      const previous = inFlightGetControllers.get(requestKey);
      if (previous) previous.abort("Replaced by a newer request");

      const controller = new AbortController();
      config.signal = controller.signal;
      config._requestKey = requestKey;
      inFlightGetControllers.set(requestKey, controller);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.config._requestKey) {
      inFlightGetControllers.delete(response.config._requestKey);
    }

    if (response.config.method === "get") {
      saveCache(response.config.url, response.data);
    }

    if (localStorage.getItem("iot_offline")) {
      localStorage.removeItem("iot_offline");
      window.dispatchEvent(new CustomEvent("iot_online"));
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};

    if (originalRequest._requestKey) {
      inFlightGetControllers.delete(originalRequest._requestKey);
    }

    if (error.code === "ERR_CANCELED" || error.name === "CanceledError") {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;
        setAccessToken(newToken);
        markSessionHint();
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        clearSessionHint();
        localStorage.removeItem("iot_user");
        localStorage.removeItem("iot_session");
        window.dispatchEvent(
          new CustomEvent("iot_session_expired", {
            detail: { mensaje: "Tu sesión ha vencido. Por favor inicia sesión de nuevo." },
          })
        );
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 429) {
      window.dispatchEvent(
        new CustomEvent("iot_rate_limited", {
          detail: { mensaje: "Demasiados intentos. Por favor espera unos minutos." },
        })
      );
    }

    if (!error.response && originalRequest.method === "get") {
      const cached = loadCache(originalRequest.url);
      if (cached) {
        localStorage.setItem("iot_offline", "1");
        window.dispatchEvent(new CustomEvent("iot_offline"));
        return Promise.resolve({ data: cached, _fromCache: true, status: 200 });
      }
    }

    error.mensajeUsuario = mensajeDeError(error);
    return Promise.reject(error);
  }
);

export default api;
