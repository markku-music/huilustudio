const CACHE_NAME = 'puhallinstartti-v23-scoreboard-final-v2-reticle';
const ASSETS = [
  "./",
  "./index.html",
  "./Lamppu.wav",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-192.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/themes/classic/background.webp",
  "./assets/themes/classic/cover_disabled.webp",
  "./assets/themes/classic/empty.webp",
  "./assets/themes/classic/notes/A.webp",
  "./assets/themes/classic/notes/B.webp",
  "./assets/themes/classic/notes/C.webp",
  "./assets/themes/classic/notes/D.webp",
  "./assets/themes/classic/notes/E.webp",
  "./assets/themes/classic/notes/Es.webp",
  "./assets/themes/classic/notes/F.webp",
  "./assets/themes/classic/notes/G.webp",
  "./assets/themes/classic/notes/H.webp",
  "./assets/themes/concert/background.webp",
  "./assets/themes/concert/cover_disabled.webp",
  "./assets/themes/concert/empty.webp",
  "./assets/themes/concert/notes/A.webp",
  "./assets/themes/concert/notes/B.webp",
  "./assets/themes/concert/notes/C.webp",
  "./assets/themes/concert/notes/D.webp",
  "./assets/themes/concert/notes/E.webp",
  "./assets/themes/concert/notes/Es.webp",
  "./assets/themes/concert/notes/F.webp",
  "./assets/themes/concert/notes/G.webp",
  "./assets/themes/concert/notes/H.webp",
  "./assets/themes/kids/background.webp",
  "./assets/themes/kids/cover_disabled.webp",
  "./assets/themes/kids/empty.webp",
  "./assets/themes/kids/notes/A.webp",
  "./assets/themes/kids/notes/B.webp",
  "./assets/themes/kids/notes/C.webp",
  "./assets/themes/kids/notes/D.webp",
  "./assets/themes/kids/notes/E.webp",
  "./assets/themes/kids/notes/Es.webp",
  "./assets/themes/kids/notes/F.webp",
  "./assets/themes/kids/notes/G.webp",
  "./assets/themes/kids/notes/H.webp",
  "./audio-manager.js",
  "./firestore.rules",
  "./index.html",
  "./manifest.webmanifest",
  "./resonator-engine.js",
  "./scoreboard.js",
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const copy = response.clone();
        if (request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
