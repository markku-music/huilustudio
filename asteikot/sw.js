// One complete offline copy per installation folder. Other apps keep their caches.
const CACHE_PREFIX = 'resonator-osmd-pwa-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE_NAME = CACHE_PREFIX + 'v1-icon-20260929';
const APP_SHELL = [
  './index.html',
  './pwa.js',
  './score-editor.js',
  './score-editor.css',
  './score-display.js',
  './note-stability.js',
  './resonator-engine.js',
  './vendor/osmd/opensheetmusicdisplay.min.js',
  './manifest.webmanifest',
  './hyvaksytyt-asetukset.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];
const URLS = APP_SHELL.map(path => new URL(path, self.registration.scope).href);
const KNOWN = new Set(URLS);
const INDEX = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // addAll commits only if every app file downloads successfully.
    await cache.addAll(URLS.map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const plain = url.origin + url.pathname;
  const key = plain === self.registration.scope ? INDEX : plain;
  if (!KNOWN.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const saved = await cache.match(key);
    if (saved) return saved;
    const response = await fetch(new Request(event.request, { cache: 'reload' }));
    if (response.ok) event.waitUntil(cache.put(key, response.clone()));
    return response;
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
