import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../lib/api";

const AuthContext = createContext(null);

// Backend rolga qarab `redirect` qaytaradi; bu faqat zaxira qiymat.
// App.jsx dagi haqiqiy <Route> bilan mos bo'lishi shart.
const DEFAULT_POST_AUTH_PATH = "/kurslarim";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authVersion = useRef(0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onInvalid = () => {
      authVersion.current += 1;
      setUser(null);
    };
    window.addEventListener("designora-session-invalidated", onInvalid);
    return () =>
      window.removeEventListener("designora-session-invalidated", onInvalid);
  }, []);

  useEffect(() => {
    let active = true;
    const restoreVersion = authVersion.current;
    setLoading(true);
    const restore = async () => {
      try {
        const profile = await authApi.profile();
        if (active && authVersion.current === restoreVersion) setUser(profile);
      } catch {
        try {
          await authApi.refresh();
          const profile = await authApi.profile();
          if (active && authVersion.current === restoreVersion) {
            setUser(profile);
          }
        } catch {
          if (active && authVersion.current === restoreVersion) {
            setUser(null);
          }
        }
      } finally {
        if (active && authVersion.current === restoreVersion) setLoading(false);
      }
    };
    restore();
    return () => {
      active = false;
    };
  }, []);

  function handlePostAuthRedirect(response) {
    const nextPath =
      response?.redirect || location.state?.from || DEFAULT_POST_AUTH_PATH;
    // Ilgari bu yerda window.location.replace() bor edi: u to'liq sahifa
    // reload qilib, auth restore'ni noldan ishga tushirardi. Natijada
    // login'dan keyin darhol 401 poygasi va flaky redirect paydo bo'lardi.
    // Client-side navigatsiya sessiyani va React holatini saqlab qoladi.
    navigate(nextPath, { replace: true });
  }

  async function login(credentials) {
    const version = ++authVersion.current;
    const response = await authApi.login(credentials);
    if (authVersion.current !== version) return response;
    setUser(response.user);
    setLoading(false);
    handlePostAuthRedirect(response);
    return response;
  }

  async function register(payload) {
    const version = ++authVersion.current;
    const response = await authApi.register(payload);
    if (authVersion.current !== version) return response;
    setUser(response.user);
    setLoading(false);
    handlePostAuthRedirect(response);
    return response;
  }

  const loginWithToken = useCallback(async (nextToken) => {
    if (!nextToken) return null;
    const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
    const response = await fetch(`${API_URL}/api/auth/issue-refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${nextToken}` },
    });
    if (!response.ok) throw new Error("OAuth sessiyasini yaratib bo'lmadi");
    const profile = await authApi.profile();
    setUser(profile);
    return profile;
  }, []);

  function logout() {
    authVersion.current += 1;
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
