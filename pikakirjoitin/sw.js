const CACHE_NAME = 'pikakirjoitin-offline-v1.1.42-tahtilaji-svg';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './vendor/osmd/opensheetmusicdisplay.min.js',
  './vendor/pdf-lib/pdf-lib.min.js',
  './vendor/pdf-lib/LICENSE.md',
  './assets/clef-alto.svg',
  './assets/clef-bass.svg',
  './assets/clef-treble.svg',
  './assets/dotted-quarter-note.svg',
  './assets/double-crochet.svg',
  './assets/1_4_dot.svg',
  './assets/1_4_double_dot.svg',
  './assets/1_16_note.svg',
  './assets/1_16_rest.svg',
  './assets/1_32_note.svg',
  './assets/1_32_rest.svg',
  './assets/Common_time.svg',
  './assets/Alla_breve.svg',
  './assets/ending-1.svg',
  './assets/ending-2.svg',
  './assets/pickup-dotted-half.svg',
  './assets/pickup-dotted-quarter.svg',
  './assets/pickup-eighth.svg',
  './assets/pickup-half.svg',
  './assets/pickup-quarter.svg',
  './assets/repeat.svg',
  './assets/rest.svg',
  './assets/slur.svg',
  './assets/tie.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map(async path=>{
      try{
        const response=await fetch(new Request(path,{cache:'reload'}));
        if(response.ok)await cache.put(path,response.clone());
      }catch{}
    }));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response && response.ok)await cache.put(request,response.clone());
    return response;
  }catch(error){
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
    if(request.mode==='navigate'){
      const fallback=await cache.match('./index.html');
      if(fallback)return fallback;
    }
    throw error;
  }
}

self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(networkFirst(request));
});
