const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail || "So'rov bajarilmadi");
  return payload;
}

export const courseBuilderApi = {
  get: (courseId, token) => request(`/api/instructor/builder/courses/${courseId}`, token),
  autosave: (courseId, body, token) => request(`/api/instructor/builder/courses/${courseId}/autosave`, token, { method: "PATCH", body: JSON.stringify(body) }),
  reorder: (courseId, body, token) => request(`/api/instructor/builder/courses/${courseId}/reorder`, token, { method: "POST", body: JSON.stringify(body) }),
  bulkLessons: (courseId, lessons, token) => request(`/api/instructor/builder/courses/${courseId}/bulk-lessons`, token, { method: "POST", body: JSON.stringify({ lessons }) }),
  preview: (courseId, token) => request(`/api/instructor/builder/courses/${courseId}/preview`, token),
  versions: (courseId, token) => request(`/api/instructor/builder/courses/${courseId}/versions`, token),
  createVersion: (courseId, label, token) => request(`/api/instructor/builder/courses/${courseId}/versions`, token, { method: "POST", body: JSON.stringify({ label }) }),
  restore: (courseId, versionId, token) => request(`/api/instructor/builder/courses/${courseId}/versions/${versionId}/restore`, token, { method: "POST" }),
};
