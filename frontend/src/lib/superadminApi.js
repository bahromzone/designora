import { request } from "./request";

export const superadminApi = {
  overview: (token) => request("/api/superadmin/overview", { token }),
  users: (token) => request("/api/superadmin/users", { token }),
  audit: (token) => request("/api/superadmin/audit", { token }),
  updateRole: (id, role, token) =>
    request(`/api/superadmin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
      token,
    }),
  updateStatus: (id, is_active, token) =>
    request(`/api/superadmin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
      token,
    }),
};
