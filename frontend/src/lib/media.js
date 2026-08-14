const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export function resolveMediaUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return API_URL
    ? `${API_URL}${value.startsWith("/") ? value : `/${value}`}`
    : value;
}
