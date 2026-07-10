const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.detail === "string" ? data.detail : "So'rov bajarilmadi");
  return data;
}

export const portfolioApi = {
  mine: (token) => request("/api/portfolio/mine", { token }),
  eligible: (token) => request("/api/portfolio/eligible", { token }),
  create: (body, token) => request("/api/portfolio", { method: "POST", body: JSON.stringify(body), token }),
  update: (id, body, token) => request(`/api/portfolio/${id}`, { method: "PATCH", body: JSON.stringify(body), token }),
  remove: (id, token) => request(`/api/portfolio/${id}`, { method: "DELETE", token }),
  public: (userId) => request(`/api/portfolio/public/${userId}`),
};
