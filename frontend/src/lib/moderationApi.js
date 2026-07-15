const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
async function request(path, token, options = {}) { const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.detail || "Moderation so‘rovi bajarilmadi"); return data; }
export const moderationApi = {
  queue: (token, status = "open") => request(`/api/moderation/queue?status=${status}`, token),
  appeals: (token) => request("/api/moderation/appeals", token),
  act: (token, reportId, body) => request(`/api/moderation/reports/${reportId}/action`, token, { method: "POST", body: JSON.stringify(body) }),
  decide: (token, appealId, body) => request(`/api/moderation/appeals/${appealId}/decision`, token, { method: "POST", body: JSON.stringify(body) }),
};
