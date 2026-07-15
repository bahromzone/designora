const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Admin ma’lumotlarini olib bo‘lmadi");
  return data;
}

export const adminOperationsApi = {
  dashboard: (token) => request("/api/admin/operations", token),
  audit: (token, action, targetType, targetId) => request(`/api/admin/operations/audit?action=${encodeURIComponent(action)}&target_type=${encodeURIComponent(targetType || "")}&target_id=${encodeURIComponent(targetId || "")}`, token, { method: "POST" }),
};
