import { request } from "./request";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const assignmentsApi = {
  forCourse: (courseId) => request(`/api/assignments/courses/${courseId}`),

  submissions: (assignmentId) =>
    request(`/api/assignments/${assignmentId}/submissions`),

  grade: (submissionId, body) =>
    request(`/api/assignments/submissions/${submissionId}/grade`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  submit: (assignmentId, body) =>
    request(`/api/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  upload: (file, _token, onProgress) =>
    new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/api/assignments/upload`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        let payload = null;
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          payload = null;
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
        else reject(new Error(payload?.detail || "Faylni yuklab bo'lmadi"));
      };
      xhr.onerror = () => reject(new Error("Internet aloqasini tekshiring"));
      xhr.send(form);
    }),
};
