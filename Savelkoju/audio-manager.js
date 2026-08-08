(()=>{
'use strict';

class SavelkojuAudioManager {
  constructor(files){
    this.files=files;
    this.ctx=null;
    this.buffers=new Map();
    this.loading=new Map();
    this.finaleSource=null;
  }

  ensureContext(){
    if(!this.ctx){
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx) throw new Error('Web Audio API ei ole käytettävissä.');
      this.ctx=new Ctx();
    }
    return this.ctx;
  }

  async unlock(){
    const ctx=this.ensureContext();

    // iOS/iPadOS Safari: resume täytyy tapahtua suoraan käyttäjän eleestä.
    if(ctx.state==='suspended'){
      await ctx.resume();
    }

    // Soitetaan myös yhden näytteen hiljainen bufferi samassa käyttäjäeleessä.
    // Tämä vahvistaa Web Audion avauksen vanhemmissa iOS-versioissa.
    try{
      const buffer=ctx.createBuffer(1,1,ctx.sampleRate);
      const source=ctx.createBufferSource();
      const gain=ctx.createGain();
      gain.gain.value=0;
      source.buffer=buffer;
      source.connect(gain).connect(ctx.destination);
      source.start(0);
    }catch(e){
      console.warn('Audio unlock pulse:',e);
    }

    return ctx;
  }

  async loadOne(key){
    if(this.buffers.has(key)) return this.buffers.get(key);
    if(this.loading.has(key)) return this.loading.get(key);

    const promise=(async()=>{
      const ctx=this.ensureContext();
      const url=this.files[key];
      if(!url) throw new Error('Tuntematon ääni: '+key);

      const response=await fetch(url,{cache:'force-cache'});
      if(!response.ok) throw new Error('Äänitiedostoa ei voitu ladata: '+url);
      const arrayBuffer=await response.arrayBuffer();

      // Slice suojaa selaimia, jotka käsittelevät decodeAudioData:ssa
      // alkuperäistä ArrayBufferia omistavasti.
      const audioBuffer=await ctx.decodeAudioData(arrayBuffer.slice(0));
      this.buffers.set(key,audioBuffer);
      return audioBuffer;
    })();

    this.loading.set(key,promise);
    try{
      return await promise;
    }finally{
      this.loading.delete(key);
    }
  }

  preload(){
    return Promise.allSettled(Object.keys(this.files).map(key=>this.loadOne(key)));
  }

  async ready(){
    await this.preload();
  }

  playBuffer(buffer,{volume=1,loop=false}={}){
    const ctx=this.ensureContext();
    if(ctx.state==='suspended'){
      // Jos selain on keskeyttänyt kontekstin taustalle siirtymisen jälkeen,
      // yritetään jatkaa. Tämä ei korvaa ensimmäistä käyttäjäele-unlockia.
      ctx.resume().catch(()=>{});
    }

    const source=ctx.createBufferSource();
    const gain=ctx.createGain();
    gain.gain.value=volume;
    source.buffer=buffer;
    source.loop=loop;
    source.connect(gain).connect(ctx.destination);
    source.start(0);
    return source;
  }

  playHit(){
    const buffer=this.buffers.get('hit');
    if(!buffer) return;
    this.playBuffer(buffer,{volume:1});
  }

  playFinale(){
    this.stopFinale();
    const buffer=this.buffers.get('finale');
    if(!buffer) return;
    this.finaleSource=this.playBuffer(buffer,{volume:1});
    this.finaleSource.addEventListener?.('ended',()=>{
      this.finaleSource=null;
    });
  }

  stopFinale(){
    if(this.finaleSource){
      try{ this.finaleSource.stop(); }catch(e){}
      try{ this.finaleSource.disconnect(); }catch(e){}
      this.finaleSource=null;
    }
  }

  async suspend(){
    if(this.ctx && this.ctx.state==='running'){
      try{ await this.ctx.suspend(); }catch(e){}
    }
  }
}

window.SavelkojuAudioManager=SavelkojuAudioManager;
})();