const VERSION = "designora-v330";
const SHELL = ["/", "/manifest.webmanifest", "/favicon.svg", "/brand.css"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => { caches.open(VERSION).then((cache) => cache.put(request, response.clone())); return response; }).catch(() => caches.match(request).then((cached) => cached || caches.match("/"))));
    return;
  }
  event.respondWith(caches.open(VERSION).then(async (cache) => {
    const cached = await cache.match(request);
    const refresh = fetch(request).then((response) => { if (response.ok) cache.put(request, response.clone()); return response; });
    return cached || refresh;
  }));
});
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_LESSON") return;
  const urls = (event.data.urls || []).filter((url) => !url.includes("/api/") && !/\.(mp4|m3u8|mpd|webm)(\?|$)/.test(url));
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(urls)));
});
