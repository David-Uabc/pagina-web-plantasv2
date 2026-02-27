import { Bell, Sun, ChevronDown, LogOut, User, Settings, GitCompare } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../i18n";
import ProfileModal  from "./ProfileModal";
import SettingsModal from "./SettingsModal";
import GlobalSearch  from "./GlobalSearch";
import { getGreeting } from "../../App";

function Navbar({ onLogout, plants = [], onCompare }) {
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
  const greeting    = getGreeting(userName);
  const alerts      = plants.filter(p => (p.currentHumidity ?? 0) < p.minHumidity);

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
    { to: "/",         label: t("nav.home")      },
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

          {/* ✅ Búsqueda global */}
          <GlobalSearch plants={plants} />

          {/* ✅ Botón comparar — solo en dashboard */}
          {onCompare && plants.length >= 2 && (
            <button
              onClick={onCompare}
              title="Comparar plantas"
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"6px 12px", borderRadius:99,
                background:"rgba(96,165,250,0.10)",
                border:"1px solid rgba(96,165,250,0.22)",
                color:"#60a5fa", cursor:"pointer", fontSize:12, fontWeight:600,
                transition:"all 0.2s",
              }}
            >
              <GitCompare size={14} />
              <span style={{ display:"none" }}>Comparar</span>
            </button>
          )}

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

          {/* Toggle tema */}
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
                  <div className="ud-header">
                    <div className="ud-avatar-lg">{userInitial}</div>
                    <div>
                      <div style={{ fontSize: 11, color: "#78909c", marginBottom: 2 }}>{greeting}</div>
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

      {/* Mobile menu */}
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