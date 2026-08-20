import { request } from "./request";

// Parolni tiklash, Google OAuth va instruktor arizasi uchun yordamchilar.
const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
export const GOOGLE_AUTH_URL = `${API_URL}/auth/google`;

let recaptchaScriptPromise;

function loadRecaptchaScript() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.grecaptcha) return Promise.resolve(window.grecaptcha);
  if (recaptchaScriptPromise) return recaptchaScriptPromise;

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey) return Promise.resolve(null);

  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src^="https://www.google.com/recaptcha/api.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(window.grecaptcha));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
      siteKey,
    )}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = reject;
    document.head.appendChild(script);
  }).catch(() => null);

  return recaptchaScriptPromise;
}

export async function getRegistrationRecaptchaToken() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey) return "";
  const grecaptcha = await loadRecaptchaScript();
  if (!grecaptcha?.ready || !grecaptcha.execute) return "";
  return new Promise((resolve) => {
    grecaptcha.ready(() => {
      grecaptcha
        .execute(siteKey, { action: "register" })
        .then(resolve)
        .catch(() => resolve(""));
    });
  });
}

export const forgotPassword = (email) =>
  request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token, password) =>
  request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });

export const applyInstructor = (token, body) =>
  request("/api/instructor/apply", {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
