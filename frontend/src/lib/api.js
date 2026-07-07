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

// Query string yordamchisi — undefined/null qiymatlarni tashlab ketadi.
function qs(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      usp.append(key, value);
    }
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
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
  login: (body) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  profile: (token) =>
    request("/api/profile/me", {
      method: "GET",
      token,
    }),

  dashboard: (token) =>
    request("/api/dashboard", {
      method: "GET",
      token,
    }),

  courses: () =>
    request("/api/courses", {
      method: "GET",
    }),

  // ── XAVFSIZLIK: refresh-token oqimi ──
  issueRefresh: (token) =>
    request("/api/auth/issue-refresh", { method: "POST", token }),
  refresh: () => request("/api/auth/refresh", { method: "POST" }),
  logoutAll: (token) => request("/api/auth/logout-all", { method: "POST", token }),
};

// ── BOSQICH 1: kurs detali (syllabus bilan) ──
export const coursesApi = {
  list: () => request("/api/courses"),
  detail: (courseId) => request(`/api/courses/${courseId}/detail`),
};

// ── BOSQICH 1: o'quv (learning) API ──
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

// ── BOSQICH 4: kashfiyot (qidiruv / filtr / tavsiya) ──
export const discoveryApi = {
  search: (params) => request(`/api/discovery/search${qs(params)}`),
  categories: () => request("/api/discovery/categories"),
  bestselling: (limit) => request(`/api/discovery/recommendations/bestselling${qs({ limit })}`),
  similar: (courseId, limit) =>
    request(`/api/discovery/recommendations/similar/${courseId}${qs({ limit })}`),
};

// ── BOSQICH 4: sharh va reyting ──
export const reviewsApi = {
  list: (courseId) => request(`/api/reviews/courses/${courseId}`),
  summary: (courseId) => request(`/api/reviews/courses/${courseId}/summary`),
  mine: (courseId, token) => request(`/api/reviews/courses/${courseId}/my`, { token }),
  upsert: (courseId, body, token) =>
    request(`/api/reviews/courses/${courseId}`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  remove: (reviewId, token) =>
    request(`/api/reviews/${reviewId}`, { method: "DELETE", token }),
};

// ── BOSQICH 3: quiz ──
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
  myAttempts: (quizId, token) =>
    request(`/api/quiz/quizzes/${quizId}/my-attempts`, { token }),
};

// ── BOSQICH 3: sertifikat ──
export const certificatesApi = {
  issue: (courseId, token) =>
    request(`/api/certificates/courses/${courseId}/issue`, {
      method: "POST",
      token,
    }),
  mine: (token) => request("/api/certificates/my", { token }),
  download: (certificateId, token) =>
    request(`/api/certificates/${certificateId}/download`, { token }),
  verify: (code) => request(`/api/certificates/verify/${code}`),
};

// ── BOSQICH 3: Q&A ──
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
    request(`/api/qa/questions/${questionId}/resolve`, { method: "PATCH", token }),
};

// ── BOSQICH 3: eslatmalar ──
export const notesApi = {
  forLesson: (lessonId, token) => request(`/api/notes/lessons/${lessonId}`, { token }),
  mine: (token) => request("/api/notes/my", { token }),
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

// ── BOSQICH 5: himoyalangan video (signed URL) ──
export const mediaApi = {
  signLesson: (lessonId, token, ttl) =>
    request(`/api/media/lessons/${lessonId}/sign${qs({ ttl })}`, {
      method: "POST",
      token,
    }),
};

// ── BOSQICH 4: bildirishnomalar ──
export const notificationsApi = {
  list: (token, onlyUnread) =>
    request(`/api/notifications${qs({ only_unread: onlyUnread })}`, { token }),
  unreadCount: (token) => request("/api/notifications/unread-count", { token }),
  markRead: (id, token) =>
    request(`/api/notifications/${id}/read`, { method: "POST", token }),
  markAllRead: (token) =>
    request("/api/notifications/read-all", { method: "POST", token }),
  remove: (id, token) =>
    request(`/api/notifications/${id}`, { method: "DELETE", token }),
};

// ── BOSQICH 4: referral ──
export const referralsApi = {
  myCode: (token) => request("/api/referrals/my-code", { token }),
  apply: (code, token) =>
    request("/api/referrals/apply", {
      method: "POST",
      body: JSON.stringify({ code }),
      token,
    }),
  myReferrals: (token) => request("/api/referrals/my-referrals", { token }),
};

// ── BOSQICH 4: blog ──
export const blogApi = {
  list: (params) => request(`/api/blog${qs(params)}`),
  get: (slug) => request(`/api/blog/${slug}`),
};

// ── BOSQICH 4: forum ──
export const forumApi = {
  threads: (params) => request(`/api/forum/threads${qs(params)}`),
  thread: (threadId) => request(`/api/forum/threads/${threadId}`),
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

// ── BOSQICH 3/4: gamifikatsiya ──
export const gamificationApi = {
  me: (token) => request("/api/gamification/me", { token }),
  leaderboard: (limit) => request(`/api/gamification/leaderboard${qs({ limit })}`),
  badges: (token) => request("/api/gamification/badges", { token }),
};

// ── BOSQICH 4: instruktor profillari ──
export const instructorsApi = {
  get: (id) => request(`/api/instructors/${id}`),
  courses: (id) => request(`/api/instructors/${id}/courses`),
};

// ── ANALITIKA: dashboardlar + event tracking ──
export const analyticsApi = {
  instructor: (token) => request("/api/analytics/instructor", { token }),
  admin: (token) => request("/api/analytics/admin", { token }),
  track: (body) =>
    request("/api/analytics/track", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ── SYSTEM: i18n ──
export const i18nApi = {
  languages: () => request("/api/i18n/languages"),
  catalog: (lang) => request(`/api/i18n/${lang}`),
};

// ── Umumiy formatlash yordamchilari ──
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
