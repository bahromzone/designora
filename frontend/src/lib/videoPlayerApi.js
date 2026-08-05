import { request } from "./request";

export const videoPlayerApi = {
  manifest: (lessonId) =>
    request(`/api/media/lessons/${lessonId}/sign`, { method: "POST" }),
  save: (lessonId, body) =>
    request(`/api/media/lessons/${lessonId}/progress`, {
      method: "PUT",
      body: JSON.stringify(body),
      keepalive: true,
    }),
};
