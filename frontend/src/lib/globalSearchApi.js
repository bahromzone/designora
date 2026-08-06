import { request } from "./request";

export async function globalSearch(query, types) {
  const params = new URLSearchParams({ q: query, limit: "12" });
  if (types?.length) params.set("types", types.join(","));
  return request(`/api/discovery/global-search?${params}`);
}
