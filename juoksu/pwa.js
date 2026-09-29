/* Manual refresh fetches the full app before replacing the current page.
 * Saved settings and records are in localStorage and are never cleared. */
(() => {
 'use strict';
 const button=document.getElementById('reloadGame');
 const notice=document.getElementById('reloadNotice');
 let registrationTask=null,busy=false;
 function register(){
  if(!registrationTask){
   registrationTask=navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'})
    .catch(error=>{registrationTask=null;throw error;});
  }
  return registrationTask;
 }
 const supported='serviceWorker' in navigator&&window.isSecureContext;
 if(supported)window.addEventListener('load',()=>register().catch(error=>console.warn('Offline-tallennus ei onnistunut:',error)));
 function tell(text){notice.textContent=text;notice.hidden=false;}
 function waitInstalled(worker){
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>done(new Error('Asennus viivästyi.')),35000);
   const check=()=>{
    if(['installed','activating','activated'].includes(worker.state))done();
    else if(worker.state==='redundant')done(new Error('Päivitys ei asentunut.'));
   };
   function done(error){clearTimeout(timer);worker.removeEventListener('statechange',check);error?reject(error):resolve();}
   worker.addEventListener('statechange',check);check();
  });
 }
 function refreshFiles(worker){
  return new Promise((resolve,reject)=>{
   const channel=new MessageChannel();
   const timer=setTimeout(()=>done(new Error('Lataus viivästyi.')),45000);
   function done(error){clearTimeout(timer);channel.port1.close();error?reject(error):resolve();}
   channel.port1.onmessage=event=>event.data?.ok?done():done(new Error('Lataus epäonnistui.'));
   try{worker.postMessage({type:'REFRESH_APP'},[channel.port2]);}catch(error){done(error);}
  });
 }
 function waitController(worker){
  return new Promise((resolve,reject)=>{
   const sw=navigator.serviceWorker;
   const timer=setTimeout(()=>done(new Error('Päivitys ei aktivoitunut.')),15000);
   const check=()=>{if(sw.controller===worker)done();};
   function done(error){clearTimeout(timer);sw.removeEventListener('controllerchange',check);error?reject(error):resolve();}
   sw.addEventListener('controllerchange',check);check();
  });
 }
 button.addEventListener('click',async()=>{
  if(busy)return;
  if(!supported){tell('Avaa peli HTTPS-osoitteesta tai localhost-palvelimelta, jotta verkkopäivitys toimii.');return;}
  if(navigator.onLine===false){tell('Päivitys tarvitsee verkkoyhteyden. Yhdistä verkkoon ja yritä uudelleen.');return;}
  busy=true;button.disabled=true;button.setAttribute('aria-busy','true');tell('Haetaan peliä uudelleen verkosta…');
  let timeout;
  const deadline=new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Päivitys viivästyi.')),60000);});
  try{
   await Promise.race([(async()=>{
    const registration=await register();
    await registration.update();
    if(registration.installing)await waitInstalled(registration.installing);
    const worker=registration.waiting||registration.active;
    if(!worker)throw new Error('Päivitystä ei löytynyt.');
    await refreshFiles(worker);
    await waitController(worker);
   })(),deadline]);
   tell('Peli päivitetty. Avataan uudelleen…');
   window.location.reload();
  }catch(error){
   console.warn('Pelin verkkopäivitys:',error);
   tell('Päivitys ei onnistunut. Tarkista verkkoyhteys ja yritä uudelleen. Nykyinen peli on edelleen käytettävissä.');
  }finally{
   clearTimeout(timeout);busy=false;button.disabled=false;button.removeAttribute('aria-busy');
  }
 });
})();
