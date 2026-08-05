const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function parse(response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.detail || "Video yuklanmadi");
  return payload;
}

export const videoPlayerApi = {
  manifest: (lessonId) =>
    fetch(`${API_URL}/api/media/lessons/${lessonId}/sign`, {
      method: "POST",
      credentials: "include",
    }).then(parse),
  save: (lessonId, body) =>
    fetch(`${API_URL}/api/media/lessons/${lessonId}/progress`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).then(parse),
};
