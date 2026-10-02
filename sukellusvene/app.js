(() => {
  'use strict';
  const canvas=document.getElementById('sea'), loading=document.getElementById('loading');
  const controls=document.querySelector('.controls'), pause=document.getElementById('pause');
  const speed=document.getElementById('speed'), surface=document.getElementById('surface');
  const submarine=document.getElementById('submarine'), submarineImage=document.getElementById('submarine-image');
  const startStation=document.getElementById('station-start'), endStation=document.getElementById('station-end');
  const startStationImage=document.getElementById('station-start-image'),endStationImage=document.getElementById('station-end-image');
  const rotateNotice=document.getElementById('rotate-notice');
  const settingsPanel=document.getElementById('settings-panel');
  const settingsButton=document.getElementById('settings-open');
  let settings=window.SeaSettings.read(),settingsOpen=false,previewStation='start';
  let noteChoice=window.SeaMusic.read(),notesOpen=true,gameStarted=false;
  const notesButton=document.getElementById('notes-open');
  const useMicrophone=document.getElementById('use-microphone'),micButton=document.getElementById('mic-toggle');
  const micPanel=document.getElementById('mic-panel'),micStatus=document.getElementById('mic-status');
  const micProgress=document.getElementById('mic-progress'),micDb=document.getElementById('mic-db');
  const micRetry=document.getElementById('mic-retry'),micMargin=document.getElementById('mic-margin');
  let microphone,micBusy=false,micMessage='';
  const encounters=new window.SeaEncounters();
  const encounterLayer=document.getElementById('encounters'),encounterNodes=new Map();
  const depthLines=document.getElementById('depth-lines'),depthLineNodes=[];
  const warningLight=document.getElementById('mine-warning');
  const submarineNote=document.getElementById('submarine-note');
  const fuelValue=document.getElementById('fuel-value'),fuelMeter=document.getElementById('fuel-meter'),fuelEmpty=document.getElementById('fuel-empty');
  const scoreboard=document.getElementById('scoreboard'),scoreValue=document.getElementById('score-value'),feedback=document.getElementById('game-feedback');
  let coastSpeed=0,coastStartPosition=0;
  let selectedLevel=null,journeyStarted=false,boatY=null,heldInput=null,heldSeconds=0,depthVelocity=0,boatPitch=0;
  const depthKeys='qwertyui';
  const depthButtons=Array.from(document.querySelectorAll('[data-depth]'));
  const files=['meri-1.png',...Array.from({length:6},(_,i)=>`meri-${i+1}.png`),'meri-6.png'];
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let running=!reducedMotion.matches;
  let renderer, images, layout, position=0, lastTime=null, frameId=null, lost=false, wide=true;
  let dockStartY=0,dockStartPitch=0,departureComplete=false;
  let phase='cruise', phaseTime=0, smoothedSpeed=Number(speed.value)/900, lastPainted=null;
  const definitions=window.stationDefinitions;
  function terminal(){return phase==='arrived'||phase==='stranded';}
  function active(){return Boolean(renderer)&&running&&!micBusy&&!settingsOpen&&!notesOpen&&!document.hidden&&!lost&&wide;}
  function depthActive(){return running&&phase==='cruise'&&Boolean(renderer)&&!micBusy&&!settingsOpen&&!notesOpen&&!document.hidden&&!lost&&wide;}
  function targetY(){return !departureComplete||selectedLevel===null?layout.start.dockY:window.Voyage.depthY(selectedLevel,layout,controls.offsetHeight+32);}
  function depthMoving(){return depthActive()&&boatY!==null&&(boatY!==targetY()||depthVelocity!==0||boatPitch!==0);}
  function releaseDepth(input){if(input===undefined||heldInput===input){heldInput=null;heldSeconds=0;}}
  function syncMotion(){
    surface.classList.toggle('moving',active()&&phase!=='stranded');
    encounterLayer.classList.toggle('moving',active()&&!terminal());
    submarine.classList.toggle('cruising',active()&&!terminal());
    microphone?.setActive(active()&&phase==='cruise'&&departureComplete);
  }
  function draw(force=false){
    if(!layout)return;
    const pose=settingsOpen
      ?(previewStation==='start'?{position:0,x:layout.start.dockX,y:layout.start.dockY}:{position:layout.destination,x:layout.end.dockX,y:layout.end.dockY})
      :window.Voyage.pose(phase,phaseTime,position,layout,selectedLevel,controls.offsetHeight+32);
    if(!settingsOpen){
      if(phase!=='docking'&&phase!=='arrived')pose.y=boatY??pose.y;
      else Object.assign(pose,window.Voyage.dockPose(phase==='arrived'?window.Voyage.dockDuration:phaseTime,layout,dockStartY,dockStartPitch));
      position=pose.position;
    }
    submarine.style.transform=`translate3d(${pose.x-layout.boatW/2}px,${pose.y-layout.boatH/2}px,0) rotate(${settingsOpen||reducedMotion.matches?0:(pose.pitch??boatPitch)}deg)`;
    const offset=pose.position*layout.step;
    startStation.style.transform=`translate3d(${layout.start.left-offset}px,${layout.start.top}px,0)`;
    endStation.style.transform=`translate3d(${layout.endWorld-offset}px,${layout.end.top}px,0)`;
    drawEncounters();
    drawGuidance(pose);
    if(force||pose.position!==lastPainted){renderer.draw(pose.position);lastPainted=pose.position;}
  }
  function drawGuidance(pose){
    const visible=gameStarted&&!settingsOpen&&!notesOpen&&phase==='cruise';
    depthLines.hidden=!visible;
    while(depthLineNodes.length<noteChoice.notes.length){
      const line=document.createElement('div');line.className='depth-line';depthLines.append(line);depthLineNodes.push(line);
    }
    const hint=encounters.guidance({layout,position,boatY,pitch:boatPitch,bottomGap:controls.offsetHeight+32,speed:smoothedSpeed});
    let currentIndex=0,nearestDistance=Infinity;
    for(const [index,line] of depthLineNodes.entries()){
      line.hidden=index>=noteChoice.notes.length;
      if(line.hidden)continue;
      const level=window.SeaMusic.level(index,noteChoice.notes.length);
      const lineY=window.Voyage.depthY(level,layout,controls.offsetHeight+32);
      line.style.transform=`translateY(${lineY}px)`;
      const distance=Math.abs(pose.y-lineY);
      if(distance<nearestDistance){nearestDistance=distance;currentIndex=index;}
      line.classList.toggle('target',visible&&hint.target?.level===level);
    }
    const danger=visible&&departureComplete&&hint.danger;
    warningLight.hidden=!danger;submarine.classList.toggle('danger',danger);
    submarineNote.hidden=!gameStarted||settingsOpen||notesOpen;
    const name=window.SeaMusic.pitchName(noteChoice.notes[currentIndex]);
    if(submarineNote.textContent!==name)submarineNote.textContent=name;
    submarine.setAttribute('aria-label','Sukellusvene, nykyinen säveltaso '+name+(danger?'. Varo miinaa.':''));
  }
  function drawEncounters(){
    const visible=gameStarted&&!settingsOpen&&!notesOpen;
    scoreboard.hidden=!visible;encounterLayer.hidden=!visible;
    fuelEmpty.hidden=!visible||phase!=='stranded';
    if(scoreValue.textContent!==String(encounters.score))scoreValue.textContent=String(encounters.score);
    const percent=Math.ceil(encounters.fuel);
    if(fuelValue.textContent!==percent+' %')fuelValue.textContent=percent+' %';
    fuelMeter.value=encounters.fuel;scoreboard.classList.toggle('low-fuel',encounters.fuel<=25);
    const message=visible?encounters.feedback:'';
    if(feedback.textContent!==message)feedback.textContent=message;
    submarine.classList.toggle('hit',visible&&encounters.hitTime>0);
    const live=new Set(encounters.items.map(item=>item.id));
    for(const [id,node] of encounterNodes)if(!live.has(id)){node.remove();encounterNodes.delete(id);}
    for(const item of encounters.items){
      let node=encounterNodes.get(item.id);
      if(!node){
        node=document.createElement('div');node.className='encounter '+item.kind;node.dataset.kind=item.kind;
        node.dataset.level=String(item.level);
        const img=document.createElement('img');img.src='assets/'+item.kind+'.webp';img.alt='';img.draggable=false;node.append(img);
        const label=document.createElement('span');label.className='encounter-note';
        label.textContent=window.SeaMusic.pitchName(item.midi);node.append(label);
        encounterLayer.append(node);encounterNodes.set(item.id,node);
      }
      const g=encounters.geometry(item,layout,position,controls.offsetHeight+32);
      node.hidden=g.x+g.size<0||g.x-g.size>layout.width;
      if(node.hidden)continue;
      node.style.width=g.size+'px';node.style.height=g.size+'px';
      node.style.transform=`translate3d(${g.x-g.size/2}px,${g.y-g.size/2}px,0)`;
    }
  }
  function resize(){
    encounters.suspend();
    const width=canvas.clientWidth,height=canvas.clientHeight;
    wide=width>=height*1.2;
    rotateNotice.hidden=wide;
    if(renderer&&!lost&&height){
      const previousHeight=layout?.height;
      if(previousHeight){depthVelocity*=height/previousHeight;dockStartY*=height/previousHeight;}
      layout=window.Voyage.layout(width,height,definitions,settings);
      boatY=!departureComplete||selectedLevel===null?layout.start.dockY:Math.max(window.Voyage.depthY(7,layout,controls.offsetHeight+32),Math.min(window.Voyage.depthY(0,layout,controls.offsetHeight+32),(boatY??layout.start.dockY)*height/(previousHeight||height)));
      if(!journeyStarted){position=layout.startPosition;journeyStarted=true;}
      surface.style.setProperty('--scene-height',`${height}px`);
      renderer.resize(width,height);
      for(const [el,station] of [[startStation,layout.start],[endStation,layout.end]]){
        el.style.width=`${station.width}px`;el.style.height=`${station.height}px`;
      }
      draw(true);
    }
    if(!wide)releaseDepth();
    resetClock();
  }
  function schedule(){if(frameId===null&&((active()&&!terminal())||depthMoving()))frameId=requestAnimationFrame(frame);}
  function changePhase(next){
    if(next==='coasting'){coastSpeed=smoothedSpeed;coastStartPosition=position;releaseDepth();}
    if(next==='stranded'){depthVelocity=0;boatPitch=0;encounters.hitTime=0;}
    if(next==='docking'){dockStartY=boatY;dockStartPitch=boatPitch;releaseDepth();depthVelocity=0;selectedLevel=null;}
    phase=next;phaseTime=0;updateDepthUI();updatePause();syncMotion();
  }
  function frame(time){
    frameId=null;
    if(!(active()&&!terminal())&&!depthMoving())return;
    const elapsed=lastTime===null?0:Math.min((time-lastTime)/1000,.1);
    lastTime=time;
    smoothedSpeed+=(Number(speed.value)/900-smoothedSpeed)*(1-Math.exp(-elapsed*5));
    if(active())phaseTime+=elapsed;
    if(active()&&phase==='cruise'){
      const previousPosition=position;
      position=window.advanceJourney(position,layout.destination,smoothedSpeed,elapsed);
      encounters.consume(position-previousPosition);
      if(!departureComplete&&window.Voyage.departureClear(position,layout)){departureComplete=true;syncMotion();}
      if(position>=layout.destination)changePhase('docking');
    }
    if(active()&&phase==='coasting'){
      const t=Math.min(phaseTime,1.5);
      position=coastStartPosition+coastSpeed*(t-t*t/3);
      const decay=Math.exp(-elapsed*8);
      boatY=Math.max(window.Voyage.depthY(7,layout,controls.offsetHeight+32),Math.min(window.Voyage.depthY(0,layout,controls.offsetHeight+32),boatY+depthVelocity*(1-decay)/8));
      depthVelocity*=decay;
      boatPitch*=Math.exp(-elapsed*8);
      if(phaseTime>=1.5)changePhase('stranded');
    }
    if(active()&&phase==='docking'&&phaseTime>=window.Voyage.dockDuration)changePhase('arrived');
    if(depthMoving()){
      const motion=window.Voyage.advanceDepth(boatY,targetY(),depthVelocity,layout.height,heldInput===null?null:heldSeconds,elapsed);
      boatY=motion.y;depthVelocity=motion.velocity;
      const targetPitch=reducedMotion.matches?0:Math.max(-8,Math.min(8,depthVelocity/layout.height*24));
      boatPitch+=(targetPitch-boatPitch)*(1-Math.exp(-elapsed/ .12));
      if(targetPitch===0&&Math.abs(boatPitch)<.01)boatPitch=0;
      if(heldInput!==null)heldSeconds+=elapsed;
    }
    if(active())encounters.update({seconds:elapsed,layout,position,boatY,pitch:boatPitch,bottomGap:controls.offsetHeight+32,departed:departureComplete,cruising:phase==='cruise'});
    else encounters.suspend();
    if(active()&&phase==='cruise'&&encounters.fuel<=1e-8)changePhase('coasting');
    draw();schedule();
  }
  function resetClock(){
    lastTime=null;encounters.suspend();syncMotion();
    if(frameId!==null){cancelAnimationFrame(frameId);frameId=null;}
    schedule();
  }
  function updatePause(){
    const arrived=terminal(),failed=phase==='stranded';
    document.getElementById('pause-icon').textContent=arrived?'↻':running?'Ⅱ':'▶';
    document.getElementById('pause-label').textContent=arrived?(failed?'Uusi yritys':'Uusi matka'):running?'Tauko':'Jatka';
    pause.setAttribute('aria-label',arrived?'Aloita uusi matka lähtöasemalta':running?'Pysäytä matka':'Jatka matkaa');
  }
  function startJourney(choice){
    noteChoice=choice;notesOpen=false;gameStarted=true;encounters.reset(choice.notes,layout);
    for(const node of encounterNodes.values())node.remove();encounterNodes.clear();
    departureComplete=false;position=layout.startPosition;phaseTime=0;phase='cruise';selectedLevel=null;boatY=layout.start.dockY;depthVelocity=0;boatPitch=0;
    releaseDepth();updateDepthUI();running=true;smoothedSpeed=Number(speed.value)/900;draw(true);updatePause();resetClock();
    microphone.setNotes(choice.notes);
    if(useMicrophone.checked)microphone.start();else microphone.stop();
  }
  const notePicker=window.createNotePicker({onStart:startJourney,onCancel:()=>{notesOpen=false;draw();resetClock();notesButton.focus();}});
  function openNotes(){releaseDepth();notesOpen=true;draw();resetClock();notePicker.open(noteChoice,gameStarted);}
  notesButton.addEventListener('click',openNotes);
  document.getElementById('fuel-retry').addEventListener('click',()=>startJourney(noteChoice));
  pause.addEventListener('click',()=>{
    if(phase==='stranded'){startJourney(noteChoice);return;}
    if(phase==='arrived'){
      openNotes();return;
    }else running=!running;
    updatePause();resetClock();
  });
  speed.addEventListener('input',()=>{document.getElementById('speed-value').value=speed.value;});
  function updateDepthUI(){
    for(const [index,button] of depthButtons.entries()){
      const midi=noteChoice.notes[index],available=midi!==undefined;
      button.hidden=!available;button.disabled=!available||phase!=='cruise';
      button.setAttribute('aria-pressed',String(available&&window.SeaMusic.level(index,noteChoice.notes.length)===selectedLevel));
      if(available){const name=window.SeaMusic.noteName(midi);button.querySelector('span').textContent=window.SeaMusic.pitchName(midi);button.setAttribute('aria-label',depthKeys[index].toUpperCase()+', '+name);}
    }
    document.querySelector('.depth-controls').setAttribute('aria-label','Valitut sävelet matalimmasta korkeimpaan; korkein lähellä pintaa');
  }
  function selectDepth(index,input=null){
    if(!depthActive()||index<0||index>=noteChoice.notes.length)return;
    const level=window.SeaMusic.level(index,noteChoice.notes.length);
    if(heldInput!==input||selectedLevel!==level)heldSeconds=0;
    heldInput=input;selectedLevel=level;updateDepthUI();
    if(frameId===null)lastTime=null;
    schedule();
  }
  document.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.repeat||settingsOpen||notesOpen)return;
    const editable=event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
    if(event.target?.isContentEditable||(editable&&!(editable.tagName==='INPUT'&&editable.type==='range')))return;
    const level=depthKeys.indexOf(event.key.toLowerCase());
    if(level<0||event.key.length!==1)return;
    event.preventDefault();selectDepth(level,'key:'+event.key.toLowerCase());
  });
  document.addEventListener('keyup',event=>releaseDepth('key:'+event.key.toLowerCase()));
  window.addEventListener('blur',()=>releaseDepth());
  for(const button of depthButtons){
    button.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      event.preventDefault();button.focus();button.setPointerCapture(event.pointerId);
      selectDepth(Number(button.dataset.depth),'pointer:'+event.pointerId);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>releaseDepth('pointer:'+event.pointerId));
    // Keyboard activation and assistive technology still support a gentle tap.
    button.addEventListener('click',event=>{if(event.detail===0)selectDepth(Number(button.dataset.depth));});
    button.addEventListener('contextmenu',event=>event.preventDefault());
  }
  updateDepthUI();
  const settingInputs=Array.from(document.querySelectorAll('[data-setting]'));
  const previewButtons=Array.from(document.querySelectorAll('[data-preview]'));
  function updateSettingsUI(){
    for(const input of settingInputs){
      const value=settings[input.dataset.setting];input.value=value;
      document.getElementById(input.id+'-value').value=`${value} %`;
    }
    for(const button of previewButtons)button.setAttribute('aria-pressed',String(button.dataset.preview===previewStation));
  }
  function applySettings(){
    window.SeaSettings.save(settings);updateSettingsUI();
    if(renderer&&!lost){
      layout=window.Voyage.layout(canvas.clientWidth,canvas.clientHeight,definitions,settings);
      for(const [el,station] of [[startStation,layout.start],[endStation,layout.end]]){
        el.style.width=`${station.width}px`;el.style.height=`${station.height}px`;
      }
      draw(true);
    }
  }
  settingsButton.addEventListener('click',()=>{
    releaseDepth();settingsOpen=true;previewStation=phase!=='cruise'?'end':'start';
    updateSettingsUI();resetClock();settingsPanel.showModal();draw(true);
  });
  document.getElementById('settings-close').addEventListener('click',()=>settingsPanel.close());
  settingsPanel.addEventListener('close',()=>{settingsOpen=false;draw(true);resetClock();settingsButton.focus();});
  for(const input of settingInputs)input.addEventListener('input',()=>{
    settings[input.dataset.setting]=Number(input.value);
    if(input.dataset.setting.startsWith('start'))previewStation='start';
    if(input.dataset.setting.startsWith('end'))previewStation='end';
    applySettings();
  });
  for(const button of previewButtons)button.addEventListener('click',()=>{previewStation=button.dataset.preview;updateSettingsUI();draw(true);});
  document.getElementById('settings-reset').addEventListener('click',()=>{settings={...window.SeaSettings.defaults};applySettings();});
  updateSettingsUI();
  function updateMicrophone(state,message=''){
    micMessage=message;micBusy=['opening','calibrating','error','interrupted'].includes(state);
    micButton.textContent=state==='ready'?'Mikki päällä':'Avaa mikki';
    micButton.setAttribute('aria-pressed',String(state==='ready'));
    micStatus.textContent=message||(state==='opening'?'Salli mikrofonin käyttö…':state==='calibrating'?'Ole hiljaa hetki · mitataan taustakohinaa':'Mikrofoni valmis');
    micRetry.hidden=state!=='error'&&state!=='interrupted';
    micProgress.hidden=state!=='calibrating';micDb.hidden=state!=='calibrating';
    if(state==='opening'){micProgress.value=0;micDb.textContent='';}
    if(micBusy&&!document.hidden&&!micPanel.open)micPanel.showModal();
    if(!micBusy&&micPanel.open)micPanel.close();
    resetClock();
  }
  microphone=new window.SeaMicrophone({
    onNote:midi=>{
      if(!active()||!departureComplete||phase!=='cruise'||(heldInput!==null&&heldInput!=='mic'))return;
      const index=noteChoice.notes.indexOf(midi);
      if(index<0)return;
      if(heldInput!=='mic'||selectedLevel!==window.SeaMusic.level(index,noteChoice.notes.length))selectDepth(index,'mic');
    },
    onRelease:()=>releaseDepth('mic'),onState:updateMicrophone,
    onProgress:({progress,noiseRms})=>{
      micProgress.value=progress;
      const text=Math.round(progress*100)+' % · '+Math.round(20*Math.log10(Math.max(noiseRms,1e-6)))+' dB';
      if(micDb.textContent!==text)micDb.textContent=text;
    }
  });
  microphone.setNotes(noteChoice.notes);
  micMargin.value=microphone.margin;document.getElementById('mic-margin-value').textContent='+'+microphone.margin+' dB';
  micMargin.addEventListener('input',()=>{document.getElementById('mic-margin-value').textContent='+'+microphone.setMargin(Number(micMargin.value))+' dB';});
  micButton.addEventListener('click',()=>{
    if(microphone.state==='ready'){useMicrophone.checked=false;microphone.stop();}
    else {useMicrophone.checked=true;microphone.start();}
  });
  const useButtons=()=>{useMicrophone.checked=false;microphone.stop();};
  document.getElementById('mic-manual').addEventListener('click',useButtons);
  micRetry.addEventListener('click',()=>microphone.start());
  micPanel.addEventListener('cancel',event=>{event.preventDefault();useButtons();});
  document.addEventListener('visibilitychange',()=>{
    releaseDepth();
    if(document.hidden)microphone.interrupt();else updateMicrophone(microphone.state,micMessage);
    resetClock();
  });
  window.addEventListener('pagehide',()=>microphone.interrupt());
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();releaseDepth();lost=true;resetClock();});
  canvas.addEventListener('webglcontextrestored',()=>{
    try{renderer.initializeGL();lost=false;resize();}catch{showError();}
  });
  function showError(){loading.hidden=false;loading.textContent='Maisemien avaaminen ei onnistunut. Päivitä sivu ja kokeile uudelleen.';}
  new ResizeObserver(resize).observe(canvas);updatePause();
  Promise.all([submarineImage.decode(),startStationImage.decode(),endStationImage.decode(),
    Promise.all(['pearl.webp','mine.webp','fuel.webp',...files].map(file=>new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=`assets/${file}`;
    })))
  ]).then(([, , , loaded])=>{
    images=loaded.slice(3);renderer=new window.SeaRenderer(canvas,images);resize();
    loading.hidden=true;controls.hidden=false;surface.hidden=false;submarine.hidden=false;
    startStation.hidden=false;endStation.hidden=false;resetClock();
    resize();notePicker.open(noteChoice,false);
  }).catch(showError);
})();
