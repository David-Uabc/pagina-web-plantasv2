import { createContext, useContext, useState, useEffect } from "react";

// ─────────────────────────────────────────────
//  TRANSLATIONS
// ─────────────────────────────────────────────
export const TRANSLATIONS = {
  es: {
    // Navbar
    "nav.title":          "Sistema de Riego IoT",
    "nav.home":           "Inicio",
    "nav.sectorSup":      "Sector Superior",
    "nav.sectorInf":      "Sector Inferior",
    "nav.notifications":  "Notificaciones",
    "nav.noAlerts":       "Sin alertas activas",
    "nav.alerts":         "alertas",
    "nav.critHumidity":   "Humedad crítica",
    "nav.profile":        "Mi perfil",
    "nav.settings":       "Configuración",
    "nav.logout":         "Cerrar sesión",

    // QuickStats
    "stats.totalPlants":  "Total Plantas",
    "stats.watering":     "Regando Ahora",
    "stats.alerts":       "Alertas Activas",
    "stats.avgHumidity":  "Humedad Promedio",

    // SystemStatus
    "sys.title":          "Estado del Sistema",
    "sys.operative":      "● Operativo",
    "sys.attention":      "● Atención",
    "sys.mqtt":           "MQTT Broker",
    "sys.connected":      "Conectado",
    "sys.disconnected":   "Desconectado",
    "sys.database":       "Base de Datos",
    "sys.dbActive":       "Activa",
    "sys.dbInactive":     "Inactiva",
    "sys.lastIrr":        "Último Riego",
    "sys.reporting":      "Reportando",
    "sys.noRecord":       "Sin registro",
    "sys.errBoth":        "MQTT y Base de Datos desconectados",
    "sys.errMqtt":        "MQTT desconectado — revisá la conexión",
    "sys.errDb":          "Base de datos inaccesible",
    "sys.secAgo":         "s atrás",
    "sys.minAgo":         "min atrás",
    "sys.hAgo":           "h atrás",
    "sys.daysAgo":        "días",

    // AverageHumidity
    "hum.title":          "Humedad Promedio",
    "hum.monitored":      "plantas monitoreadas",
    "hum.critical":       "Crítica",
    "hum.regular":        "Regular",
    "hum.optimal":        "Óptima",
    "hum.min":            "Mínimo",
    "hum.max":            "Máximo",
    "hum.plants":         "Plantas",
    "hum.24h":            "24h",
    "hum.week":           "Semana",
    "hum.month":          "Mes",

    // Dashboard
    "dash.patioSup":      "🌿 Patio Superior",
    "dash.patioInf":      "🌿 Patio Inferior",
    "dash.seeAll":        "Ver todas",
    "dash.goSector":      "Ir al sector →",
    "dash.noPlants":      "Aún no hay plantas en este sector.",
    "dash.goAdd":         "Ir a Sector {0} para agregar →",

    // PlantCard
    "plant.daily":        "Diario",
    "plant.weekly":       "Semanal",
    "plant.manual":       "Manual",
    "plant.critical":     "Crítica",
    "plant.low":          "Baja",
    "plant.high":         "Alta",
    "plant.optimal":      "Óptima",
    "plant.alertMsg":     "⚠ Humedad bajo mínimo — riego recomendado",
    "plant.waterNow":     "💧 Regar Ahora",
    "plant.stopWater":    "⏹ Detener",
    "plant.watering":     "Regando...",
    "plant.history":      "Historial",
    "plant.edit":         "Editar",
    "plant.humidity":     "Humedad",
    "plant.irrigations":  "Riegos",
    "plant.avg":          "Promedio",
    "plant.min":          "Mínimo",
    "plant.max":          "Máximo",
    "plant.count":        "Riegos",
    "plant.noIrr":        "Sin riegos en este período 🌵",
    "plant.duration":     "Duración (min)",
    "plant.raised":       "Humedad +%",

    // SectorPage
    "sector.supTitle":    "Sector Superior",
    "sector.infTitle":    "Sector Inferior",
    "sector.addPlant":    "+ Agregar Planta",
    "sector.search":      "Buscar plantas...",
    "sector.all":         "Todas",
    "sector.optimal":     "Óptimas",
    "sector.lowAlert":    "Alerta baja",
    "sector.watering":    "Regando",
    "sector.noResults":   "Sin resultados",
    "sector.noPlants":    "No hay plantas en este sector todavía.",
    "sector.plant":       "planta",
    "sector.plants":      "plantas",

    // Login
    "login.title":        "Iniciar Sesión",
    "login.register":     "Registrarse",
    "login.forgot":       "¿Olvidaste tu contraseña?",
    "login.username":     "Usuario",
    "login.password":     "Contraseña",
    "login.email":        "Email",
    "login.fullName":     "Nombre completo",
    "login.confirmPass":  "Confirmar contraseña",
    "login.submit":       "Entrar",
    "login.registerBtn":  "Crear cuenta",
    "login.resetBtn":     "Enviar instrucciones",
    "login.noAccount":    "¿No tienes cuenta?",
    "login.hasAccount":   "¿Ya tienes cuenta?",
    "login.signUp":       "Regístrate",
    "login.signIn":       "Inicia sesión",
    "login.backLogin":    "← Volver al login",
    "login.forgotLink":   "¿Olvidaste tu contraseña?",
    "login.success":      "¡Bienvenido de vuelta!",
    "login.registered":   "¡Cuenta creada! Iniciando sesión...",
    "login.resetSent":    "✓ Instrucciones enviadas a tu email",
    "login.errUser":      "Usuario o contraseña incorrectos",
    "login.errExists":    "El usuario ya existe",
    "login.errPassMatch": "Las contraseñas no coinciden",

    // ProfileModal
    "profile.title":      "Mi Perfil",
    "profile.info":       "Información",
    "profile.password":   "Contraseña",
    "profile.fullName":   "Nombre completo",
    "profile.email":      "Email",
    "profile.username":   "Usuario",
    "profile.userHint":   "El nombre de usuario no se puede cambiar",
    "profile.oldPass":    "Contraseña actual",
    "profile.newPass":    "Nueva contraseña",
    "profile.confirmPass":"Confirmar contraseña",
    "profile.save":       "Guardar cambios",
    "profile.saved":      "¡Guardado!",
    "profile.saving":     "Guardando...",
    "profile.updating":   "Actualizando...",
    "profile.updated":    "¡Contraseña actualizada!",
    "profile.weak":       "Muy corta",
    "profile.medium":     "Regular",
    "profile.strong":     "Segura",
    "profile.errName":    "El nombre es requerido",
    "profile.errEmail":   "Email inválido",
    "profile.errOldPass": "Ingresa tu contraseña actual",
    "profile.errWrongPass":"Contraseña incorrecta",
    "profile.errMinPass": "Mínimo 6 caracteres",
    "profile.errMatch":   "Las contraseñas no coinciden",

    // SettingsModal
    "settings.title":       "Configuración",
    "settings.subtitle":    "Personaliza tu experiencia",
    "settings.appearance":  "Apariencia",
    "settings.dark":        "Oscuro",
    "settings.light":       "Claro",
    "settings.compact":     "Modo compacto",
    "settings.compactDesc": "Reduce el espaciado para ver más información",
    "settings.notifications":"Notificaciones",
    "settings.humAlerts":   "Alertas de humedad",
    "settings.humAlertsDesc":"Notificar cuando la humedad baja del umbral",
    "settings.soundAlerts": "Alertas de sonido",
    "settings.soundDesc":   "Reproducir sonido al recibir alertas críticas",
    "settings.threshold":   "Umbral de alerta",
    "settings.system":      "Sistema",
    "settings.refresh":     "Auto-actualizar cada",
    "settings.language":    "Idioma",
    "settings.langDesc":    "Idioma de la interfaz",
    "settings.cancel":      "Cancelar",
    "settings.save":        "Guardar cambios",
    "settings.saving":      "Aplicando...",
    "settings.saved":       "¡Aplicado!",

    // ConfirmModal
    "confirm.delete":     "¿Eliminar planta?",
    "confirm.deleteDesc": "Esta acción no se puede deshacer.",
    "confirm.yes":        "Sí, eliminar",
    "confirm.cancel":     "Cancelar",

    // NotFound
    "notfound.title":     "Página no encontrada",
    "notfound.desc":      "La página que buscas no existe.",
    "notfound.btn":       "Volver al inicio",
  },

  en: {
    // Navbar
    "nav.title":          "IoT Irrigation System",
    "nav.home":           "Home",
    "nav.sectorSup":      "Upper Sector",
    "nav.sectorInf":      "Lower Sector",
    "nav.notifications":  "Notifications",
    "nav.noAlerts":       "No active alerts",
    "nav.alerts":         "alerts",
    "nav.critHumidity":   "Critical humidity",
    "nav.profile":        "My Profile",
    "nav.settings":       "Settings",
    "nav.logout":         "Sign out",

    // QuickStats
    "stats.totalPlants":  "Total Plants",
    "stats.watering":     "Watering Now",
    "stats.alerts":       "Active Alerts",
    "stats.avgHumidity":  "Avg. Humidity",

    // SystemStatus
    "sys.title":          "System Status",
    "sys.operative":      "● Operative",
    "sys.attention":      "● Attention",
    "sys.mqtt":           "MQTT Broker",
    "sys.connected":      "Connected",
    "sys.disconnected":   "Disconnected",
    "sys.database":       "Database",
    "sys.dbActive":       "Active",
    "sys.dbInactive":     "Inactive",
    "sys.lastIrr":        "Last Irrigation",
    "sys.reporting":      "Reporting",
    "sys.noRecord":       "No record",
    "sys.errBoth":        "MQTT and Database disconnected",
    "sys.errMqtt":        "MQTT disconnected — check connection",
    "sys.errDb":          "Database unreachable",
    "sys.secAgo":         "s ago",
    "sys.minAgo":         "min ago",
    "sys.hAgo":           "h ago",
    "sys.daysAgo":        "days",

    // AverageHumidity
    "hum.title":          "Average Humidity",
    "hum.monitored":      "plants monitored",
    "hum.critical":       "Critical",
    "hum.regular":        "Regular",
    "hum.optimal":        "Optimal",
    "hum.min":            "Minimum",
    "hum.max":            "Maximum",
    "hum.plants":         "Plants",
    "hum.24h":            "24h",
    "hum.week":           "Week",
    "hum.month":          "Month",

    // Dashboard
    "dash.patioSup":      "🌿 Upper Patio",
    "dash.patioInf":      "🌿 Lower Patio",
    "dash.seeAll":        "See all",
    "dash.goSector":      "Go to sector →",
    "dash.noPlants":      "No plants in this sector yet.",
    "dash.goAdd":         "Go to {0} Sector to add →",

    // PlantCard
    "plant.daily":        "Daily",
    "plant.weekly":       "Weekly",
    "plant.manual":       "Manual",
    "plant.critical":     "Critical",
    "plant.low":          "Low",
    "plant.high":         "High",
    "plant.optimal":      "Optimal",
    "plant.alertMsg":     "⚠ Humidity below minimum — watering recommended",
    "plant.waterNow":     "💧 Water Now",
    "plant.stopWater":    "⏹ Stop",
    "plant.watering":     "Watering...",
    "plant.history":      "History",
    "plant.edit":         "Edit",
    "plant.humidity":     "Humidity",
    "plant.irrigations":  "Irrigations",
    "plant.avg":          "Average",
    "plant.min":          "Minimum",
    "plant.max":          "Maximum",
    "plant.count":        "Irrigations",
    "plant.noIrr":        "No irrigations in this period 🌵",
    "plant.duration":     "Duration (min)",
    "plant.raised":       "Humidity +%",

    // SectorPage
    "sector.supTitle":    "Upper Sector",
    "sector.infTitle":    "Lower Sector",
    "sector.addPlant":    "+ Add Plant",
    "sector.search":      "Search plants...",
    "sector.all":         "All",
    "sector.optimal":     "Optimal",
    "sector.lowAlert":    "Low alert",
    "sector.watering":    "Watering",
    "sector.noResults":   "No results",
    "sector.noPlants":    "No plants in this sector yet.",
    "sector.plant":       "plant",
    "sector.plants":      "plants",

    // Login
    "login.title":        "Sign In",
    "login.register":     "Register",
    "login.forgot":       "Forgot your password?",
    "login.username":     "Username",
    "login.password":     "Password",
    "login.email":        "Email",
    "login.fullName":     "Full name",
    "login.confirmPass":  "Confirm password",
    "login.submit":       "Sign In",
    "login.registerBtn":  "Create account",
    "login.resetBtn":     "Send instructions",
    "login.noAccount":    "Don't have an account?",
    "login.hasAccount":   "Already have an account?",
    "login.signUp":       "Sign up",
    "login.signIn":       "Sign in",
    "login.backLogin":    "← Back to login",
    "login.forgotLink":   "Forgot your password?",
    "login.success":      "Welcome back!",
    "login.registered":   "Account created! Signing in...",
    "login.resetSent":    "✓ Instructions sent to your email",
    "login.errUser":      "Incorrect username or password",
    "login.errExists":    "Username already exists",
    "login.errPassMatch": "Passwords do not match",

    // ProfileModal
    "profile.title":      "My Profile",
    "profile.info":       "Information",
    "profile.password":   "Password",
    "profile.fullName":   "Full name",
    "profile.email":      "Email",
    "profile.username":   "Username",
    "profile.userHint":   "Username cannot be changed",
    "profile.oldPass":    "Current password",
    "profile.newPass":    "New password",
    "profile.confirmPass":"Confirm password",
    "profile.save":       "Save changes",
    "profile.saved":      "Saved!",
    "profile.saving":     "Saving...",
    "profile.updating":   "Updating...",
    "profile.updated":    "Password updated!",
    "profile.weak":       "Too short",
    "profile.medium":     "Fair",
    "profile.strong":     "Strong",
    "profile.errName":    "Name is required",
    "profile.errEmail":   "Invalid email",
    "profile.errOldPass": "Enter your current password",
    "profile.errWrongPass":"Incorrect password",
    "profile.errMinPass": "Minimum 6 characters",
    "profile.errMatch":   "Passwords do not match",

    // SettingsModal
    "settings.title":       "Settings",
    "settings.subtitle":    "Customize your experience",
    "settings.appearance":  "Appearance",
    "settings.dark":        "Dark",
    "settings.light":       "Light",
    "settings.compact":     "Compact mode",
    "settings.compactDesc": "Reduce spacing to see more information",
    "settings.notifications":"Notifications",
    "settings.humAlerts":   "Humidity alerts",
    "settings.humAlertsDesc":"Notify when humidity drops below threshold",
    "settings.soundAlerts": "Sound alerts",
    "settings.soundDesc":   "Play sound when critical alerts are received",
    "settings.threshold":   "Alert threshold",
    "settings.system":      "System",
    "settings.refresh":     "Auto-refresh every",
    "settings.language":    "Language",
    "settings.langDesc":    "Interface language",
    "settings.cancel":      "Cancel",
    "settings.save":        "Save changes",
    "settings.saving":      "Applying...",
    "settings.saved":       "Applied!",

    // ConfirmModal
    "confirm.delete":     "Delete plant?",
    "confirm.deleteDesc": "This action cannot be undone.",
    "confirm.yes":        "Yes, delete",
    "confirm.cancel":     "Cancel",

    // NotFound
    "notfound.title":     "Page not found",
    "notfound.desc":      "The page you're looking for doesn't exist.",
    "notfound.btn":       "Back to home",
  }
};

// ─────────────────────────────────────────────
//  CONTEXT
// ─────────────────────────────────────────────
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const saved = localStorage.getItem("iot_settings");
  const initLang = saved ? (JSON.parse(saved).language || "es") : "es";
  const [lang, setLang] = useState(initLang);

  // Sync con cambios de settings
  useEffect(() => {
    const onStorage = () => {
      const s = localStorage.getItem("iot_settings");
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.language && parsed.language !== lang) setLang(parsed.language);
      }
    };
    window.addEventListener("storage", onStorage);
    // También exponer setter global para que SettingsModal lo llame
    window.setAppLanguage = setLang;
    return () => window.removeEventListener("storage", onStorage);
  }, [lang]);

  // t("key") — retorna la traducción
  const t = (key, ...args) => {
    const str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS["es"]?.[key] ?? key;
    // Interpolación simple: {0}, {1} ...
    return args.reduce((s, arg, i) => s.replace(`{${i}}`, arg), str);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}