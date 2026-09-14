const CACHE='pong-yhteispeli-v5.20';
const APP_FILES=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/Summer.mp3",
  "./assets/child_court_bg.webp",
  "./assets/tennis_ball_blue.webp",
  "./assets/tennis_ball_red.webp",
  "./assets/tennis_ball_yellow.webp",
  "./assets/tennis_bg_full_ipad.webp",
  "./assets/tennisball_hit.wav"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request, {ignoreSearch:true})
      .then(cached => cached || fetch(event.request).then(response => {
        if(response && response.status === 200 && response.type === 'basic'){
          const copy=response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }))
      .catch(() => caches.match('./index.html'))
  );
});
