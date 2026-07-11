const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function parse(response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.detail || "Notes so‘rovi bajarilmadi");
  return payload;
}

const headers = (token) => ({ Authorization: `Bearer ${token}` });
export const notesWorkspaceApi = {
  recent: (token) => fetch(`${API_URL}/api/notes/recent`, { headers: headers(token) }).then(parse),
  bookmarks: (token) => fetch(`${API_URL}/api/notes/bookmarks`, { headers: headers(token) }).then(parse),
  setBookmark: (lessonId, bookmarked, token) => fetch(`${API_URL}/api/notes/bookmarks/${lessonId}?bookmarked=${bookmarked}`, { method: "PUT", headers: headers(token) }).then(parse),
  exportUrl: (token, format = "markdown") => `${API_URL}/api/notes/export?format=${format}&access_token=${encodeURIComponent(token)}`,
};
