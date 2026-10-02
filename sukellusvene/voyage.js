(() => {
  'use strict';
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const ease=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
  window.Voyage={
    ease,
    layout(width,height,definitions,settings=window.SeaSettings.defaults){
      const boatH=height/8,boatW=boatH*337/128,padding=height*.013;
      const waterY=height*.30,margin=Math.max(12,width*.03),step=height*1.5*.86;
      const size=(def,prefix)=>{
        const [x0,y0,x1,y1]=def.bay,scale=settings[prefix+'Size']/100;
        const h=(boatH+2*padding)/(y1-y0)*scale;
        const w=Math.max(height*.76,(boatW+2*padding)/(x1-x0))*scale;
        const top=clamp(waterY+height*settings[prefix+'Y']/100-(y0+y1)*h/2,height*.09,height*.98-h);
        return {width:w,height:h,top,bay:def.bay,dockY:top+(y0+y1)*h/2};
      };
      const start=size(definitions.start,'start'),end=size(definitions.end,'end');
      start.left=clamp(margin+width*settings.startX/100,8,width-start.width-8);
      end.left=clamp(width-margin-end.width+width*settings.endX/100,8,width-end.width-8);
      start.dockX=start.left+(start.bay[0]+start.bay[2])*start.width/2;
      end.dockX=end.left+(end.bay[0]+end.bay[2])*end.width/2;
      const playX=height*.035+boatW/2;
      const startPosition=(start.dockX-playX)/step;
      const endWorld=7*step+height*.3;
      return {width,height,boatH,boatW,waterY,step,start,end,playX,startPosition,endWorld,destination:(endWorld-end.left)/step};
    },
    depthY(level,l,bottomGap=90){
      const top=l.height*.065+l.boatH/2;
      const bottom=Math.max(top+l.height*.3,l.height-bottomGap-l.boatH/2);
      return bottom-(bottom-top)*clamp(level,0,7)/7;
    },
    advanceDepth(y,target,velocity,height,heldSeconds,seconds){
      if(seconds<=0)return {y,velocity};
      // Critically damped motion: ease into speed and brake before the target.
      const smoothTime=.28,omega=2/smoothTime;
      const maxSpeed=height*(.12+.6*(heldSeconds===null?0:Math.min(.8,heldSeconds+seconds/2)));
      const change=clamp(y-target,-maxSpeed*smoothTime,maxSpeed*smoothTime);
      const localTarget=y-change,decay=Math.exp(-omega*seconds);
      const temp=(velocity+omega*change)*seconds;
      const next=localTarget+(change+temp)*decay;
      const nextVelocity=(velocity-omega*temp)*decay;
      if((target-y)*(target-next)<0||(Math.abs(target-next)<.05&&Math.abs(nextVelocity)<.5))return {y:target,velocity:0};
      return {y:next,velocity:nextVelocity};
    },
    departureClear(position,l){
      const stationRight=l.start.left+l.start.width-position*l.step;
      const boatRear=l.playX-l.boatW/2;
      return stationRight+l.height*.015<=boatRear;
    },
    dockDuration:5.2,
    dockPose(time,l,startY,startPitch=0){
      // Match the bay height before passing its entrance, then glide inside.
      const align=clamp(time/2,0,1),approach=ease((time-2)/3.2);
      const pitch=startPitch*(1-ease(align))+Math.sign(l.end.dockY-startY)*8*Math.sin(Math.PI*align);
      return {position:l.destination,x:l.playX+(l.end.dockX-l.playX)*approach,
        y:startY+(l.end.dockY-startY)*ease(align),pitch:align===1?0:clamp(pitch,-8,8)};
    },
    pose(phase,phaseTime,position,l,level=null,bottomGap=90){
      return {position:phase==='arrived'?l.destination:Math.min(position,l.destination),x:l.playX,
        y:level===null?l.start.dockY:this.depthY(level,l,bottomGap)};
    }
  };
})();
