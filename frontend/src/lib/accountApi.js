import { request } from "./request";

export const accountApi = {
  certificates: () => request("/api/certificates/my"),
  savedCourses: () => request("/api/saved-courses"),
  removeSavedCourse: (courseId) => request(`/api/saved-courses/${courseId}`, { method: "DELETE" }),
  paymentHistory: () => request("/api/payments/history"),
  profile: () => request("/api/profile/me"),
  updateProfile: (body) => request("/api/profile/update", { method: "PATCH", body: JSON.stringify(body) }),
  changePassword: (body) => request("/api/profile/change-password", { method: "POST", body: JSON.stringify(body) }),
};
