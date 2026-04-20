import { I18nProvider } from "./i18n";
import "./styles.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ToastProvider } from "./context/ToastProvider";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ParticleBackground from "./components/ParticleBackground";
import SplashScreen from "./components/SplashScreen";
import OfflineBanner from "./components/OfflineBanner";
import Dashboard from "./pages/Dashboard";
import SectorPage from "./pages/SectorPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/superior": "Sector Superior",
  "/inferior": "Sector Inferior",
  "/login": "Iniciar sesion",
  "/reset-password": "Recuperar contrasena",
};

function useDynamicTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.startsWith("/reset-password")
      ? "/reset-password"
      : location.pathname;
    const title = PAGE_TITLES[path] ?? "Pagina no encontrada";
    document.title = `${title} - RiegoIQ`;
  }, [location.pathname]);
}

export function getGreeting(name = "") {
  const h = new Date().getHours();
  const base = h < 12 ? "Buenos dias" : h < 18 ? "Buenas tardes" : "Buenas noches";
  return name ? `${base}, ${name}` : base;
}

function PrivateRoute({ children, user, loading }) {
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080a0e",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid rgba(52,211,153,0.2)",
            borderTopColor: "#34d399",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
const slideRight = { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 } };
const slideLeft = { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 50 } };
const T = { duration: 0.28 };

function AnimatedRoutes() {
  const location = useLocation();
  const { user, authLoading } = useAuth();

  useDynamicTitle();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            user && !authLoading ? (
              <Navigate to="/" replace />
            ) : (
              <motion.div {...fade} transition={T}>
                <Login />
              </motion.div>
            )
          }
        />

        <Route
          path="/reset-password/:token"
          element={
            <motion.div {...fade} transition={T}>
              <ResetPassword />
            </motion.div>
          }
        />

        <Route
          path="/"
          element={
            <PrivateRoute user={user} loading={authLoading}>
              <motion.div {...fade} transition={T}>
                <Dashboard />
              </motion.div>
            </PrivateRoute>
          }
        />

        <Route
          path="/superior"
          element={
            <PrivateRoute user={user} loading={authLoading}>
              <motion.div {...slideRight} transition={T}>
                <SectorPage sector="Superior" />
              </motion.div>
            </PrivateRoute>
          }
        />

        <Route
          path="/inferior"
          element={
            <PrivateRoute user={user} loading={authLoading}>
              <motion.div {...slideLeft} transition={T}>
                <SectorPage sector="Inferior" />
              </motion.div>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppShell() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <Router>
        <ToastProvider>
          <OfflineBanner />
          <ParticleBackground />
          <AnimatedRoutes />
        </ToastProvider>
      </Router>
    </>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
