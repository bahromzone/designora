import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FAILURE_PATH = "/?modal=login&error=oauth_failed";
const FAILURE_DELAY_MS = 1500;

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

export function safeRedirect(path) {
  return ALLOWED_REDIRECTS.has(path) ? path : "/";
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  // `window.location.search` emas: router bilan bitta manba, test qilsa
  // bo'ladi va MemoryRouter ostida ham to'g'ri ishlaydi.
  const { search } = useLocation();
  const { completeOAuthLogin } = useAuth();
  const [error, setError] = useState("");
  const handled = useRef(false);
  const failureTimeout = useRef(null);

  useEffect(() => {
    // StrictMode (dev) har bir effektni mount -> cleanup -> mount tartibida
    // ikki marta ishga tushiradi. Bu ref oqim faqat bir marta bajarilishini
    // kafolatlaydi.
    if (!handled.current) {
      handled.current = true;

      const redirectPath = safeRedirect(
        new URLSearchParams(search).get("next") || "/"
      );

      // DIQQAT: bu yerda "active" bayrog'i yo'q va qayta qo'shilmasligi kerak.
      // Ilgari cleanup uni false qilardi, StrictMode'ning ikkinchi mount'i esa
      // `handled` sababli darhol qaytardi. Natijada backend cookie'larni
      // o'rnatib, /api/profile/me 200 qaytargan bo'lsa ham navigate() hech
      // qachon chaqirilmasdi va sahifa abadiy "Google orqali kirilmoqda..."
      // holatida qotib qolardi.
      //
      // URL'dan token o'qilmaydi: backend access va refresh cookie'larini
      // allaqachon o'rnatgan. Bu yerda faqat sessiya haqiqatan ishlayotgani
      // tasdiqlanadi, shundan keyingina redirect qilamiz.
      completeOAuthLogin()
        .then(() => {
          navigate(redirectPath, { replace: true });
        })
        .catch(() => {
          setError("Google orqali kirishda sessiyani tasdiqlab bo'lmadi.");
          failureTimeout.current = setTimeout(() => {
            navigate(FAILURE_PATH, { replace: true });
          }, FAILURE_DELAY_MS);
        });
    }

    // Cleanup har doim ro'yxatdan o'tadi (guard ichida emas), aks holda
    // unmount'dan keyin timeout ishlab ketardi.
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
