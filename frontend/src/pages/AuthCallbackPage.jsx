import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CALLBACK_TIMEOUT_MS = 12000;
const ALLOWED_REDIRECTS = new Set(["/", "/admin", "/superadmin", "/instruktor-panel"]);

function safeRedirect(path) {
  return ALLOWED_REDIRECTS.has(path) ? path : "/";
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    const redirectPath = safeRedirect(
      new URLSearchParams(window.location.search).get("next") || "/"
    );

    if (!token) {
      setError("Google orqali kirishda xatolik yuz berdi.");
      const timeout = setTimeout(
        () => navigate("/?modal=login&error=oauth_failed", { replace: true }),
        1500
      );
      return () => clearTimeout(timeout);
    }

    let active = true;
    let errorTimeout;
    const fail = () => {
      if (!active) return;
      setError("Google orqali kirishda sessiyani tasdiqlab bo'lmadi.");
      errorTimeout = setTimeout(
        () => navigate("/?modal=login&error=oauth_failed", { replace: true }),
        1500
      );
    };

    const callbackTimeout = setTimeout(fail, CALLBACK_TIMEOUT_MS);
    // Backend user rolini allaqachon tekshirgan va `next` ni imzolangan oqimdan
    // yuborgan. Redirectni profil API javobini kutmasdan qilamiz, RoleRoute esa
    // panelga kirishda serverdan kelgan rolni yana tekshiradi.
    loginWithToken(token)
      .catch(fail)
      .finally(() => clearTimeout(callbackTimeout));
    navigate(redirectPath, { replace: true });

    return () => {
      active = false;
      clearTimeout(callbackTimeout);
      clearTimeout(errorTimeout);
    };
  }, [loginWithToken, navigate]);

  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm" style={{ color: "var(--ink-60)" }}>
        {error || "Google orqali kirilmoqda..."}
      </p>
    </section>
  );
}
