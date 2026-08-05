import { request } from "./request";

function withQuery(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  return query ? `${path}?${query}` : path;
}

export const instructorAnalyticsApi = {
  get: (token, courseId) =>
    request(
      withQuery(
        "/api/instructor/analytics",
        courseId ? { course_id: courseId } : {}
      ),
      { token }
    ),
  exportUrl: (courseId) =>
    withQuery(
      "/api/instructor/analytics/export.csv",
      courseId ? { course_id: courseId } : {}
    ),
};
