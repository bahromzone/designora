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
import { bumpAuthEpoch, currentAuthEpoch } from "../lib/authEpoch";

const AuthContext = createContext(null);

const DEFAULT_POST_AUTH_PATH = "/kurslarim";
const ROLE_DASHBOARD_PATHS = {
  admin: "/admin",
  superadmin: "/superadmin",
  instructor: "/instruktor-panel",
  user: DEFAULT_POST_AUTH_PATH,
};

function dashboardPathForRole(role) {
  const normalizedRole = String(role || "user").trim().toLowerCase();
  return ROLE_DASHBOARD_PATHS[normalizedRole] || DEFAULT_POST_AUTH_PATH;
}

function isKnownPostAuthPath(path) {
  return Object.values(ROLE_DASHBOARD_PATHS).includes(path);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authVersion = useRef(0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onInvalid = (event) => {
      const eventEpoch = event?.detail?.epoch;
      if (eventEpoch !== undefined && eventEpoch !== currentAuthEpoch()) return;
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
    const rolePath = dashboardPathForRole(response?.user?.role);
    const responsePath = response?.redirect;
    const requestedPath = location.state?.from;
    const nextPath = isKnownPostAuthPath(responsePath)
      ? responsePath
      : isKnownPostAuthPath(requestedPath)
        ? requestedPath
        : rolePath;
    navigate(nextPath, { replace: true });
  }

  async function login(credentials) {
    const version = ++authVersion.current;
    const response = await authApi.login(credentials);
    if (authVersion.current !== version) return response;
    bumpAuthEpoch();
    setUser(response.user);
    setLoading(false);
    handlePostAuthRedirect(response);
    return response;
  }

  async function register(payload) {
    const version = ++authVersion.current;
    const response = await authApi.register(payload);
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
