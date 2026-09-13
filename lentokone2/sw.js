const CACHE_NAME = 'lentokone-pwa-base-6.3.2-ipad-harmonic-rearm';
const APP_SHELL = [
  './',
  './index.html',
  './sw.js',
  './app/manifest.webmanifest',
  './app/css/app.css',
  './app/js/audio-data.js',
  './app/js/app.js',
  './app/assets/images/lentokone_sivu.webp',
  './app/assets/images/pilvi_levea.webp',
  './app/assets/images/pilvi_keski.webp',
  './app/assets/images/pilvi_iso.webp',
  './app/assets/images/kerattava_kolikko.webp',
  './app/assets/images/kerattava_timantti.webp',
  './app/assets/images/kerattava_aarrearkku.webp',
  './app/assets/images/este_lehma.webp',
  './app/assets/images/este_kivi.webp',
  './app/assets/images/este_pyorre.webp',
  './app/assets/images/soitin_huilu.webp',
  './app/assets/images/ohje_huilu.png',
  './app/assets/icons/icon-192.png',
  './app/assets/icons/icon-512.png',
  './app/assets/icons/icon-maskable-512.png',
  './app/assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Navigoinnissa verkko ensin: PWA saa uuden index.html:n heti kun verkko toimii.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
        }
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Staattiset tiedostot cache-first, jotta peli toimii nopeasti ja offline.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
