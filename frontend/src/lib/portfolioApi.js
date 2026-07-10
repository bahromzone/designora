const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const { token, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail || "So'rov bajarilmadi");
  return payload;
}

export const portfolioApi = {
  mine: (token) => request("/api/portfolio/mine", { token }),
  eligible: (token) => request("/api/portfolio/eligible", { token }),
  create: (body, token) =>
    request("/api/portfolio", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  fromSubmission: (submissionId, token) =>
    request(`/api/portfolio/from-submission/${submissionId}`, {
      method: "POST",
      token,
    }),
  update: (projectId, body, token) =>
    request(`/api/portfolio/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    }),
  remove: (projectId, token) =>
    request(`/api/portfolio/${projectId}`, { method: "DELETE", token }),
  public: (userId) => request(`/api/portfolio/public/${userId}`),
};
