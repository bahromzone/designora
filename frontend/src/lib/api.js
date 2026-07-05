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

  // Public kurslar katalogi (JSON) — /api/courses
  courses: () =>
    request("/api/courses", {
      method: "GET",
    }),
};

// ── BOSQICH 1: kurs detali (syllabus bilan) ─────────────────────────────────
export const coursesApi = {
  list: () => request("/api/courses"),
  detail: (courseId) => request(`/api/courses/${courseId}/detail`),
};

// ── BOSQICH 1: o'quv (learning) API ─────────────────────────────────────────
export const learningApi = {
  enroll: (courseId, token) =>
    request(`/api/learning/enroll/${courseId}`, { method: "POST", token }),

  unenroll: (courseId, token) =>
    request(`/api/learning/enroll/${courseId}`, { method: "DELETE", token }),

  myCourses: (token) => request("/api/learning/my-courses", { token }),

  learn: (courseId, token) =>
    request(`/api/learning/courses/${courseId}`, { token }),

  completeLesson: (lessonId, token) =>
    request(`/api/learning/lessons/${lessonId}/complete`, {
      method: "POST",
      token,
    }),

  uncompleteLesson: (lessonId, token) =>
    request(`/api/learning/lessons/${lessonId}/uncomplete`, {
      method: "POST",
      token,
    }),
};

// ── Umumiy formatlash yordamchilari ─────────────────────────────────────────
export function formatDuration(totalMinutes) {
  const mins = Number(totalMinutes) || 0;
  if (mins < 60) return `${mins} daqiqa`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hours} soat ${rem} daq` : `${hours} soat`;
}

export function formatSeconds(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function formatPrice(price) {
  const p = Number(price) || 0;
  if (p <= 0) return "Bepul";
  return `${p.toLocaleString("uz-UZ")} so'm`;
}
