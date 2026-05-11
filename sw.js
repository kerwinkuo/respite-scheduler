const cacheName = "respite-scheduler-v3";
const appShell = [
  "./",
  "./index.html",
  "./respite-scheduler.html",
  "./scheduler-core.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(appShell))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== cacheName).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => (
      cached || fetch(event.request).catch(() => caches.match("./index.html"))
    ))
  );
});

