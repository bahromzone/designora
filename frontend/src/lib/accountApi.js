import { request } from "./request";

export const accountApi = {
  certificates: () => request("/api/certificates/my"),
  savedCourses: () => request("/api/saved-courses"),
  saveCourse: (courseId) =>
    request(`/api/saved-courses/${courseId}`, { method: "POST" }),
  removeSavedCourse: (courseId) =>
    request(`/api/saved-courses/${courseId}`, { method: "DELETE" }),
  paymentHistory: () => request("/api/payments/history"),
  profile: () => request("/api/profile/me"),
  updateProfile: (body) =>
    request("/api/profile/update", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  uploadAvatar: (file) => {
    const body = new FormData();
    body.append("file", file);
    return request("/api/uploads/avatar", { method: "POST", body });
  },
  changePassword: (body) =>
    request("/api/profile/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
