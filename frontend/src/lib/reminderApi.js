import { request } from "./request";

export const reminderApi = {
  get: (token) => request("/api/notifications/preferences", { token }),
  update: (body, token) =>
    request("/api/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    }),
  test: (token) =>
    request("/api/notifications/preferences/test", {
      method: "POST",
      token,
    }),
  subscribe: (body, token) =>
    request("/api/notifications/push-subscriptions", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  unsubscribe: (endpoint, token) =>
    request(
      `/api/notifications/push-subscriptions?endpoint=${encodeURIComponent(endpoint)}`,
      { method: "DELETE", token }
    ),
};
