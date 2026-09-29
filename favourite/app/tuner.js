(() => {
'use strict';
class PitchMeter {
 constructor(root){this.root=root;this.pointer=root.querySelector('.tuner-pointer');this.reading=root.querySelector('#tunerReading');this.accessible=root.querySelector('#tunerAccessible');this.clear();}
 clear(){this.note=null;this.cents=null;this.at=0;this.pointer.hidden=true;this.root.dataset.active='false';this.root.dataset.inTune='false';this.accessible.textContent='Ei tunnistettua säveltä.';}
 update(frequency,target,note,now=performance.now()){
  if(!Number.isFinite(frequency)||frequency<=0||!Number.isFinite(target)||target<=0){this.clear();return;}
  const cents=1200*Math.log2(frequency/target);
  if(this.note!==note||this.cents===null||now-this.at>250)this.cents=cents;
  else this.cents+=(cents-this.cents)*(1-Math.exp(-Math.max(0,now-this.at)/90));
  this.note=note;this.at=now;
  const value=Math.round(this.cents),text=(value>0?'+':value<0?'−':'')+Math.abs(value)+' ct';
  this.pointer.style.top=(50-Math.max(-50,Math.min(50,this.cents)))+'%';this.reading.textContent=text;this.pointer.hidden=false;
  this.root.dataset.active='true';this.root.dataset.inTune=String(Math.abs(this.cents)<=5);
  this.accessible.textContent=value===0?'Vire kohdallaan.':Math.abs(value)+' senttiä '+(value>0?'korkea.':'matala.');
 }
 tick(now=performance.now()){if(this.note!==null&&now-this.at>250)this.clear();}
}
window.PitchMeter=PitchMeter;
})();
