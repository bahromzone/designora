import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FAILURE_PATH = "/?modal=login&error=oauth_failed";
const FAILURE_DELAY_MS = 1500;
const ROLE_DASHBOARD_PATHS = {
  admin: "/admin",
  superadmin: "/superadmin",
  instructor: "/instruktor-panel",
  user: "/kurslarim",
};

function roleDashboard(role) {
  const normalizedRole = String(role || "user")
    .trim()
    .toLowerCase();
  return ROLE_DASHBOARD_PATHS[normalizedRole] || ROLE_DASHBOARD_PATHS.user;
}

export function safeRedirect(_path, role) {
  // The OAuth callback must never trust a requested path over the role returned
  // by the authenticated profile. This keeps all roles on their own dashboard.
  return roleDashboard(role);
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { completeOAuthLogin } = useAuth();
  const [error, setError] = useState("");
  const handled = useRef(false);
  const failureTimeout = useRef(null);

  useEffect(() => {
    if (!handled.current) {
      handled.current = true;

      const requestedPath = new URLSearchParams(search).get("next") || "/";

      completeOAuthLogin()
        .then((profile) => {
          navigate(safeRedirect(requestedPath, profile?.role), {
            replace: true,
          });
        })
        .catch(() => {
          setError("Google orqali kirishda sessiyani tasdiqlab bo'lmadi.");
          failureTimeout.current = setTimeout(() => {
            navigate(FAILURE_PATH, { replace: true });
          }, FAILURE_DELAY_MS);
        });
    }

    return () => {
      if (failureTimeout.current) {
        clearTimeout(failureTimeout.current);
        failureTimeout.current = null;
      }
    };
    // Oqim bir martalik: dependency o'zgarsa ham qayta ishga tushmasligi kerak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <p
        className="text-sm"
        style={{ color: "var(--ink-60)" }}
        role="status"
        aria-live="polite"
      >
        {error || "Google orqali kirilmoqda..."}
      </p>
    </section>
  );
}
