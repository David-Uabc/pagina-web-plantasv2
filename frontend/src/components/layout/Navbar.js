import { Bell, ChevronDown, GitCompare, LogOut, Palette, Settings, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { createPortal } from "react-dom";
import { lazy, startTransition, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../../i18n";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import GlobalSearch from "./GlobalSearch";
import { getGreeting } from "../../App";

const ProfileModal = lazy(() => import("./ProfileModal"));
const SettingsModal = lazy(() => import("./SettingsModal"));
const ThemeSelector = lazy(() => import("../plant/ThemeSelector"));

function getDropdownPosition(targetRef) {
  const fallback = { top: 84, right: 20 };
  const node = targetRef?.current;
  if (!node || typeof window === "undefined") return fallback;

  const rect = node.getBoundingClientRect();
  return {
    top: rect.bottom + 10,
    right: Math.max(window.innerWidth - rect.right, 12),
  };
}

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
  const notifDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  const userName = user?.name || user?.username || "Usuario";
  const userHandle = user?.username || userName;
  const userInitial = userName.charAt(0).toUpperCase();
  const greeting = getGreeting(userName);

  const alerts = useMemo(
    () => plants.filter((plant) => (plant.currentHumidity ?? 0) < plant.minHumidity),
    [plants]
  );

  const navLinks = useMemo(
    () => [
      { to: "/", label: t("nav.home") },
      { to: "/superior", label: t("nav.sectorSup") },
      { to: "/inferior", label: t("nav.sectorInf") },
    ],
    [t]
  );

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      const notifTarget = event.target;
      const clickedNotifTrigger = notifRef.current?.contains(notifTarget);
      const clickedNotifDropdown = notifDropdownRef.current?.contains(notifTarget);
      if (!clickedNotifTrigger && !clickedNotifDropdown) setNotifOpen(false);

      const userTarget = event.target;
      const clickedUserTrigger = userRef.current?.contains(userTarget);
      const clickedUserDropdown = userDropdownRef.current?.contains(userTarget);
      if (!clickedUserTrigger && !clickedUserDropdown) setUserOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleTheme = () => {
    startTransition(() => {
      changeTheme(themeId === "light" ? "dark" : "light");
    });
  };

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
              onClick={() => startTransition(() => setMobileOpen(false))}
            >
              <div className="logo">💧</div>
              <span className="nav-title">RiegoIQ</span>
            </NavLink>
          </div>

          <div className="nav-links">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-right">
            <div className="nav-search-slot">
              <GlobalSearch plants={plants} />
            </div>

            {onCompare && plants.length >= 2 && (
              <button
                className="nav-compare-btn"
                onClick={() => startTransition(() => onCompare())}
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
                  transition: "background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease",
                }}
              >
                <GitCompare size={14} />
                <span className="nav-compare-label">Comparar</span>
              </button>
            )}

            <div className="nav-icon-btn" ref={notifRef} onClick={() => setNotifOpen((open) => !open)}>
              <Bell size={17} />
              {alerts.length > 0 && (
                <motion.span
                  className="nav-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.6 }}
                >
                  {alerts.length}
                </motion.span>
              )}
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

            <div className="user-chip" ref={userRef} onClick={() => setUserOpen((open) => !open)}>
              <div className="user-avatar">{userInitial}</div>
              <span className="user-name">{userName}</span>
              <motion.div animate={{ rotate: userOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={13} color="var(--text-3)" />
              </motion.div>
            </div>

            <div
              className="nav-hamburger"
              onClick={() => startTransition(() => setMobileOpen((open) => !open))}
              aria-label="Menú"
            >
              <span style={mobileOpen ? { transform: "rotate(45deg) translateY(7px)" } : {}} />
              <span style={mobileOpen ? { opacity: 0, transform: "scaleX(0)" } : {}} />
              <span style={mobileOpen ? { transform: "rotate(-45deg) translateY(-7px)" } : {}} />
            </div>
          </div>
        </div>

        <div className={`nav-mobile-menu ${mobileOpen ? "open" : ""}`}>
          <div className="nav-mobile-search">
            <GlobalSearch plants={plants} />
            {onCompare && plants.length >= 2 && (
              <button
                className="nav-mobile-compare"
                onClick={() => {
                  startTransition(() => setMobileOpen(false));
                  startTransition(() => onCompare());
                }}
              >
                <GitCompare size={14} />
                <span>Comparar plantas</span>
              </button>
            )}
          </div>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => startTransition(() => setMobileOpen(false))}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              key="navbar-notifications"
              ref={notifDropdownRef}
              className="nav-dropdown notif-dropdown"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.18 }}
              style={getDropdownPosition(notifRef)}
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
                alerts.map((plant) => (
                  <div key={plant._id} className="nav-dd-item alert">
                    <span className="nav-dd-item-icon">⚠</span>
                    <div>
                      <span className="nav-dd-item-title">{plant.name}</span>
                      <span className="nav-dd-item-sub">Humedad crítica: {plant.currentHumidity ?? 0}%</span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {userOpen && (
            <motion.div
              key="navbar-user-menu"
              ref={userDropdownRef}
              className="nav-dropdown user-dropdown"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.18 }}
              style={getDropdownPosition(userRef)}
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

          <Suspense fallback={null}>
            {showProfile && <ProfileModal key="navbar-profile-modal" onClose={() => startTransition(() => setShowProfile(false))} onUpdate={updateUser} />}
            {showSettings && <SettingsModal key="navbar-settings-modal" onClose={() => startTransition(() => setShowSettings(false))} />}
            {showThemeSelector && (
              <ThemeSelector
                key="navbar-theme-selector"
                isOpen={showThemeSelector}
                onClose={() => startTransition(() => setShowThemeSelector(false))}
              />
            )}
          </Suspense>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export default Navbar;
