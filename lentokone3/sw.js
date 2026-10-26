// Välimuisti kuuluu vain tämän peliasennuksen URL-polulle.
const CACHE_PREFIX='lentokone:'+self.registration.scope+':';
const CACHE_NAME=CACHE_PREFIX+'6.4.1';
const SCOPE_URL=new URL(self.registration.scope);
const INDEX_URL=new URL('index.html',SCOPE_URL).href;
const APP_SHELL = [
  './',
  './index.html',
  './sw.js',
  './app/manifest.webmanifest',
  './app/css/app.css',
  './app/js/audio-data.js',
  './app/js/app.js',
  './app/js/resonator-engine.js',
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
  './app/assets/images/valikko_valinnat.webp',
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
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function cacheSuccessfulResponse(cache, request, response) {
  if(response?.status === 200 && response.type !== 'opaque') {
    try { await cache.put(request, response.clone()); }
    catch(error) { console.warn('Pelin välimuistiin tallennus epäonnistui:',error); }
  }
  return response;
}

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url=new URL(event.request.url);
  if(url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return;

  event.respondWith((async () => {
    const cache=await caches.open(CACHE_NAME);
    if(event.request.mode === 'navigate') {
      try {
        return await cacheSuccessfulResponse(cache,INDEX_URL,await fetch(event.request));
      } catch(error) {
        const cached=await cache.match(INDEX_URL);
        if(cached) return cached;
        throw error;
      }
    }
    const cached=await cache.match(event.request);
    if(cached) return cached;
    return cacheSuccessfulResponse(cache,event.request,await fetch(event.request));
  })());
});
