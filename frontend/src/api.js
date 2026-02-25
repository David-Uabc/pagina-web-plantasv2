import axios from "axios";

// ── URL base de la API ────────────────────────────────
export const API_URL = process.env.REACT_APP_API_URL || "https://riego-iot-backend.onrender.com";

// ── Instancia de axios con configuración global ───────
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// ── Interceptor — agrega token JWT automáticamente ───
api.interceptors.request.use((config) => {
  const session = localStorage.getItem("iot_session");
  if (session) {
    const { token } = JSON.parse(session);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor — maneja errores globalmente ──────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("iot_session");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;