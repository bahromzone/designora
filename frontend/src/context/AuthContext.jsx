import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "designora-auth-token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem(STORAGE_KEY))
  );

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onRefresh = (e) => {
      const next = e.detail || localStorage.getItem(STORAGE_KEY);
      if (next) setToken(next);
    };
    const onInvalid = () => {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    };
    window.addEventListener("designora-token-refreshed", onRefresh);
    window.addEventListener("designora-session-invalidated", onInvalid);
    return () => {
      window.removeEventListener("designora-token-refreshed", onRefresh);
      window.removeEventListener("designora-session-invalidated", onInvalid);
    };
  }, []);

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
        if (active) setUser(profile);
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  // Login/register dan keyin oldingi sahifaga qaytarish
  function handlePostAuthRedirect(response) {
    if (response.redirect) {
      window.location.assign(response.redirect);
      return;
    }
    // location.state.from mavjud bo'lsa, o'sha sahifaga navigate qilish
    const returnTo = location.state?.from;
    if (returnTo) {
      navigate(returnTo, { replace: true });
    }
  }

  async function login(credentials) {
    const response = await authApi.login(credentials);
    localStorage.setItem(STORAGE_KEY, response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    authApi.issueRefresh(response.access_token).catch(() => {});
    handlePostAuthRedirect(response);
    return response;
  }

  async function register(payload) {
    const response = await authApi.register(payload);
    localStorage.setItem(STORAGE_KEY, response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    authApi.issueRefresh(response.access_token).catch(() => {});
    handlePostAuthRedirect(response);
    return response;
  }

  function loginWithToken(nextToken) {
    if (!nextToken) return;
    localStorage.setItem(STORAGE_KEY, nextToken);
    setToken(nextToken);
    authApi.issueRefresh(nextToken).catch(() => {});
  }

  function logout() {
    if (token) authApi.logoutAll(token).catch(() => {});
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  async function refreshProfile() {
    if (!token) return null;
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
