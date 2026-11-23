'use strict';
function laatanPinta(p,start=pinonMuoto(p.capacity)){
  if(!p.choice||p.stackWeight>=1)return start;
  const dest=p.kolo.pinta;
  if(p.stackWeight<=0)return dest;
  return start.map((corner,i)=>corner.map((v,j)=>v+(dest[i][j]-v)*(1-p.stackWeight)));
}
const KARKI_SISAAN=3,KARKI_ALAS=3;
function leukaAsento(p,ote=pinnanOte(laatanPinta(p),p.otteenSyvyys??KIVEYKSET[4][0].syvyys)){
  const {left,right}=ote;
  const closed=(right-left)/2+KARKI_SISAAN;
  const open=Math.max(closed+4,nosturinAsetukset.jaws.openWidth/2);
  const folded=Math.max(0,p.grip-1);
  return {x:nosturinAsetukset.jaws.offsetX*folded,
    y:-KARKI_ALAS*(1-folded),
    spread:p.grip<=1?open+(closed-open)*p.grip:closed+(5-closed)*folded};
}
function leukapisteet(jawX,y,spread,s){
  return [[jawX,y-25],[jawX+s*Math.max(0,spread-4),y-13],[jawX+s*spread,y-3],[jawX+s*spread,y+2],[jawX+s*Math.max(0,spread-KARKI_SISAAN),y+KARKI_ALAS]];
}
function lavanLeveys(capacity){return Math.max(60,178/capacity+12)}
function lavanVarjo(capacity){
  const {offsetX,offsetY,shadowX,shadowY}=nosturinAsetukset.pallet;
  return {x:TYOMAA.palletX+offsetX+shadowX,y:359+offsetY+shadowY,rx:lavanLeveys(capacity)*32/60,ry:4.5};
}
class Maisema {
  constructor(canvas,images){
    this.canvas=canvas;this.g=canvas.getContext('2d');this.images=images;
    this.tonde=new TondenOhjaus(images.tonde,images['tonde-ajo']);
    this.resize();new ResizeObserver(()=>this.resize()).observe(canvas);
  }
  resize(){
    const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    this.canvas.width=Math.max(1,Math.round(rect.width*dpr));this.canvas.height=Math.max(1,Math.round(rect.height*dpr));
  }
  texture(q,c=document.createElement('canvas')){
    const r=4, xs=q.map(point=>point[0]), top=q[0][1], bottom=q[3][1];
    const left=Math.min(-29,Math.floor(Math.min(...xs))-1), right=Math.max(29,Math.ceil(Math.max(...xs))+1);
    const y=Math.min(-13,Math.floor(top)-1), height=Math.max(13,Math.ceil(bottom)+1)-y, width=right-left;
    if(c.width!==width*r)c.width=width*r;
    if(c.height!==height*r)c.height=height*r;
    const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);
    g.save();g.scale(r,r);g.translate(-left,-y);
    g.beginPath();q.forEach(([x,y],j)=>j?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();
    const image=this.images.kivi;
    // Stone grain follows the receding side edges along each scanline.
    const rows=Math.ceil((bottom-top)*r), dy=(bottom-top)/rows;
    for(let row=0;row<rows;row++){
      const t=(row+.5)/rows,l=q[0][0]*(1-t)+q[3][0]*t,rr=q[1][0]*(1-t)+q[2][0]*t;
      g.drawImage(image,0,row*image.height/rows,image.width,image.height/rows,l,top+row*dy,rr-l,dy);
    }
    g.restore();return {q,canvas:c,left,y,width,height};
  }
  stackedTile(capacity){
    const {depth,skew,backWidth}=nosturinAsetukset.stack;
    const key=[capacity,depth,skew,backWidth].join('/');
    if(key!==this.stackKey){
      this.stackTile=this.texture(pinonMuoto(capacity),this.stackTile?.canvas);
      this.stackKey=key;
    }
    return this.stackTile;
  }
  carriedTile(p){
    const start=this.stackedTile(p.capacity);
    if(!p.choice||p.stackWeight>=1)return start;
    const dest=this.tiles[p.notes.indexOf(p.choice)];
    if(p.stackWeight<=0)return dest;
    this.movingTile=this.texture(laatanPinta(p,start.q),this.movingTile?.canvas);
    return this.movingTile;
  }
  line(points,color,w){
    const g=this.g;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
    g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();
  }
  ellipse(x,y,rx,ry,color){
    const g=this.g;g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();
  }
  stone(x,y,tile,side){
    const g=this.g,q=tile.q,front=y+q[3][1];
    if(side>.1){g.fillStyle='#58646d';g.beginPath();g.moveTo(x+q[3][0],front-.5);g.lineTo(x+q[2][0],front-.5);
      g.lineTo(x+q[2][0],front+side);g.lineTo(x+q[3][0],front+side);g.fill();
      this.line([[x+q[3][0],front+side],[x+q[2][0],front+side]],'#455059',.75)}
    g.drawImage(tile.canvas,x+tile.left,y+tile.y,tile.width,tile.height);
  }
  worksite(site,active,frontSlot){
    const g=this.g;
    for(const [i,note] of site.notes.entries()){
      const x=site.kolot[i].originX;
      if(site.slots[note]){if(i!==frontSlot)this.stone(x,pintaY,this.tiles[i],0)}
      else if(i>0){const q=site.kolot[i].pinta;this.line([[x+q[0][0],326],[x+q[3][0],347]],'#8c8190',.8)}
      if(active){
        this.line([[x,323],[x,314]],'#674737',2.2);
        g.fillStyle=site.slots[note]?'#574d37':'#805635';g.beginPath();g.roundRect(x-9.5,300,19,16,3);g.fill();
        g.fillStyle='#ffeac5';g.font='bold 13px Georgia,serif';g.textAlign='center';g.fillText(note,x,312.5);
      }
    }
  }
  puhekupla(note){
    const g=this.g,{x,y}=puhekuplanPaikka();
    g.save();g.translate(x,y);
    g.beginPath();
    g.moveTo(-25,0);
    g.bezierCurveTo(-25,-14,-17,-18,0,-18);
    g.bezierCurveTo(17,-18,25,-14,25,0);
    g.bezierCurveTo(25,13,17,18,0,18);
    g.quadraticCurveTo(-4,18,-8,17);
    g.quadraticCurveTo(-14,23,-23,25);
    g.quadraticCurveTo(-19,19,-18,15);
    g.quadraticCurveTo(-25,12,-25,0);
    g.closePath();g.fillStyle='#fff4d9';g.fill();
    g.strokeStyle='#674934';g.lineWidth=1.5;g.lineJoin='round';g.stroke();
    g.fillStyle='#403026';g.font='bold 25px Georgia,serif';g.textAlign='center';
    g.textBaseline='alphabetic';g.fillText(note,0,8.5);g.restore();
  }
  pallet(site,shadow,frontStack){
    const {offsetX,offsetY}=nosturinAsetukset.pallet,px=TYOMAA.palletX+offsetX;
    this.ellipse(shadow.x,shadow.y,shadow.rx,shadow.ry,'rgba(42,47,69,.26)');
    const width=lavanLeveys(site.capacity);
    this.g.drawImage(this.images.lava,px-width/2,346+offsetY,width,13);
    const bottom=TYOMAA.lowStone+nosturinAsetukset.stack.offsetY;
    for(let j=0;j<site.capacity-site.count-(site.cargo||frontStack?1:0);j++)this.stone(site.sourceX,bottom-j*TYOMAA.thickness,this.stackedTile(site.capacity),TYOMAA.thickness);
  }
  rig(p,foreground,inspect){
    const g=this.g;
    const mount=nosturinPiste(TONDE.x+522*TONDE.width/640,TONDE.y+132*TONDE.height/425);
    const boomY=225+(p.x-TYOMAA.palletX)*.068,boom=nosturinPiste(p.x,boomY);
    // Ease the hook from sled-relative travel coordinates into worksite coordinates.
    const roadWeight=p.roadWeight??0;
    const x=p.x+(boom.x-p.x)*roadWeight,y=p.y+(boom.y-boomY)*roadWeight;
    const baseX=mount.x,baseY=mount.y,tipY=Math.min(boom.y,y-28);
    const mid=[baseX+(x-baseX)*.55,baseY+(tipY-baseY)*.55];
    this.line([[baseX,baseY],[x,tipY]],'#51382e',6);
    this.line([[baseX,baseY],[x,tipY]],'#d7a561',3.5);
    this.line([[baseX,baseY],mid],'#683c31',8.7);this.line([[baseX,baseY],mid],'#b66043',5.3);
    for(const [xx,yy,rr] of [[baseX,baseY,4.6],[x,tipY,3.1]]){
      this.ellipse(xx,yy,rr,rr,'#674d36');this.ellipse(xx,yy-.2,rr*.65,rr*.65,'#e5ba7c');
    }
    const carried=p.cargo?this.carriedTile(p):null;
    const contact=carried?pinnanOte(carried.q,p.otteenSyvyys):undefined;
    const pose=p.jawPose??leukaAsento(p,contact);
    const jawX=x+pose.x,jawY=y+pose.y,spread=pose.spread;
    this.line([[x,tipY+2],[jawX,jawY-25]],'#544538',1.6);
    const tips=inspect?[]:null;
    for(const s of [-1,1]){
      const pts=leukapisteet(jawX,jawY,spread,s);
      if(inspect)tips.push(pts[pts.length-1]);
      this.line(pts,'#3b4247',3.2);this.line(pts,'#a5afb0',1.2);
    }
    this.ellipse(jawX,jawY-25,2.5,2.5,'#b99961');
    // The same tile stays in front of the jaws while gripping, carrying and releasing.
    if(carried){
      const atGround=p.phase==='lower'||p.phase==='returnUp';
      const side=atGround?Math.min(TYOMAA.thickness,Math.max(0,p.kolo.y-y)):TYOMAA.thickness;
      this.stone(x-contact.x,y-contact.y,carried,side);
    }
    else if(foreground)this.stone(foreground.x,foreground.y,foreground.tile,foreground.thickness);
    if(inspect)inspect(tips,carried);
  }
  paint(camera,actor,sites,workIndex,p,dt,view=null){
    const g=this.g,w=this.canvas.width,h=this.canvas.height;
    g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);const width=view?.width??844,height=view?.height??390,top=view?.top??0;
    g.setTransform(w/width,0,0,h/height,0,0);g.translate(-camera,-top);
    if(view){
      g.drawImage(view.panorama,0,0,3376,390);
      // Extreme downward offsets can put the runners below the painting.
      if(top+height>390){
        g.save();g.translate(0,780);g.scale(1,-1);g.drawImage(view.panorama,0,0,3376,390);g.restore();
      }
    }
    const {kolot,capacity}=sites[0];
    if(this.kolot!==kolot){this.tiles=kolot.map(k=>this.texture(k.pinta));this.kolot=kolot}
    const visible=actor-camera>=-150&&actor-camera<=1140;
    const active=visible?sites[workIndex]:null;
    const frontSlot=active&&active.slots[p.choice]?active.notes.indexOf(p.choice):-1;
    const frontStack=active&&!p.cargo&&!active.complete&&frontSlot===-1;
    let foreground=null;
    if(frontStack)foreground={x:active.sourceX,y:active.sourceY,tile:this.stackedTile(capacity),thickness:TYOMAA.thickness};
    else if(frontSlot>=0)foreground={x:kolot[frontSlot].originX,y:pintaY,tile:this.tiles[frontSlot],thickness:0};
    for(let i=0;i<sites.length;i++){
      const center=WORKS[i];if(center-camera< -120||center-camera>1040)continue;
      g.save();g.translate(center,0);this.worksite(sites[i],i===workIndex,i===workIndex?frontSlot:-1);g.restore();
    }
    if(visible)this.ellipse(actor+KIERTOAKSELI.x,reenVarjoY(),77,4.5,'rgba(45,45,68,.24)');
    const palletX=TYOMAA.palletX+nosturinAsetukset.pallet.offsetX;
    const shadow=lavanVarjo(capacity),palletHalf=lavanLeveys(capacity)/2;
    for(let i=0;i<sites.length;i++){
      const center=WORKS[i],stackX=sites[i].sourceX;
      const right=Math.max(palletX+palletHalf,stackX+120/capacity+40,shadow.x+shadow.rx);
      const left=Math.min(palletX-palletHalf,stackX-120/capacity-40,shadow.x-shadow.rx);
      if(center+right<camera||center+left>camera+width)continue;
      g.save();g.translate(center,0);this.pallet(sites[i],shadow,i===workIndex&&frontStack);g.restore();
    }
    if(visible){
      g.save();g.translate(actor,0);
      const {offsetY,rotationDeg}=nosturinAsetukset.crane;
      g.save();g.translate(KIERTOAKSELI.x,KIERTOAKSELI.y+offsetY);g.rotate(rotationDeg*Math.PI/180);
      g.translate(-KIERTOAKSELI.x,-KIERTOAKSELI.y);
      this.tonde.update(p,dt);this.tonde.draw(g);g.restore();
      this.rig(p,foreground,view?.inspect);
      if(active?.phase==='idle'&&active.pickupNote)this.puhekupla(active.pickupNote);
      g.restore();
    }
  }
}
