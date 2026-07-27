let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
  refreshPromise = fetch(`${API_URL}/api/auth/refresh`, { method: "POST", credentials: "include" })
    .then(async (response) => {
      if (!response.ok) throw new Error("refresh failed");
      const payload = await response.json();
      return payload?.access_token;
    })
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function request(path, options = {}) {
  const { token, headers, _retry, ...rest } = options;
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
  if (response.status === 401 && token && !_retry && !path.startsWith("/api/auth/")) {
    try {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        localStorage.setItem("designora-auth-token", nextToken);
        window.dispatchEvent(new CustomEvent("designora-token-refreshed", { detail: nextToken }));
        return request(path, { ...options, token: nextToken, _retry: true });
      }
    } catch { /* return original response below */ }
  }
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const detail = payload?.detail;
    const message = Array.isArray(detail) ? detail.map((item) => item?.msg ?? "Noma'lum xato").join(" ") : detail || "So'rovni bajarib bo'lmadi.";
    throw new Error(message);
  }
  return payload;
}
