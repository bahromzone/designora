import { request } from "./request";

async function req(path, _token, options = {}) {
  return request(path, options);
}

export const courseCommunityApi = {
  list: (courseId, token, lessonId) =>
    req(
      `/api/course-community/courses/${courseId}/threads${lessonId ? `?lesson_id=${lessonId}` : ""}`,
      token
    ),
  detail: (id, token) => req(`/api/course-community/threads/${id}`, token),
  create: (body, token) =>
    req("/api/course-community/threads", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  reply: (id, body, token) =>
    req(`/api/course-community/threads/${id}/posts`, token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  accept: (tid, pid, token) =>
    req(`/api/course-community/threads/${tid}/accept/${pid}`, token, {
      method: "POST",
    }),
  report: (body, token) =>
    req("/api/course-community/reports", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
