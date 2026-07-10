const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function globalSearch(query, types) {
  const params = new URLSearchParams({ q: query, limit: "12" });
  if (types?.length) params.set("types", types.join(","));
  const response = await fetch(`${API_URL}/api/discovery/global-search?${params}`);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail || "Qidiruvni bajarib bo‘lmadi");
  return payload;
}
