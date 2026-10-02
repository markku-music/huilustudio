(() => {
  'use strict';
  const install=document.getElementById('install-app'),update=document.getElementById('update-app');
  const status=document.getElementById('offline-status');
  let prompt=null,registration=null,reloading=false;
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;install.hidden=false;});
  window.addEventListener('appinstalled',()=>{prompt=null;install.hidden=true;});
  install.addEventListener('click',async()=>{
    if(!prompt)return;
    const event=prompt;prompt=null;install.hidden=true;
    await event.prompt();await event.userChoice;
  });
  update.addEventListener('click',()=>{
    if(!registration?.waiting)return;
    reloading=true;registration.waiting.postMessage('SKIP_WAITING');
  });
  if(!('serviceWorker' in navigator)||!window.isSecureContext){
    status.textContent='Asennus ja mikrofoni vaativat HTTPS-osoitteen tai localhost-palvelimen.';return;
  }
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)window.location.reload();});
  window.addEventListener('load',async()=>{
    try{
      registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
      const check=()=>{
        update.hidden=!registration.waiting;
        status.textContent=registration.waiting?'Uusi versio on valmis asennettavaksi.':registration.active?'Peli on käytettävissä myös ilman verkkoyhteyttä.':'Tallennetaan peliä offline-käyttöä varten…';
      };
      const watch=()=>registration.installing?.addEventListener('statechange',check);
      registration.addEventListener('updatefound',()=>{watch();check();});watch();check();
      navigator.serviceWorker.ready.then(check);
    }catch{status.textContent='Offline-tallennus ei onnistunut. Voit jatkaa pelaamista verkkoyhteydellä.';}
  });
})();
