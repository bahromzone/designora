const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request(path, token) {
  const response = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail || "Analytics yuklanmadi");
  return payload;
}

export const instructorAnalyticsApi = {
  get: (token, courseId) => request(`/api/instructor/analytics${courseId ? `?course_id=${courseId}` : ""}`, token),
  exportUrl: (courseId) => `${API_URL}/api/instructor/analytics/export.csv${courseId ? `?course_id=${courseId}` : ""}`,
};
