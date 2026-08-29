(()=>{
'use strict';

class SavelkojuAudioManager {
  constructor(files){
    this.files=files;
    this.ctx=null;
    this.buffers=new Map();
    this.loading=new Map();
    this.mode='webaudio';
    this.finaleSource=null;

    this.htmlAudio={};
    for(const [key,url] of Object.entries(files)){
      const a=new Audio(url);
      a.preload='auto';
      a.playsInline=true;
      this.htmlAudio[key]=a;
    }
  }

  ensureContext(){
    if(!this.ctx){
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx){
        this.mode='html';
        return null;
      }
      this.ctx=new Ctx();
    }
    return this.ctx;
  }

  async unlock(){
    const ctx=this.ensureContext();

    if(ctx){
      try{
        if(ctx.state==='suspended') await ctx.resume();

        const buffer=ctx.createBuffer(1,1,ctx.sampleRate);
        const source=ctx.createBufferSource();
        const gain=ctx.createGain();
        gain.gain.value=0;
        source.buffer=buffer;
        source.connect(gain).connect(ctx.destination);
        source.start(0);
      }catch(e){
        console.warn('Web Audio unlock:',e);
      }
    }

    // Avataan myös HTMLAudio-fallback käyttäjän eleessä.
    for(const audio of Object.values(this.htmlAudio)){
      try{
        const oldVolume=audio.volume;
        audio.volume=0;
        audio.currentTime=0;
        const p=audio.play();
        if(p && typeof p.then==='function'){
          p.then(()=>{
            audio.pause();
            audio.currentTime=0;
            audio.volume=oldVolume;
          }).catch(()=>{
            audio.volume=oldVolume;
          });
        }else{
          audio.pause();
          audio.currentTime=0;
          audio.volume=oldVolume;
        }
      }catch(e){}
    }
  }

  async loadOne(key){
    if(this.buffers.has(key)) return this.buffers.get(key);
    if(this.loading.has(key)) return this.loading.get(key);

    const promise=(async()=>{
      const ctx=this.ensureContext();
      if(!ctx) throw new Error('Web Audio ei käytettävissä');

      const url=this.files[key];
      const response=await fetch(url,{cache:'force-cache'});
      if(!response.ok) throw new Error('Äänitiedostoa ei voitu ladata: '+url);
      const arrayBuffer=await response.arrayBuffer();
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

  async preload(){
    if(location.protocol==='file:'){
      // Desktop-selaimet voivat estää fetch() relative WAV -> file://.
      this.mode='html';
      Object.values(this.htmlAudio).forEach(a=>a.load());
      return;
    }

    const results=await Promise.allSettled(
      Object.keys(this.files).map(key=>this.loadOne(key))
    );

    if(results.some(r=>r.status==='rejected')){
      console.warn('Web Audio -lataus epäonnistui, käytetään HTMLAudio-fallbackia.');
      this.mode='html';
      Object.values(this.htmlAudio).forEach(a=>a.load());
    }else{
      this.mode='webaudio';
    }
  }

  async ready(){
    await this.preload();
  }

  playWebBuffer(buffer,{volume=1,loop=false}={}){
    const ctx=this.ensureContext();
    if(!ctx) return null;

    if(ctx.state==='suspended'){
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

  playHtml(key,{volume=1,loop=false}={}){
    const audio=this.htmlAudio[key];
    if(!audio) return null;
    try{
      audio.pause();
      audio.currentTime=0;
      audio.volume=volume;
      audio.loop=loop;
      const p=audio.play();
      if(p && typeof p.catch==='function'){
        p.catch(e=>console.warn('HTMLAudio play:',e));
      }
      return audio;
    }catch(e){
      console.warn('HTMLAudio:',e);
      return null;
    }
  }

  playHit(){
    if(this.mode==='webaudio'){
      const buffer=this.buffers.get('hit');
      if(buffer){
        this.playWebBuffer(buffer,{volume:1});
        return;
      }
    }
    this.playHtml('hit',{volume:1});
  }

  async playFinaleUntilEnd(){
    this.stopFinale();

    if(this.mode==='webaudio'){
      const buffer=this.buffers.get('finale');
      if(buffer){
        return new Promise(resolve=>{
          const source=this.playWebBuffer(buffer,{volume:1});
          this.finaleSource=source;
          source.onended=()=>{
            if(this.finaleSource===source) this.finaleSource=null;
            resolve();
          };
        });
      }
    }

    const audio=this.htmlAudio['finale'];
    if(!audio) return;

    return new Promise(resolve=>{
      try{
        audio.pause();
        audio.currentTime=0;
        audio.volume=1;
        audio.loop=false;
        this.finaleSource=audio;

        const done=()=>{
          audio.removeEventListener('ended',done);
          if(this.finaleSource===audio) this.finaleSource=null;
          resolve();
        };

        audio.addEventListener('ended',done,{once:true});
        const p=audio.play();
        if(p && typeof p.catch==='function'){
          p.catch(()=>{
            audio.removeEventListener('ended',done);
            if(this.finaleSource===audio) this.finaleSource=null;
            resolve();
          });
        }
      }catch(e){
        resolve();
      }
    });
  }

  stopFinale(){
    if(!this.finaleSource) return;

    try{
      if(this.finaleSource instanceof HTMLMediaElement){
        this.finaleSource.pause();
        this.finaleSource.currentTime=0;
      }else{
        this.finaleSource.stop();
        this.finaleSource.disconnect();
      }
    }catch(e){}

    this.finaleSource=null;
  }
}

window.SavelkojuAudioManager=SavelkojuAudioManager;
})();