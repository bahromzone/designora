import { request } from "./request";

function withQuery(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  return query ? `${path}?${query}` : path;
}

export const calendarApi = {
  list: (params = {}, token) =>
    request(withQuery("/api/calendar/events", params), { token }),
  create: (body, token) =>
    request("/api/calendar/events", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  remove: (id, token) =>
    request(`/api/calendar/events/${id}`, { method: "DELETE", token }),
};
