import { analyticsApi } from "./api";

const SESSION_KEY = "designora-session-id";

// Sessiya identifikatorini localStorage'da saqlaymiz, hodisalarni bitta
// tashrif bo'ylab bog'lash uchun. Auth token browser storage'ga yozilmaydi.
export function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Xatti-harakat hodisasini backend'ga yuboradi. Fire-and-forget:
// UI oqimini bloklamaydi.
export function trackEvent(name, props = {}) {
  if (!name) return;
  try {
    const body = {
      name,
      props,
      session_id: getSessionId(),
      path: typeof window !== "undefined" ? window.location.pathname : null,
    };
    analyticsApi.track(body).catch(() => {});
  } catch {
    // localStorage yoki tarmoq muammosi, e'tiborsiz qoldiramiz.
  }
}
