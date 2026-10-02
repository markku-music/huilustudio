(() => {
  'use strict';
  const marginKey='Sukellusmeri.microphone.margin.v1';
  class SeaMicrophone {
    constructor({onNote,onRelease,onState,onProgress}){
      Object.assign(this,{onNote,onRelease,onState,onProgress});
      this.state='off';this.active=false;this.session=0;this.margin=10;
      try{const saved=Number(localStorage.getItem(marginKey));if(saved>=4&&saved<=10)this.margin=saved;}catch{}
      this.engine=new window.ResonatorStringEngine({targets:{65:440*Math.pow(2,(65-69)/12)},
        blockSize:256,calibrationMs:1500,responseMs:1.8,toleranceCents:40,
        centerMatch:.955,edgeMatch:.998,minHalfPeriodEnergy:.32,noiseMarginDb:this.margin,
        pitchMeterIntervalMs:22,pitchMeterWindowMs:16,pitchMeterSearchCents:140});
      this.stability=new window.ResonatorNoteStability({targets:this.engine.targets});
      this.engine.addEventListener('state',({detail})=>{
        if(detail.state==='calibrating')this.change('calibrating');
        if(detail.state==='running'){clearTimeout(this.timer);this.change('ready');}
      });
      this.engine.addEventListener('calibrationprogress',({detail})=>this.onProgress(detail));
      this.engine.addEventListener('input',({detail})=>{
        if(!this.active||this.state!=='ready')return;
        if(!detail.accepted){this.stability.reject();this.onRelease();return;}
        const stable=this.stability.accept(detail);
        if(stable)this.onNote(Number(stable.action));
        else this.onRelease();
      });
      this.engine.addEventListener('silence',()=>{this.stability.silence();this.onRelease();});
    }
    change(state,message=''){
      this.state=state;
      if(state!=='ready'){this.active=false;this.stability.reset();this.onRelease();}
      this.onState(state,message);
    }
    setNotes(notes){
      const targets=Object.fromEntries(notes.map(midi=>[String(midi),440*Math.pow(2,(midi-69)/12)]));
      this.onRelease();this.engine.setTargets(targets);
      this.stability=new window.ResonatorNoteStability({targets});
    }
    setActive(active){
      active=Boolean(active)&&this.state==='ready';
      if(this.active===active)return;
      this.active=active;this.stability.reset();this.onRelease();
    }
    setMargin(value){
      this.margin=this.engine.setNoiseMarginDb(value);
      try{localStorage.setItem(marginKey,String(this.margin));}catch{}
      return this.margin;
    }
    async start(){
      if(['ready','opening','calibrating'].includes(this.state))return;
      const session=++this.session;
      this.change('opening');
      this.timer=setTimeout(()=>{
        if(session!==this.session||this.state==='ready')return;
        this.stop();this.change('error','Mikrofonista ei saatu ääntä. Kokeile uudelleen tai jatka painikkeilla.');
      },20000);
      try{
        await this.engine.start();
        if(session!==this.session)return;
        const context=this.engine.context;
        this.contextListener=()=>{if(context.state!=='running'&&this.state!=='off')this.interrupt();};
        context.addEventListener('statechange',this.contextListener);
        this.trackListeners=this.engine.stream.getAudioTracks().map(track=>{
          const listener=()=>this.interrupt();track.addEventListener('ended',listener);return {track,listener};
        });
        if(context.state!=='running')this.contextListener();
      }catch(error){
        if(session!==this.session)return;
        clearTimeout(this.timer);
        const messages={NotAllowedError:'Mikrofonilupa puuttuu. Salli mikrofoni selaimen sivustoasetuksissa tai jatka painikkeilla.',
          NotFoundError:'Mikrofonia ei löytynyt. Liitä mikrofoni tai jatka painikkeilla.',
          NotReadableError:'Mikrofonia ei saatu käyttöön. Sulje sitä käyttävä muu ohjelma ja kokeile uudelleen.'};
        this.change('error',messages[error.name]||error.message||'Mikrofonin avaus epäonnistui.');
      }
    }
    stop(){
      ++this.session;clearTimeout(this.timer);
      if(this.contextListener)this.engine.context?.removeEventListener('statechange',this.contextListener);
      this.contextListener=null;
      for(const {track,listener} of this.trackListeners||[])track.removeEventListener('ended',listener);
      this.trackListeners=[];this.engine.stop();this.change('off');
    }
    interrupt(){
      if(this.state==='off'||this.state==='interrupted')return;
      this.stop();this.change('interrupted','Kuuntelu keskeytyi. Jatka avaamalla mikrofoni uudelleen.');
    }
  }
  window.SeaMicrophone=SeaMicrophone;
})();
