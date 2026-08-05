import { request } from "./request";

export const learningPathsApi = {
  list: () => request("/api/learning-paths"),
  detail: (slug) => request(`/api/learning-paths/${slug}`),
  progress: (slug, token) =>
    request(`/api/learning-paths/${slug}/progress`, { token }),
  start: (slug, token) =>
    request(`/api/learning-paths/${slug}/start`, { method: "POST", token }),
};
