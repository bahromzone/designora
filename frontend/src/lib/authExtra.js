// Parolni tiklash, Google OAuth va instruktor arizasi uchun yordamchilar.
const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
export const GOOGLE_AUTH_URL = `${API_URL}/auth/google`;
function extractErrorMessage(payload) { const detail = payload?.detail; if (!detail) return "So'rovni bajarib bo'lmadi."; if (typeof detail === "string") return detail; if (Array.isArray(detail)) return detail.map((item) => item?.msg ?? "Noma'lum xato").join(" "); return "So'rovni bajarib bo'lmadi."; }
async function post(path, body, token) { const res = await fetch(`${API_URL}${path}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }); const contentType = res.headers.get("content-type") ?? ""; const payload = contentType.includes("application/json") ? await res.json() : null; if (!res.ok) throw new Error(extractErrorMessage(payload)); return payload; }
export const forgotPassword = (email) => post("/api/auth/forgot-password", { email });
export const resetPassword = (token, password) => post("/api/auth/reset-password", { token, password });
export const applyInstructor = (token, body) => post("/api/instructor/apply", body, token);
