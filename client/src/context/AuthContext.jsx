import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      if (!tokenStore.get()) {
        setBooting(false);
        return;
      }
      try {
        const { user: me } = await api.me();
        setUser(me);
      } catch {
        tokenStore.clear();
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: u, token } = await api.login({ email, password });
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const { user: u, token } = await api.signup({ name, email, password });
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, booting, login, signup, logout, authed: !!user }),
    [user, booting, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
