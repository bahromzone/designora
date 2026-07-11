const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function parse(response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.detail || "Video yuklanmadi");
  return payload;
}

export const videoPlayerApi = {
  manifest: (lessonId, token) =>
    fetch(`${API_URL}/api/media/lessons/${lessonId}/sign`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).then(parse),
  save: (lessonId, body, token) =>
    fetch(`${API_URL}/api/media/lessons/${lessonId}/progress`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      keepalive: true,
    }).then(parse),
};
