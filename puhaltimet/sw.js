const CACHE='aaninaeyte-dev-0.3.21-ui-lab';
const ASSETS=['./','index.html','manifest.webmanifest','kalibrointi_tausta.webp','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','instruments/huilu.png','instruments/klarinetti.png','instruments/saksofoni.png','instruments/oboe.png','instruments/fagotti.png','instruments/trumpetti.png','instruments/alttotorvi.png','instruments/kayratorvi.png','instruments/pasuuna.png','instruments/tuuba.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})
