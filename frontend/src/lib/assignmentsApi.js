const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function parse(response) {
  const type = response.headers.get("content-type") || "";
  const payload = type.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const detail = payload?.detail;
    throw new Error(typeof detail === "string" ? detail : "So'rovni bajarib bo'lmadi");
  }
  return payload;
}

export const assignmentsApi = {
  forCourse: (courseId, token) =>
    fetch(`${API_URL}/api/assignments/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(parse),

  submit: (assignmentId, body, token) =>
    fetch(`${API_URL}/api/assignments/${assignmentId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then(parse),

  upload: (file, token, onProgress) =>
    new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/api/assignments/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        let payload = null;
        try { payload = JSON.parse(xhr.responseText); } catch { /* no-op */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
        else reject(new Error(payload?.detail || "Faylni yuklab bo'lmadi"));
      };
      xhr.onerror = () => reject(new Error("Internet aloqasini tekshiring"));
      xhr.send(form);
    }),
};
