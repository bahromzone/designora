import { request } from "./request";

export const dashboardApi = {
  get: (token) => request("/api/dashboard", { token }),
};
