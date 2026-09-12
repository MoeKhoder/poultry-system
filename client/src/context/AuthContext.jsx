import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, getStoredUser, setSession, clearSession, setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [ready, setReady] = useState(false);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {});
    } catch {
      clearSession();
    }
    clearSession();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });

    async function verify() {
      const token = getToken();
      if (!token) {
        setReady(true);
        return;
      }
      try {
        const { user: freshUser } = await api.get("/auth/me");
        setUser(freshUser);
      } catch {
        clearSession();
        setUser(null);
      } finally {
        setReady(true);
      }
    }
    verify();
  }, []);

  const login = useCallback(async (username, password) => {
    const { token, user: loggedInUser } = await api.post("/auth/login", { username, password });
    setSession(token, loggedInUser);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
