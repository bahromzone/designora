import { request } from "./request";

export const notesWorkspaceApi = {
  recent: (token) => request("/api/notes/recent", { token }),
  bookmarks: (token) => request("/api/notes/bookmarks", { token }),
  setBookmark: (lessonId, bookmarked, token) =>
    request(`/api/notes/bookmarks/${lessonId}?bookmarked=${bookmarked}`, {
      method: "PUT",
      token,
    }),
  exportUrl: (token, format = "markdown") =>
    `/api/notes/export?format=${encodeURIComponent(format)}`,
};
