'use strict';
// A small texture mesh bends the painted sleeves and tilts the original face.
// The sled, winch, and lever brackets stay fixed in their world positions.
const TONDE={x:-282,y:226,width:157,height:104.26};
// Anchor the speech bubble and its touch target to the same point near Tonde's face.
function puhekuplanPaikka(){
  const face=nosturinPiste(TONDE.x+183*TONDE.width/640,TONDE.y+75*TONDE.height/425);
  return {x:face.x+31,y:face.y-32};
}
class TondenOhjaus {
  constructor(image){
    this.image=image;
    this.buffer=document.createElement('canvas');
    this.buffer.width=704;this.buffer.height=489;
    this.brush=this.buffer.getContext('2d');
    this.vertices=[];this.triangles=[];
    const xs=[0,26,53,82,107,132,151,171,192,209,226,242,258,275,295,314,336];
    const ys=[0,25,55,78,100,118,136,149,166,181,197,215,237,256,274,283];
    for(const y of ys)for(const x of xs)this.vertices.push(this.vertex(x,y));
    for(let j=1;j<ys.length;j++)for(let i=1;i<xs.length;i++){
      const d=j*xs.length+i,a=d-xs.length-1,b=a+1,c=d-1;
      this.triangle(a,b,d);this.triangle(a,d,c);
    }
    this.reset();
  }
  static smooth(lo,hi,v){
    const a=Math.min(1,Math.max(0,(v-lo)/(hi-lo)));return a*a*(3-2*a);
  }
  vertex(x,y){
    const s=TondenOhjaus.smooth;
    const head=s(235,208,x)*s(157+(x<65?15:0),111+(x<65?15:0),y);
    const foreBand=158+.25*(x-120);
    const fore=s(116,244,x)*s(306,274,x)*s(65,20,Math.abs(y-foreBand));
    const lever=s(20,7,Math.abs(x-260))*s(280,201,y)*s(160,189,y);
    const rear=s(166,265,x)*s(321,293,x)*s(49,15,Math.abs(y-(135+.15*(x-165))));
    return {x,y,head,fore:Math.max(fore,lever),rear:rear*(1-fore*.78),dx:x,dy:y};
  }
  triangle(a,b,c){
    const p=this.vertices[a],q=this.vertices[b],r=this.vertices[c];
    this.triangles.push({p,q,r,left:Math.min(p.x,q.x,r.x),top:Math.min(p.y,q.y,r.y),
      w:Math.max(p.x,q.x,r.x)-Math.min(p.x,q.x,r.x),h:Math.max(p.y,q.y,r.y)-Math.min(p.y,q.y,r.y),
      det:(q.x-p.x)*(r.y-p.y)-(r.x-p.x)*(q.y-p.y)});
  }
  reset(){
    this.angle=.17;this.front=0;this.back=0;this.eyeX=0;this.eyeY=.2;
    this.lastX=TYOMAA.palletX;this.lastY=TYOMAA.homeY;this.lastKey=null;this.locked=null;
  }
  update(game,dt){
    const phase=game.phase;
    if(phase==='travel'||phase==='reach'||phase==='putBack'||game.cargo)this.locked=null;
    if(phase==='open'&&game.choice)this.locked=game.kolo.originX;
    const settled=['open','clear','home','done','idle'].includes(phase)&&this.locked!==null;
    const tx=settled?this.locked:game.cargo?game.x:game.sourceX;
    const ty=settled?pintaY:game.cargo?game.y:game.sourceY;
    const eyeWorldX=TONDE.x+183*TONDE.width/640,eyeWorldY=TONDE.y+75*TONDE.height/425;
    const eye=nosturinPiste(eyeWorldX,eyeWorldY);
    const gaze=Math.atan2(ty-eye.y,tx-eye.x)-nosturinAsetukset.crane.rotationDeg*Math.PI/180;
    const desired=Math.max(.08,Math.min(.53,gaze*.77-.03));
    const follow=1-Math.exp(-dt/98),quick=1-Math.exp(-dt/46);
    this.angle+=(desired-this.angle)*follow;
    const distance=(tx-TYOMAA.palletX)/(KIVEYKSET[4][3].originX-TYOMAA.palletX);
    this.eyeX+=((distance*1.7-.78)-this.eyeX)*quick;
    this.eyeY+=((gaze-this.angle)*2.8-.48-this.eyeY)*quick;
    const clamp=v=>Math.max(-1,Math.min(1,v));
    const vx=dt?clamp((game.x-this.lastX)/(dt*.38)):0;
    const vy=dt?clamp((game.y-this.lastY)/(dt*.23)):0;
    this.lastX=game.x;this.lastY=game.y;
    const working=game.cargo||phase==='close'?1:0;
    const lever1=clamp(.87*vx-.34*vy+working*.33);
    const lever2=clamp(.94*vy-.52*vx-working*.29);
    this.front+=(lever1-this.front)*follow;this.back+=(lever2-this.back)*follow;
    // Quantization avoids redrawing hundreds of mesh faces while the crane is still.
    const key=[this.angle*110,this.front*35,this.back*35,this.eyeX*9,this.eyeY*9].map(Math.round).join(',');
    if(key!==this.lastKey){this.lastKey=key;this.render()}
  }
  transform(v,cos,sin){
    const x=v.x-150,y=v.y-126;
    v.dx=v.x+v.head*((cos-1)*x-sin*y+4*sin)+27*this.front*v.fore+22*this.back*v.rear;
    v.dy=v.y+v.head*(sin*x+(cos-1)*y)-9*this.front*v.fore+10*this.back*v.rear;
  }
  face(t){
    const g=this.brush,{p,q,r,det}=t;
    const u=q.dx-p.dx,v=r.dx-p.dx,w=q.dy-p.dy,z=r.dy-p.dy;
    const a=(u*(r.y-p.y)-v*(q.y-p.y))/det,b=(w*(r.y-p.y)-z*(q.y-p.y))/det;
    const c=(v*(q.x-p.x)-u*(r.x-p.x))/det,d=(z*(q.x-p.x)-w*(r.x-p.x))/det;
    const cx=(p.dx+q.dx+r.dx)/3,cy=(p.dy+q.dy+r.dy)/3;
    g.save();g.beginPath();
    for(const [i,n] of [p,q,r].entries()){
      const dx=n.dx-cx,dy=n.dy-cy,k=1+1.3/Math.max(2,Math.hypot(dx,dy));
      if(i===0)g.moveTo(cx+dx*k,cy+dy*k);else g.lineTo(cx+dx*k,cy+dy*k);
    }
    g.closePath();g.clip();g.transform(a,b,c,d,p.dx-a*p.x-c*p.y,p.dy-b*p.x-d*p.y);
    // Sample one extra texel on shared edges to avoid a transparent grid.
    const x=Math.max(0,t.left-2),y=Math.max(0,t.top-2),sw=t.left+t.w+2-x,sh=t.top+t.h+2-y;
    g.drawImage(this.image,x,y,sw,sh,x,y,sw,sh);g.restore();
  }
  eye(x,y,rx,ry,cos,sin){
    const v=this.vertex(x,y);this.transform(v,cos,sin);
    const g=this.brush;g.save();g.translate(v.dx,v.dy);g.rotate(this.angle-.19);
    g.beginPath();g.ellipse(0,0,rx,ry,0,0,2*Math.PI);g.fillStyle='#875d49';g.fill();
    g.scale(.84,.76);g.clip();g.fillStyle='#efe1c9';g.fillRect(-rx,-ry,2*rx,2*ry);
    const ix=rx*(.32+.33*this.eyeX),iy=ry*(.08+.61*this.eyeY);
    g.beginPath();g.ellipse(ix,iy,rx*.54,ry*.87,0,0,2*Math.PI);g.fillStyle='#624d39';g.fill();
    g.beginPath();g.ellipse(ix+.1,iy,rx*.33,ry*.70,0,0,2*Math.PI);g.fillStyle='#251d1a';g.fill();
    g.beginPath();g.arc(ix-rx*.13,iy-ry*.27,Math.max(.5,rx*.16),0,2*Math.PI);g.fillStyle='#fff4dc';g.fill();
    g.restore();
  }
  render(){
    const g=this.brush,c=Math.cos(this.angle),s=Math.sin(this.angle);
    g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,704,489);g.translate(32,32);
    g.drawImage(this.image,335,0,305,425,335,0,305,425);
    g.drawImage(this.image,0,282,336,143,0,282,336,143);
    for(const v of this.vertices)this.transform(v,c,s);
    for(const t of this.triangles)this.face(t);
    this.eye(196,68,3.4,4.3,c,s);this.eye(183,75,5.2,5.9,c,s);
  }
  draw(ctx){
    const scale=TONDE.width/640;
    ctx.drawImage(this.buffer,TONDE.x-32*scale,TONDE.y-32*scale,this.buffer.width*scale,this.buffer.height*scale);
  }
}
