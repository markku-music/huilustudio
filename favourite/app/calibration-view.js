(function(global){
'use strict';
class CalibrationView {
 constructor(dialog){this.dialog=dialog;this.ring=dialog.querySelector('.ring-progress');this.tip=dialog.querySelector('.ring-tip');this.bar=dialog.querySelector('[role=progressbar]');this.label=dialog.querySelector('strong');this.frame=0;this.timer=0;this.active=false;this.finishing=false;}
 draw(value){this.value=value;this.ring.style.strokeDashoffset=String(100*(1-value));this.tip.style.transform=`rotate(${360*value}deg)`;const percent=Math.round(value*100);this.label.textContent=percent+' %';this.bar.setAttribute('aria-valuenow',percent);}
 start(){this.cancel();this.active=true;this.target=0;this.draw(0);this.dialog.showModal();let previous=performance.now();const tick=now=>{if(!this.active||this.finishing)return;const dt=now-previous;previous=now;this.draw(Math.min(this.target,this.value+(this.target-this.value)*(1-Math.exp(-dt/35))));this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);}
 progress(value){if(this.active&&!this.finishing&&Number.isFinite(value))this.target=Math.max(this.target,Math.min(.99,Math.max(0,value)));}
 finish(done){if(this.finishing)return;if(!this.active){done();return;}this.finishing=true;cancelAnimationFrame(this.frame);const start=performance.now(),from=this.value;const tick=now=>{if(!this.active)return;const p=Math.min(1,(now-start)/80);this.draw(from+(1-from)*p);if(p<1)this.frame=requestAnimationFrame(tick);else this.timer=setTimeout(()=>{this.cancel();done();},32);};this.frame=requestAnimationFrame(tick);}
 cancel(){this.active=false;this.finishing=false;cancelAnimationFrame(this.frame);clearTimeout(this.timer);if(this.dialog.open)this.dialog.close();}
}
global.CalibrationView=CalibrationView;
})(window);
