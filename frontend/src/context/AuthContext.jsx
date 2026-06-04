import { createContext, useContext, useEffect, useState } from "react";

import { authApi } from "../lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "designora-auth-token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(STORAGE_KEY)));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    let active = true;
    setLoading(true);

    authApi
      .profile(token)
      .then((profile) => {
        if (active) {
          setUser(profile);
        }
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function login(credentials) {
    const response = await authApi.login(credentials);
    localStorage.setItem(STORAGE_KEY, response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    return response;
  }

  async function register(payload) {
    const response = await authApi.register(payload);
    localStorage.setItem(STORAGE_KEY, response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    return response;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  async function refreshProfile() {
    if (!token) {
      return null;
    }

    const profile = await authApi.profile(token);
    setUser(profile);
    return profile;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("AuthContext topilmadi.");
  }
  return context;
}
