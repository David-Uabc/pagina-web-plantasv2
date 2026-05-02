import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearClientSession,
  clearAccessToken,
  logout as apiLogout,
  markSessionHint,
  setAccessToken,
  tryRestoreSession,
} from "../api";

const USER_STORAGE_KEY = "iot_user";
const LEGACY_SESSION_KEY = "iot_session";

const AuthContext = createContext(null);

function persistUser(user) {
  if (!user) return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(user));
}

function clearPersistedUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

function readPersistedUser() {
  try {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    if (rawUser) return JSON.parse(rawUser);

    const rawLegacy = localStorage.getItem(LEGACY_SESSION_KEY);
    if (!rawLegacy) return null;

    const parsed = JSON.parse(rawLegacy);
    return parsed?.token ? null : parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(null);

  const updateUser = useCallback((nextUser) => {
    setUser((current) => {
      const resolved = typeof nextUser === "function" ? nextUser(current) : nextUser;
      if (resolved) persistUser(resolved);
      else clearPersistedUser();
      return resolved;
    });
  }, []);

  const login = useCallback((userData, accessToken) => {
    if (accessToken) {
      setAccessToken(accessToken);
      markSessionHint();
    }
    persistUser(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const acknowledgeSessionExpired = useCallback(() => {
    clearClientSession();
    clearPersistedUser();
    setSessionExpiredNotice(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const userData = await tryRestoreSession();
        if (!active) return;

        if (userData) {
          persistUser(userData);
          setUser(userData);
          setAuthLoading(false);
          return;
        }
      } catch {}

      const persistedUser = readPersistedUser();
      if (active && persistedUser) {
        setUser(persistedUser);
      }

      if (active) {
        setAuthLoading(false);
      }
    };

    restoreSession();

    const handleExpired = (event) => {
      if (!active) return;
      clearAccessToken();
      setSessionExpiredNotice(
        event?.detail?.mensaje || "Tu sesión ha vencido. Por favor inicia sesión de nuevo."
      );
    };

    window.addEventListener("iot_session_expired", handleExpired);

    return () => {
      active = false;
      window.removeEventListener("iot_session_expired", handleExpired);
    };
  }, []);

  const value = useMemo(() => ({
    authLoading,
    login,
    logout,
    setUser: updateUser,
    updateUser,
    user,
  }), [authLoading, login, logout, updateUser, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {sessionExpiredNotice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "rgba(3, 7, 18, 0.72)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(10,15,25,0.98))",
              border: "1px solid rgba(52,211,153,0.24)",
              borderRadius: 18,
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              padding: 22,
              color: "#e5eef7",
            }}
          >
            <div style={{ fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", color: "#34d399", fontWeight: 700, marginBottom: 10 }}>
              Sesión expirada
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: "#cbd5e1", marginBottom: 18 }}>
              {sessionExpiredNotice}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={acknowledgeSessionExpired}
                style={{
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#052e1b",
                  background: "linear-gradient(135deg, #34d399, #10b981)",
                  boxShadow: "0 12px 24px rgba(16,185,129,0.25)",
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
