import { Bell, Sun, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../i18n";
import ProfileModal  from "./ProfileModal";
import SettingsModal from "./SettingsModal";

function Navbar({ onLogout, plants = [] }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [lightMode,  setLightMode]  = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notifRef = useRef(null);
  const userRef  = useRef(null);

  const session     = JSON.parse(localStorage.getItem("iot_session") || "{}");
  const userName    = session.name || session.username || "Usuario";
  const userHandle  = session.username || userName;
  const userInitial = userName.charAt(0).toUpperCase();

  // Alertas reales basadas en las plantas
  const alerts = plants.filter(p => (p.currentHumidity ?? 0) < p.minHumidity);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") { document.body.classList.add("light-mode"); setLightMode(true); }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleTheme = () => {
    const next = !lightMode;
    setLightMode(next);
    document.body.classList.toggle("light-mode", next);
    localStorage.setItem("theme", next ? "light" : "dark");
  };

  const handleLogout = () => {
    localStorage.removeItem("iot_session");
    if (onLogout) onLogout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/",         label: t("nav.home")          },
    { to: "/superior", label: t("nav.sectorSup") },
    { to: "/inferior", label: t("nav.sectorInf") },
  ];

  const dropdownVariants = {
    hidden:  { opacity: 0, y: -8, scale: 0.96 },
    visible: { opacity: 1, y: 0,  scale: 1    },
    exit:    { opacity: 0, y: -6, scale: 0.97 },
  };

  return (
    <>
    <div className="nav-wrapper">
      <div className={`navbar ${scrolled ? "scrolled" : ""}`}>

        {/* LEFT */}
        <div className="nav-left">
          <NavLink to="/" style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:"10px" }} onClick={() => setMobileOpen(false)}>
            <div className="logo">💧</div>
            <span className="nav-title">
              {t("nav.title").split(" ").map((w, i) =>
                i === 2
                  ? <span key={i} style={{ color: "var(--blue)" }}>{w} </span>
                  : <span key={i}>{w} </span>
              )}
            </span>
          </NavLink>
        </div>

        {/* CENTER */}
        <div className="nav-links">
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* RIGHT */}
        <div className="nav-right">

          {/* Notificaciones */}
          <div className="nav-icon-btn" ref={notifRef} onClick={() => setNotifOpen(o => !o)}>
            <Bell size={17} />
            {alerts.length > 0 && (
              <motion.span className="nav-badge"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.6 }}>
                {alerts.length}
              </motion.span>
            )}
            <AnimatePresence>
              {notifOpen && (
                <motion.div className="nav-dropdown notif-dropdown"
                  variants={dropdownVariants}
                  initial="hidden" animate="visible" exit="exit"
                  transition={{ duration: 0.18 }}>
                  <div className="nav-dd-header">
                    <span className="nav-dd-title">Notificaciones</span>
                    {alerts.length > 0 && (
                      <span className="nav-dd-badge-count">{alerts.length} alertas</span>
                    )}
                  </div>
                  {alerts.length === 0 ? (
                    <div className="nav-dd-empty">
                      <span>✅</span> {t("nav.noAlerts")}
                    </div>
                  ) : (
                    alerts.map((p, i) => (
                      <div key={i} className="nav-dd-item alert">
                        <span className="nav-dd-item-icon">⚠</span>
                        <div>
                          <span className="nav-dd-item-title">{p.name}</span>
                          <span className="nav-dd-item-sub">Humedad crítica: {p.currentHumidity ?? 0}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle tema — pill animado */}
          <div
            className={`theme-toggle ${lightMode ? "light" : ""}`}
            onClick={toggleTheme}
            title={lightMode ? "Cambiar a modo oscuro" : "Cambiar a modo día"}
          >
            <motion.div
              className="theme-toggle-thumb"
              animate={{ x: lightMode ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
          </div>

          {/* User chip */}
          <div className="user-chip" ref={userRef} onClick={() => setUserOpen(o => !o)}>
            <div className="user-avatar">{userInitial}</div>
            <span className="user-name">{userName}</span>
            <motion.div animate={{ rotate: userOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={13} color="var(--text-3)" />
            </motion.div>

            <AnimatePresence>
              {userOpen && (
                <motion.div className="nav-dropdown user-dropdown"
                  variants={dropdownVariants}
                  initial="hidden" animate="visible" exit="exit"
                  transition={{ duration: 0.18 }}>

                  {/* Header con avatar */}
                  <div className="ud-header">
                    <div className="ud-avatar-lg">{userInitial}</div>
                    <div>
                      <div className="ud-name">{userName}</div>
                      <div className="ud-handle">@{userHandle}</div>
                    </div>
                  </div>

                  <div className="nav-dd-divider" />

                  <button className="ud-item" onClick={() => { setShowProfile(true); setUserOpen(false); }}>
                    <User size={14} /> {t("nav.profile")}
                  </button>
                  <button className="ud-item" onClick={() => { setShowSettings(true); setUserOpen(false); }}>
                    <Settings size={14} /> {t("nav.settings")}
                  </button>

                  <div className="nav-dd-divider" />

                  <button className="ud-item logout" onClick={handleLogout}>
                    <LogOut size={14} /> {t("nav.logout")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hamburger */}
          <div className="nav-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menú">
            <span style={mobileOpen ? { transform: "rotate(45deg) translateY(7px)" } : {}} />
            <span style={mobileOpen ? { opacity: 0, transform: "scaleX(0)" }        : {}} />
            <span style={mobileOpen ? { transform: "rotate(-45deg) translateY(-7px)" } : {}} />
          </div>
        </div>
      </div>

      {/* Mobile menu — dentro del wrapper para position:absolute top:100% */}
      <div className={`nav-mobile-menu ${mobileOpen ? "open" : ""}`}>
        {navLinks.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            onClick={() => setMobileOpen(false)}>
            {l.label}
          </NavLink>
        ))}
      </div>
    </div>

    {/* Modals — portal a document.body para escapar stacking context del navbar */}
    {createPortal(
      <AnimatePresence>
        {showProfile  && <ProfileModal  onClose={() => setShowProfile(false)}  onUpdate={() => {}} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </AnimatePresence>,
      document.body
    )}
  </>
  );
}

export default Navbar;