  (()=>{
    const banner=document.getElementById('pwaUpdateBanner');
    const updateButton=document.getElementById('pwaUpdateButton');
    let baselineIndexHash='';
    let checking=false;

    async function sha256(text){
      if(!window.crypto?.subtle)return String(text.length)+':'+text.slice(0,80);
      const bytes=new TextEncoder().encode(text);
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
    }

    async function fetchIndexHash(){
      const url=new URL('./index.html',location.href);
      url.searchParams.set('__pwa_check',Date.now().toString());
      const response=await fetch(url,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      if(!response.ok)throw new Error('Update check failed');
      return sha256(await response.text());
    }

    async function checkForUpdate({setBaseline=false}={}){
      if(checking||!navigator.onLine)return;
      checking=true;
      try{
        const hash=await fetchIndexHash();
        if(setBaseline||!baselineIndexHash){baselineIndexHash=hash;return}
        if(hash!==baselineIndexHash)banner.hidden=false;
      }catch{}
      finally{checking=false}
    }

    async function registerPwa(){
      if(!('serviceWorker' in navigator))return;
      try{
        const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
        registration.update().catch(()=>{});
      }catch(error){console.warn('PWA service worker registration failed',error)}
    }

    updateButton?.addEventListener('click',async()=>{
      updateButton.disabled=true;
      updateButton.textContent='Päivitetään…';
      try{
        const registration=await navigator.serviceWorker?.getRegistration?.('./');
        registration?.update?.().catch(()=>{});
      }catch{}
      location.reload();
    });

    window.addEventListener('online',()=>checkForUpdate());
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')resetTransientWritePointers();else checkForUpdate()});
    window.addEventListener('load',async()=>{
      await registerPwa();
      await checkForUpdate({setBaseline:true});
      setInterval(()=>checkForUpdate(),5*60*1000);
    },{once:true});
  })();
  
