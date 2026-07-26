export async function request(path, options = {}) {
  const { token, headers, ...rest } = options;
  const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) {
    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item?.msg ?? "Noma'lum xato").join(" ")
      : detail || "So'rovni bajarib bo'lmadi.";
    throw new Error(message);
  }
  return payload;
}
