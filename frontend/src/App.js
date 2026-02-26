import { I18nProvider } from "./i18n";
import "./styles.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ToastProvider } from "./context/ToastProvider";
import ParticleBackground from "./components/ParticleBackground";
import Dashboard     from "./pages/Dashboard";
import SectorPage    from "./pages/SectorPage";
import Login         from "./pages/Login";
import NotFound      from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";


function PrivateRoute({ children }) {
  return localStorage.getItem("iot_session") ? children : <Navigate to="/login" replace />;
}

const fade       = { initial:{ opacity:0, y:16  }, animate:{ opacity:1, y:0  }, exit:{ opacity:0, y:-16 } };
const slideRight = { initial:{ opacity:0, x:50  }, animate:{ opacity:1, x:0  }, exit:{ opacity:0, x:-50 } };
const slideLeft  = { initial:{ opacity:0, x:-50 }, animate:{ opacity:1, x:0  }, exit:{ opacity:0, x:50  } };
const T = { duration: 0.28 };

function AnimatedRoutes({ user, setUser }) {
  const location = useLocation();

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

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("iot_session");
    return saved ? JSON.parse(saved) : null;
  });

  return (
    <I18nProvider>
      <Router>
        <ToastProvider>
          {/* Partículas en el fondo — persisten en todas las rutas */}
          <ParticleBackground />
          <AnimatedRoutes user={user} setUser={setUser} />
        </ToastProvider>
      </Router>
    </I18nProvider>
  );
}

export default App;