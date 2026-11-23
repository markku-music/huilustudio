'use strict';
const NUOTIT=['G','A','H','C','D'];
const SAVELPELIT={3:['G','A','H'],4:['A','H','C','D'],5:NUOTIT};
function sekoita(nuotit){
  const tulos=[...nuotit];
  for(let i=tulos.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [tulos[i],tulos[j]]=[tulos[j],tulos[i]];
  }
  return tulos;
}
const TYOMAA={palletX:-131,lowStone:338,thickness:5,liftY:275,homeY:296};
const pintaY=336.5;
function pinonMuoto(capacity=4){
  const {depth,skew,backWidth}=nosturinAsetukset.stack;
  const q=KIVEYKSET[4][1].pinta,widthScale=4/capacity;
  const backCenter=(q[0][0]+q[1][0])/2+skew,backHalf=backWidth*widthScale/2;
  const frontCenter=(q[2][0]+q[3][0])/2,frontHalf=(q[2][0]-q[3][0])*widthScale/2;
  return [[backCenter-backHalf,-depth/2],[backCenter+backHalf,-depth/2],
    [frontCenter+frontHalf,depth/2],[frontCenter-frontHalf,depth/2]];
}

function pinnanOte(q,syvyys){
  const at=(a,b)=>a+(b-a)*syvyys;
  const left=at(q[0][0],q[3][0]),right=at(q[1][0],q[2][0]);
  return {left,right,x:(left+right)/2,y:at(q[0][1],q[3][1])};
}
// On the finished trapezoid the diagonals cross at backWidth / (backWidth + frontWidth)
// of its depth. Retain that texture row from pickup to release.
function luoKolot(capacity){
  return Array.from({length:capacity},(_,i)=>{
    const originX=-84+168*(i+.5)/capacity;
    const far=j=>-78+160*j/capacity-originX,near=j=>-91+178*j/capacity-originX;
    const pinta=[[far(i),-11.5],[far(i+1),-11.5],[near(i+1),11.5],[near(i),11.5]];
    const backWidth=pinta[1][0]-pinta[0][0],frontWidth=pinta[2][0]-pinta[3][0];
    const syvyys=backWidth/(backWidth+frontWidth),center=pinnanOte(pinta,syvyys);
    return {pinta,originX,syvyys,x:originX+center.x,y:pintaY+center.y};
  });
}
const KIVEYKSET={2:luoKolot(2),3:luoKolot(3),4:luoKolot(4)};
class Nosturi {
  constructor(notes=NUOTIT.slice(1),pitches=NUOTIT,requireSustain=false){
    this.requireSustain=requireSustain;
    this.notes=notes;this.pitches=pitches;this.kolot=KIVEYKSET[notes.length];
    this.slots=Object.fromEntries(notes.map(note=>[note,false]));
    this.pickupNote=pitches.find(note=>!notes.includes(note));
    this.park();
  }
  get capacity(){return this.notes.length}
  get complete(){return this.count===this.capacity}
  get count(){return this.notes.filter(k=>this.slots[k]).length}
  get topBaseY(){return TYOMAA.lowStone-(this.capacity-1-this.count)*TYOMAA.thickness}
  get sourceX(){return TYOMAA.palletX+nosturinAsetukset.stack.offsetX}
  get sourceY(){return this.topBaseY+nosturinAsetukset.stack.offsetY}
  get kolo(){return this.choice?this.kolot[this.notes.indexOf(this.choice)]:null}
  get otteenSyvyys(){return (this.kolo??this.kolot[0]).syvyys}
  get noutopiste(){
    // All slots share a ground-plane perspective, even before a pitch selects one.
    const center=pinnanOte(pinonMuoto(this.capacity),this.otteenSyvyys);
    return {x:TYOMAA.palletX+center.x,y:this.topBaseY+center.y};
  }
  // The pickup end of the trajectory follows the stack, the slot end is fixed.
  get x(){return this.baseX+this.stackWeight*nosturinAsetukset.stack.offsetX}
  get y(){return this.baseY+this.stackWeight*nosturinAsetukset.stack.offsetY}
  park(){
    this.phase=this.complete?'done':'idle';this.choice=null;this.cargo=false;this.held=false;
    this.baseX=TYOMAA.palletX;this.baseY=TYOMAA.homeY;this.stackWeight=1;this.grip=LEUKOJEN_LEPOASENTO;this.motion=null;this.text='';
  }
  move(phase,x,y,grip,duration,stackWeight=this.stackWeight){
    this.phase=phase;this.motion={from:[this.baseX,this.baseY,this.grip,this.stackWeight],to:[x,y,grip,stackWeight],elapsed:0,duration};
  }
  take(note){
    if(this.phase!=='idle'||note!==this.pickupNote)return false;
    this.held=true;this.text='Valitse kivelle paikka.';
    const pickup=this.noutopiste;
    this.move('reach',pickup.x,pickup.y,0,180);return true;
  }
  select(key){
    if(!this.held||!this.notes.includes(key)||key===this.pickupNote||this.choice)return false;
    if(this.slots[key]){this.text=key+' on jo täynnä. Valitse vapaa paikka.';return false}
    this.choice=key;
    this.text=this.requireSustain?'Pidä sävel '+key+', kunnes laatta on kolossa.':'Kivi siirtyy '+key+'-paikkaan.';
    if(this.phase==='hold')this.carry();
    return true;
  }
  release(){
    if(!this.held)return;
    this.held=false;if(this.choice&&!this.requireSustain)return;
    this.text=this.choice?this.choice+' katkesi. Yritä samaa nostoa uudelleen.':'Kivi jää lavalle.';
    if(this.phase==='lower'){
      this.move('returnUp',this.baseX,TYOMAA.liftY,1,220);
      return;
    }
    if(this.phase==='carry'){this.returnAcross();return}
    if(this.cargo){
      const pickup=this.noutopiste;this.move('putBack',pickup.x,pickup.y,1,230);
    }
    else this.move('home',TYOMAA.palletX,TYOMAA.homeY,LEUKOJEN_LEPOASENTO,180);
  }
  carry(){const x=this.kolo.x;this.move('carry',x,TYOMAA.liftY,1,390+Math.abs(x-this.x)*1.2,0)}
  returnAcross(){
    const pickup=this.noutopiste;
    this.move('returnAcross',pickup.x,TYOMAA.liftY,1,180+Math.abs(this.x-this.sourceX)*1.2,1);
  }
  next(){
    const px=TYOMAA.palletX,h=TYOMAA.liftY;
    switch(this.phase){
      case 'reach':this.move('close',this.baseX,this.baseY,1,125);break;
      case 'close':this.cargo=true;this.move('lift',this.baseX,h,1,250);break;
      case 'lift':if(this.choice)this.carry();else{this.phase='hold';this.motion=null}break;
      case 'carry':this.move('lower',this.kolo.x,this.kolo.y,1,310);break;
      case 'lower':
        this.slots[this.choice]=true;this.cargo=false;this.held=false;
        // A drop must always be a different pitch from this stone's pickup.
        const candidates=this.pitches.filter(n=>this.slots[n]!==false&&n!==this.pickupNote);
        this.pickupNote=this.complete?null:candidates[Math.floor(Math.random()*candidates.length)];
        this.text=this.complete?'Työmaa valmis!':'Kivi paikallaan.';
        this.move('open',this.kolo.x,this.kolo.y,0,125);break;
      case 'open':this.move('clear',this.x,h,0,190);break;
      case 'clear':this.move('home',px,TYOMAA.homeY,LEUKOJEN_LEPOASENTO,300,1);break;
      case 'returnUp':this.returnAcross();break;
      case 'returnAcross':{
        const pickup=this.noutopiste;
        this.move('putBack',pickup.x,pickup.y,1,230,1);break;
      }
      case 'putBack':this.cargo=false;this.move('letGo',this.baseX,this.baseY,0,110);break;
      case 'letGo':this.move('home',px,TYOMAA.homeY,LEUKOJEN_LEPOASENTO,190);break;
      case 'home':{
        const retry=this.requireSustain&&this.choice&&!this.slots[this.choice];
        this.park();
        if(retry)this.text='Nosta uudelleen sävelellä '+this.pickupNote+'. Jatka kohdesäveltä laskun loppuun.';
        break;
      }
    }
  }
  advance(ms){
    while(this.motion&&ms>0){
      const m=this.motion,dt=Math.min(ms,m.duration-m.elapsed);m.elapsed+=dt;ms-=dt;
      const t=m.elapsed/m.duration,e=t*t*(3-2*t),at=i=>m.from[i]+(m.to[i]-m.from[i])*e;
      this.baseX=at(0);this.baseY=at(1);this.grip=at(2);this.stackWeight=at(3);
      if(this.phase==='carry')this.baseY-=6*Math.sin(Math.PI*t);
      if(m.elapsed>=m.duration)this.next();
    }
  }
}
