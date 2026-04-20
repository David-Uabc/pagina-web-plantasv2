import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
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

    const handleExpired = () => {
      if (!active) return;
      clearAccessToken();
      clearPersistedUser();
      setUser(null);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
