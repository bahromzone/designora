const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

// FastAPI xato javobini o'qish uchun yordamchi:
// detail string ham, validatsiya xatolarida massiv ham bo'lishi mumkin.
function extractErrorMessage(payload) {
  const detail = payload?.detail;
  if (!detail) return "So'rovni bajarib bo'lmadi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg ?? "Noma'lum xato").join(" ");
  }
  return "So'rovni bajarib bo'lmadi.";
}

async function request(path, options = {}) {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload));
  }

  return payload;
}

export const authApi = {
  // ✅ TUZATILDI: /login → /api/auth/login
  login: (body) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ✅ TUZATILDI: /register → /api/auth/register
  register: (body) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ✅ TUZATILDI: /profile → /api/profile/me
  profile: (token) =>
    request("/api/profile/me", {
      method: "GET",
      token,
    }),

  // ✅ TUZATILDI: /dashboard → /api/dashboard
  dashboard: (token) =>
    request("/api/dashboard", {
      method: "GET",
      token,
    }),

  // ⚠️ DIQQAT: backendda GET /courses HTML sahifa qaytaradi (Jinja).
  // JSON qaytaradigan public endpoint kerak — pastdagi "courses_api.py"
  // snippetini backendga qo'shing, keyin bu /api/courses ga ishlaydi.
  courses: () =>
    request("/api/courses", {
      method: "GET",
    }),
};
