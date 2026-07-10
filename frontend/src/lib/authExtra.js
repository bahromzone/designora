// Parolni tiklash, Google OAuth va instruktor arizasi uchun yordamchilar.
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

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await res.json()
    : null;
  if (!res.ok) throw new Error(extractErrorMessage(payload));
  return payload;
}

const post = (path, body, token) =>
  request(path, { method: "POST", body, token });
const get = (path, token) => request(path, { method: "GET", token });

// Parolni tiklash havolasini emailga yuboradi. Backend timing-attackdan himoya
// uchun har doim bir xil javob qaytaradi.
export const forgotPassword = (email) =>
  post("/api/auth/forgot-password", { email });

// Token + yangi parol bilan parolni tiklaydi.
// Muvaffaqiyatli javob: { message, redirect, access_token, token_type, user }.
export const resetPassword = (token, password) =>
  post("/api/auth/reset-password", { token, password });

// Oddiy foydalanuvchini instruktor arizasiga qo'yadi (auth talab qilinadi).
// body: { name, bio, portfolio_url? }. Rol "instructor_pending" bo'ladi.
export const applyInstructor = (token, body) =>
  post("/api/instructor/apply", body, token);

// ── Admin: instruktor arizalarini boshqarish ───────────────────
export const adminListInstructorApplications = (token) =>
  get("/api/admin/instructor-applications", token);

export const adminApproveInstructor = (token, userId) =>
  post(`/api/admin/instructor-applications/${userId}/approve`, {}, token);

export const adminRejectInstructor = (token, userId) =>
  post(`/api/admin/instructor-applications/${userId}/reject`, {}, token);
