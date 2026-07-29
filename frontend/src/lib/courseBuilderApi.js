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

async function uploadVideoMultipart(courseId, lessonId, file, token, onProgress) {
  const init = await request(`/api/uploads/video/${courseId}/${lessonId}/initiate`, token, { method: "POST", body: JSON.stringify({ filename: file.name, content_type: file.type || "video/mp4", size: file.size }) });
  const uploaded = [];
  let completed = 0;
  for (const part of init.parts) {
    const start = (part.part_number - 1) * init.part_size;
    const end = Math.min(start + init.part_size, file.size);
    const response = await fetch(part.url, { method: "PUT", body: file.slice(start, end) });
    if (!response.ok) throw new Error(`Video bo'lagi ${part.part_number} yuklanmadi`);
    uploaded.push({ part_number: part.part_number, etag: response.headers.get("ETag") || response.headers.get("etag") || "" });
    completed += end - start;
    onProgress?.(Math.round((completed / file.size) * 100));
  }
  return request(`/api/uploads/video/${courseId}/${lessonId}/complete`, token, { method: "POST", body: JSON.stringify({ upload_id: init.upload_id, key: init.key, parts: uploaded }) });
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
  uploadVideo: uploadVideoMultipart,
};
