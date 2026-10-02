const PREFIX='sukellusmeri-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+'v21';
const FILES=[
  'index.html','style.css','app.js','renderer.js','journey.js','stations.js','settings.js',
  'voyage.js','music.js','selection.js','encounters.js','resonator-engine.js','note-stability.js',
  'microphone.js','pwa.js','manifest.webmanifest','icons/icon.svg','icons/icon-192.png',
  'icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png',
  'assets/meri-1.png','assets/meri-2.png','assets/meri-3.png','assets/meri-4.png','assets/meri-5.png','assets/meri-6.png',
  'assets/telakka-lahto.webp','assets/telakka-paluu.webp','assets/sukellusvene.webp',
  'assets/pearl.webp','assets/mine.webp','assets/fuel.webp'
];
const URLS=FILES.map(file=>new URL(file,self.registration.scope).href),KNOWN=new Set(URLS);
const INDEX=new URL('index.html',self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const responses=await Promise.all(URLS.map(async url=>{
    const response=await fetch(new Request(url,{cache:'reload',credentials:'same-origin'}));
    const type=response.headers.get('content-type')||'';
    const path=new URL(url).pathname;
    const valid=path.endsWith('.html')?type.includes('text/html'):
      /\.(png|webp|svg)$/.test(path)?type.startsWith('image/'):
      path.endsWith('.js')?/javascript/.test(type):path.endsWith('.css')?type.includes('text/css'):/json/.test(type);
    if(!response.ok||response.redirected||!valid)throw new Error('Offline-tiedostoa ei voitu ladata: '+path);
    return response;
  }));
  const cache=await caches.open(CACHE);
  await Promise.all(URLS.map((url,i)=>cache.put(url,responses[i])));
  // An update waits until the player chooses it or closes the old app.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith(PREFIX)&&name!==CACHE).map(name=>caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),plain=url.origin+url.pathname;
  const key=plain===self.registration.scope?INDEX:plain;
  if(!KNOWN.has(key))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),saved=await cache.match(key);
    return saved||fetch(event.request);
  })());
});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')event.waitUntil(self.skipWaiting());});
