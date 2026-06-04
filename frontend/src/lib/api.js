const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
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
    throw new Error(payload?.detail ?? "So'rovni bajarib bo'lmadi.");
  }

  return payload;
}

export const authApi = {
  login: (body) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body) =>
    request("/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  profile: (token) =>
    request("/profile", {
      method: "GET",
      token,
    }),
  dashboard: (token) =>
    request("/dashboard", {
      method: "GET",
      token,
    }),
  courses: () =>
    request("/courses", {
      method: "GET",
    }),
};
