// Parolni tiklash va Google OAuth uchun yordamchilar.
// api.js ni o'zgartirmaslik uchun alohida, mustaqil modul sifatida ajratildi.
const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

// Google OAuth boshlanish nuqtasi — foydalanuvchini backend redirectiga olib boradi.
export const GOOGLE_AUTH_URL = `${API_URL}/auth/google`;

// FastAPI xato javobini o'qish (detail string ham, massiv ham bo'lishi mumkin).
function extractErrorMessage(payload) {
  const detail = payload?.detail;
  if (!detail) return "So'rovni bajarib bo'lmadi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg ?? "Noma'lum xato").join(" ");
  }
  return "So'rovni bajarib bo'lmadi.";
}

async function post(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await res.json()
    : null;
  if (!res.ok) throw new Error(extractErrorMessage(payload));
  return payload;
}

// Parolni tiklash havolasini emailga yuboradi. Backend timing-attackdan himoya
// uchun har doim bir xil javob qaytaradi.
export const forgotPassword = (email) =>
  post("/api/auth/forgot-password", { email });

// Token + yangi parol bilan parolni tiklaydi.
// Muvaffaqiyatli javob: { message, redirect, access_token, token_type, user }.
export const resetPassword = (token, password) =>
  post("/api/auth/reset-password", { token, password });
