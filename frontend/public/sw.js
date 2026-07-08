// Designora service worker — sodda va xavfsiz strategiya (FBosqich 6, PWA).
//
// - App shell (statik build fayllari) o'rnatishda emas, ishlatilganda cache'lanadi.
// - Navigatsiya (HTML) so'rovlari: network-first, tarmoq bo'lmasa cache/offline.
// - Boshqa GET so'rovlar (JS/CSS/rasm): stale-while-revalidate.
// - API so'rovlari (/api/...) hech qachon cache'lanmaydi.

const CACHE = "designora-v1";
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Faqat GET; boshqa metodlarga aralashmaymiz.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // API va boshqa origin'lar — to'g'ridan-to'g'ri tarmoqqa.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // HTML navigatsiya — network-first, offline'da cache yoki bosh sahifa.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Statik resurslar — stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
