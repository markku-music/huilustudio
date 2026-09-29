/* Consume existing engine events; do not add work to pitch recognition. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 let current=null,unlisten=()=>{},noise=null,gate=null,measuring=false,lastPaint=-Infinity;
 function db(rms){
  if(rms===null||!Number.isFinite(rms)||rms<0)return '—';
  if(rms===0)return '−∞ dBFS';
  return (20*Math.log10(rms)).toFixed(1).replace('-', '−').replace('.', ',')+' dBFS';
 }
 function render(){
  $('noiseDbValue').textContent=db(noise);
  $('gateDbValue').textContent=db(gate);
  $('noiseReadoutHint').textContent=measuring?'Mitataan pohjakohinaa. Ole hiljaa hetki…':noise===null?'Avaa mikrofoni, niin pohjakohina mitataan. Pienempi kohinaraja tekee tunnistuksesta herkemmän.':gate<=0.0001*(1+1e-9)?'Vähimmäiskynnys −80 dBFS on käytössä. dBFS kuvaa mikrofonisignaalin digitaalista tasoa.':'Kohinarajan säätö päivittää tunnistuskynnyksen heti. dBFS kuvaa mikrofonisignaalin digitaalista tasoa.';
 }
 function clear(){noise=gate=null;measuring=false;lastPaint=-Infinity;render();}
 window.noiseDisplay={
  attach(engine){
   unlisten();current=engine;clear();
   const handlers={
    calibrationprogress(event){
     if(current!==engine)return;
     measuring=true;noise=event.detail.noiseRms;gate=null;
     const now=performance.now();
     if(now-lastPaint<100&&event.detail.progress<1)return;
     lastPaint=now;render();
     $('status').textContent='Mittaa pohjakohinaa · '+db(noise)+' · '+Math.round(event.detail.progress*100)+' % — ole hiljaa hetki…';
    },
    thresholdchange(event){
     if(current!==engine||measuring||noise===null)return;
     noise=event.detail.noiseRms;gate=event.detail.gate;render();
    },
    state(event){
     if(current!==engine)return;
     if(event.detail.state==='calibrating'){measuring=true;noise=gate=null;render();}
     if(event.detail.state==='running'){
      measuring=false;noise=event.detail.noiseRms??null;gate=event.detail.gate??null;render();
     }
     if(event.detail.state==='stopped')clear();
    }
   };
   for(const [type,handler] of Object.entries(handlers))engine.addEventListener(type,handler);
   unlisten=()=>{for(const [type,handler] of Object.entries(handlers))engine.removeEventListener(type,handler);};
  }
 };
})();
