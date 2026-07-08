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

// Query-string yordamchisi — undefined/null/bo'sh qiymatlarni tashlab yuboradi.
function withQuery(path, params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      usp.append(key, value);
    }
  });
  const qs = usp.toString();
  return qs ? `${path}?${qs}` : path;
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

// ── BOSQICH 1: Kashfiyot — qidiruv / kategoriya / tavsiyalar ─────────────────
export const discoveryApi = {
  search: (params = {}) => request(withQuery("/api/discovery/search", params)),
  categories: () => request("/api/discovery/categories"),
  bestselling: (limit = 6) => {
    const path = "/api/discovery/recommendations/bestselling";
    return request(withQuery(path, { limit }));
  },
  similar: (courseId, limit = 6) => {
    const path = `/api/discovery/recommendations/similar/${courseId}`;
    return request(withQuery(path, { limit }));
  },
};

// ── BOSQICH 2: Testlar (quiz) ────────────────────────────────────────────────
export const quizApi = {
  courseQuizzes: (courseId, token) =>
    request(`/api/quiz/courses/${courseId}/quizzes`, { token }),
  take: (quizId, token) => request(`/api/quiz/quizzes/${quizId}`, { token }),
  submit: (quizId, answers, token) =>
    request(`/api/quiz/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
      token,
    }),
};

// ── BOSQICH 2: Sharh va reyting (reviews) ────────────────────────────────────
export const reviewsApi = {
  summary: (courseId) => request(`/api/reviews/courses/${courseId}/summary`),
  list: (courseId) => request(`/api/reviews/courses/${courseId}`),
  upsert: (courseId, body, token) =>
    request(`/api/reviews/courses/${courseId}`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  remove: (reviewId, token) =>
    request(`/api/reviews/${reviewId}`, { method: "DELETE", token }),
};

// ── BOSQICH 2: Savol-javob (Q&A) ─────────────────────────────────────────────
export const qaApi = {
  list: (lessonId, token) =>
    request(`/api/qa/lessons/${lessonId}/questions`, { token }),
  ask: (lessonId, body, token) =>
    request(`/api/qa/lessons/${lessonId}/questions`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  answer: (questionId, body, token) =>
    request(`/api/qa/questions/${questionId}/answers`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  resolve: (questionId, token) =>
    request(`/api/qa/questions/${questionId}/resolve`, {
      method: "PATCH",
      token,
    }),
};

// ── BOSQICH 2: Eslatmalar (notes) ────────────────────────────────────────────
export const notesApi = {
  forLesson: (lessonId, token) =>
    request(`/api/notes/lessons/${lessonId}`, { token }),
  create: (lessonId, body, token) =>
    request(`/api/notes/lessons/${lessonId}`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  update: (noteId, body, token) =>
    request(`/api/notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    }),
  remove: (noteId, token) =>
    request(`/api/notes/${noteId}`, { method: "DELETE", token }),
};

// ── BOSQICH 2: Sertifikat (certificates) ─────────────────────────────────────
export const certificatesApi = {
  mine: (token) => request("/api/certificates/my", { token }),
  issue: (courseId, token) =>
    request(`/api/certificates/courses/${courseId}/issue`, {
      method: "POST",
      token,
    }),
  download: (certId, token) =>
    request(`/api/certificates/${certId}/download`, { token }),
  // Ommaviy — token talab qilinmaydi
  verify: (code) => request(`/api/certificates/verify/${code}`),
};

// ── BOSQICH 2: Himoyalangan video (signed media) ─────────────────────────────
export const mediaApi = {
  signLesson: (lessonId, token) =>
    request(`/api/media/lessons/${lessonId}/sign`, { method: "POST", token }),
};

// ── BOSQICH 3: To'lov va monetizatsiya (payments) ────────────────────────────
export const paymentsApi = {
  // Order yaratadi. Bepul kursda { free: true, order_id, status: "paid" };
  // pullik kursda { free: false, order_id, amount, discount, provider, pay_url }.
  // body: { course_id, provider: "payme" | "click", coupon_code? }
  checkout: (body, token) =>
    request("/api/payments/checkout", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),

  // Buyurtma holatini tekshiradi (natija sahifasi polling qiladi).
  orderStatus: (orderId, token) =>
    request(`/api/payments/orders/${orderId}`, { token }),
};

// ── BOSQICH 4: Bildirishnomalar (notifications) ──────────────────────────────
export const notificationsApi = {
  list: (token, onlyUnread = false) =>
    request(withQuery("/api/notifications", { only_unread: onlyUnread }), {
      token,
    }),
  unreadCount: (token) => request("/api/notifications/unread-count", { token }),
  markRead: (id, token) =>
    request(`/api/notifications/${id}/read`, { method: "POST", token }),
  markAllRead: (token) =>
    request("/api/notifications/read-all", { method: "POST", token }),
  remove: (id, token) =>
    request(`/api/notifications/${id}`, { method: "DELETE", token }),
};

// ── BOSQICH 4: Blog ──────────────────────────────────────────────────────────
export const blogApi = {
  // { total, page, per_page, pages, results: [...] }
  list: (params = {}) => request(withQuery("/api/blog", params)),
  // to'liq post (body + meta), o'qilganda backend views'ni oshiradi
  getBySlug: (slug) => request(`/api/blog/${slug}`),
};

// ── BOSQICH 4: Forum ─────────────────────────────────────────────────────────
export const forumApi = {
  // { total, page, per_page, pages, results: [...] }
  listThreads: (params = {}) =>
    request(withQuery("/api/forum/threads", params)),
  // to'liq mavzu + javoblar (posts). Ommaviy o'qiladi.
  getThread: (threadId) => request(`/api/forum/threads/${threadId}`),
  createThread: (body, token) =>
    request("/api/forum/threads", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  reply: (threadId, body, token) =>
    request(`/api/forum/threads/${threadId}/posts`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
};

// ── BOSQICH 4: Referral ──────────────────────────────────────────────────────
export const referralApi = {
  // { code, total_referred, converted, points_earned }
  myCode: (token) => request("/api/referrals/my-code", { token }),
  // body: { code }
  apply: (code, token) =>
    request("/api/referrals/apply", {
      method: "POST",
      body: JSON.stringify({ code }),
      token,
    }),
  myReferrals: (token) => request("/api/referrals/my-referrals", { token }),
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
