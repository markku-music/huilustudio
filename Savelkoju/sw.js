'use strict';

const CACHE_NAME = 'savelkoju-pwa-v4';
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./audio-manager.js",
  "./microphone-engine.js",
  "./scoreboard.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./Lamppu.wav",
  "./Sirkusmusa.wav",
  "./Infovideo.mp4",
  "./taso_1_ensissavelet.jpg",
  "./taso_2_tasapainotemppu.jpg",
  "./taso_3_sormisirkus.jpg"
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
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Firebase ja muut ulkoiset resurssit jätetään selaimen/verkon hoidettaviksi.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }

        throw new Error('Offline eikä resurssia löytynyt välimuistista.');
      })
  );
});
