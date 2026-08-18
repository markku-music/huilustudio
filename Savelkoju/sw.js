'use strict';

// Sävelkoju PWA: ei sovellustiedostojen välimuistia.
// Service Worker säilytetään PWA-kontekstia ja päivityksiä varten,
// mutta kaikki saman originin GET-pyynnöt haetaan aina verkosta.

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.toLowerCase().startsWith('savelkoju-pwa-'))
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Firebase ja muut ulkoiset resurssit jätetään niiden oman verkkologiikan hoidettaviksi.
  if (url.origin !== self.location.origin) return;

  // Network-only: ei Cache APIa eikä selaimen normaalia HTTP-cachea tähän pyyntöön.
  event.respondWith(fetch(request, { cache: 'no-store' }));
});
