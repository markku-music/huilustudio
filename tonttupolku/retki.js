'use strict';
const WORKS=[844,1688,2532];
const STOPS=[422,...WORKS,2954],ANCHORS=[467,...WORKS,3335];
const CAMERA_MAX=2532;
const AJOASENTO={phase:'travel',x:TYOMAA.palletX-15,y:273,grip:LEUKOJEN_LEPOASENTO,roadWeight:1,sourceX:90,sourceY:307,cargo:false};
const ASETTUMISAIKA=650;
function vaihdaAsentoa(from,to,progress){
  const t=progress*progress*(3-2*progress);
  const mix=(a,b)=>a+(b-a)*t;
  const a=from.jawPose??leukaAsento(from),b=to.jawPose??leukaAsento(to);
  return {phase:'travel',cargo:false,x:mix(from.x,to.x),y:mix(from.y,to.y),grip:mix(from.grip,to.grip),
    jawPose:{x:mix(a.x,b.x),y:mix(a.y,b.y),spread:mix(a.spread,b.spread)},
    roadWeight:mix(from.roadWeight??0,to.roadWeight??0),
    sourceX:mix(from.sourceX,to.sourceX),sourceY:mix(from.sourceY,to.sourceY)};
}
class Retki {
  constructor(){this.reset()}
  reset(pitches=this.pitches??NUOTIT,requireSustain=this.requireSustain??false){
    this.pitches=pitches;
    this.requireSustain=requireSustain;
    const firstPickups=sekoita(pitches);
    this.sites=WORKS.map((_,i)=>new Nosturi(sekoita(pitches.filter(n=>n!==firstPickups[i])),pitches,requireSustain));
    this.station=0;this.actor=ANCHORS[0];this.camera=0;
    this.trip=null;this.departIn=null;this.follow=true;
  }
  get index(){return !this.trip&&this.station>=1&&this.station<=3?this.station-1:-1}
  get site(){return this.sites[this.index]}
  get cranePose(){
    const trip=this.trip;
    if(!trip)return this.site??AJOASENTO;
    const windowMs=Math.min(ASETTUMISAIKA,trip.duration/2);
    if(trip.elapsed<windowMs)return vaihdaAsentoa(trip.startPose,AJOASENTO,trip.elapsed/windowMs);
    const remaining=trip.duration-trip.elapsed,destination=this.sites[trip.station-1];
    if(destination&&remaining<windowMs)return vaihdaAsentoa(AJOASENTO,destination,1-remaining/windowMs);
    return AJOASENTO;
  }
  get total(){return this.sites.reduce((sum,s)=>sum+s.count,0)}
  get goal(){return this.sites.length*(this.pitches.length-1)}
  get finished(){return this.station===4&&!this.trip&&this.total===this.goal}
  nextStation(){
    for(let step=1;step<=3;step++){
      const i=(Math.max(0,this.station)+step-1)%3;
      if(!this.sites[i].complete)return i+1;
    }
    return 4;
  }
  visit(station,instant=false){
    this.follow=true;this.departIn=null;
    if(!this.trip&&this.station===station){this.camera=STOPS[station]-422;return}
    // Capture the displayed pose before parking, including when rerouting mid-trip.
    const startPose=vaihdaAsentoa(this.cranePose,AJOASENTO,0);
    this.site?.park();
    const duration=instant?0:Math.max(750,Math.min(4200,Math.abs(ANCHORS[station]-this.actor)*3.6));
    this.trip={station,from:this.actor,fromCamera:this.camera,startPose,elapsed:0,duration,paused:false};
    if(instant)this.advance(0);
  }
  advance(ms){
    if(this.trip){
      const t=this.trip;if(t.paused)return;
      t.elapsed+=ms;const f=t.duration?Math.min(1,t.elapsed/t.duration):1;
      const ease=f*f*(3-2*f);
      this.actor=t.from+(ANCHORS[t.station]-t.from)*ease;
      if(this.follow)this.camera=t.fromCamera+(STOPS[t.station]-422-t.fromCamera)*ease;
      if(f===1){this.station=t.station;this.trip=null}
      return;
    }
    if(!this.site)return;
    const wasComplete=this.site.complete;this.site.advance(ms);
    if(!wasComplete&&this.site.complete)this.departIn=900;
    if(this.departIn!==null&&this.site.phase==='done'){
      this.departIn-=ms;
      if(this.departIn<=0)this.visit(this.nextStation());
    }
  }
}
