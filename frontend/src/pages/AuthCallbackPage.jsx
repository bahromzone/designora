import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function dashboardPathForRole(role) {
  if (role === "superadmin") return "/superadmin";
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/instruktor-panel";
  return "/";
}

// Google OAuth qaytish sahifasi.
// Backend /auth/google/callback bu yerga token va tasdiqlangan rolni fragmentda yuboradi.
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    let active = true;
    let errorTimer = null;

    const rawHash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(rawHash);
    const token = params.get("token");
    const role = params.get("role") || "user";

    // JWT URL'da qolmasin.
    window.history.replaceState(null, "", "/auth/callback");

    if (!token) {
      setError("Google orqali kirishda xatolik yuz berdi.");
      errorTimer = window.setTimeout(() => {
        if (active) {
          navigate("/?modal=login&error=oauth_failed", { replace: true });
        }
      }, 1500);
      return () => {
        active = false;
        if (errorTimer) window.clearTimeout(errorTimer);
      };
    }

    // Profil so'rovi sekinlashsa ham callback ekrani qotib qolmaydi.
    // AuthContext sessiyani fonda tasdiqlaydi, route esa server yuborgan role bilan ochiladi.
    loginWithToken(token).catch(() => {});
    navigate(dashboardPathForRole(role), { replace: true });

    return () => {
      active = false;
      if (errorTimer) window.clearTimeout(errorTimer);
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
