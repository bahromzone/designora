import { offlineStore } from "./offlineStore";

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function syncOffline(token) {
  const mutations = await offlineStore.pending();
  if (!mutations.length) return { synced: 0, conflicts: 0, results: [] };

  const response = await fetch(`${API}/api/offline-sync/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations }),
  });
  if (!response.ok) throw new Error("Offline sync bajarilmadi");

  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];
  for (const item of results) {
    if (item.status === "applied" || item.duplicate) await offlineStore.remove(item.client_id);
  }
  return { synced: data.synced ?? 0, conflicts: data.conflicts ?? 0, results };
}

export function registerOfflineSync(token, onResult, onError = () => {}) {
  const run = () => {
    if (!navigator.onLine) return Promise.resolve(null);
    return syncOffline(token).then(onResult).catch(onError);
  };
  window.addEventListener("online", run);
  run();
  return () => window.removeEventListener("online", run);
}
