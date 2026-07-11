const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function parse(response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.detail || "Reminder sozlamasi saqlanmadi");
  return payload;
}

const auth = (token, extra = {}) => ({ ...extra, Authorization: `Bearer ${token}` });

export const reminderApi = {
  get: (token) => fetch(`${API_URL}/api/notifications/preferences`, { headers: auth(token) }).then(parse),
  update: (body, token) => fetch(`${API_URL}/api/notifications/preferences`, { method: "PATCH", headers: auth(token, { "Content-Type": "application/json" }), body: JSON.stringify(body) }).then(parse),
  test: (token) => fetch(`${API_URL}/api/notifications/preferences/test`, { method: "POST", headers: auth(token) }).then(parse),
  subscribe: (body, token) => fetch(`${API_URL}/api/notifications/push-subscriptions`, { method: "POST", headers: auth(token, { "Content-Type": "application/json" }), body: JSON.stringify(body) }).then(parse),
  unsubscribe: (endpoint, token) => fetch(`${API_URL}/api/notifications/push-subscriptions?endpoint=${encodeURIComponent(endpoint)}`, { method: "DELETE", headers: auth(token) }).then(parse),
};
