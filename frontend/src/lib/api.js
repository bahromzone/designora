const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

function extractErrorMessage(payload) {
  const detail = payload?.detail;
  if (!detail) return "So'rovni bajarib bo'lmadi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((item) => item?.msg ?? "Noma'lum xato").join(" ");
  return "So'rovni bajarib bo'lmadi.";
}

let refreshPromise = null;
async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((response) => {
      if (!response.ok) throw new Error("refresh failed");
      return true;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

async function request(path, options = {}) {
  const { headers, _retry, ...rest } = options;
  delete rest.token;
  const isFormData =
    typeof FormData !== "undefined" && rest.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(headers ?? {}),
    },
  });
  if (response.status === 401 && !_retry && !path.startsWith("/api/auth/")) {
    try {
      await refreshAccessToken();
      return request(path, { ...options, _retry: true });
    } catch {
      // Continue with the original 401 response.
    }
  }
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) throw new Error(extractErrorMessage(payload));
  return payload;
}

function withQuery(path, params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      usp.append(key, value);
  });
  const qs = usp.toString();
  return qs ? `${path}?${qs}` : path;
}

export const authApi = {
  login: (body) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  profile: () => request("/api/profile/me"),
  dashboard: async () => {
    const s = await request("/api/profile/stats");
    return {
      ...(s ?? {}),
      metrics: [
        { label: "Yozilgan kurslar", value: s?.courses_enrolled ?? 0 },
        { label: "Tugatilgan", value: s?.courses_completed ?? 0 },
        { label: "O'rganilgan soat", value: s?.hours_learned ?? 0 },
        { label: "Sertifikatlar", value: s?.certificates ?? 0 },
        { label: "Ball", value: s?.points ?? 0 },
        { label: "Streak (kun)", value: s?.streak_days ?? 0 },
      ],
    };
  },
  courses: () => request("/api/courses"),
  issueRefresh: (token) =>
    request("/api/auth/issue-refresh", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  refresh: () => request("/api/auth/refresh", { method: "POST" }),
  logoutAll: () => request("/api/auth/logout-all", { method: "POST" }),
};

export const coursesApi = {
  list: () => request("/api/courses"),
  detail: (courseId) => request(`/api/courses/${courseId}/detail`),
};

export const learningApi = {
  enroll: (courseId) =>
    request(`/api/learning/enroll/${courseId}`, { method: "POST" }),
  unenroll: (courseId) =>
    request(`/api/learning/enroll/${courseId}`, { method: "DELETE" }),
  myCourses: () => request("/api/learning/my-courses"),
  learn: (courseId) => request(`/api/learning/courses/${courseId}`),
  completeLesson: (lessonId) =>
    request(`/api/learning/lessons/${lessonId}/complete`, { method: "POST" }),
  uncompleteLesson: (lessonId) =>
    request(`/api/learning/lessons/${lessonId}/uncomplete`, { method: "POST" }),
};

export const discoveryApi = {
  search: (params = {}) => request(withQuery("/api/discovery/search", params)),
  categories: () => request("/api/discovery/categories"),
  bestselling: (limit = 6) =>
    request(withQuery("/api/discovery/recommendations/bestselling", { limit })),
  similar: (courseId, limit = 6) =>
    request(
      withQuery(`/api/discovery/recommendations/similar/${courseId}`, { limit })
    ),
};

export const quizApi = {
  courseQuizzes: (courseId) => request(`/api/quiz/courses/${courseId}/quizzes`),
  take: (quizId) => request(`/api/quiz/quizzes/${quizId}`),
  submit: (quizId, answers) =>
    request(`/api/quiz/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};

export const reviewsApi = {
  summary: (courseId) => request(`/api/reviews/courses/${courseId}/summary`),
  list: (courseId) => request(`/api/reviews/courses/${courseId}`),
  upsert: (courseId, body) =>
    request(`/api/reviews/courses/${courseId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  remove: (reviewId) =>
    request(`/api/reviews/${reviewId}`, { method: "DELETE" }),
};

export const qaApi = {
  list: (lessonId) => request(`/api/qa/lessons/${lessonId}/questions`),
  ask: (lessonId, body) =>
    request(`/api/qa/lessons/${lessonId}/questions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  answer: (questionId, body) =>
    request(`/api/qa/questions/${questionId}/answers`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  resolve: (questionId) =>
    request(`/api/qa/questions/${questionId}/resolve`, { method: "PATCH" }),
};

export const notesApi = {
  forLesson: (lessonId) => request(`/api/notes/lessons/${lessonId}`),
  create: (lessonId, body) =>
    request(`/api/notes/lessons/${lessonId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (noteId, body) =>
    request(`/api/notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  remove: (noteId) => request(`/api/notes/${noteId}`, { method: "DELETE" }),
};

export const certificatesApi = {
  mine: () => request("/api/certificates/my"),
  issue: (courseId) =>
    request(`/api/certificates/courses/${courseId}/issue`, { method: "POST" }),
  download: (certId) => request(`/api/certificates/${certId}/download`),
  verify: (code) => request(`/api/certificates/verify/${code}`),
};

export const mediaApi = {
  signLesson: (lessonId) =>
    request(`/api/media/lessons/${lessonId}/sign`, { method: "POST" }),
};

export const paymentsApi = {
  checkout: (body) =>
    request("/api/payments/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  orderStatus: (orderId) => request(`/api/payments/orders/${orderId}`),
};

export const notificationsApi = {
  list: (_token, onlyUnread = false) =>
    request(withQuery("/api/notifications", { only_unread: onlyUnread })),
  unreadCount: () => request("/api/notifications/unread-count"),
  markRead: (id) =>
    request(`/api/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => request("/api/notifications/read-all", { method: "POST" }),
  remove: (id) => request(`/api/notifications/${id}`, { method: "DELETE" }),
};

export const blogApi = {
  list: (params = {}) => request(withQuery("/api/blog", params)),
  getBySlug: (slug) => request(`/api/blog/${slug}`),
};

export const forumApi = {
  listThreads: (params = {}) =>
    request(withQuery("/api/forum/threads", params)),
  getThread: (threadId) => request(`/api/forum/threads/${threadId}`),
  createThread: (body) =>
    request("/api/forum/threads", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  reply: (threadId, body) =>
    request(`/api/forum/threads/${threadId}/posts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const referralApi = {
  myCode: () => request("/api/referrals/my-code"),
  apply: (code) =>
    request("/api/referrals/apply", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  myReferrals: () => request("/api/referrals/my-referrals"),
};

export const instructorsApi = {
  get: (instructorId) => request(`/api/instructors/${instructorId}`),
  courses: (instructorId) =>
    request(`/api/instructors/${instructorId}/courses`),
};

export const gamificationApi = {
  me: () => request("/api/gamification/me"),
  badges: () => request("/api/gamification/badges"),
  leaderboard: (limit = 20) =>
    request(withQuery("/api/gamification/leaderboard", { limit })),
};

export const analyticsApi = {
  instructor: () => request("/api/analytics/instructor"),
  admin: () => request("/api/analytics/admin"),
  track: (body) =>
    request("/api/analytics/track", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const instructorApi = {
  listCourses: () => request("/api/instructor/courses"),
  getCourse: (courseId) => request(`/api/instructor/courses/${courseId}`),
  createCourse: (body) =>
    request("/api/instructor/courses", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCourse: (courseId, body) =>
    request(`/api/instructor/courses/${courseId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  publishCourse: (courseId) =>
    request(`/api/instructor/courses/${courseId}/publish`, { method: "POST" }),
  unpublishCourse: (courseId) =>
    request(`/api/instructor/courses/${courseId}/unpublish`, {
      method: "POST",
    }),
  createModule: (courseId, body) =>
    request(`/api/instructor/courses/${courseId}/modules`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateModule: (moduleId, body) =>
    request(`/api/instructor/modules/${moduleId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteModule: (moduleId) =>
    request(`/api/instructor/modules/${moduleId}`, { method: "DELETE" }),
  createLesson: (courseId, body) =>
    request(`/api/instructor/courses/${courseId}/lessons`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateLesson: (lessonId, body) =>
    request(`/api/instructor/lessons/${lessonId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteLesson: (lessonId) =>
    request(`/api/instructor/lessons/${lessonId}`, { method: "DELETE" }),
};

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
