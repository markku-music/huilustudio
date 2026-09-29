/* Compact live editor. Only layout changes invoke OSMD; SVG transforms and
 * cropping reuse cached frames. Layout jobs are serialized and coalesced.
 */
(() => {
  'use strict';
  const DISPLAY={autoCenterX:true,visualScale:171,canvasHeight:265,translateX:0,translateY:51,panelPadTop:8,panelPadRight:18,panelPadBottom:8,panelPadLeft:18};
  const GROUPS=[
    {title:'Koko ja sijainti',open:true,fields:[
      ['display','visualScale','Asteikon koko (%)',40,220,1],
      ['display','canvasHeight','Nuottialueen korkeus (px)',100,800,5],
      ['display','translateX','Sijainti X (px)',-400,400,1],
      ['display','translateY','Sijainti Y (px)',-300,300,1]
    ]},
    {title:'Nuotit ja viivat',open:true,help:'Välien 100 % on alkuperäinen väli ja 0 % pienin turvaväli. Etumerkki pysyy nuottinsa mukana. Yleinen nuottiväli ja paksuudet vaativat lyhyen ladontapäivityksen.',fields:[
      ['osmd','clefGapPercent','Nuottiavaimen jälkeinen väli (%)',0,200,1],
      ['osmd','endGapPercent','Viivaston loppuväli (%)',0,200,1],
      ['osmd','accidentalGapPercent','Väli ennen etumerkillistä nuottia (%)',0,200,1],
      ['rule','VoiceSpacingMultiplierVexflow','Nuottien väli',0.3,1.5,0.05],
      ['rule','StaffLineWidth','Viivaston paksuus',0.05,0.4,0.01],
      ['rule','StemWidth','Varsien paksuus',0.05,0.5,0.01]
    ]},
    {title:'Tyhjän tilan rajaus',help:'Rajaus suurentaa jäljelle jäävää aluetta. Liian suuri rajaus voi leikata nuotteja.',fields:[
      ['osmd','cropLeftPct','Rajaus vasemmalta (%)',0,40,0.25],
      ['osmd','cropRightPct','Rajaus oikealta (%)',0,40,0.25],
      ['osmd','cropTopPct','Rajaus ylhäältä (%)',0,40,0.25],
      ['osmd','cropBottomPct','Rajaus alhaalta (%)',0,40,0.25]
    ]},
    {title:'Paneelin reunatilat',fields:[
      ['display','panelPadTop','Reunatila ylhäällä (px)',0,100,1],
      ['display','panelPadRight','Reunatila oikealla (px)',0,100,1],
      ['display','panelPadBottom','Reunatila alhaalla (px)',0,100,1],
      ['display','panelPadLeft','Reunatila vasemmalla (px)',0,100,1]
    ]}
  ];
  const FIELDS=GROUPS.flatMap(group=>group.fields);
  class ResonatorScoreEditor {
    constructor({score,root,gear,storageKey,osmd,display,getScale,onChange}) {
      Object.assign(this,{score,root,gear,storageKey,getScale,onChange});
      this.controls=new Map();this.isReady=false;this.busy=false;this.pending=false;this.timer=null;this.saveTimer=null;
      this.json=document.getElementById('devJsonOutput');this.status=document.getElementById('devStatus');
      this.assignSettings(osmd,display);this.build();this.populate();
      this.centerFrame=null;
      window.addEventListener('resize',()=>this.scheduleCenter());
      if(window.ResizeObserver){
        this.resizeObserver=new window.ResizeObserver(()=>this.scheduleCenter());
        this.resizeObserver.observe(score.container);
      }
      gear.addEventListener('click',()=>{
        const open=root.hidden;root.hidden=!open;gear.setAttribute('aria-expanded',String(open));
        document.body.classList.toggle('dev-open',open);window.dispatchEvent(new Event('resize'));
        if(open)this.updateJson();
      });
      document.getElementById('devCopy').addEventListener('click',()=>this.copy());
      document.getElementById('devLoadJson').addEventListener('click',()=>this.load());
      document.getElementById('devReset').addEventListener('click',()=>this.reset());
      // Flush pending persistence without creating a second layout job.
      window.addEventListener('pagehide',()=>this.save());
    }
    value(scope,key){return scope==='display'?this.display[key]:scope==='rule'?this.osmd.rules[key]:this.osmd[key];}
    put(scope,key,value){if(scope==='display')this.display[key]=value;else if(scope==='rule')this.osmd.rules[key]=value;else this.osmd[key]=value;}
    bounded(raw,field,fallback){
      const n=typeof raw==='number'||typeof raw==='string'&&raw.trim()!==''?Number(raw):NaN;
      if(!Number.isFinite(n))return fallback;
      const [, , ,min,max,step]=field;
      return Number((min+Math.round((Math.min(max,Math.max(min,n))-min)/step)*step).toFixed(4));
    }
    assignSettings(osmd={},display={}){
      // Whitelist visible settings so hidden legacy rules cannot override sliders.
      this.osmd=window.ResonatorScoreDisplay.defaults();this.display={...DISPLAY,autoCenterX:display?.autoCenterX!==false};
      for(const field of FIELDS){
        const [scope,key]=field;
        const raw=scope==='display'?display?.[key]:scope==='rule'?osmd?.rules?.[key]:osmd?.[key];
        this.put(scope,key,this.bounded(raw,field,this.value(scope,key)));
      }
      this.onChange(this.osmd,this.display);
    }
    build(){
      const host=document.getElementById('scoreEditorControls');host.replaceChildren();
      for(const group of GROUPS){
        const section=document.createElement('details'),summary=document.createElement('summary');
        section.open=!!group.open;summary.textContent=group.title;section.append(summary);
        if(group===GROUPS[0]){
          const label=document.createElement('label'),checkbox=document.createElement('input'),text=document.createElement('span');
          label.className='dev-auto-center';checkbox.type='checkbox';checkbox.id='edit_autoCenterX';
          text.textContent='Keskitä vaakasuunnassa automaattisesti';label.append(checkbox,text);section.append(label);this.autoCenter=checkbox;
          checkbox.addEventListener('change',()=>{
            this.display.autoCenterX=checkbox.checked;this.syncCenterControls();this.onChange(this.osmd,this.display);
            this.applyDisplay();this.saveSoon();this.updateJson();
          });
          const help=document.createElement('p');help.className='dev-section-help';help.textContent='Keskittää näkyvän viivaston. X-käsisäätö vapautuu, kun poistat valinnan.';section.append(help);
        }
        if(group.help){const help=document.createElement('p');help.className='dev-section-help';help.textContent=group.help;section.append(help);}
        for(const field of group.fields){
          const [scope,key,title,min,max,step]=field;
          const row=document.createElement('div'),label=document.createElement('label'),slider=document.createElement('input'),number=document.createElement('input');
          row.className='dev-control';label.htmlFor=`edit_${key}`;label.textContent=title;
          slider.type='range';slider.id=`edit_${key}`;slider.dataset.setting=key;
          number.type='number';number.id=`edit_${key}_value`;number.setAttribute('aria-label',`${title}, numeroarvo`);
          for(const input of [slider,number]){input.min=String(min);input.max=String(max);input.step=String(step);}
          slider.addEventListener('input',()=>this.edit(field,slider.value,slider));
          number.addEventListener('input',()=>{
            if(number.value.trim()==='')return;
            const n=Number(number.value);if(Number.isFinite(n)&&n>=min&&n<=max)this.edit(field,n,number);
          });
          number.addEventListener('change',()=>{
            this.edit(field,number.value,slider);number.value=String(this.value(scope,key));
          });
          row.append(label,slider,number);section.append(row);this.controls.set(key,{field,slider,number});
        }
        host.append(section);
      }
    }
    populate(){
      for(const {field,slider,number} of this.controls.values())slider.value=number.value=String(this.value(field[0],field[1]));
      this.syncCenterControls();this.updateJson(true);
    }
    syncCenterControls(){
      this.autoCenter.checked=this.display.autoCenterX;
      const x=this.controls.get('translateX');
      x.slider.disabled=x.number.disabled=this.display.autoCenterX;
    }
    edit(field,raw,source){
      const [scope,key]=field,value=this.bounded(raw,field,this.value(scope,key));
      this.put(scope,key,value);const pair=this.controls.get(key);pair.slider.value=String(value);
      if(source!==pair.number)pair.number.value=String(value);
      this.onChange(this.osmd,this.display);
      if(scope==='rule')this.requestLayout();
      else{
        if(scope==='osmd')this.score.updateViewport(this.osmd);
        this.applyDisplay();this.saveSoon();
        if(!this.busy&&!this.pending)this.setStatus('Valmis · muutos näkyy heti.');
      }
      this.updateJson();
    }
    scheduleCenter(){
      if(this.centerFrame!==null)return;
      this.centerFrame=requestAnimationFrame(()=>{this.centerFrame=null;this.applyDisplay();});
    }
    applyDisplay(display=this.display){
      const canvas=this.score.container,panel=canvas.closest('.score-panel');
      canvas.style.height=`${display.canvasHeight}px`;canvas.style.justifyContent='center';canvas.style.alignItems='center';
      panel.style.padding=`${display.panelPadTop}px ${display.panelPadRight}px ${display.panelPadBottom}px ${display.panelPadLeft}px`;
      // Apply to cached scales too, so changing scales preserves live adjustments.
      for(const svg of this.score.frames.values()){
        svg.style.width='100%';svg.style.maxWidth='760px';
        svg.style.transform=`translate(${display.autoCenterX?0:display.translateX}px,${display.translateY}px) scale(${display.visualScale/100})`;
        svg.style.transformOrigin='center center';
      }
      if(display.autoCenterX){
        const svg=canvas.querySelector('svg'),center=svg?this.score.contentCenterX(svg):null;
        // getScreenCTM includes viewBox fitting, cropping and CSS magnification.
        // It maps SVG units to the same CSS-pixel coordinates as the viewport.
        const matrix=svg?.getScreenCTM?.();
        if(center!==null&&matrix){
          const panelRect=panel.getBoundingClientRect();
          const target=document.body.classList.contains('dev-open')
            ?panelRect.left+panelRect.width/2:window.innerWidth/2;
          const correction=target-(matrix.a*center+matrix.e);
          if(Number.isFinite(correction))svg.style.transform=`translate(${correction}px,${display.translateY}px) scale(${display.visualScale/100})`;
        }
      }
    }
    ready(){this.isReady=true;this.score.updateViewport(this.osmd);this.applyDisplay();if(this.pending)this.requestLayout();else this.setStatus('Valmis · säädöt tallentuvat automaattisesti.');}
    requestLayout(){
      this.pending=true;this.setStatus('Päivitetään asteikkoa…');
      // Throttle, not trailing-edge debounce: continuous dragging keeps updating.
      if(this.isReady&&!this.busy&&this.timer===null)this.timer=setTimeout(()=>this.flush(),80);
    }
    async flush(){
      this.timer=null;if(!this.isReady||this.busy||!this.pending)return;
      this.busy=true;this.pending=false;
      const snapshot=JSON.parse(JSON.stringify(this.osmd));
      try{
        const ok=await this.score.applySettings(snapshot);
        if(ok===false)throw new Error('Nuottikuvan päivitys keskeytyi.');
        this.score.show(this.getScale());this.score.updateViewport(this.osmd);this.applyDisplay();
        if(!this.pending){this.updateJson();this.save();this.setStatus('Valmis · säädöt tallennettu.');}
      }catch(error){console.error('Asteikon säädöt:',error);this.setStatus(`Päivitys epäonnistui: ${error.message||error}. Kokeile lähtöarvojen palautusta.`);}
      finally{this.busy=false;if(this.pending)this.requestLayout();}
    }
    payload(){return {schema:'ResonatorEngine.OSMDScaleEditor/2',base:'ResonatorEngine_1.0.12_OSMD_LIUKURIT_0_5_VALMIS',selectedScale:this.getScale(),osmd:this.osmd,display:this.display};}
    updateJson(force=false){if(force||document.activeElement!==this.json)this.json.value=JSON.stringify(this.payload(),null,2);}
    saveSoon(){clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.save(),180);}
    save(){clearTimeout(this.saveTimer);try{window.localStorage?.setItem(this.storageKey,JSON.stringify(this.payload()));}catch{this.setStatus('Selaintallennus ei onnistu. Ota asetukset talteen JSONina.');}}
    setStatus(text){this.status.textContent=text;}
    async copy(){
      this.updateJson(true);
      try{await navigator.clipboard.writeText(this.json.value);this.setStatus('JSON kopioitu.');}
      catch{
        this.json.closest('details').open=true;this.json.focus();this.json.select();
        let copied=false;try{copied=!!document.execCommand('copy');}catch{}
        this.setStatus(copied?'JSON kopioitu.':'JSON valittu. Kopioi se ⌘C- tai Ctrl+C-näppäimillä.');
      }
    }
    load(){
      try{
        const data=JSON.parse(this.json.value);
        if(!data||typeof data!=='object'||Array.isArray(data)||(!data.osmd&&!data.display))throw new Error('Tarvitaan osmd- tai display-asetukset.');
        for(const key of ['osmd','display'])if(data[key]!==undefined&&(!data[key]||typeof data[key]!=='object'||Array.isArray(data[key])))throw new Error(`${key}-asetusten on oltava objekti.`);
        this.assignSettings(data.osmd??this.osmd,data.display??this.display);this.populate();
        this.score.updateViewport(this.osmd);this.applyDisplay();this.requestLayout();
      }catch(error){this.setStatus(`JSON-virhe: ${error.message}`);}
    }
    reset(){this.assignSettings();this.populate();this.score.updateViewport(this.osmd);this.applyDisplay();this.requestLayout();}
  }
  window.RESONATOR_DISPLAY_DEFAULTS=Object.freeze({...DISPLAY});
  window.ResonatorScoreEditor=ResonatorScoreEditor;
})();
