const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
    credentials: "include",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail || "So'rov bajarilmadi");
  return payload;
}

export const courseBuilderApi = {
  get: (courseId, token) => request(`/api/instructor/builder/courses/${courseId}`, token),
  autosave: (courseId, body, token) => request(`/api/instructor/builder/courses/${courseId}/autosave`, token, { method: "PATCH", body: JSON.stringify(body) }),
  reorder: (courseId, body, token) => request(`/api/instructor/builder/courses/${courseId}/reorder`, token, { method: "POST", body: JSON.stringify(body) }),
  bulkLessons: (courseId, lessons, token) => request(`/api/instructor/builder/courses/${courseId}/bulk-lessons`, token, { method: "POST", body: JSON.stringify({ lessons }) }),
  preview: (courseId, token) => request(`/api/instructor/builder/courses/${courseId}/preview`, token),
  versions: (courseId, token) => request(`/api/instructor/builder/courses/${courseId}/versions`, token),
  createVersion: (courseId, label, token) => request(`/api/instructor/builder/courses/${courseId}/versions`, token, { method: "POST", body: JSON.stringify({ label }) }),
  restore: (courseId, versionId, token) => request(`/api/instructor/builder/courses/${courseId}/versions/${versionId}/restore`, token, { method: "POST" }),
  uploadVideo: (courseId, lessonId, file, token, onProgress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/uploads/video/${courseId}/${lessonId}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error("Video yuklashda tarmoq xatosi"));
    xhr.onload = () => {
      let payload = null;
      try { payload = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
      else reject(new Error(payload?.detail || "Video yuklanmadi"));
    };
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  }),
};
