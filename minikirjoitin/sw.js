const CACHE = 'huilukaverit-osmd-1.21';
const LOCAL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/huilukaverit_bg.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/opensheetmusicdisplay.min.js',
  './assets/audio-engine.js',
  './assets/fingering-D.svg',
  './assets/fingering-C.svg',
  './assets/fingering-H.svg',
  './assets/fingering-A.svg',
  './assets/fingering-G.svg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(LOCAL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
      return response;
    }))
  );
});
