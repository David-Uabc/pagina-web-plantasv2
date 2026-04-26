import { Bell, ChevronDown, LogOut, User, Settings, GitCompare, Palette } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../i18n";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ProfileModal from "./ProfileModal";
import SettingsModal from "./SettingsModal";
import GlobalSearch from "./GlobalSearch";
import ThemeSelector from "../plant/ThemeSelector";
import { getGreeting } from "../../App";

function Navbar({ plants = [], onCompare }) {
  const { t } = useI18n();
  const { logout, updateUser, user } = useAuth();
  const { themeId, changeTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const userName = user?.name || user?.username || "Usuario";
  const userHandle = user?.username || userName;
  const userInitial = userName.charAt(0).toUpperCase();
  const greeting = getGreeting(userName);
  const alerts = plants.filter((p) => (p.currentHumidity ?? 0) < p.minHumidity);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleTheme = () => {
    changeTheme(themeId === "light" ? "dark" : "light");
  };

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/superior", label: t("nav.sectorSup") },
    { to: "/inferior", label: t("nav.sectorInf") },
  ];

  const dropdownVariants = {
    hidden: { opacity: 0, y: -8, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -6, scale: 0.97 },
  };

  return (
    <>
      <div className="nav-wrapper">
        <div className={`navbar ${scrolled ? "scrolled" : ""}`}>
          <div className="nav-left">
            <NavLink
              to="/"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}
              onClick={() => setMobileOpen(false)}
            >
              <div className="logo">💧</div>
              <span className="nav-title">RiegoIQ</span>
            </NavLink>
          </div>

          <div className="nav-links">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-right">
            <GlobalSearch plants={plants} />

            {onCompare && plants.length >= 2 && (
              <button
                onClick={onCompare}
                title="Comparar plantas"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 99,
                  background: "rgba(96,165,250,0.10)",
                  border: "1px solid rgba(96,165,250,0.22)",
                  color: "#60a5fa",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >
                <GitCompare size={14} />
                <span style={{ display: "none" }}>Comparar</span>
              </button>
            )}

            <div className="nav-icon-btn" ref={notifRef} onClick={() => setNotifOpen((o) => !o)}>
              <Bell size={17} />
              {alerts.length > 0 && (
                <motion.span className="nav-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }}>
                  {alerts.length}
                </motion.span>
              )}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    className="nav-dropdown notif-dropdown"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.18 }}
                  >
                    <div className="nav-dd-header">
                      <span className="nav-dd-title">Notificaciones</span>
                      {alerts.length > 0 && <span className="nav-dd-badge-count">{alerts.length} alertas</span>}
                    </div>
                    {alerts.length === 0 ? (
                      <div className="nav-dd-empty">
                        <span>✓</span> {t("nav.noAlerts")}
                      </div>
                    ) : (
                      alerts.map((p) => (
                        <div key={p._id} className="nav-dd-item alert">
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

            <div
              className={`theme-toggle ${themeId === "light" ? "light" : ""}`}
              onClick={toggleTheme}
              title={themeId === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            >
              <motion.div
                className="theme-toggle-thumb"
                animate={{ x: themeId === "light" ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              />
            </div>

            <div className="user-chip" ref={userRef} onClick={() => setUserOpen((o) => !o)}>
              <div className="user-avatar">{userInitial}</div>
              <span className="user-name">{userName}</span>
              <motion.div animate={{ rotate: userOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={13} color="var(--text-3)" />
              </motion.div>

              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    className="nav-dropdown user-dropdown"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.18 }}
                  >
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
                    <button className="ud-item" onClick={() => { setShowThemeSelector(true); setUserOpen(false); }}>
                      <Palette size={14} /> Apariencia
                    </button>
                    <div className="nav-dd-divider" />
                    <button className="ud-item logout" onClick={logout}>
                      <LogOut size={14} /> {t("nav.logout")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="nav-hamburger" onClick={() => setMobileOpen((o) => !o)} aria-label="Menú">
              <span style={mobileOpen ? { transform: "rotate(45deg) translateY(7px)" } : {}} />
              <span style={mobileOpen ? { opacity: 0, transform: "scaleX(0)" } : {}} />
              <span style={mobileOpen ? { transform: "rotate(-45deg) translateY(-7px)" } : {}} />
            </div>
          </div>
        </div>

        <div className={`nav-mobile-menu ${mobileOpen ? "open" : ""}`}>
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {showProfile && <ProfileModal onClose={() => setShowProfile(false)} onUpdate={updateUser} />}
          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
          {showThemeSelector && <ThemeSelector isOpen={showThemeSelector} onClose={() => setShowThemeSelector(false)} />}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export default Navbar;
