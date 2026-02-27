import { I18nProvider } from "./i18n";
import "./styles.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ToastProvider } from "./context/ToastProvider";
import ParticleBackground from "./components/ParticleBackground";
import SplashScreen  from "./components/SplashScreen";
import OfflineBanner from "./components/OfflineBanner";
import Dashboard     from "./pages/Dashboard";
import SectorPage    from "./pages/SectorPage";
import Login         from "./pages/Login";
import NotFound      from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

// ── Títulos dinámicos por ruta ──────────────────────
const PAGE_TITLES = {
  "/":               "Dashboard",
  "/superior":       "Sector Superior",
  "/inferior":       "Sector Inferior",
  "/login":          "Iniciar sesión",
  "/reset-password": "Recuperar contraseña",
};

function useDynamicTitle() {
  const location = useLocation();
  useEffect(() => {
    const path  = location.pathname.startsWith("/reset-password")
      ? "/reset-password"
      : location.pathname;
    const title = PAGE_TITLES[path] ?? "Página no encontrada";
    document.title = `${title} — Riego IoT 🌱`;
  }, [location.pathname]);
}

// ── Saludo dinámico exportado para Navbar y WelcomeToast ──
export function getGreeting(name = "") {
  const h = new Date().getHours();
  const base = h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
  return name ? `${base}, ${name} 🌱` : `${base} 🌱`;
}

function PrivateRoute({ children }) {
  return localStorage.getItem("iot_session") ? children : <Navigate to="/login" replace />;
}

const fade       = { initial:{ opacity:0, y:16  }, animate:{ opacity:1, y:0  }, exit:{ opacity:0, y:-16 } };
const slideRight = { initial:{ opacity:0, x:50  }, animate:{ opacity:1, x:0  }, exit:{ opacity:0, x:-50 } };
const slideLeft  = { initial:{ opacity:0, x:-50 }, animate:{ opacity:1, x:0  }, exit:{ opacity:0, x:50  } };
const T = { duration: 0.28 };

function AnimatedRoutes({ user, setUser }) {
  const location = useLocation();
  useDynamicTitle();

  const handleLogout = () => {
    localStorage.removeItem("iot_session");
    setUser(null);
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        <Route path="/login" element={
          <motion.div {...fade} transition={T}>
            <Login onLogin={u => setUser(u)} />
          </motion.div>
        }/>

        <Route path="/reset-password/:token" element={
          <motion.div {...fade} transition={T}>
            <ResetPassword />
          </motion.div>
        }/>

        <Route path="/" element={
          <PrivateRoute>
            <motion.div {...fade} transition={T}>
              <Dashboard user={user} onLogout={handleLogout} />
            </motion.div>
          </PrivateRoute>
        }/>

        <Route path="/superior" element={
          <PrivateRoute>
            <motion.div {...slideRight} transition={T}>
              <SectorPage sector="Superior" onLogout={handleLogout} />
            </motion.div>
          </PrivateRoute>
        }/>

        <Route path="/inferior" element={
          <PrivateRoute>
            <motion.div {...slideLeft} transition={T}>
              <SectorPage sector="Inferior" onLogout={handleLogout} />
            </motion.div>
          </PrivateRoute>
        }/>

        <Route path="*" element={<NotFound />} />

      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [user,    setUser]    = useState(() => {
    const saved = localStorage.getItem("iot_session");
    return saved ? JSON.parse(saved) : null;
  });
  const [splashDone, setSplashDone] = useState(false);

  return (
    <I18nProvider>
      {/* ✅ Splash screen — desaparece solo después de 1.8s */}
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      {/* App principal — renderiza debajo del splash */}
      <Router>
        <ToastProvider>
          {/* ✅ Banner offline — visible en todas las páginas */}
          <OfflineBanner />
          <ParticleBackground />
          <AnimatedRoutes user={user} setUser={setUser} />
        </ToastProvider>
      </Router>
    </I18nProvider>
  );
}

export default App;