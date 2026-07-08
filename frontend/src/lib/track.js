import { analyticsApi } from "./api";

// AuthContext token'ni shu kalitda saqlaydi.
const TOKEN_KEY = "designora-auth-token";
const SESSION_KEY = "designora-session-id";

// Sessiya identifikatorini localStorage'da saqlaymiz (hodisalarni bitta
// tashrif bo'ylab bog'lash uchun). Yo'q bo'lsa yangi yaratamiz.
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

// Xatti-harakat hodisasini backend'ga yuboradi. "Fire-and-forget":
// hech qachon xato tashlamaydi va UI oqimini bloklamaydi.
export function trackEvent(name, props = {}) {
  if (!name) return;
  try {
    const token = localStorage.getItem(TOKEN_KEY) || undefined;
    const body = {
      name,
      props,
      session_id: getSessionId(),
      path: typeof window !== "undefined" ? window.location.pathname : null,
    };
    // Natijani kutmaymiz; xatolarni jimgina yutamiz.
    analyticsApi.track(body, token).catch(() => {});
  } catch {
    // localStorage yoki tarmoq muammosi — e'tiborsiz qoldiramiz.
  }
}
