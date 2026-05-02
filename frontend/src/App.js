import "./styles.css";
import { I18nProvider } from "./i18n";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ToastProvider } from "./context/ToastProvider";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

const ParticleBackground = lazy(() => import("./components/ParticleBackground"));
const SplashScreen = lazy(() => import("./components/SplashScreen"));
const OfflineBanner = lazy(() => import("./components/OfflineBanner"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SectorPage = lazy(() => import("./pages/SectorPage"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const PAGE_TITLES = {
  "/": "Dashboard",
  "/superior": "Sector Superior",
  "/inferior": "Sector Inferior",
  "/login": "Iniciar sesión",
  "/reset-password": "Recuperar contraseña",
};

function PageLoader() {
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

function useDynamicTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.startsWith("/reset-password") ? "/reset-password" : location.pathname;
    const title = PAGE_TITLES[path] ?? "Página no encontrada";
    document.title = `${title} - RiegoIQ`;
  }, [location.pathname]);
}

export function getGreeting(name = "") {
  const hour = new Date().getHours();
  const base = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  return name ? `${base}, ${name}` : base;
}

function PrivateRoute({ children, user, loading }) {
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
const slideRight = { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 } };
const slideLeft = { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 50 } };
const transition = { duration: 0.28 };

function AnimatedRoutes() {
  const location = useLocation();
  const { user, authLoading } = useAuth();

  useDynamicTitle();

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/login"
            element={user && !authLoading ? <Navigate to="/" replace /> : (
              <motion.div {...fade} transition={transition}>
                <Login />
              </motion.div>
            )}
          />

          <Route
            path="/reset-password/:token"
            element={(
              <motion.div {...fade} transition={transition}>
                <ResetPassword />
              </motion.div>
            )}
          />

          <Route
            path="/"
            element={(
              <PrivateRoute user={user} loading={authLoading}>
                <motion.div {...fade} transition={transition}>
                  <Dashboard />
                </motion.div>
              </PrivateRoute>
            )}
          />

          <Route
            path="/superior"
            element={(
              <PrivateRoute user={user} loading={authLoading}>
                <motion.div {...slideRight} transition={transition}>
                  <SectorPage sector="Superior" />
                </motion.div>
              </PrivateRoute>
            )}
          />

          <Route
            path="/inferior"
            element={(
              <PrivateRoute user={user} loading={authLoading}>
                <motion.div {...slideLeft} transition={transition}>
                  <SectorPage sector="Inferior" />
                </motion.div>
              </PrivateRoute>
            )}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function AppShell() {
  const [splashDone, setSplashDone] = useState(false);
  const background = useMemo(() => <ParticleBackground />, []);
  const offlineBanner = useMemo(() => <OfflineBanner />, []);

  return (
    <>
      {!splashDone && (
        <Suspense fallback={null}>
          <SplashScreen onDone={() => setSplashDone(true)} />
        </Suspense>
      )}
      <Router>
        <ToastProvider>
          <Suspense fallback={null}>{offlineBanner}</Suspense>
          <Suspense fallback={null}>{background}</Suspense>
          <AnimatedRoutes />
        </ToastProvider>
      </Router>
    </>
  );
}

function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
