const CACHE='viulukielet-dev-2.6';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./assets/viulu.png','./assets/karhu_G.webp','./assets/isa_D.webp','./assets/aiti_A.webp','./assets/lintu_E.webp'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
