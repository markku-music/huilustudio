const CACHE_PREFIX='puhaltimet-';
const CACHE='puhaltimet-0.1.4-instrument-refresh';
const ASSETS=['./','index.html','manifest.webmanifest','opensheetmusicdisplay.min.js','sample_button.webp','icons/icon-192.png','icons/icon-512.png','icons/icon-512-maskable.png','icons/apple-touch-icon.png','instruments/huilu.webp','instruments/klarinetti.webp','instruments/saksofoni.webp','instruments/oboe.webp','instruments/fagotti.webp','instruments/trumpetti.webp','instruments/alttotorvi.webp','instruments/kayratorvi.webp','instruments/pasuuna.webp','instruments/tuuba.webp'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
    return response;
  })));
});
