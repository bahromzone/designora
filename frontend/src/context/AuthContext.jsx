import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onInvalid = () => {
      setUser(null);
    };
    window.addEventListener("designora-session-invalidated", onInvalid);
    return () =>
      window.removeEventListener(
        "designora-session-invalidated",
        onInvalid
      );
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const restore = async () => {
      try {
        const profile = await authApi.profile();
        if (active) setUser(profile);
      } catch {
        try {
          await authApi.refresh();
          const profile = await authApi.profile();
          if (active) setUser(profile);
        } catch {
          if (active) {
            setUser(null);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    restore();
    return () => {
      active = false;
    };
  }, []);

  function handlePostAuthRedirect(response) {
    if (response.redirect) {
      window.location.assign(response.redirect);
      return;
    }
    const returnTo = location.state?.from;
    if (returnTo) navigate(returnTo, { replace: true });
  }

  async function login(credentials) {
    const response = await authApi.login(credentials);
    setUser(response.user);
    handlePostAuthRedirect(response);
    return response;
  }

  async function register(payload) {
    const response = await authApi.register(payload);
    setUser(response.user);
    handlePostAuthRedirect(response);
    return response;
  }

  const loginWithToken = useCallback(async (nextToken) => {
    if (!nextToken) return null;
    const API_URL =
      import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
    const response = await fetch(`${API_URL}/api/auth/issue-refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${nextToken}` },
    });
    if (!response.ok)
      throw new Error("OAuth sessiyasini yaratib bo'lmadi");
    const profile = await authApi.profile();
    setUser(profile);
    return profile;
  }, []);

  function logout() {
    authApi.logoutAll().catch(() => {});
    setUser(null);
  }

  async function refreshProfile() {
    const profile = await authApi.profile();
    setUser(profile);
    return profile;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        loginWithToken,
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
  if (!context) throw new Error("AuthContext topilmadi.");
  return context;
}
