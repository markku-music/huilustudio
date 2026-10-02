(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sizes={pearl:.058,mine:.078,fuel:.085};
  class SeaEncounters {
    constructor(random=Math.random){this.random=random;this.reset([]);}
    reset(notes,layout){
      this.notes=[...notes];this.items=[];this.score=0;this.fuel=70;this.feedback='';this.feedbackTime=0;this.hitTime=0;this.previous=new Map();
      this.routeLength=layout?layout.destination-layout.startPosition:1;
      if(!layout||!notes.length)return;
      const exit=(layout.start.left+layout.start.width+layout.height*.015-(layout.playX-layout.boatW/2))/layout.step;
      const first=exit+.85;
      const last=Math.min(layout.destination-.8,(layout.endWorld-layout.height*.75-layout.playX)/layout.step);
      const kinds=['pearl','fuel',notes.length>1?'mine':'pearl','fuel','fuel','pearl'];
      let index=Math.max(0,notes.length-3);
      this.items=kinds.map((kind,i)=>{
        const choices=notes.map((_,n)=>n).filter(n=>Math.abs(n-index)<=2);
        if(kind!=='mine')index=choices[Math.min(choices.length-1,Math.floor(this.random()*choices.length))];
        const meet=first+(last-first)*i/(kinds.length-1);
        // Identity and image kind remain fixed for the object's entire lifetime.
        return Object.freeze({id:i+1,kind,world:meet+layout.playX/layout.step,level:8-notes.length+index,midi:notes[index]});
      });
      this.previous=new Map();
    }
    suspend(){this.previous=new Map();}
    consume(distance){this.fuel=Math.max(0,this.fuel-Math.max(0,distance)/this.routeLength*100);}
    geometry(item,layout,position,bottomGap){
      return {x:(item.world-position)*layout.step,y:window.Voyage.depthY(item.level,layout,bottomGap),size:layout.height*sizes[item.kind]};
    }
    guidance({layout,position,boatY,pitch=0,bottomGap,speed=0}){
      let target=null,nearest=Infinity,danger=false;
      const range=Math.min(layout.width-layout.playX,Math.max(layout.boatW*2,speed*layout.step*6));
      for(const item of this.items){
        const g=this.geometry(item,layout,position,bottomGap),dx=g.x-layout.playX;
        if(dx<0)continue;
        if(item.kind!=='mine'){
          if(dx<nearest){target=item;nearest=dx;}
        }else if(dx<=range&&this.contact({x:dx,y:g.y-boatY},{x:0,y:g.y-boatY},layout,'mine',pitch))danger=true;
      }
      return {target,danger};
    }
    contact(previous,current,layout,kind,pitch){
      const angle=-pitch*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
      const radius=layout.height*sizes[kind]*(kind==='mine'?.36:.45);
      const rx=layout.boatW*.40+radius,ry=layout.boatH*.24+radius;
      const local=p=>({x:(p.x*c-p.y*s)/rx,y:(p.x*s+p.y*c-layout.boatH*.11)/ry});
      const a=local(previous||current),b=local(current),dx=b.x-a.x,dy=b.y-a.y;
      const t=clamp(-(a.x*dx+a.y*dy)/(dx*dx+dy*dy||1),0,1);
      return (a.x+t*dx)**2+(a.y+t*dy)**2<=1;
    }
    update({seconds,layout,position,boatY,pitch=0,bottomGap,departed,cruising}){
      this.feedbackTime=Math.max(0,this.feedbackTime-seconds);this.hitTime=Math.max(0,this.hitTime-seconds);
      if(!this.feedbackTime)this.feedback='';
      if(!cruising){this.suspend();return;}
      if(!departed||!this.notes.length){this.suspend();return;}
      this.items=this.items.filter(item=>{
        const g=this.geometry(item,layout,position,bottomGap),relative={x:g.x-layout.playX,y:g.y-boatY};
        if(this.contact(this.previous.get(item.id),relative,layout,item.kind,pitch)){
          if(item.kind==='pearl'){
            const points=8-item.level;this.score+=points;
            this.feedback=(item.level===0?'Musta helmi! +':'Helmi! +')+points;
          }
          else if(item.kind==='fuel'){this.fuel=Math.min(100,this.fuel+25);this.feedback='Tankattu +25 %';}
          else {const lost=this.score>0;this.score=Math.max(0,this.score-1);this.hitTime=.9;this.feedback=lost?'Osuma −1':'Osuma · 0 pistettä';}
          this.feedbackTime=1.8;this.previous.delete(item.id);return false;
        }
        if(g.x+g.size/2<0){this.previous.delete(item.id);return false;}
        this.previous.set(item.id,relative);return true;
      });
    }
  }
  window.SeaEncounters=SeaEncounters;
})();
