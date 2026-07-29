import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CALLBACK_TIMEOUT_MS = 12000;

function dashboardPathForRole(role) {
  const normalized = (role || "user").trim().toLowerCase();
  if (normalized === "superadmin") return "/superadmin";
  if (normalized === "admin") return "/admin";
  if (normalized === "instructor") return "/instruktor-panel";
  return "/";
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const rawHash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const token = new URLSearchParams(rawHash).get("token");

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

    loginWithToken(token)
      .then((profile) => {
        if (active) navigate(dashboardPathForRole(profile?.role), { replace: true });
      })
      .catch(fail)
      .finally(() => clearTimeout(callbackTimeout));

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
