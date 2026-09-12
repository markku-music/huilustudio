const CACHE='viulukielet-dev-3.1';
const ASSETS=[
  './manifest.webmanifest',
  './icon.svg',
  './assets/viulu.png',
  './assets/karhu_G.webp',
  './assets/isa_D.webp',
  './assets/aiti_A.webp',
  './assets/lintu_E.webp'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    // Päivitä myös jo avoinna oleva vanha näkymä heti uuden SW:n aktivoiduttua.
    const openClients = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    await Promise.all(openClients.map(client => client.navigate(client.url).catch(() => null)));
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // HTML/navigointi aina ensisijaisesti verkosta, jotta uusi versio ei jää
  // vanhan service workerin cache-first -strategian taakse.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache:'no-store' });
        return fresh;
      } catch {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Staattiset assetit: verkko ensin, onnistunut vastaus päivittää välimuistin.
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache:'no-store' });
      if (fresh && fresh.ok && new URL(req.url).origin === self.location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch {
      return (await caches.match(req)) || Response.error();
    }
  })());
});
