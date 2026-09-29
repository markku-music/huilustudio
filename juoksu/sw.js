const CACHE = 'asteikkospurtti-pwa-v4';
const ASSETS = ["./monster.js", "./assets/monster-sheet.png", "./", "./pwa.js", "./game.js", "./race-score.js", "./finish-bubble.js", "./manifest.webmanifest", "./responsive.css", "./app.css", "./hyvaksytyt-asetukset.json", "./scales.js", "./responsive.js", "./resonator-engine.js", "./score-display.js", "./index.html", "./app-ui.js", "./icons/icon-512.png", "./icons/icon-192.png", "./assets/runner-sheet.png", "./assets/park-background.png", "./assets/finish-line.webp", "./vendor/osmd/opensheetmusicdisplay.min.js", "./vendor/osmd/LICENSE"];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('asteikkospurtti-pwa-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
 if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
 event.respondWith(fetch(event.request).then(response => {
   if (response.ok) {const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
   return response;
 }).catch(async () => (await caches.match(event.request)) || (event.request.mode === 'navigate' ? await caches.match('./index.html') : Response.error())));
});
