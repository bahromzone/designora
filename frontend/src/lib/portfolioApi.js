import { request } from "./request";

export const portfolioApi = {
  mine: (token) => request("/api/portfolio/mine", { token }),
  eligible: (token) => request("/api/portfolio/eligible", { token }),
  create: (body, token) =>
    request("/api/portfolio", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  fromSubmission: (submissionId, token) =>
    request(`/api/portfolio/from-submission/${submissionId}`, {
      method: "POST",
      token,
    }),
  update: (projectId, body, token) =>
    request(`/api/portfolio/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    }),
  remove: (projectId, token) =>
    request(`/api/portfolio/${projectId}`, { method: "DELETE", token }),
  public: (userId) => request(`/api/portfolio/public/${userId}`),
};
