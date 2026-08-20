import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../lib/api";
import { bumpAuthEpoch, currentAuthEpoch } from "../lib/authEpoch";
import { getRegistrationRecaptchaToken } from "../lib/authExtra";
import { request } from "../lib/request";

const AuthContext = createContext(null);

const DEFAULT_POST_AUTH_PATH = "/kurslarim";
const ROLE_DASHBOARD_PATHS = {
  admin: "/admin",
  superadmin: "/superadmin",
  instructor: "/instruktor-panel",
  user: DEFAULT_POST_AUTH_PATH,
};

export function dashboardPathForRole(role) {
  const normalized = String(role || "user").trim().toLowerCase();
  return ROLE_DASHBOARD_PATHS[normalized] || DEFAULT_POST_AUTH_PATH;
}

export function isKnownPostAuthPath(path) {
  return Object.values(ROLE_DASHBOARD_PATHS).includes(path);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authVersion = useRef(0);

  const navigate = useNavigate();

  useEffect(() => {
    const onInvalid = (event) => {
      const eventEpoch = event?.detail?.epoch;
      if (eventEpoch !== undefined && eventEpoch !== currentAuthEpoch()) return;
      authVersion.current += 1;
      setUser(null);
      setLoading(false);
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
          if (active && authVersion.current === restoreVersion) setUser(null);
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
    const rolePath = dashboardPathForRole(response?.user?.role);
    navigate(rolePath, { replace: true });
  }

  async function login(credentials) {
    const version = ++authVersion.current;
    const csrf = await request("/api/auth/csrf-token");
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: { "X-CSRF-Token": csrf.csrf_token },
      body: JSON.stringify(credentials),
    });
    if (authVersion.current !== version) return response;
    bumpAuthEpoch();
    setUser(response.user);
    setLoading(false);
    handlePostAuthRedirect(response);
    return response;
  }

  async function register(payload) {
    const version = ++authVersion.current;
    const recaptcha_token =
      payload.recaptcha_token || (await getRegistrationRecaptchaToken());
    const response = await authApi.register({ ...payload, recaptcha_token });
    if (authVersion.current !== version) return response;
    bumpAuthEpoch();
    setUser(response.user);
    setLoading(false);
    handlePostAuthRedirect(response);
    return response;
  }

  const completeOAuthLogin = useCallback(async () => {
    authVersion.current += 1;
    bumpAuthEpoch();
    const profile = await authApi.profile();
    setUser(profile);
    setLoading(false);
    return profile;
  }, []);

  function logout() {
    authVersion.current += 1;
    bumpAuthEpoch();
    authApi.logoutAll().catch(() => {});
    setUser(null);
    setLoading(false);
  }

  async function refreshProfile() {
    const version = ++authVersion.current;
    setLoading(true);
    try {
      const profile = await authApi.profile();
      if (authVersion.current === version) {
        bumpAuthEpoch();
        setUser(profile);
      }
      return profile;
    } finally {
      if (authVersion.current === version) setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        completeOAuthLogin,
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
