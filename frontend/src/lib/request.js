import { currentAuthEpoch } from "./authEpoch";

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
  refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("refresh failed");
      return true;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function request(path, options = {}) {
  // So'rov boshlangan paytdagi sessiya epoch'i.
  const epochAtStart = currentAuthEpoch();
  const { headers, _retry, signal, ...rest } = options;
  delete rest.token;
  const isFormData =
    typeof FormData !== "undefined" && rest.body instanceof FormData;
  const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    signal,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(headers ?? {}),
    },
  });
  if (response.status === 401 && !_retry && !path.startsWith("/api/auth/")) {
    try {
      await refreshAccessToken();
      return request(path, { ...options, _retry: true });
    } catch {
      // Epoch'ni birga yuboramiz: eski (login'dan oldingi) xato yangi
      // sessiyani invalidatsiya qilmasligi kerak.
      window.dispatchEvent(
        new CustomEvent("designora-session-invalidated", {
          detail: { epoch: epochAtStart },
        })
      );
    }
  }
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
