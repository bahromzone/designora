import { request } from "./request";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const notesWorkspaceApi = {
  recent: (token) => request("/api/notes/recent", { token }),
  bookmarks: (token) => request("/api/notes/bookmarks", { token }),
  setBookmark: (lessonId, bookmarked, token) =>
    request(`/api/notes/bookmarks/${lessonId}?bookmarked=${bookmarked}`, {
      method: "PUT",
      token,
    }),
  exportUrl: (token, format = "markdown") =>
    `${API_URL}/api/notes/export?format=${encodeURIComponent(format)}`,
};
