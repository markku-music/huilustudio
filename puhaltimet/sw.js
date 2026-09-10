const CACHE='puhaltimet-0.2.9-aanimuisti-toggle-clean';
const ASSETS=['./','index.html','manifest.webmanifest','opensheetmusicdisplay.min.js','sample_button.webp','icons/icon-192.png','icons/icon-512.png','icons/icon-512-maskable.png','icons/apple-touch-icon.png','instruments/huilu.webp','instruments/klarinetti.webp','instruments/saksofoni.webp','instruments/oboe.webp','instruments/fagotti.webp','instruments/trumpetti.webp','instruments/alttotorvi.webp','instruments/kayratorvi.webp','instruments/pasuuna.webp','instruments/tuuba.webp'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE && (key.startsWith('puhaltimet-')||key.startsWith('aaninaeyte-')||key.startsWith('aaninaeyte-dev-'))).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request;

  // Sivun avaus/navigointi: verkko ensin. Näin GitHub Pagesin uusi index.html
  // tulee käyttöön heti uuden deployn jälkeen. Offline-tilassa käytetään nykyistä cachea.
  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request,{cache:'no-store'})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put('index.html',copy)).catch(()=>{});
          return response;
        })
        .catch(()=>caches.open(CACHE).then(cache=>cache.match('index.html')).then(r=>r||Response.error()))
    );
    return;
  }

  // Muut assetit: käytä vain tämän version omaa cachea, ei kaikkia vanhoja cacheja.
  event.respondWith(
    caches.open(CACHE).then(cache=>cache.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response && response.ok){cache.put(request,response.clone()).catch(()=>{});}
      return response;
    })))
  );
});
