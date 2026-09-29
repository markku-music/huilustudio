// Vaihda VERSION aina, kun julkaiset uuden paketin.
const VERSION = '0.7.41';
// Jokaisella sovelluskansiolla on oma välimuisti.
const PREFIX = 'nuottiseikkailu-pwa:' + encodeURIComponent(self.registration.scope) + ':';
const CACHE = PREFIX + VERSION;
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './app/style.css', './app/pwa.css', './app/pwa.js',
  './app/notes.js', './app/app.js', './app/staff-sparkles.js', './app/tuner.js',
  './app/burst-sounds.js', './app/short-sound.js', './app/burst-audio.js',
  './app/calibration-view.js', './app/settings.js', './app/game-core.js',
  './app/resonator-engine.js', './app/note-stability.js',
  './assets/instruments/flute.png', './assets/instruments/clarinet.png',
  './assets/instruments/sax.png', './assets/instruments/trumpet.png',
  './assets/instruments/trombone.png',
  './assets/concert.webp', './assets/fun.webp', './assets/home.webp',
  './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png',
  './assets/apple-touch-icon.png', './assets/icon-maskable-512.png',
  './assets/sounds/liianLyhyt.wav', './assets/sounds/poks-1.wav',
  './assets/sounds/poks-2.wav', './assets/sounds/poks-3.wav',
  './assets/sounds/poks-4.wav', './assets/sounds/poks-5.wav',
  './asetukset/Nuottiseikkailu_asetukset.json'
];
const ASSETS = new Set(FILES.map(path => new URL(path, self.registration.scope).href));
const HOME = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  // Vasta kokonaan ladattu julkaisu voidaan ottaa käyttöön.
  event.waitUntil(caches.open(CACHE).then(cache =>
    cache.addAll(FILES.map(path => new Request(new URL(path, self.registration.scope), {cache: 'reload'})))
  ));
  // Päivitys jää odottamaan, kun sovellus on auki.
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      !url.href.startsWith(self.registration.scope)) return;
  const isHome = request.mode === 'navigate' &&
    (url.pathname === new URL(self.registration.scope).pathname || url.pathname === new URL(HOME).pathname);
  if (!isHome && !ASSETS.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(isHome ? HOME : request);
    // Nopea käynnistys myös huonolla yhteydellä; tiedostot samasta julkaisusta.
    return cached || fetch(request);
  }));
});
