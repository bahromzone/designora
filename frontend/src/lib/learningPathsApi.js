const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function parse(response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.detail || "Learning path yuklanmadi");
  return payload;
}

export const learningPathsApi = {
  list: () => fetch(`${API_URL}/api/learning-paths`).then(parse),
  detail: (slug) => fetch(`${API_URL}/api/learning-paths/${slug}`).then(parse),
  progress: (slug, token) =>
    fetch(`${API_URL}/api/learning-paths/${slug}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(parse),
  start: (slug, token) =>
    fetch(`${API_URL}/api/learning-paths/${slug}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).then(parse),
};
