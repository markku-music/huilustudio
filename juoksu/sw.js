/* Versioned, app-scoped snapshot. Explicit refresh bypasses HTTP caches. */
const CACHE_PREFIX='asteikkospurtti-pwa-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=CACHE_PREFIX+'v10-reactions';
const ASSETS=["./runner-reactions.js", "./assets/runner-reactions.png", "./noise-display.js", "./monster.js", "./assets/monster-sheet.png", "./", "./pwa.js", "./game.js", "./race-score.js", "./finish-bubble.js", "./manifest.webmanifest", "./responsive.css", "./app.css", "./hyvaksytyt-asetukset.json", "./scales.js", "./responsive.js", "./resonator-engine.js", "./score-display.js", "./index.html", "./app-ui.js", "./icons/icon-512.png", "./icons/icon-192.png", "./assets/runner-sheet.png", "./assets/park-background.png", "./assets/finish-line.webp", "./vendor/osmd/opensheetmusicdisplay.min.js", "./vendor/osmd/LICENSE"];
const INDEX=new URL('./index.html',self.registration.scope).href;
const URLS=[...new Set(ASSETS.map(path=>new URL(path==='./'?'./index.html':path,self.registration.scope).href))];
const KNOWN=new Set(URLS);
let refreshTask=null;
async function downloadApp(){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),30000);
 const nonce=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 try{
  // Fully consume each body before touching the working offline snapshot.
  return await Promise.all(URLS.map(async canonical=>{
   const fresh=new URL(canonical);fresh.searchParams.set('__refresh',nonce);
   const response=await fetch(fresh.href,{cache:'no-store',credentials:'same-origin',signal:controller.signal});
   if(!response.ok)throw new Error('App file download failed: '+response.status);
   await response.clone().arrayBuffer();
   return [canonical,response];
  }));
 }catch(error){controller.abort();throw error;}finally{clearTimeout(timer);}
}
async function storeApp(entries){
 const cache=await caches.open(CACHE);
 await Promise.all(entries.map(([url,response])=>cache.put(url,response)));
}
self.addEventListener('install',event=>event.waitUntil(downloadApp().then(storeApp)));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 // Never remove another folder's app, or shared legacy caches.
 await Promise.all(names.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE).map(name=>caches.delete(name)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(event.data?.type!=='REFRESH_APP')return;
 const port=event.ports?.[0];
 if(!port||!event.source?.url?.startsWith(self.registration.scope))return;
 if(!refreshTask)refreshTask=downloadApp().then(storeApp).finally(()=>{refreshTask=null;});
 event.waitUntil(refreshTask.then(async()=>{
  await self.skipWaiting();
  port.postMessage({ok:true});
 }).catch(()=>port.postMessage({ok:false})));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 const plain=url.origin+url.pathname;
 const key=plain===self.registration.scope?INDEX:plain;
 if(!KNOWN.has(key))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const saved=await cache.match(key);
  if(saved)return saved;
  // This fallback is only for a missing cache entry, such as after eviction.
  const response=await fetch(new Request(event.request,{cache:'reload'}));
  if(response.ok){const copy=response.clone();event.waitUntil(cache.put(key,copy));}
  return response;
 })());
});
