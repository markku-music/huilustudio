const CACHE_NAME = 'f0-engine-pwa-v21-responsive-score';

const APP_SHELL = [
  './',
  './index.html',
  './f0-engine.js',
  './instrument-controller.js',
  './audio-engine.js',
  './opensheetmusicdisplay.min.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './instruments/huilu.png',
  './instruments/oboe.png',
  './instruments/klarinetti.png',
  './instruments/alttosaksofoni.png',
  './instruments/fagotti.png',
  './instruments/kayratorvi.png',
  './instruments/trumpetti.png',
  './instruments/alttotorvi.png',
  './instruments/pasuuna.png',
  './instruments/tuuba.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
