import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FAILURE_PATH = "/?modal=login&error=oauth_failed";

// Backend `next` ni rolga qarab yuboradi. Ro'yxat App.jsx dagi haqiqiy
// <Route path="..."> bilan mos bo'lishi shart, aks holda foydalanuvchi
// jimgina bosh sahifaga tushib qoladi.
const ALLOWED_REDIRECTS = new Set([
  "/",
  "/kurslarim",
  "/admin",
  "/superadmin",
  "/instruktor-panel",
]);

function safeRedirect(path) {
  return ALLOWED_REDIRECTS.has(path) ? path : "/";
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();
  const [error, setError] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const redirectPath = safeRedirect(
      new URLSearchParams(window.location.search).get("next") || "/"
    );

    let active = true;
    let errorTimeout;

    // URL'dan token o'qilmaydi: backend access va refresh cookie'larini
    // allaqachon o'rnatgan. Bu yerda faqat sessiya haqiqatan ishlayotgani
    // tasdiqlanadi, shundan keyingina redirect qilamiz.
    completeOAuthLogin()
      .then(() => {
        if (active) navigate(redirectPath, { replace: true });
      })
      .catch(() => {
        if (!active) return;
        setError("Google orqali kirishda sessiyani tasdiqlab bo'lmadi.");
        errorTimeout = setTimeout(
          () => navigate(FAILURE_PATH, { replace: true }),
          1500
        );
      });

    return () => {
      active = false;
      clearTimeout(errorTimeout);
    };
  }, [completeOAuthLogin, navigate]);

  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm" style={{ color: "var(--ink-60)" }}>
        {error || "Google orqali kirilmoqda..."}
      </p>
    </section>
  );
}
