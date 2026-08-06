import { request } from "./request";

export const monetizationApi = {
  catalog: () => request("/api/monetization/catalog"),
  bundle: (id, token) =>
    request(`/api/monetization/bundles/${id}/activate`, {
      method: "POST",
      token,
    }),
  subscribe: (id, token) =>
    request(`/api/monetization/plans/${id}/subscribe`, {
      method: "POST",
      token,
    }),
  team: (body, token) =>
    request("/api/monetization/teams", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
  aid: (body, token) =>
    request("/api/monetization/aid", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),
};
