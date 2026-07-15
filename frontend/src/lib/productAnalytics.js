const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const TOKEN_KEY = "designora-auth-token";
const SESSION_KEY = "designora-session-id";
const ANONYMOUS_KEY = "designora-anonymous-id";
const SENT_KEY = "designora-analytics-sent";

export const PRODUCT_EVENTS = Object.freeze([
  "landing_page_view",
  "signup_started",
  "signup_completed",
  "onboarding_started",
  "onboarding_completed",
  "search_performed",
  "search_result_clicked",
  "course_viewed",
  "enrollment_started",
  "enrollment_completed",
  "checkout_started",
  "payment_succeeded",
  "payment_failed",
  "lesson_started",
  "lesson_completed",
  "video_progress_25",
  "video_progress_50",
  "video_progress_75",
  "video_progress_100",
  "quiz_started",
  "quiz_submitted",
  "quiz_passed",
  "assignment_started",
  "assignment_submitted",
  "feedback_viewed",
  "assignment_resubmitted",
  "certificate_issued",
  "certificate_downloaded",
  "notification_clicked",
  "portfolio_project_published",
]);

const FUNNEL_STEPS = {
  landing_page_view: 1,
  signup_completed: 2,
  onboarding_completed: 3,
  course_viewed: 4,
  enrollment_completed: 5,
  payment_succeeded: 5,
  lesson_started: 6,
  lesson_completed: 7,
  assignment_submitted: 8,
  certificate_issued: 10,
  portfolio_project_published: 10,
};

const PRIVATE_KEYS = /email|password|token|authorization|card|phone|name|content|answer/i;
let installed = false;
let nativeFetch = null;

