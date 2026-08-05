import { request } from "./request";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function apiRequest(path, _token, options = {}) {
  return request(path, options);
}

async function uploadVideoMultipart(
  courseId,
  lessonId,
  file,
  token,
  onProgress
) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const contentType = ext === "m4v" ? "video/mp4" : file.type || "video/mp4";
  const init = await apiRequest(
    `/api/uploads/video/${courseId}/${lessonId}/initiate`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        content_type: contentType,
        size: file.size,
      }),
    }
  );
  try {
    const uploaded = [];
    let completed = 0;
    for (const part of init.parts) {
      const start = (part.part_number - 1) * init.part_size;
      const end = Math.min(start + init.part_size, file.size);
      const response = await fetch(part.url, {
        method: "PUT",
        body: file.slice(start, end),
      });
      if (!response.ok)
        throw new Error(`Video bo'lagi ${part.part_number} yuklanmadi`);
      const etag = response.headers.get("ETag") || response.headers.get("etag");
      if (!etag) throw new Error("Storage CORS ETag headerini expose qilmagan");
      uploaded.push({ part_number: part.part_number, etag });
      completed += end - start;
      onProgress?.(Math.round((completed / file.size) * 100));
    }
    return await apiRequest(
      `/api/uploads/video/${courseId}/${lessonId}/complete`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          upload_id: init.upload_id,
          key: init.key,
          parts: uploaded,
        }),
      }
    );
  } catch (error) {
    const query = new URLSearchParams({ key: init.key });
    await fetch(
      `${API_URL}/api/uploads/video/${courseId}/${lessonId}/${encodeURIComponent(init.upload_id)}?${query}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    ).catch(() => null);
    throw error;
  }
}

export const courseBuilderApi = {
  get: (courseId, token) =>
    apiRequest(`/api/instructor/builder/courses/${courseId}`, token),
  autosave: (courseId, body, token) =>
    apiRequest(`/api/instructor/builder/courses/${courseId}/autosave`, token, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  reorder: (courseId, body, token) =>
    apiRequest(`/api/instructor/builder/courses/${courseId}/reorder`, token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  bulkLessons: (courseId, lessons, token) =>
    apiRequest(
      `/api/instructor/builder/courses/${courseId}/bulk-lessons`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ lessons }),
      }
    ),
  preview: (courseId, token) =>
    apiRequest(`/api/instructor/builder/courses/${courseId}/preview`, token),
  versions: (courseId, token) =>
    apiRequest(`/api/instructor/builder/courses/${courseId}/versions`, token),
  createVersion: (courseId, label, token) =>
    apiRequest(`/api/instructor/builder/courses/${courseId}/versions`, token, {
      method: "POST",
      body: JSON.stringify({ label }),
    }),
  restore: (courseId, versionId, token) =>
    apiRequest(
      `/api/instructor/builder/courses/${courseId}/versions/${versionId}/restore`,
      token,
      { method: "POST" }
    ),
  uploadVideo: uploadVideoMultipart,
};
