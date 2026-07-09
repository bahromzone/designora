import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Google OAuth qaytish sahifasi.
// Backend /auth/google/callback bu yerga token'ni URL fragmentida yuboradi:
//   /auth/callback#token=<JWT>
// Fragment server loglariga va Referer header'iga tushmaydi — token shu bois
// xavfsizroq uzatiladi.
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
    const params = new URLSearchParams(rawHash);
    const token = params.get("token");

    if (!token) {
      setError("Google orqali kirishda xatolik yuz berdi.");
      const t = setTimeout(
        () => navigate("/?modal=login&error=oauth_failed", { replace: true }),
        1500
      );
      return () => clearTimeout(t);
    }

    loginWithToken(token);
    // Sessiya boshlandi — bosh sahifaga o'tamiz (token URL'da qolmaydi).
    navigate("/", { replace: true });
  }, [loginWithToken, navigate]);

  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm" style={{ color: "var(--ink-60)" }}>
        {error || "Google orqali kirilmoqda..."}
      </p>
    </section>
  );
}