function randomId(prefix) {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function persistentId(key, prefix) {
  try {
    let value = localStorage.getItem(key);
    if (!value) {
      value = randomId(prefix);
      localStorage.setItem(key, value);
    }
    return value;
  } catch {
    return randomId(prefix);
  }
}

function safeProps(props = {}) {
  return Object.fromEntries(
    Object.entries(props)
      .filter(([key, value]) => !PRIVATE_KEYS.test(key) && value !== undefined)
      .map(([key, value]) => [
        key,
        typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? value
          : String(value),
      ]),
  );
}

function once(key) {
  try {
    const sent = new Set(JSON.parse(sessionStorage.getItem(SENT_KEY) || "[]"));
    if (sent.has(key)) return false;
    sent.add(key);
    sessionStorage.setItem(SENT_KEY, JSON.stringify([...sent]));
  } catch {
    return true;
  }
  return true;
}

export function trackProductEvent(name, props = {}, options = {}) {
  if (!PRODUCT_EVENTS.includes(name)) return;
  const dedupeKey = options.onceKey ? `${name}:${options.onceKey}` : null;
  if (dedupeKey && !once(dedupeKey)) return;

  const payload = {
    name,
    props: safeProps({ ...props, funnel_step: FUNNEL_STEPS[name] }),
    session_id: persistentId(SESSION_KEY, "session"),
    anonymous_id: persistentId(ANONYMOUS_KEY, "anonymous"),
    path: globalThis.location?.pathname ?? null,
    device: globalThis.navigator?.userAgent ?? "unknown",
    timestamp: new Date().toISOString(),
  };

  globalThis.__designoraAnalyticsEvents = globalThis.__designoraAnalyticsEvents || [];
  globalThis.__designoraAnalyticsEvents.push(payload);
  globalThis.dispatchEvent?.(new CustomEvent("designora-analytics", { detail: payload }));

  const token = localStorage.getItem(TOKEN_KEY);
  nativeFetch?.(`${API_URL}/api/analytics/track`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

function idFrom(path, pattern) {
  return path.match(pattern)?.[1];
}

function parseBody(body) {
  if (!body || typeof body !== "string") return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

export function eventsForRequest(path, method, phase, response = {}, requestBody = {}) {
  const events = [];
  const push = (name, props = {}, onceKey) => events.push({ name, props, onceKey });
  const courseId =
    idFrom(path, /\/courses\/(\d+)/) ||
    idFrom(path, /\/enroll\/(\d+)/) ||
    requestBody.course_id;
  const lessonId = idFrom(path, /\/lessons\/(\d+)/);
  const assignmentId = idFrom(path, /\/assignments\/(\d+)/);

  if (phase === "before") {
    if (method === "POST" && path === "/api/auth/register") push("signup_started");
    if (method === "POST" && /\/onboarding/.test(path)) push("onboarding_started");
    if (method === "POST" && /\/learning\/enroll\//.test(path))
      push("enrollment_started", { course_id: courseId });
    if (method === "POST" && /\/payments\/(checkout|checkout-safe)/.test(path))
      push("checkout_started", { course_id: courseId, provider: requestBody.provider });
    if (method === "POST" && /\/assignments\/\d+\/submit/.test(path))
      push("assignment_started", { assignment_id: assignmentId });
    return events;
  }

  if (method === "POST" && path === "/api/auth/register") push("signup_completed");
  if (method === "POST" && /\/onboarding/.test(path)) push("onboarding_completed");
  if (method === "GET" && /\/courses\/\d+\/detail/.test(path))
    push("course_viewed", { course_id: courseId }, courseId);
  if (method === "POST" && /\/learning\/enroll\//.test(path))
    push("enrollment_completed", { course_id: courseId }, courseId);
  if (method === "GET" && /\/payments\/orders\/[^/]+$/.test(path)) {
    if (response.status === "paid") push("payment_succeeded", { course_id: response.course_id }, response.id || path);
    if (["failed", "cancelled"].includes(response.status))
      push("payment_failed", { course_id: response.course_id, status: response.status }, response.id || path);
  }
  if (method === "GET" && /\/learning\/courses\/\d+/.test(path)) {
    const lessons = (response.modules || []).flatMap((module) => module.lessons || []);
    const lesson = lessons.find((item) => !item.is_locked && !item.is_completed) || lessons[0];
    if (lesson) push("lesson_started", { course_id: courseId, lesson_id: lesson.id }, lesson.id);
  }
  if (method === "POST" && /\/learning\/lessons\/\d+\/complete/.test(path))
    push("lesson_completed", { lesson_id: lessonId }, lessonId);
  if (method === "PUT" && /\/media\/lessons\/\d+\/progress/.test(path)) {
    const percent = requestBody.duration_seconds
      ? Math.floor((requestBody.position_seconds / requestBody.duration_seconds) * 100)
      : 0;
    [25, 50, 75, 100].forEach((milestone) => {
      if (percent >= milestone)
        push(`video_progress_${milestone}`, { lesson_id: lessonId }, `${lessonId}:${milestone}`);
    });
  }
  if (method === "GET" && /\/quiz\/quizzes\/\d+$/.test(path))
    push("quiz_started", { quiz_id: idFrom(path, /quizzes\/(\d+)/) });
  if (method === "POST" && /\/quiz\/quizzes\/\d+\/submit/.test(path)) {
    const quizId = idFrom(path, /quizzes\/(\d+)/);
    push("quiz_submitted", { quiz_id: quizId });
    if (response.passed) push("quiz_passed", { quiz_id: quizId, score: response.score });
  }
  if (method === "POST" && /\/assignments\/\d+\/submit/.test(path))
    push(response.is_resubmission ? "assignment_resubmitted" : "assignment_submitted", {
      assignment_id: assignmentId,
    });
  if (method === "GET" && /\/assignments\/.*feedback/.test(path))
    push("feedback_viewed", { assignment_id: assignmentId }, assignmentId);
  if (method === "POST" && /\/certificates\/courses\/\d+\/issue/.test(path))
    push("certificate_issued", { course_id: courseId, certificate_id: response.id }, response.id || courseId);
  if (method === "GET" && /\/certificates\/\d+\/download/.test(path))
    push("certificate_downloaded", { certificate_id: idFrom(path, /certificates\/(\d+)/) });
  if (method === "POST" && /\/notifications\/\d+\/read/.test(path))
    push("notification_clicked", { notification_id: idFrom(path, /notifications\/(\d+)/) });
  if (method === "POST" && /\/portfolio\/.*publish/.test(path))
    push("portfolio_project_published", { project_id: response.id });
  if (method === "GET" && /\/discovery\/search/.test(path)) push("search_performed");
  return events;
}

function recordRoute() {
  if (location.pathname === "/") trackProductEvent("landing_page_view", {}, { onceKey: location.pathname });
}

export function installProductAnalytics() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.origin);
    const method = (init.method || (typeof input !== "string" && input.method) || "GET").toUpperCase();
    if (!url.pathname.startsWith("/api/") || url.pathname === "/api/analytics/track")
      return nativeFetch(input, init);

    const requestBody = parseBody(init.body);
    eventsForRequest(url.pathname, method, "before", {}, requestBody).forEach((event) =>
      trackProductEvent(event.name, event.props, { onceKey: event.onceKey }),
    );

    const result = await nativeFetch(input, init);
    if (result.ok) {
      const response = await result.clone().json().catch(() => ({}));
      eventsForRequest(url.pathname, method, "after", response, requestBody).forEach((event) =>
        trackProductEvent(event.name, event.props, { onceKey: event.onceKey }),
      );
    }
    return result;
  };

  ["pushState", "replaceState"].forEach((method) => {
    const original = history[method];
    history[method] = function patchedHistory(...args) {
      const result = original.apply(this, args);
      queueMicrotask(recordRoute);
      return result;
    };
  });
  addEventListener("popstate", recordRoute);
  recordRoute();
}
