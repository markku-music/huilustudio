'use strict';
// Short original foley synthesized locally, independent of the game's clock.
class PeliAanet {
  constructor(){this.enabled=true;this.place='';this.nextCrackle=0}
  activate(){
    if(!this.enabled)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    try{
      if(!this.ctx){
        const ctx=new Audio();this.ctx=ctx;
        this.output=ctx.createGain();this.output.gain.value=.26;this.output.connect(ctx.destination);
        this.noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
        const samples=this.noise.getChannelData(0);
        for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
        const wind=ctx.createBufferSource(),low=ctx.createBiquadFilter();
        wind.buffer=this.noise;wind.loop=true;low.type='lowpass';low.frequency.value=680;
        this.air=ctx.createGain();this.air.gain.value=0;
        wind.connect(low).connect(this.air).connect(this.output);wind.start();
      }
      if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
    }catch{this.enabled=false}
  }
  close(){
    if(this.ctx)this.ctx.close().catch(()=>{});
    this.ctx=this.air=this.output=this.noise=null;this.place='';this.nextCrackle=0;
  }
  toggle(){this.enabled=!this.enabled;if(this.enabled)this.activate();this.mix()}
  mix(){
    if(!this.ctx||!this.air)return;
    const on=this.enabled&&!this.calibrating&&!document.hidden,t=this.ctx.currentTime;
    this.output.gain.setTargetAtTime(on ? .26 : 0,t,.03);
    this.air.gain.setTargetAtTime(this.place==='travel' ? .17 : 0,t,.28);
  }
  pulse(frequency,length,volume,delay=0,noisy=false){
    if(!this.enabled||this.calibrating||this.ctx?.state!=='running'||document.hidden)return;
    const ctx=this.ctx,t=ctx.currentTime+delay,amp=ctx.createGain();
    const src=noisy?ctx.createBufferSource():ctx.createOscillator();
    let node=src;
    if(noisy){
      src.buffer=this.noise;
      const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=frequency;
      src.connect(filter);node=filter;
    }else{src.type='sine';src.frequency.value=frequency}
    amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(volume,t+.005);
    amp.gain.exponentialRampToValueAtTime(.0001,t+length);node.connect(amp).connect(this.output);
    src.onended=()=>{src.disconnect();if(node!==src)node.disconnect();amp.disconnect()};
    src.start(t);src.stop(t+length+.01);
  }
  update(place,site,oldCount,oldCargo){
    if(this.place!==place){
      this.place=place;this.mix();
      if(place==='workshop'){this.pulse(460,.08,.45);this.pulse(350,.09,.38,.18);this.pulse(1600,.26,.18,.47,true)}
    }
    if(place==='cabin'&&this.ctx?.state==='running'&&this.ctx.currentTime>=this.nextCrackle){
      this.pulse(1000+Math.random()*900,.04,.09,0,true);this.nextCrackle=this.ctx.currentTime+1+Math.random()*3;
    }
    if(!site||place!=='work')return;
    if(!oldCargo&&site.cargo)this.pulse(1500,.05,.34,0,true);
    if(site.count>oldCount){
      this.pulse(175,.12,.60);this.pulse(900,.06,.34,0,true);
      if(site.complete){this.pulse(1420,.36,.22,.12);this.pulse(2180,.26,.11,.14)}
    }
  }
}
