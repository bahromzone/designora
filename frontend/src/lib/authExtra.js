import { request } from "./request";

// Parolni tiklash, Google OAuth va instruktor arizasi uchun yordamchilar.
const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
export const GOOGLE_AUTH_URL = `${API_URL}/auth/google`;

export const forgotPassword = (email) =>
  request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token, password) =>
  request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });

export const applyInstructor = (token, body) =>
  request("/api/instructor/apply", {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
