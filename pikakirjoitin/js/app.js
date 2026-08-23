    const A4_WIDTH=794,A4_HEIGHT=1123,A4_VISIBLE_FRACTION=.62,DEFAULT_MIN_MIDI=36,DEFAULT_MAX_MIDI=95,WHITE_COUNT=35,BLACK_WIDTH=.62,TUNING_KEY='pikakirjoitin.tuning',CLEF_KEY='pikakirjoitin.clef',THEME_KEY='pikakirjoitin.theme',MODIFIER_Y_KEY='pikakirjoitin.modifierY',LONG_PRESS_MS=500,LONG_PRESS_MOVE=14,SCORE_SCROLL_SLOP=8,WRITE_SELECTION_HOLD_MS=420,WRITE_SELECTION_MOVE=12,EDIT_SELECTION_HOLD_MS=420,EDIT_SELECTION_MOVE=12;
    const piano=document.querySelector('#piano'),whiteKeys=document.querySelector('#whiteKeys'),keyboardPanel=document.querySelector('#keyboardPanel'),keyboardViewport=document.querySelector('#keyboardViewport'),keyboardScrollRail=document.querySelector('#keyboardScrollRail'),keyboardScrollTrack=document.querySelector('#keyboardScrollTrack'),keyboardScrollThumb=document.querySelector('#keyboardScrollThumb'),scoreArea=document.querySelector('.score-area'),modifierRail=document.querySelector('#modifierRail'),modifierDragHandle=document.querySelector('#modifierDragHandle'),doubleDotButton=document.querySelector('#doubleDotButton'),thirtysecondButton=document.querySelector('#thirtysecondButton'),restSixteenthButton=document.querySelector('#restSixteenthButton'),restThirtysecondButton=document.querySelector('#restThirtysecondButton'),tripletButton=document.querySelector('#tripletButton'),quintupletButton=document.querySelector('#quintupletButton'),sextupletButton=document.querySelector('#sextupletButton'),tupletButtonNumber=document.querySelector('#tupletButtonNumber'),tieButton=document.querySelector('#tieButton'),modeTabs=document.querySelector('#modeTabs'),newProjectButton=document.querySelector('#newProjectButton'),writeModeButton=document.querySelector('#writeModeButton'),editModeButton=document.querySelector('#editModeButton'),printModeButton=document.querySelector('#printModeButton'),tuningSelect=document.querySelector('#tuningSelect'),tuningChoices=document.querySelector('#tuningChoices'),clefSelect=document.querySelector('#clefSelect'),clefChoices=document.querySelector('#clefChoices'),projectSaveButton=document.querySelector('#projectSaveButton'),projectModal=document.querySelector('#projectModal'),projectForm=document.querySelector('#projectForm'),newProjectStartButton=document.querySelector('#newProjectStartButton'),openProjectButton=document.querySelector('#openProjectButton'),projectFileInput=document.querySelector('#projectFileInput'),app=document.querySelector('#app'),titleInput=document.querySelector('#titleInput'),composerInput=document.querySelector('#composerInput'),tempoInput=document.querySelector('#tempoInput'),themeSelect=document.querySelector('#themeSelect'),keySignatureSelect=document.querySelector('#keySignatureSelect'),keyTrigger=document.querySelector('#keyTrigger'),keyTriggerValue=document.querySelector('#keyTriggerValue'),keyWheelPopover=document.querySelector('#keyWheelPopover'),keyWheelCard=document.querySelector('#keyWheelCard'),keyWheelSlots=document.querySelector('#keyWheelSlots'),keyWheelClose=document.querySelector('#keyWheelClose'),meterTrigger=document.querySelector('#meterTrigger'),meterTriggerValue=document.querySelector('#meterTriggerValue'),meterWheelPopover=document.querySelector('#meterWheelPopover'),meterWheelCard=document.querySelector('#meterWheelCard'),meterWheelSlots=document.querySelector('#meterWheelSlots'),meterWheelClose=document.querySelector('#meterWheelClose'),timeSignatureSelect=document.querySelector('#timeSignatureSelect'),pickupSelect=document.querySelector('#pickupSelect'),pickupChoices=document.querySelector('#pickupChoices'),scoreTitle=document.querySelector('#scoreTitle'),scoreTempo=document.querySelector('#scoreTempo'),scoreComposer=document.querySelector('#scoreComposer'),titleDragHandle=document.querySelector('#titleDragHandle'),tempoDragHandle=document.querySelector('#tempoDragHandle'),composerDragHandle=document.querySelector('#composerDragHandle'),scorePageShell=document.querySelector('#scorePageShell'),scorePage=document.querySelector('#scorePage'),osmdContainer=document.querySelector('#osmdContainer'),scorePrompt=document.querySelector('#scorePrompt'),score=document.querySelector('#score'),tupletWarning=document.querySelector('#tupletWarning'),status=document.querySelector('#status'),AC=window.AudioContext||window.webkitAudioContext;
    const writeNoteContext=document.querySelector('#writeNoteContext'),writeNoteFlatButton=document.querySelector('#writeNoteFlatButton'),writeNoteNaturalButton=document.querySelector('#writeNoteNaturalButton'),writeNoteSharpButton=document.querySelector('#writeNoteSharpButton'),writeNoteAccidentalButtons=[writeNoteFlatButton,writeNoteNaturalButton,writeNoteSharpButton],writeNoteDeleteButton=document.querySelector('#writeNoteDeleteButton'),selectionToolbar=document.querySelector('#selectionToolbar'),selectionToolbarDragHandle=document.querySelector('#selectionToolbarDragHandle'),selectionSlurButton=document.querySelector('#selectionSlurButton'),selectionSlurFlipButton=document.querySelector('#selectionSlurFlipButton'),selectionStemFlipButton=document.querySelector('#selectionStemFlipButton'),selectionTieFlipButton=document.querySelector('#selectionTieFlipButton'),selectionStaccatoButton=document.querySelector('#selectionStaccatoButton'),selectionPortatoButton=document.querySelector('#selectionPortatoButton'),selectionAccentButton=document.querySelector('#selectionAccentButton'),beamEditButton=document.querySelector('#beamEditButton'),selectionDynamicButtons=[...document.querySelectorAll('.selection-dynamic-button')],selectionCrescendoButton=document.querySelector('#selectionCrescendoButton'),selectionDiminuendoButton=document.querySelector('#selectionDiminuendoButton'),writeSelectionActions=document.querySelector('#writeSelectionActions'),writePasteEndButton=document.querySelector('#writePasteEndButton'),writeSelectionDeleteButton=document.querySelector('#writeSelectionDeleteButton'),systemBreakButton=document.querySelector('#systemBreakButton'),barlineEditButton=document.querySelector('#barlineEditButton'),endingOneButton=document.querySelector('#endingOneButton'),endingTwoButton=document.querySelector('#endingTwoButton'),barlinePalette=document.querySelector('#barlinePalette'),barlineChoiceButtons=[...document.querySelectorAll('.barline-choice-button')],stretchLastLineButton=document.querySelector('#stretchLastLineButton'),staffTopSlider=document.querySelector('#staffTopSlider'),staffTopThumb=document.querySelector('#staffTopThumb'),staffTopFill=document.querySelector('#staffTopFill'),lineSpacingSlider=document.querySelector('#lineSpacingSlider'),lineSpacingThumb=document.querySelector('#lineSpacingThumb'),lineSpacingFill=document.querySelector('#lineSpacingFill'),noteSizeButton=document.querySelector('#noteSizeButton'),noteSizePanel=document.querySelector('#noteSizePanel'),noteSizeDecreaseButton=document.querySelector('#noteSizeDecreaseButton'),noteSizeResetButton=document.querySelector('#noteSizeResetButton'),noteSizeIncreaseButton=document.querySelector('#noteSizeIncreaseButton'),publishShareButton=document.querySelector('#publishShareButton'),publishPrintButton=document.querySelector('#publishPrintButton'),publishProjectButton=document.querySelector('#publishProjectButton');
    const whitePitchNames={0:'C',2:'D',4:'E',5:'F',7:'G',9:'A',11:'H'},blackPitchNames={1:'cis',3:'dis',6:'fis',8:'gis',10:'ais'};
    const sharpPitchNames=['c','cis','d','dis','e','f','fis','g','gis','a','ais','h'],flatPitchNames=['c','des','d','es','e','f','ges','g','as','a','b','h'];
    const noteDurations={thirtysecond:1,sixteenth:2,eighth:4,quarter:8,half:16,whole:32};
    const tuningTransposes={C:0,Bb:-2,Eb:-9,F:-7};
    const clefKeyboardStarts={treble:60,alto:48,bass:36};
    const themeDefinitions={
      kupari:{name:'Kupari',accent:'#C97B63',accentSoft:'#F2EDE3',accentText:'#6c3c2f',panel:'#284B63',panelBorder:'#1E2A38',panelText:'#ffffff',appBg:'#eef1f5',pageBg:'#ffffff',pageShadow:'rgba(30,42,56,.22)',tabIdle:'#71879c',tabBorder:'#536b82'},
      salvia:{name:'Salvia',accent:'#A3B18A',accentSoft:'#F5F1E8',accentText:'#425039',panel:'#6B705C',panelBorder:'#59604b',panelText:'#ffffff',appBg:'#f1f3ed',pageBg:'#ffffff',pageShadow:'rgba(76,84,63,.18)',tabIdle:'#909882',tabBorder:'#747b67'},
      luumu:{name:'Luumu',accent:'#6D597A',accentSoft:'#F4F1EE',accentText:'#4d3d58',panel:'#355070',panelBorder:'#24384f',panelText:'#ffffff',appBg:'#f1eef4',pageBg:'#ffffff',pageShadow:'rgba(53,80,112,.18)',tabIdle:'#897d95',tabBorder:'#6d6278'},
      sahko:{name:'Sähkö',accent:'#5BC0EB',accentSoft:'#E9ECEF',accentText:'#174d83',panel:'#2B2D42',panelBorder:'#1f2131',panelText:'#ffffff',appBg:'#eef2f6',pageBg:'#ffffff',pageShadow:'rgba(43,45,66,.2)',tabIdle:'#5a6488',tabBorder:'#414965'},
      koralli:{name:'Koralli',accent:'#F28482',accentSoft:'#F7EDE2',accentText:'#8f4745',panel:'#22577A',panelBorder:'#173c54',panelText:'#ffffff',appBg:'#f7f1ee',pageBg:'#ffffff',pageShadow:'rgba(34,87,122,.18)',tabIdle:'#4f7b95',tabBorder:'#365d73'},
      vanilja:{name:'Vanilja',accent:'#E9C46A',accentSoft:'#F4F1DE',accentText:'#6f581c',panel:'#3D405B',panelBorder:'#2d3045',panelText:'#ffffff',appBg:'#f5f2e7',pageBg:'#ffffff',pageShadow:'rgba(61,64,91,.18)',tabIdle:'#767994',tabBorder:'#5d6178'}
    };
    const themeStyleTag=document.createElement('style');
    themeStyleTag.id='dynamicThemeStyle';
    document.head.appendChild(themeStyleTag);
    let audio,osc,gain,started=false,activeId=null,activeKey=null,activeNote=null,activeNoteAction=null,activeNoteSounds=false,noteStartX=0,noteStartY=0,noteSwipeThreshold=28,noteGestureLocked=false,longPressTimer=null,modifierPointerId=null,activeModifier=null,activeModifierButton=null,modifierDragPointerId=null,modifierDragStartY=0,modifierDragStartTop=0,modifierYRatio=1,tieArmed=false,tripletArmed=false,tripletSize=3,tripletGroupId=null,tripletCount=0,tripletBaseUnits=null,nextTupletId=1,completedTupletId=null,tupletWarningTimer=null,scrollPointerId=null,scrollGrabOffset=0,projectData=null,needsInstrumentPosition=true,notes=[],editHistory=[],scoreRenderer=null,scoreRendering=false,scoreRenderPending=false,scoreGesture=0,scoreUndoneAction=null,scoreStartX=0,scoreStartY=0,scoreMoved=false,keyboardMinMidi=DEFAULT_MIN_MIDI,keyboardMaxMidi=DEFAULT_MAX_MIDI,soundingKey=null,workMode='write',headerDrag=null;
    let slurs=[],hairpins=[],systemBreaks=new Set(),systemBreakModeActive=false,barlineStyles=new Map(),barlineEditModeActive=false,barlineActiveBoundary=null,beamOverrides=new Map(),beamEditModeActive=false,endings=[],endingModeActive=0,endingDrag=null,stretchLastLine=false,stretchCommandRunning=false,nextEntryId=1,selectedNoteIndices=new Set(),selectionHitboxes=[],writeNoteHitboxes=[],writeEditNoteId=null,writeEditHighlight=null,writePitchDrag=null,activeReplacingExisting=false,selectionDrag=null,selectionToolbarDrag=null,selectionClipboard=null,writeSelectionCandidate=null,writeSelectionHoldTimer=null,writeSelectionActive=false,writeSelectionScrollTop=0,writeSelectionScrollLeft=0,renderedNoteObjectMap=new Map(),scorePageScale=1;
    let lineSpacingValue=5,lineSpacingPointerId=null,lineSpacingDragStartValue=5,lineSpacingDragStartClientY=0,lineSpacingDragMoved=false,lineSpacingPreview=null,lineSpacingCommitRunning=false,lineSpacingPreviewFrame=0,lineSpacingPreviewPendingValue=5,lineSpacingRasterCache=null,lineSpacingRasterCachePromise=null,lineSpacingRasterGeneration=0;
    let staffTopValue=17,staffTopPointerId=null,staffTopDragStartValue=17,staffTopDragStartClientY=0,staffTopDragMoved=false,staffTopPreview=null,staffTopCommitRunning=false,staffTopPreviewFrame=0,staffTopPreviewPendingValue=17;
    let noteSizePercent=100,noteSizeCommitRunning=false,noteSizeBasePageMargins=null;
    const LINE_SPACING_MIN=1,LINE_SPACING_MAX=10,LINE_SPACING_PREVIEW_PX_PER_UNIT=10,LINE_SPACING_PREVIEW_MAX_PIXELS=5000000,LINE_SPACING_VECTOR_PREVIEW_MAX_SYSTEMS=8,STAFF_TOP_MIN=8,STAFF_TOP_MAX=30,STAFF_TOP_DEFAULT=17,STAFF_TOP_PREVIEW_PX_PER_UNIT=10,NOTE_SIZE_MIN=70,NOTE_SIZE_MAX=140,NOTE_SIZE_DEFAULT=100,NOTE_SIZE_STEP=5,SLIDER_GRAB_PAD_Y=5,SLIDER_DRAG_EPSILON_PX=.75;
    const scorePointers=new Set();
    const scoreTouchIds=new Set();
    let scoreMultiTouchLocked=false,scoreMultiTouchScrollTop=0,scoreMultiTouchScrollLeft=0;
    let scoreSingleTouchId=null,scoreSingleTouchStartX=0,scoreSingleTouchStartY=0,scoreSingleTouchScrollTop=0,scoreSingleTouchScrolling=false;

    function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
    function mod(value,divisor){return((value%divisor)+divisor)%divisor}
    function currentTranspose(){return projectData?.transpose??tuningTransposes[tuningSelect.value]??0}
    function currentClef(){return projectData?.clef||clefSelect.value||'treble'}
    function capitalize(value){return value.charAt(0).toUpperCase()+value.slice(1)}
    function pitchDisplay(midi,useFlats=false){
      const name=(useFlats?flatPitchNames:sharpPitchNames)[mod(midi,12)],octave=Math.floor(midi/12)-1;
      if(octave<=0)return 'subkontra-'+capitalize(name);
      if(octave===1)return 'kontra-'+capitalize(name);
      if(octave===2)return 'suuri '+capitalize(name);
      if(octave===3)return 'pieni '+name;
      return name+(octave-3);
    }
    function escapeXml(value=''){
      return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
    }
    function selectedKeyInfo(){
      const option=keySignatureSelect.selectedOptions[0];
      return {fifths:+(option?.value||0),mode:option?.dataset.mode||'major',tonic:option?.dataset.tonic||'C'};
    }
    const keyWheelData=[
      {major:[{label:'C',fifths:0,tonic:'C'}],minor:[{label:'a',fifths:0,tonic:'A'}]},
      {major:[{label:'G',fifths:1,tonic:'G'}],minor:[{label:'e',fifths:1,tonic:'E'}]},
      {major:[{label:'D',fifths:2,tonic:'D'}],minor:[{label:'h',fifths:2,tonic:'B'}]},
      {major:[{label:'A',fifths:3,tonic:'A'}],minor:[{label:'fis',fifths:3,tonic:'F#'}]},
      {major:[{label:'E',fifths:4,tonic:'E'}],minor:[{label:'cis',fifths:4,tonic:'C#'}]},
      {major:[{label:'H',fifths:5,tonic:'B'}],minor:[{label:'gis',fifths:5,tonic:'G#'}]},
      {major:[{label:'Ges',fifths:-6,tonic:'Gb'}],minor:[{label:'es',fifths:-6,tonic:'Eb'}]},
      {major:[{label:'Des',fifths:-5,tonic:'Db'}],minor:[{label:'b',fifths:-5,tonic:'Bb'}]},
      {major:[{label:'As',fifths:-4,tonic:'Ab'}],minor:[{label:'f',fifths:-4,tonic:'F'}]},
      {major:[{label:'Es',fifths:-3,tonic:'Eb'}],minor:[{label:'c',fifths:-3,tonic:'C'}]},
      {major:[{label:'B',fifths:-2,tonic:'Bb'}],minor:[{label:'g',fifths:-2,tonic:'G'}]},
      {major:[{label:'F',fifths:-1,tonic:'F'}],minor:[{label:'d',fifths:-1,tonic:'D'}]}
    ];
    function keyOptionFor(choice,mode){
      return [...keySignatureSelect.options].find(option=>+option.value===choice.fifths&&option.dataset.mode===mode&&option.dataset.tonic===choice.tonic);
    }
    function keyChoiceName(choice,mode){
      return keyOptionFor(choice,mode)?.textContent||`${choice.label}-${mode==='major'?'duuri':'molli'}`;
    }
    function syncKeyPicker(){
      const text=keySignatureSelect.selectedOptions[0]?.textContent||'C-duuri';
      keyTriggerValue.textContent=text;
      const info=selectedKeyInfo();
      keyWheelSlots.querySelectorAll('.key-wheel-slot').forEach(button=>{
        const variants=keyWheelData[+button.dataset.slot]?.[button.dataset.mode]||[];
        const selected=variants.some(choice=>choice.fifths===info.fifths&&choice.tonic===info.tonic);
        button.setAttribute('aria-pressed',String(selected));
      });
    }
    function chooseKeyChoice(choice,mode){
      const option=keyOptionFor(choice,mode);if(!option)return;
      keySignatureSelect.selectedIndex=option.index;syncKeyPicker();closeKeyWheel();
    }
    function chooseKeyWheelSlot(e){
      const button=e.target.closest('.key-wheel-slot');if(!button)return;
      const choices=keyWheelData[+button.dataset.slot]?.[button.dataset.mode]||[];if(!choices.length)return;
      e.preventDefault();
      chooseKeyChoice(choices[0],button.dataset.mode);
    }
    function buildKeyWheel(){
      keyWheelSlots.replaceChildren();
      keyWheelData.forEach((slot,index)=>{
        const angle=(index*30-90)*Math.PI/180;
        [['major',39],['minor',25]].forEach(([mode,radius])=>{
          const choices=slot[mode],button=document.createElement('button');button.type='button';button.className=`key-wheel-slot ${mode}`;button.dataset.slot=String(index);button.dataset.mode=mode;
          button.style.left=`${50+Math.cos(angle)*radius}%`;button.style.top=`${50+Math.sin(angle)*radius}%`;
          button.textContent=choices[0].label;button.setAttribute('aria-label',keyChoiceName(choices[0],mode));button.setAttribute('aria-pressed','false');keyWheelSlots.appendChild(button);
        });
      });
      syncKeyPicker();
    }
    function openKeyWheel(e){
      e?.preventDefault();syncKeyPicker();keyWheelPopover.hidden=false;keyTrigger.setAttribute('aria-expanded','true');
      requestAnimationFrame(()=>{const selected=keyWheelSlots.querySelector('[aria-pressed="true"]');(selected||keyWheelClose).focus()});
    }
    function closeKeyWheel(){
      if(keyWheelPopover.hidden)return;keyWheelPopover.hidden=true;keyTrigger.setAttribute('aria-expanded','false');keyTrigger.focus();
    }
    function keyWheelBackdrop(e){if(e.target===keyWheelPopover)closeKeyWheel()}
    const meterWheelData=['2/4','3/4','4/4','C','2/2','cutC','3/8','6/8','9/8','12/8'];
    function timeSignatureParts(value=timeSignatureSelect.value){
      if(value==='C')return [4,4];
      if(value==='cutC')return [2,2];
      const [beats,beatType]=String(value||'4/4').split('/').map(Number);
      return [Number.isFinite(beats)&&beats>0?beats:4,Number.isFinite(beatType)&&beatType>0?beatType:4];
    }
    function timeSignatureSymbolAttribute(value){return value==='C'?' symbol="common"':value==='cutC'?' symbol="cut"':''}
    const meterImageSources={
      '2/4':'assets/time-2-4.svg',
      '3/4':'assets/time-3-4.svg',
      '4/4':'assets/time-4-4.svg',
      'C':'assets/Common_time.svg',
      '2/2':'assets/time-2-2.svg',
      'cutC':'assets/Alla_breve.svg',
      '3/8':'assets/time-3-8.svg',
      '6/8':'assets/time-6-8.svg',
      '9/8':'assets/time-9-8.svg',
      '12/8':'assets/time-12-8.svg'
    };
    function meterAriaLabel(value){return value==='C'?'C-tahtiosoitus, 4/4':value==='cutC'?'Cut C -tahtiosoitus, 2/2':`Tahtiosoitus ${value}`}
    function renderMeterLabel(element,value){
      element.replaceChildren();
      const symbol=document.createElement('img');
      const extraClass=value==='cutC'?'cut':(value==='C'?'common':'numeric');
      symbol.className=`meter-symbol-image ${extraClass}`;
      symbol.src=meterImageSources[value]||meterImageSources['4/4'];
      symbol.alt='';symbol.setAttribute('aria-hidden','true');
      element.appendChild(symbol);
    }
    function syncMeterPicker(){
      const value=timeSignatureSelect.value||'4/4';
      renderMeterLabel(meterTriggerValue,value);
      meterWheelSlots.querySelectorAll('.meter-wheel-slot').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.meter===value)));
    }
    function buildMeterWheel(){
      meterWheelSlots.replaceChildren();
      meterWheelData.forEach((value,index)=>{
        const angle=(index*(360/meterWheelData.length)-90)*Math.PI/180,button=document.createElement('button');
        button.type='button';button.className='meter-wheel-slot';button.dataset.meter=value;renderMeterLabel(button,value);button.setAttribute('aria-label',meterAriaLabel(value));button.setAttribute('aria-pressed','false');
        button.style.left=`${50+Math.cos(angle)*37}%`;button.style.top=`${50+Math.sin(angle)*37}%`;meterWheelSlots.appendChild(button);
      });
      syncMeterPicker();
    }
    function chooseMeterWheelSlot(e){
      const button=e.target.closest('.meter-wheel-slot');if(!button)return;
      e.preventDefault();timeSignatureSelect.value=button.dataset.meter;syncMeterPicker();syncPickupOptions();closeMeterWheel();
    }
    function openMeterWheel(e){
      e?.preventDefault();syncMeterPicker();meterWheelPopover.hidden=false;meterTrigger.setAttribute('aria-expanded','true');
      requestAnimationFrame(()=>{const selected=meterWheelSlots.querySelector('[aria-pressed="true"]');(selected||meterWheelClose).focus()});
    }
    function closeMeterWheel(){
      if(meterWheelPopover.hidden)return;meterWheelPopover.hidden=true;meterTrigger.setAttribute('aria-expanded','false');meterTrigger.focus();
    }
    function meterWheelBackdrop(e){if(e.target===meterWheelPopover)closeMeterWheel()}
    function pickerEscapeKey(e){
      if(e.key!=='Escape')return;
      if(!noteSizePanel.hidden){e.preventDefault();closeNoteSizePanel({focusButton:true});return}
      if(!meterWheelPopover.hidden){e.preventDefault();closeMeterWheel();return}
      if(!keyWheelPopover.hidden){e.preventDefault();closeKeyWheel()}
    }
    function timeSignatureCapacity(value=timeSignatureSelect.value){
      const [beats,beatType]=timeSignatureParts(value);
      return beats*32/beatType;
    }
    function gcd(a,b){while(b){[a,b]=[b,a%b]}return Math.abs(a)||1}
    function pickupFraction(units){
      const divisor=gcd(units,32);return `${units/divisor}/${32/divisor}`;
    }
    const pickupPresets={
      '2/4':[4,8,12],
      '3/4':[4,8,12,16],
      '4/4':[4,8,12,16,24],
      'C':[4,8,12,16,24],
      '2/2':[8,12,16,24],
      'cutC':[8,12,16,24],
      '3/8':[4,8],
      '6/8':[4,8,12],
      '9/8':[4,8,12,24],
      '12/8':[4,8,12,24]
    };
    const pickupIcons={
      4:'assets/pickup-eighth.svg',
      8:'assets/pickup-quarter.svg',
      12:'assets/pickup-dotted-quarter.svg',
      16:'assets/pickup-half.svg',
      24:'assets/pickup-dotted-half.svg'
    };
    function syncPickupButtons(){
      const selected=Number(pickupSelect.value)||0;
      pickupChoices.querySelectorAll('.pickup-choice').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.units)===selected)));
    }
    function syncPickupOptions(){
      const capacity=timeSignatureCapacity(),previous=Number(pickupSelect.value)||0;
      const values=(pickupPresets[timeSignatureSelect.value]||[]).filter(units=>units>0&&units<capacity);
      pickupSelect.value=String(values.includes(previous)?previous:0);
      pickupChoices.innerHTML=values.map(units=>{
        const label=pickupFraction(units);
        const icon=pickupIcons[units];
        const content=icon?`<img src="${icon}" alt="">`:label;
        return `<button class="pickup-choice" type="button" data-units="${units}" aria-label="Kohotahti ${label}" aria-pressed="false">${content}</button>`;
      }).join('');
      syncPickupButtons();
    }
    function choosePickup(e){
      const button=e.target.closest('.pickup-choice');if(!button)return;
      const units=Number(button.dataset.units)||0,current=Number(pickupSelect.value)||0;
      pickupSelect.value=String(current===units?0:units);
      syncPickupButtons();
    }
    const minorLeadingSpellings={
      'A':['G',1],'E':['D',1],'B':['A',1],'F#':['E',1],'C#':['B',1],'G#':['F',2],'D#':['C',2],'A#':['G',2],
      'D':['C',1],'G':['F',1],'C':['B',0],'F':['E',0],'Bb':['A',0],'Eb':['D',0],'Ab':['G',0]
    };
    const naturalPitchClass={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
    const diatonicSteps=['C','D','E','F','G','A','B'];
    function midiFromSpelling(step,octave,alter=0){return (Number(octave)+1)*12+naturalPitchClass[step]+Number(alter||0)}
    function noteSpellingParts(note,index,keyInfo={fifths:projectData?.keySignature??selectedKeyInfo().fifths,mode:projectData?.keyMode??selectedKeyInfo().mode,tonic:projectData?.keyTonic??selectedKeyInfo().tonic}){
      if(note?.spellingStep&&diatonicSteps.includes(note.spellingStep)&&Number.isFinite(Number(note.spellingOctave))&&Number.isFinite(Number(note.spellingAlter)))return {step:note.spellingStep,octave:Number(note.spellingOctave),alter:Number(note.spellingAlter)};
      const sharps=[['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]],flats=[['C',0],['D',-1],['D',0],['E',-1],['E',0],['F',0],['G',-1],['G',0],['A',-1],['A',0],['B',-1],['B',0]];
      let pitch;if(!note?.accidentalStyle)pitch=leadingToneSpelling(note,keyInfo);
      if(!pitch)pitch=(automaticUseFlats(note,index,keyInfo.fifths,keyInfo.mode,keyInfo.tonic)?flats:sharps)[mod(note.midi,12)];
      const octave=(note.midi-naturalPitchClass[pitch[0]]-pitch[1])/12-1;return {step:pitch[0],octave,alter:pitch[1]};
    }
    function shiftedSpelling(spelling,steps){
      const start=Number(spelling.octave)*7+diatonicSteps.indexOf(spelling.step),target=start+Number(steps||0),octave=Math.floor(target/7),step=diatonicSteps[mod(target,7)];
      return {step,octave,alter:Number(spelling.alter)||0};
    }
    function leadingToneSpelling(note,keyInfo){
      if(!note||keyInfo?.mode!=='minor')return null;
      const spelling=minorLeadingSpellings[keyInfo.tonic];
      if(!spelling)return null;
      const pc=mod(naturalPitchClass[spelling[0]]+spelling[1],12);
      return mod(note.midi,12)===pc?spelling:null;
    }
    function automaticUseFlats(note,index,keySignature,keyMode=projectData?.keyMode,keyTonic=projectData?.keyTonic){
      if(note?.accidentalStyle==='flat')return true;
      if(note?.accidentalStyle==='sharp')return false;
      const leading=leadingToneSpelling(note,{mode:keyMode,tonic:keyTonic});
      if(leading)return leading[1]<0;
      if(keySignature<0)return true;
      if(keySignature>0)return false;
      if(!note||![1,3,6,8,10].includes(mod(note.midi,12)))return false;
      for(let i=index-1;i>=0;i-=1){const previous=notes[i];if(previous?.rest||previous?.measureRest)continue;if(previous.midi>note.midi)return true;if(previous.midi<note.midi)return false;break}
      return false;
    }
    function musicXmlPitch(note,index,keyInfo){
      const pitch=noteSpellingParts(note,index,keyInfo);
      return `<pitch><step>${pitch.step}</step>${pitch.alter?`<alter>${pitch.alter}</alter>`:''}<octave>${pitch.octave}</octave></pitch>`;
    }
    function musicXmlAccidental(note){
      if(!note?.spellingManual)return '';
      const value=Number(note.spellingAlter);return value<0?'<accidental>flat</accidental>':value>0?'<accidental>sharp</accidental>':'<accidental>natural</accidental>';
    }
    function musicXmlRest(note,clefName){
      if(note.duration!=='whole')return '<rest/>';
      const [step,octave]={treble:['D',5],alto:['E',4],bass:['F',3]}[clefName]||['D',5];
      return `<rest${note.measureRest?' measure="yes"':''}><display-step>${step}</display-step><display-octave>${octave}</display-octave></rest>`;
    }
    function tupletActualNotes(note){const size=Number(note?.tupletSize)||3;return size===5||size===6?size:3}
    function tupletNormalNotes(size){return size===5?4:size===6?4:2}
    function nominalNoteDurationValue(note){
      const base=noteDurations[note?.duration]||noteDurations.quarter;
      return note?.doubleDotted?base*1.75:note?.dotted?base*1.5:base;
    }
    function noteDurationValue(note){
      const nominal=nominalNoteDurationValue(note);
      if(!note.tupletId)return nominal;
      const actual=tupletActualNotes(note),normal=tupletNormalNotes(actual);return nominal*normal/actual;
    }
    function musicXmlDurationValue(note){return Math.round(noteDurationValue(note)*60)}
    function tupletBaseUnitsForNote(note){
      const stored=Number(note?.tupletBaseUnits);if(Number.isFinite(stored)&&stored>0)return stored;
      if(!note?.tupletId)return null;
      const first=notes.filter(item=>item?.tupletId===note.tupletId).sort((a,b)=>(Number(a.tupletIndex)||0)-(Number(b.tupletIndex)||0))[0];
      return first?nominalNoteDurationValue(first):null;
    }
    function isProtectedSextuplet(note){
      const base=tupletBaseUnitsForNote(note);
      return Boolean(note?.tupletId&&Number(note.tupletSize)===6&&Number.isFinite(base)&&base<=2+1e-7);
    }
    function beamUnit(beats,beatType){
      return beatType===8&&beats%3===0?12:32/beatType;
    }
    function beamPairKey(left,right){return left?.id&&right?.id?`${left.id}|${right.id}`:''}
    function isManualBeamable(note){
      if(!note||note.measureRest)return false;
      if(note.rest&&isProtectedSextuplet(note))return true;
      return Boolean(!note.rest&&(note.duration==='eighth'||note.duration==='sixteenth'||note.duration==='thirtysecond'));
    }
    function beamLevelCount(note){
      const normal=note?.duration==='thirtysecond'?3:note?.duration==='sixteenth'?2:note?.duration==='eighth'?1:0;
      return note?.rest&&isProtectedSextuplet(note)?Math.max(1,normal):normal;
    }
    function tupletFixedBeamConnection(left,right){
      if(!left?.tupletId||left.tupletId!==right?.tupletId||!isManualBeamable(left)||!isManualBeamable(right))return null;
      const leftIndex=Number(left.tupletIndex),rightIndex=Number(right.tupletIndex);
      if(!Number.isInteger(leftIndex)||rightIndex!==leftIndex+1)return false;
      // Triolit, kvintolit ja sekstolit palkitetaan oletuksena yhtenä ryhmänä.
      // Suojatussa 1/16- tai 1/32-sekstolissa myös sisäinen tauko kuuluu ensimmäiseen palkkiin.
      return true;
    }
    function sextupletProtectedMinimum(left,right,maxLevel){
      if(maxLevel<1||!left?.tupletId||left.tupletId!==right?.tupletId)return 0;
      if(!isProtectedSextuplet(left)||!isProtectedSextuplet(right))return 0;
      const leftIndex=Number(left.tupletIndex),rightIndex=Number(right.tupletIndex);
      return Number.isInteger(leftIndex)&&rightIndex===leftIndex+1?1:0;
    }
    function beamOverrideLevel(override,{automaticLevel,maxLevel,minimumLevel}){
      if(override===null||override===undefined)return automaticLevel;
      if(typeof override==='number'&&Number.isFinite(override))return clamp(Math.round(override),minimumLevel,maxLevel);
      if(Boolean(override))return maxLevel;
      return minimumLevel;
    }
    function measureBeamConnections(group,beats,beatType){
      const starts=[];let offset=0;for(const note of group){starts.push(offset);offset+=noteDurationValue(note)}
      const unit=beamUnit(beats,beatType),connections=[];
      for(let index=0;index<group.length-1;index+=1){
        const left=group[index],right=group[index+1],leftCandidate=isManualBeamable(left),rightCandidate=isManualBeamable(right),leftBucket=Math.floor(starts[index]/unit),rightBucket=Math.floor(starts[index+1]/unit),leftInside=starts[index]+noteDurationValue(left)<=(leftBucket+1)*unit,rightInside=starts[index+1]+noteDurationValue(right)<=(rightBucket+1)*unit,metricAutomatic=leftCandidate&&rightCandidate&&leftInside&&rightInside&&leftBucket===rightBucket,tupletAutomatic=tupletFixedBeamConnection(left,right),automatic=tupletAutomatic===null?metricAutomatic:tupletAutomatic,key=beamPairKey(left,right),maxLevel=leftCandidate&&rightCandidate?Math.min(beamLevelCount(left),beamLevelCount(right)):0,minimumLevel=sextupletProtectedMinimum(left,right,maxLevel),automaticLevel=automatic?maxLevel:0,override=key&&beamOverrides.has(key)?beamOverrides.get(key):null,level=leftCandidate&&rightCandidate?beamOverrideLevel(override,{automaticLevel,maxLevel,minimumLevel}):0,connected=level>0;
        connections.push({index,key,left,right,leftCandidate,rightCandidate,automatic,automaticLevel,maxLevel,minimumLevel,level,connected,fullConnected:maxLevel>0&&level>=maxLevel});
      }
      return {starts,connections};
    }
    function addBeamLevelRuns(tags,group,starts,connections,level,{onlyProtectedTuplets=false}={}){
      let index=0;
      while(index<group.length){
        const eligible=isManualBeamable(group[index])&&beamLevelCount(group[index])>=level;
        if(!eligible){index+=1;continue}
        const run=[index];
        while(index<group.length-1){
          const connection=connections[index],nextIndex=index+1,nextEligible=isManualBeamable(group[nextIndex])&&beamLevelCount(group[nextIndex])>=level;
          if(!nextEligible||!connection||connection.level<level)break;
          if(onlyProtectedTuplets&&connection.minimumLevel<1)break;
          index+=1;run.push(index);
        }
        if(run.length>1){
          run.forEach((noteIndex,position)=>tags[noteIndex].push([level,position===0?'begin':position===run.length-1?'end':'continue']));
        }else if(level>1){
          const noteIndex=run[0],previous=connections[noteIndex-1],next=connections[noteIndex],hasProtectedBreak=onlyProtectedTuplets&&((previous?.minimumLevel>0&&previous.level<level)||(next?.minimumLevel>0&&next.level<level));
          if(!onlyProtectedTuplets||hasProtectedBreak)tags[noteIndex].push([level,starts[noteIndex]%(level===2?4:2)===0?'forward hook':'backward hook']);
        }
        index+=1;
      }
    }
    function measureBeamTags(group,beats,beatType,{osmdCompatible=false}={}){
      const tags=group.map(()=>[]),{starts,connections}=measureBeamConnections(group,beats,beatType);
      addBeamLevelRuns(tags,group,starts,connections,1);
      if(!osmdCompatible){
        addBeamLevelRuns(tags,group,starts,connections,2);
        addBeamLevelRuns(tags,group,starts,connections,3);
      }else{
        // OSMD saa tavallisesti johtaa alemmat palkit aika-arvoista itse.
        // 1/16- ja 1/32-sekstolien Muokkaa-palkituksessa alempien palkkien
        // katkot annetaan kuitenkin eksplisiittisesti, jotta ensimmäinen palkki
        // voi jäädä koko sekstolin läpi yhtenäiseksi.
        const hasProtectedEdit=connections.some(connection=>connection.minimumLevel>0&&connection.level<connection.maxLevel);
        if(hasProtectedEdit){
          addBeamLevelRuns(tags,group,starts,connections,2,{onlyProtectedTuplets:true});
          addBeamLevelRuns(tags,group,starts,connections,3,{onlyProtectedTuplets:true});
        }
      }
      return tags.map(beams=>beams.map(([number,value])=>`<beam number="${number}">${value}</beam>`).join(''));
    }
    function measureData(){
      const [beats,beatType]=timeSignatureParts(projectData?.timeSignature||timeSignatureSelect.value),capacity=beats*32/beatType,rawPickup=Number(projectData?.pickupDuration??pickupSelect.value)||0,pickupCapacity=rawPickup>0&&rawPickup<capacity?rawPickup:0,groups=[[]],groupCapacities=[pickupCapacity||capacity];
      let used=0;
      const pushGroup=()=>{groups.push([]);groupCapacities.push(capacity);used=0};
      for(const note of notes){
        if(note.measureRest){
          if(groups.at(-1).length)pushGroup();
          groups.at(-1).push(note);pushGroup();continue;
        }
        const duration=noteDurationValue(note),currentCapacity=groupCapacities.at(-1)||capacity;
        if(groups.at(-1).length&&used+duration>currentCapacity+1e-7)pushGroup();
        groups.at(-1).push(note);used+=duration;
      }
      if(groups.length>1&&!groups.at(-1).length){groups.pop();groupCapacities.pop()}
      return {beats,beatType,capacity,groups,groupCapacities,pickupCapacity};
    }
    function createEntryId(){return `entry-${nextEntryId++}`}
    function ensureEntryIds(){notes.forEach(note=>{if(!note.id)note.id=createEntryId()})}
    function pruneEditRanges(){
      ensureEntryIds();
      const ids=new Set(notes.map(note=>note.id));
      slurs=slurs.filter(item=>ids.has(item.startId)&&ids.has(item.endId));
      hairpins=hairpins.filter(item=>ids.has(item.startId)&&ids.has(item.endId));
      beamOverrides=new Map([...beamOverrides].filter(([key])=>{const [leftId,rightId]=String(key).split('|');return ids.has(leftId)&&ids.has(rightId)}));
      selectedNoteIndices=new Set([...selectedNoteIndices].filter(index=>notes[index]&&!notes[index].rest&&!notes[index].measureRest));
    }
    function editRangeDecorations(note){
      const slurStarts=[],slurStops=[],hairpinStarts=[],hairpinStops=[];
      slurs.forEach((item,index)=>{const number=index%6+1;if(item.startId===note.id)slurStarts.push({number,placement:item.placement});if(item.endId===note.id)slurStops.push(number)});
      hairpins.forEach((item,index)=>{const number=index%6+1;if(item.startId===note.id)hairpinStarts.push({number,type:item.type});if(item.endId===note.id)hairpinStops.push({number,type:item.type})});
      return {slurStarts,slurStops,hairpinStarts,hairpinStops};
    }
    function dynamicDirectionXml(dynamic){
      return ['ppp','pp','p','mp','mf','f','ff','fff'].includes(dynamic)?`<direction placement="below"><direction-type><dynamics><${dynamic}/></dynamics></direction-type></direction>`:'';
    }
    function wedgeDirectionsXml(items,stop=false){
      return items.map(item=>`<direction placement="below"><direction-type><wedge type="${stop?'stop':item.type}" number="${item.number}"/></direction-type></direction>`).join('');
    }
    function barlineStyleForBoundary(boundary){return barlineStyles.get(boundary)||'normal'}
    function endingStartingAt(measureIndex){return endings.find(item=>item.startMeasure===measureIndex)||null}
    function endingEndingAt(measureIndex){return endings.find(item=>item.endMeasure===measureIndex)||null}
    function pruneEndings(totalMeasures){
      endings=endings.map(item=>({...item,endMeasure:Math.min(item.endMeasure,totalMeasures-1)})).filter(item=>Number.isInteger(item.number)&&(item.number===1||item.number===2)&&Number.isInteger(item.startMeasure)&&Number.isInteger(item.endMeasure)&&item.startMeasure>=0&&item.startMeasure<totalMeasures&&item.endMeasure>=item.startMeasure);
    }
    function leftBarlineXml(boundary){
      const style=barlineStyleForBoundary(boundary),ending=endingStartingAt(boundary),parts=[];
      if(style==='repeat-start')parts.push('<bar-style>heavy-light</bar-style>');
      if(ending)parts.push(`<ending number="${ending.number}" type="start"/>`);
      if(style==='repeat-start')parts.push('<repeat direction="forward"/>');
      return parts.length?`<barline location="left">${parts.join('')}</barline>`:'';
    }
    function rightBarlineXml(boundary,totalMeasures){
      const style=barlineStyleForBoundary(boundary),ending=endingEndingAt(boundary-1),parts=[];
      if(style==='repeat-end'||boundary===totalMeasures)parts.push('<bar-style>light-heavy</bar-style>');
      else if(style==='double')parts.push('<bar-style>light-light</bar-style>');
      if(ending){const endingType=ending.number===2&&boundary<totalMeasures?'discontinue':'stop';parts.push(`<ending number="${ending.number}" type="${endingType}"/>`)}
      if(style==='repeat-end')parts.push('<repeat direction="backward"/>');
      return parts.length?`<barline location="right">${parts.join('')}</barline>`:'';
    }
    function buildMusicXml({forRender=false}={}){
      ensureEntryIds();pruneEditRanges();renderedNoteObjectMap=new Map();
      const fallbackKey=selectedKeyInfo(),data=projectData||{instrumentName:'Pikakirjoitin',title:'',composer:'',tempoText:'',keySignature:fallbackKey.fifths,keyMode:fallbackKey.mode,keyTonic:fallbackKey.tonic,timeSignature:timeSignatureSelect.value,pickupDuration:Number(pickupSelect.value)||0,clef:clefSelect.value||'treble',transpose:tuningTransposes[tuningSelect.value]||0},{beats,beatType,capacity,groups,groupCapacities,pickupCapacity}=measureData(),clef={treble:['G',2],alto:['C',3],bass:['F',4]}[data.clef]||['G',2],noteIndices=new Map(notes.map((note,index)=>[note,index])),tupletBounds=new Map();
      notes.forEach(note=>{if(!note?.tupletId)return;const bound=tupletBounds.get(note.tupletId)||{firstId:note.id,lastId:note.id};bound.lastId=note.id;tupletBounds.set(note.tupletId,bound)});
      let renderedNoteObjectId=0;
      const totalMeasures=groups.length;
      [...barlineStyles.keys()].forEach(boundary=>{if(boundary<0||boundary>totalMeasures)barlineStyles.delete(boundary)});
      pruneEndings(totalMeasures);
      const measures=groups.map((group,index)=>{
        const attributes=index===0?`<attributes><divisions>480</divisions><key><fifths>${data.keySignature}</fifths></key><time${timeSignatureSymbolAttribute(data.timeSignature)}><beats>${beats}</beats><beat-type>${beatType}</beat-type></time><clef><sign>${clef[0]}</sign><line>${clef[1]}</line></clef></attributes>`:'',measureCapacity=groupCapacities[index]||capacity;
        const beamTags=measureBeamTags(group,beats,beatType,{osmdCompatible:forRender}),entries=group.length?group.map((note,noteIndex)=>{
          const sourceIndex=noteIndices.get(note),measureRest=Boolean(note.measureRest),type=note.duration==='thirtysecond'?'32nd':note.duration==='sixteenth'?'16th':Object.hasOwn(noteDurations,note.duration)?note.duration:'quarter',duration=measureRest?Math.round(measureCapacity*60):musicXmlDurationValue(note),content=note.rest?musicXmlRest(note,data.clef):musicXmlPitch(note,sourceIndex,{fifths:data.keySignature,mode:data.keyMode||'major',tonic:data.keyTonic||'C'}),typeXml=measureRest?'<type>whole</type>':`<type>${type}</type>`,dot=!measureRest?(note.doubleDotted?'<dot/><dot/>':note.dotted?'<dot/>':''):'',tupletActual=note.tupletId?tupletActualNotes(note):0,tupletNormal=tupletActual?tupletNormalNotes(tupletActual):0,timeModification=note.tupletId?`<time-modification><actual-notes>${tupletActual}</actual-notes><normal-notes>${tupletNormal}</normal-notes></time-modification>`:'',accidentalXml=note.rest?'':musicXmlAccidental(note);
          renderedNoteObjectMap.set(renderedNoteObjectId,sourceIndex);renderedNoteObjectId+=1;
          const tieStop=Boolean(note.tieFromPrevious),tieStart=Boolean(notes[sourceIndex+1]?.tieFromPrevious),startPlacement=note.tiePlacement,stopPlacement=notes[sourceIndex-1]?.tiePlacement,tieXml=`${tieStop?'<tie type="stop"/>':''}${tieStart?'<tie type="start"/>':''}`,placement=value=>value==='above'||value==='below'?` placement="${value}"`:'',tiedXml=`${tieStop?`<tied type="stop"${placement(stopPlacement)}/>`:''}${tieStart?`<tied type="start"${placement(startPlacement)}/>`:''}`;
          const tupletPlacement=note.tupletId?tupletPlacementForId(note.tupletId):'above',tupletBound=note.tupletId?tupletBounds.get(note.tupletId):null,tupletNotation=note.tupletId&&tupletBound?.firstId===note.id?`<tuplet type="start" number="1" bracket="yes" show-number="actual" placement="${tupletPlacement}"/>`:note.tupletId&&tupletBound?.lastId===note.id?'<tuplet type="stop" number="1"/>':'';
          const decorations=editRangeDecorations(note),slurXml=`${decorations.slurStops.map(number=>`<slur type="stop" number="${number}"/>`).join('')}${decorations.slurStarts.map(item=>`<slur type="start" number="${item.number}"${placement(item.placement)}/>`).join('')}`,articulationItems=`${note.staccato?'<staccato/>':''}${note.portato?'<tenuto/>':''}${note.accent?'<accent/>':''}`,articulations=articulationItems?`<articulations>${articulationItems}</articulations>`:'',notations=tiedXml||slurXml||articulations||tupletNotation?`<notations>${tiedXml}${slurXml}${articulations}${tupletNotation}</notations>`:'';
          const before=`${wedgeDirectionsXml(decorations.hairpinStarts)}${dynamicDirectionXml(note.dynamic)}`,after=wedgeDirectionsXml(decorations.hairpinStops,true);
          const stemXml=!measureRest&&(note.stemDirection==='up'||note.stemDirection==='down')?`<stem>${note.stemDirection}</stem>`:'';
          return `${before}<note>${content}<duration>${duration}</duration>${tieXml}<voice>1</voice>${typeXml}${dot}${accidentalXml}${timeModification}${stemXml}${beamTags[noteIndex]}${notations}</note>${after}`;
        }).join(''):(renderedNoteObjectId+=1,`<note print-object="no"><rest${pickupCapacity&&index===0?'':' measure="yes"'}/><duration>${Math.round(measureCapacity*60)}</duration><voice>1</voice></note>`);
        const systemBreak=index>0&&systemBreaks.has(index)?'<print new-system="yes"/>':'',measureNumber=pickupCapacity?(index===0?0:index):index+1,implicit=pickupCapacity&&index===0?' implicit="yes"':'',leftBarline=leftBarlineXml(index),rightBarline=rightBarlineXml(index+1,totalMeasures);
        return `<measure number="${measureNumber}"${implicit}>${systemBreak}${attributes}${leftBarline}${entries}${rightBarline}</measure>`;
      }).join('');
      return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>${escapeXml(data.title||'Nimetön kappale')}</work-title></work><movement-title></movement-title><identification>${data.composer?`<creator type="composer">${escapeXml(data.composer)}</creator>`:''}</identification><part-list><score-part id="P1"><part-name print-object="no"></part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
    }
    function centerMeasureRests(){
      const measureList=scoreRenderer?.GraphicSheet?.MeasureList;
      if(!measureList)return;
      measureData().groups.forEach((group,measureIndex)=>{
        if(!group.some(note=>note.measureRest))return;
        for(const graphicalMeasure of measureList[measureIndex]||[]){
          const stave=graphicalMeasure?.getVFStave?.(),start=stave?.getNoteStartX?.(),end=stave?.getNoteEndX?.();
          if(!Number.isFinite(start)||!Number.isFinite(end))continue;
          const handled=new Set();
          for(const staffEntry of graphicalMeasure.staffEntries||[])for(const voiceEntry of staffEntry.graphicalVoiceEntries||[])for(const graphicalNote of voiceEntry.notes||[]){
            if(graphicalNote.sourceNote?.PrintObject===false||!graphicalNote.sourceNote?.isRest?.())continue;
            const element=graphicalNote.getSVGGElement?.();
            if(!element||handled.has(element)||element.hasAttribute('data-pikakirjoitin-measure-rest-centered'))continue;
            handled.add(element);
            try{
              const box=element.getBBox(),shift=(start+end)/2-(box.x+box.width/2),base=element.getAttribute('transform')||'';
              element.setAttribute('data-pikakirjoitin-measure-rest-centered','');
              if(Math.abs(shift)>.01)element.setAttribute('transform',`${base?base+' ':''}translate(${shift.toFixed(3)} 0)`);
              element.querySelectorAll('.vf-dot,circle').forEach(dot=>dot.remove());
            }catch{}
          }
        }
      });
    }
    function ensureScoreRenderer(){
      if(scoreRenderer)return true;
      if(!window.opensheetmusicdisplay?.OpenSheetMusicDisplay)return false;
      scoreRenderer=new window.opensheetmusicdisplay.OpenSheetMusicDisplay(osmdContainer,{backend:'svg',autoResize:false,pageFormat:'A4_P',drawingParameters:'compacttight',drawTitle:false,drawSubtitle:false,drawComposer:false,drawCredits:false,drawPartNames:false,drawMeasureNumbers:false,newSystemFromXML:true,stretchLastSystemLine:stretchLastLine});
      scoreRenderer.setPageFormat('A4_P');
      applyStaffTopRules();
      applyLineSpacingRules();
      return true;
    }
    const HEADER_BASE_Y={title:28,tempo:104,composer:104},HEADER_MIN_Y=8,HEADER_MAX_Y=280;
    function normalizedHeaderPositions(source=projectData?.headerPositions){
      const value=source&&typeof source==='object'?source:{};
      return {title:Number(value.title)||0,tempo:Number(value.tempo)||0,composer:Number(value.composer)||0};
    }
    function ensureHeaderPositions(){
      if(!projectData)return normalizedHeaderPositions();
      projectData.headerPositions=normalizedHeaderPositions(projectData.headerPositions);
      return projectData.headerPositions;
    }
    function titleTextRightOnPage(){
      const range=document.createRange();range.selectNodeContents(scoreTitle);
      const textRect=range.getBoundingClientRect(),pageRect=scorePage.getBoundingClientRect(),scale=scorePageScale||1;
      return (textRect.right-pageRect.left)/scale;
    }
    function syncHeaderDragHandles(){
      const positions=normalizedHeaderPositions(),titleRight=titleTextRightOnPage();
      titleDragHandle.style.top=`${HEADER_BASE_Y.title+positions.title+1}px`;
      titleDragHandle.style.left=`${clamp(titleRight+8,8,A4_WIDTH-48)}px`;
      tempoDragHandle.style.top=`${HEADER_BASE_Y.tempo+positions.tempo-10}px`;
      composerDragHandle.style.top=`${HEADER_BASE_Y.composer+positions.composer-10}px`;
      tempoDragHandle.hidden=scoreTempo.hidden;composerDragHandle.hidden=scoreComposer.hidden;
    }
    function applyHeaderPositions(){
      const positions=normalizedHeaderPositions();
      scoreTitle.style.top=`${HEADER_BASE_Y.title+positions.title}px`;
      scoreTempo.style.top=`${positions.tempo}px`;
      scoreComposer.style.top=`${positions.composer}px`;
      syncHeaderDragHandles();
    }
    let activeHeaderEditor=null;
    function syncHeaderTextPresentation(){
      const tempoText=(projectData?.tempoText??scoreTempo.textContent??'').trim(),composerText=(projectData?.composer??scoreComposer.textContent??'').trim();
      scoreTempo.textContent=tempoText;scoreComposer.textContent=composerText;
      scoreTempo.classList.toggle('header-empty',!tempoText);scoreComposer.classList.toggle('header-empty',!composerText);
      scoreTempo.hidden=!tempoText&&workMode!=='write';scoreComposer.hidden=!composerText&&workMode!=='write';
      syncHeaderDragHandles();
    }
    function headerFieldInfo(element){
      if(element===scoreTitle)return {key:'title',input:titleInput,value:projectData?.title||'',placeholder:'Kappaleen nimi'};
      if(element===scoreTempo)return {key:'tempoText',input:tempoInput,value:projectData?.tempoText||'',placeholder:'Tempoteksti'};
      if(element===scoreComposer)return {key:'composer',input:composerInput,value:projectData?.composer||'',placeholder:'Säveltäjä'};
      return null;
    }
    function finishHeaderInlineEdit(commit=true){
      const state=activeHeaderEditor;if(!state)return;
      activeHeaderEditor=null;
      const {editor,element,info,scoreScrollTop,scoreScrollLeft}=state;
      const value=commit?editor.value.trim():info.value;
      editor.remove();element.style.visibility='';
      if(commit&&projectData){
        projectData[info.key]=value;info.input.value=value;
        if(info.key==='title')scoreTitle.textContent=value||'Nimetön kappale';
        else if(info.key==='tempoText')scoreTempo.textContent=value;
        else scoreComposer.textContent=value;
        invalidatePublishFiles();
      }
      syncHeaderTextPresentation();applyHeaderPositions();
      score.scrollTop=scoreScrollTop;score.scrollLeft=scoreScrollLeft;keepOuterViewportFixed();
      requestAnimationFrame(()=>{score.scrollTop=scoreScrollTop;score.scrollLeft=scoreScrollLeft;keepOuterViewportFixed();});
    }
    function startHeaderInlineEdit(e){
      if(workMode!=='write'||!projectData)return;
      if(e.type==='pointerdown'&&e.pointerType==='mouse'&&e.button!==0)return;
      if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;
      e.preventDefault();e.stopPropagation();
      if(activeHeaderEditor)finishHeaderInlineEdit(true);
      const element=e.currentTarget,info=headerFieldInfo(element);if(!info)return;
      const pageRect=scorePage.getBoundingClientRect(),rect=element.getBoundingClientRect(),scale=scorePageScale||1,style=getComputedStyle(element),isTitle=element===scoreTitle;
      const editor=document.createElement(isTitle?'textarea':'input');
      editor.className='header-inline-editor';editor.value=info.value;editor.placeholder=info.placeholder;
      editor.setAttribute('aria-label',info.placeholder);editor.autocomplete='off';editor.spellcheck=true;
      const left=(rect.left-pageRect.left)/scale,top=(rect.top-pageRect.top)/scale,width=rect.width/scale,height=Math.max(rect.height/scale,isTitle?46:28),sourceFontSize=Number.parseFloat(style.fontSize)||16,editorFontSize=Math.max(16,sourceFontSize),scoreScrollTop=score.scrollTop,scoreScrollLeft=score.scrollLeft,frozenScale=scorePageScale||scale;
      Object.assign(editor.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`,fontFamily:style.fontFamily,fontSize:`${editorFontSize}px`,fontWeight:style.fontWeight,fontStyle:style.fontStyle,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,textAlign:style.textAlign,color:style.color});
      scorePage.appendChild(editor);element.style.visibility='hidden';activeHeaderEditor={editor,element,info,scoreScrollTop,scoreScrollLeft,frozenScale};
      editor.addEventListener('pointerdown',event=>event.stopPropagation());
      editor.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();finishHeaderInlineEdit(false);return}
        if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();finishHeaderInlineEdit(true)}
      });
      editor.addEventListener('blur',()=>{if(activeHeaderEditor?.editor===editor)finishHeaderInlineEdit(true)});
      editor.focus({preventScroll:true});
      editor.setSelectionRange?.(editor.value.length,editor.value.length);
      const restoreHeaderEditViewport=()=>{if(activeHeaderEditor?.editor!==editor)return;score.scrollTop=scoreScrollTop;score.scrollLeft=scoreScrollLeft;keepOuterViewportFixed();};
      restoreHeaderEditViewport();requestAnimationFrame(restoreHeaderEditViewport);setTimeout(restoreHeaderEditViewport,80);
    }
    function startHeaderDrag(e){
      if(workMode!=='edit'||!projectData)return;
      if(e.pointerType==='mouse'&&e.button!==0)return;
      const handle=e.currentTarget,key=handle.dataset.headerTarget;if(!HEADER_BASE_Y[key])return;
      e.preventDefault();e.stopPropagation();
      const positions=ensureHeaderPositions();
      headerDrag={pointerId:e.pointerId,key,startClientY:e.clientY,startOffset:positions[key],handle};
      handle.classList.add('dragging');handle.setPointerCapture?.(e.pointerId);
    }
    function moveHeaderDrag(e){
      if(!headerDrag||e.pointerId!==headerDrag.pointerId)return;
      e.preventDefault();e.stopPropagation();
      const {key,startClientY,startOffset}=headerDrag,scale=scorePageScale||1,base=HEADER_BASE_Y[key],delta=(e.clientY-startClientY)/scale,offset=clamp(startOffset+delta,HEADER_MIN_Y-base,HEADER_MAX_Y-base);
      ensureHeaderPositions()[key]=Math.round(offset*10)/10;applyHeaderPositions();
    }
    function endHeaderDrag(e){
      if(!headerDrag||e.pointerId!==headerDrag.pointerId)return;
      moveHeaderDrag(e);
      const {handle}=headerDrag;handle.classList.remove('dragging');try{handle.releasePointerCapture?.(e.pointerId)}catch{}headerDrag=null;invalidatePublishFiles();
    }
    function cancelHeaderDrag(e){
      if(!headerDrag||e.pointerId!==headerDrag.pointerId)return;
      const {handle,key,startOffset}=headerDrag;ensureHeaderPositions()[key]=startOffset;applyHeaderPositions();handle.classList.remove('dragging');try{handle.releasePointerCapture?.(e.pointerId)}catch{}headerDrag=null;
    }
    function renderedScoreContentHeight(){
      // iPad/Safari ei aina päivitä absoluuttisesti skaalatun scorePage-elementin
      // scrollHeight-arvoa, kun OSMD lisää uuden osmdCanvasPage-sivun. Lasketaan
      // monisivuisen nuotin korkeus suoraan OSMD:n sivuelementeistä.
      const pages=[...osmdContainer.querySelectorAll('[id^="osmdCanvasPage"]')];
      if(!pages.length)return A4_HEIGHT;
      let total=0;
      for(const page of pages){
        const svg=page.matches?.('svg')?page:page.querySelector('svg');
        const attrHeight=Number.parseFloat(svg?.getAttribute?.('height'))||0;
        const viewBoxHeight=svg?.viewBox?.baseVal?.height||0;
        const measured=Math.max(page.offsetHeight||0,svg?.offsetHeight||0,attrHeight,viewBoxHeight);
        total+=Math.max(A4_HEIGHT,measured||A4_HEIGHT);
      }
      return Math.max(A4_HEIGHT,total);
    }
    function updateScorePagePreview(){
      const widthScale=Math.max(1,score.clientWidth-16)/A4_WIDTH,heightScale=score.clientHeight?score.clientHeight/(A4_HEIGHT*A4_VISIBLE_FRACTION):widthScale,computedScale=clamp(Math.min(widthScale,heightScale),.42,1.28),scale=activeHeaderEditor?.frozenScale||computedScale;
      // Nollaa edellisen renderin pakotettu korkeus, jotta sivumäärän väheneminenkin
      // (esim. undo) voidaan mitata oikein.
      scorePage.style.height='';
      osmdContainer.style.minHeight=A4_HEIGHT+'px';
      const contentHeight=renderedScoreContentHeight();
      scorePageScale=scale;
      // Tee scrollausalueesta eksplisiittisesti kaikkien OSMD-sivujen korkuinen.
      // Tämä estää tilanteen, jossa sivu 2 näkyy mutta scrollHeight jää sivun 1 tasolle.
      osmdContainer.style.minHeight=contentHeight+'px';
      scorePage.style.height=contentHeight+'px';
      scorePage.style.transform=`scale(${scale})`;
      scorePageShell.style.width=A4_WIDTH*scale+'px';
      scorePageShell.style.height=contentHeight*scale+'px';
      if(writeEditNoteId)requestAnimationFrame(positionWriteNoteContext);
    }
    function closeKeyboardForWorkMode(){
      if(keyboardPanel.hidden)return;
      clearModifier();setTieArmed(false);setTripletArmed(false);cancelModifierDrag();app.classList.remove('keyboard-open');modifierRail.setAttribute('aria-hidden','true');keyboardPanel.hidden=true;score.setAttribute('aria-expanded','false');
    }
    function syncWorkModeUI(){
      if(!notes.length&&workMode!=='write')workMode='write';
      if(workMode!=='edit')closeNoteSizePanel();
      const hasNotes=notes.length>0,modes=[[writeModeButton,'write'],[editModeButton,'edit'],[printModeButton,'print']];
      editModeButton.disabled=!hasNotes;printModeButton.disabled=!hasNotes;
      modes.forEach(([button,mode])=>button.setAttribute('aria-pressed',String(workMode===mode)));
      app.dataset.workMode=workMode;
      syncHeaderTextPresentation();
      scoreTitle.tabIndex=workMode==='write'?0:-1;scoreTempo.tabIndex=workMode==='write'?0:-1;scoreComposer.tabIndex=workMode==='write'?0:-1;syncHeaderDragHandles();
      score.setAttribute('aria-label',workMode==='write'?'Nuotti-ikkuna. Pyyhkäise pystysuunnassa vierittääksesi A4-sivua tai napauta avataksesi koskettimiston.':workMode==='print'?'Julkaisutila. Valitse julkaisuun liittyvä toiminto.':'Nuotti-ikkuna. Pyyhkäise pystysuunnassa vierittääksesi A4-sivua.');
      selectionToolbar.setAttribute('aria-hidden',String(workMode!=='edit'));
      if(workMode==='edit')syncSelectionToolbar();
      syncWritePasteEndButton();
    }
    function setWorkMode(mode,e){
      if(activeHeaderEditor)finishHeaderInlineEdit(true);
      const next=mode==='edit'?'edit':mode==='print'?'print':'write';
      if(next!=='write'&&!notes.length)return;
      if(workMode==='write'&&next!=='write'&&tripletArmed&&currentTupletHasEntries()){showTupletWarning('Kirjoita tupletti loppuun');return}
      if(workMode==='write'&&next!=='write')clearSelection();
      workMode=next;
      if(next!=='edit')closeNoteSizePanel();
      if(next==='write'&&keyboardPanel.hidden&&e)togglePiano(e);else if(next!=='write')closeKeyboardForWorkMode();
      if(next!=='edit'){
        systemBreakModeActive=false;barlineEditModeActive=false;beamEditModeActive=false;endingModeActive=0;endingDrag=null;selectedNoteIndices.clear();selectionDrag=null;selectionHitboxes=[];clearEditorOverlays();
      }
      if(next!=='write')clearWriteNoteEdit();
      syncWorkModeUI();
      requestAnimationFrame(()=>{positionModifierRail();updateScorePagePreview();syncStaffTopSlider();syncLineSpacingSlider();if(workMode==='edit'){refreshEditGeometry();queueLineSpacingRasterCache()}else if(workMode==='write')refreshWriteGeometry();else if(workMode==='print')preparePublishPdf()});
    }

    function statusMessage(message){status.textContent=message}
    function projectFileBaseName(){
      const raw=(projectData?.title||'Nimetön kappale').trim()||'Nimetön kappale';
      return raw.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()||'nimeton-kappale';
    }
    function downloadBlob(blob,filename){
      const link=document.createElement('a'),url=URL.createObjectURL(blob);
      link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
    }
    let publishPdfBlob=null,publishPdfPromise=null,publishPdfRevision=0;
    function syncPublishPdfButtons(){
      const ready=Boolean(publishPdfBlob),busy=Boolean(publishPdfPromise);
      [publishShareButton].forEach(button=>{if(!button)return;button.disabled=!ready;button.setAttribute('aria-busy',String(busy))});
    }
    function invalidatePublishFiles(){publishPdfRevision+=1;publishPdfBlob=null;publishPdfPromise=null;syncPublishPdfButtons()}
    function scoreSvgPages(){
      const wrappers=[...osmdContainer.querySelectorAll('[id^="osmdCanvasPage"]')],pages=wrappers.map(page=>page.matches?.('svg')?page:page.querySelector('svg')).filter(Boolean);
      if(pages.length)return pages;
      return [...osmdContainer.querySelectorAll('svg')].filter(svg=>!svg.classList.contains('system-break-candidate-svg'));
    }
    function publicationSvgImage(svg){
      return new Promise((resolve,reject)=>{
        const clone=svg.cloneNode(true);clone.querySelectorAll('.system-break-candidate-svg,foreignObject').forEach(element=>element.remove());clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');clone.setAttribute('width',String(A4_WIDTH));clone.setAttribute('height',String(A4_HEIGHT));
        if(!clone.getAttribute('viewBox')){const sourceWidth=Number(svg.getAttribute('width'))||A4_WIDTH,sourceHeight=Number(svg.getAttribute('height'))||A4_HEIGHT;clone.setAttribute('viewBox',`0 0 ${sourceWidth} ${sourceHeight}`)}
        const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),image=new Image();
        image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Nuottisivua ei voitu muuntaa kuvaksi.'))};image.src=url;
      });
    }
    function wrappedCanvasLines(ctx,text,maxWidth,maxLines=2){
      const words=String(text||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
      words.forEach(word=>{const candidate=line?`${line} ${word}`:word;if(!line||ctx.measureText(candidate).width<=maxWidth)line=candidate;else{lines.push(line);line=word}});if(line)lines.push(line);
      if(lines.length>maxLines){const rest=lines.slice(maxLines-1).join(' ');lines.length=maxLines-1;let last=rest;while(last.length>1&&ctx.measureText(`${last}…`).width>maxWidth)last=last.slice(0,-1);lines.push(`${last}…`)}
      return lines;
    }
    function canvasFontFromElement(element){
      const style=getComputedStyle(element),fontStyle=style.fontStyle&&style.fontStyle!=='normal'?`${style.fontStyle} `:'',fontWeight=style.fontWeight||'400',fontSize=style.fontSize||'16px',fontFamily=style.fontFamily||'sans-serif';
      return `${fontStyle}${fontWeight} ${fontSize} ${fontFamily}`;
    }
    async function ensurePublicationFonts(){
      if(!document.fonts?.load)return;
      const requests=[
        [canvasFontFromElement(scoreTitle),(scoreTitle.textContent||projectData?.title||'Nimetön kappale').trim()],
        [canvasFontFromElement(scoreTempo),(scoreTempo.textContent||projectData?.tempoText||'').trim()],
        [canvasFontFromElement(scoreComposer),(scoreComposer.textContent||projectData?.composer||'').trim()]
      ];
      await Promise.all(requests.filter(([,sample])=>sample).map(([font,sample])=>document.fonts.load(font,sample).catch(()=>[])));
      try{await document.fonts.ready}catch{}
    }
    function drawPublicationHeader(ctx){
      const title=(scoreTitle.textContent||projectData?.title||'Nimetön kappale').trim(),tempo=(scoreTempo.textContent||projectData?.tempoText||'').trim(),composer=(scoreComposer.textContent||projectData?.composer||'').trim(),titleStyle=getComputedStyle(scoreTitle),infoStyle=getComputedStyle(scoreTempo.parentElement),tempoStyle=getComputedStyle(scoreTempo),composerStyle=getComputedStyle(scoreComposer),titleTop=Number.parseFloat(titleStyle.top)||28,infoTop=Number.parseFloat(infoStyle.top)||104,tempoTop=infoTop+(Number.parseFloat(tempoStyle.top)||0),composerTop=infoTop+(Number.parseFloat(composerStyle.top)||0);
      ctx.save();ctx.fillStyle='#18202a';ctx.textBaseline='top';ctx.textAlign='center';ctx.font=canvasFontFromElement(scoreTitle);wrappedCanvasLines(ctx,title,A4_WIDTH-100,2).forEach((line,index)=>ctx.fillText(line,A4_WIDTH/2,titleTop+index*29));ctx.fillStyle='#263342';if(tempo){ctx.font=canvasFontFromElement(scoreTempo);ctx.textAlign='left';ctx.fillText(tempo,50,tempoTop)}if(composer){ctx.font=canvasFontFromElement(scoreComposer);ctx.textAlign='right';ctx.fillText(composer,A4_WIDTH-50,composerTop)}ctx.restore();
    }
    function canvasBlob(canvas,type='image/png',quality){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PDF-sivun kuvan luominen epäonnistui.')),type,quality))}
    async function publicationPagePng(svg,pageIndex){
      const rasterScale=2,canvas=document.createElement('canvas');canvas.width=A4_WIDTH*rasterScale;canvas.height=A4_HEIGHT*rasterScale;const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('PDF-kuvapintaa ei voitu luoda.');ctx.setTransform(rasterScale,0,0,rasterScale,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,A4_WIDTH,A4_HEIGHT);const image=await publicationSvgImage(svg);ctx.drawImage(image,0,0,A4_WIDTH,A4_HEIGHT);if(pageIndex===0)drawPublicationHeader(ctx);const blob=await canvasBlob(canvas);canvas.width=1;canvas.height=1;return new Uint8Array(await blob.arrayBuffer());
    }
    async function createScorePdfBlob(){
      await ensurePublicationFonts();
      const PDFDocument=window.PDFLib?.PDFDocument;if(!PDFDocument)throw new Error('PDF-moottori ei ole vielä käytettävissä.');const svgs=scoreSvgPages();if(!svgs.length)throw new Error('Nuottisivuja ei löytynyt PDF:ää varten.');const documentPdf=await PDFDocument.create(),pageWidth=595.28,pageHeight=841.89;documentPdf.setTitle(projectData?.title||'Nimetön kappale');if(projectData?.composer)documentPdf.setAuthor(projectData.composer);documentPdf.setCreator('Pikakirjoitin');
      for(let index=0;index<svgs.length;index+=1){const pngBytes=await publicationPagePng(svgs[index],index),image=await documentPdf.embedPng(pngBytes),page=documentPdf.addPage([pageWidth,pageHeight]);page.drawImage(image,{x:0,y:0,width:pageWidth,height:pageHeight})}
      const bytes=await documentPdf.save({useObjectStreams:true});return new Blob([bytes],{type:'application/pdf'});
    }
    async function preparePublishPdf(){
      if(publishPdfBlob)return publishPdfBlob;if(publishPdfPromise)return publishPdfPromise;const revision=publishPdfRevision,promise=createScorePdfBlob();publishPdfPromise=promise;syncPublishPdfButtons();statusMessage('PDF valmistellaan…');
      try{const blob=await promise;if(revision===publishPdfRevision){publishPdfBlob=blob;statusMessage('PDF valmis jaettavaksi.')}return blob}catch(error){console.error(error);if(revision===publishPdfRevision)statusMessage(error?.message||'PDF:n valmistelu epäonnistui.');return null}finally{if(publishPdfPromise===promise)publishPdfPromise=null;syncPublishPdfButtons()}
    }
    function canShareFiles(files){if(typeof navigator.share!=='function')return false;try{return typeof navigator.canShare!=='function'||navigator.canShare({files})}catch{return false}}
    function shareOrDownloadFiles(files,{successMessage,fallbackMessage}){
      if(canShareFiles(files)){
        navigator.share({files}).then(()=>statusMessage(successMessage)).catch(error=>{if(error?.name==='AbortError')statusMessage('Jakaminen peruttiin.');else{console.error(error);files.forEach(file=>downloadBlob(file,file.name));statusMessage(fallbackMessage)}});return;
      }
      files.forEach(file=>downloadBlob(file,file.name));statusMessage(fallbackMessage);
    }
    function sharePdf(){
      if(!publishPdfBlob){statusMessage('PDF valmistuu vielä. Kokeile hetken kuluttua uudelleen.');preparePublishPdf();return}
      const baseName=projectFileBaseName(),now=Date.now();
      const pdfFile=new File([publishPdfBlob],`${baseName}.pdf`,{type:'application/pdf',lastModified:now});
      const xmlFile=new File([buildMusicXml()],`${baseName}.musicxml`,{type:'application/vnd.recordare.musicxml+xml',lastModified:now});
      shareOrDownloadFiles([pdfFile,xmlFile],{successMessage:'PDF ja MusicXML annettu jakoikkunaan.',fallbackMessage:'PDF ja MusicXML ladattu laitteelle.'});
    }
    function printScore(){statusMessage('Avataan tulostus…');window.print()}
    function buildProjectFile(){
      return {format:'pikakirjoitin-project',version:'1.0',savedAt:new Date().toISOString(),projectData:projectData?{...projectData}:null,notes:notes.map(note=>({...note})),slurs:slurs.map(item=>({...item})),hairpins:hairpins.map(item=>({...item})),endings:endings.map(item=>({...item})),systemBreaks:[...systemBreaks],barlineStyles:[...barlineStyles],beamOverrides:[...beamOverrides],staffTopValue,lineSpacingValue,noteSizePercent,stretchLastLine,notation:{tuning:tuningSelect.value,clef:clefSelect.value,keySignature:keySignatureSelect.value,timeSignature:timeSignatureSelect.value,pickupDuration:Number(pickupSelect.value)||0,noteSizePercent}};
    }
    function saveProjectFile(){
      const payload=JSON.stringify(buildProjectFile(),null,2),filename=`${projectFileBaseName()}.pikakirjoitin`,projectFile=new File([payload],filename,{type:'application/json;charset=utf-8',lastModified:Date.now()});
      shareOrDownloadFiles([projectFile],{successMessage:'Pikakirjoitin-projekti annettu jakoikkunaan.',fallbackMessage:'Pikakirjoitin-projekti ladattu laitteelle.'});
    }
    function nextIdFromItems(items,prefix){
      let maximum=0;
      for(const item of items||[]){const raw=prefix==='tuplet'?item?.tupletId:item?.id,match=String(raw||'').match(new RegExp(`^${prefix}-(\\d+)$`));if(match)maximum=Math.max(maximum,Number(match[1])||0)}
      return maximum+1;
    }
    function projectKeyOption(data){
      return [...keySignatureSelect.options].find(option=>+option.value===+(data?.keySignature??0)&&(option.dataset.mode||'major')===(data?.keyMode||'major')&&(option.dataset.tonic||'C')===(data?.keyTonic||'C'))||[...keySignatureSelect.options].find(option=>+option.value===+(data?.keySignature??0));
    }
    async function loadProjectFile(file){
      if(!file)return;
      let payload;
      try{payload=JSON.parse(await file.text())}catch{throw new Error('Projektitiedostoa ei voitu lukea.')}
      if(payload?.format!=='pikakirjoitin-project'||!payload.projectData||!Array.isArray(payload.notes))throw new Error('Tiedosto ei ole Pikakirjoitin-projekti.');
      closeKeyboardForWorkMode();setTieArmed(false);setTripletArmed(false);clearWriteNoteEdit();
      const notation=payload.notation||{},loadedProject={...payload.projectData};
      if(!themeDefinitions[loadedProject.themeId])loadedProject.themeId=currentThemeId();
      const tuning=notation.tuning||loadedProject.tuning||'C';tuningSelect.value=Object.hasOwn(tuningTransposes,tuning)?tuning:'C';
      const clef=notation.clef||loadedProject.clef||'treble';clefSelect.value=Object.hasOwn(clefKeyboardStarts,clef)?clef:'treble';
      const keyOption=projectKeyOption(loadedProject);if(keyOption)keySignatureSelect.selectedIndex=keyOption.index;
      const meter=notation.timeSignature||loadedProject.timeSignature||'4/4';timeSignatureSelect.value=[...timeSignatureSelect.options].some(option=>option.value===meter)?meter:'4/4';
      pickupSelect.value=String(Number(notation.pickupDuration??loadedProject.pickupDuration)||0);syncPickupOptions();
      projectData={...loadedProject,tuning:tuningSelect.value,clef:clefSelect.value,timeSignature:timeSignatureSelect.value,pickupDuration:Number(pickupSelect.value)||0,transpose:tuningTransposes[tuningSelect.value]||0};
      const keyInfo=selectedKeyInfo();projectData.keySignature=keyInfo.fifths;projectData.keyMode=keyInfo.mode;projectData.keyTonic=keyInfo.tonic;projectData.keySignatureName=selectedText(keySignatureSelect);
      notes=payload.notes.map(note=>({...note}));slurs=Array.isArray(payload.slurs)?payload.slurs.map(item=>({...item})):[];hairpins=Array.isArray(payload.hairpins)?payload.hairpins.map(item=>({...item})):[];endings=Array.isArray(payload.endings)?payload.endings.map(item=>({...item})):[];
      systemBreaks=new Set(Array.isArray(payload.systemBreaks)?payload.systemBreaks:[]);barlineStyles=new Map(Array.isArray(payload.barlineStyles)?payload.barlineStyles:[]);beamOverrides=new Map(Array.isArray(payload.beamOverrides)?payload.beamOverrides:[]);
      staffTopValue=clamp(Number(payload.staffTopValue)||STAFF_TOP_DEFAULT,STAFF_TOP_MIN,STAFF_TOP_MAX);lineSpacingValue=clamp(Number(payload.lineSpacingValue)||5,LINE_SPACING_MIN,LINE_SPACING_MAX);noteSizePercent=clamp(Number(payload.noteSizePercent??notation.noteSizePercent)||NOTE_SIZE_DEFAULT,NOTE_SIZE_MIN,NOTE_SIZE_MAX);stretchLastLine=Boolean(payload.stretchLastLine);
      nextEntryId=nextIdFromItems(notes,'entry');nextTupletId=nextIdFromItems(notes,'tuplet');ensureEntryIds();pruneEditRanges();
      editHistory=[];scoreUndoneAction=null;selectedNoteIndices.clear();selectionClipboard=null;workMode='write';
      titleInput.value=projectData.title||'';composerInput.value=projectData.composer||'';tempoInput.value=projectData.tempoText||'';
      themeSelect.value=projectData.themeId||currentThemeId();
      applyTheme(themeSelect.value);
      saveThemePreference();
      scoreTitle.textContent=projectData.title||'Nimetön kappale';scoreTempo.textContent=projectData.tempoText||'';scoreComposer.textContent=projectData.composer||'';syncHeaderTextPresentation();applyHeaderPositions();
      syncNotationChoices();syncKeyPicker();syncMeterPicker();syncPickupButtons();buildKeyboard();applyNotationSettings();syncWorkModeUI();syncStaffTopSlider();syncLineSpacingSlider();syncNoteSizeControls();
      projectModal.hidden=true;app.inert=false;app.removeAttribute('aria-hidden');await renderScore();requestAnimationFrame(()=>{updateScorePagePreview();score.focus()});statusMessage(`Projekti avattu: ${projectData.title||file.name}`);
    }
    function chooseProjectFile(e){e?.preventDefault();projectFileInput.value='';projectFileInput.click()}
    async function projectFileChosen(){
      const file=projectFileInput.files?.[0];if(!file)return;
      try{await loadProjectFile(file)}catch(error){console.error(error);statusMessage(error?.message||'Projektin avaaminen epäonnistui.');window.alert(error?.message||'Projektin avaaminen epäonnistui.')}finally{projectFileInput.value=''}
    }

    async function renderScore(){
      invalidatePublishFiles();
      syncWorkModeUI();
      scorePrompt.hidden=notes.length>0;scoreRenderPending=true;
      if(scoreRendering||!ensureScoreRenderer())return;
      scoreRendering=true;
      try{
        while(scoreRenderPending){
          scoreRenderPending=false;
          invalidateLineSpacingRasterCache();
          scoreRenderer.setOptions?.({newSystemFromXML:true,stretchLastSystemLine:stretchLastLine});
          applyStaffTopRules();
          applyLineSpacingRules();
          if(scoreRenderer.EngravingRules){scoreRenderer.EngravingRules.StretchLastSystemLine=stretchLastLine;scoreRenderer.EngravingRules.LastSystemMaxScalingFactor=stretchLastLine?100:1.4}
          await scoreRenderer.load(buildMusicXml({forRender:true}));
          scoreRenderer.Zoom=noteSizeZoom();
          applyStaffTopRules();
          applyLineSpacingRules();
          if(scoreRenderer.EngravingRules){scoreRenderer.EngravingRules.StretchLastSystemLine=stretchLastLine;scoreRenderer.EngravingRules.LastSystemMaxScalingFactor=stretchLastLine?100:1.4}
          await scoreRenderer.render();centerMeasureRests();updateScorePagePreview();captureAutomaticTiePlacements();
          if(workMode==='edit')await new Promise(resolve=>requestAnimationFrame(resolve));
          refreshEditGeometry();refreshWriteGeometry();queueLineSpacingRasterCache();
        }
      }catch(error){
        console.error(error);scorePrompt.hidden=false;scorePrompt.textContent='NUOTTIKUVAA EI VOITU NÄYTTÄÄ';
      }finally{
        scoreRendering=false;if(scoreRenderPending)renderScore();
      }
    }
    function isEditableNote(index){const note=notes[index];return Boolean(note&&!note.rest&&!note.measureRest)}
    function getSelectedNoteIndices(){return [...selectedNoteIndices].filter(isEditableNote).sort((a,b)=>a-b)}
    function getSelectionRange(){
      ensureEntryIds();const indices=getSelectedNoteIndices();if(indices.length<2)return null;
      const first=indices[0],last=indices.at(-1);
      for(let index=first;index<=last;index+=1)if(!isEditableNote(index)||!selectedNoteIndices.has(index))return null;
      return {first,last,startId:notes[first].id,endId:notes[last].id};
    }
    function findSelectionSlur(range=getSelectionRange()){return range?slurs.find(item=>item.startId===range.startId&&item.endId===range.endId)||null:null}
    function findSelectionHairpin(type,range=getSelectionRange()){return range?hairpins.find(item=>item.type===type&&item.startId===range.startId&&item.endId===range.endId)||null:null}
    function getSelectedTieStartIndex(){
      const indices=getSelectedNoteIndices();if(!indices.length)return null;
      for(let i=0;i<indices.length-1;i+=1){const first=indices[i],second=indices[i+1];if(second===first+1&&notes[second]?.tieFromPrevious)return first}
      const index=indices[0];if(notes[index+1]?.tieFromPrevious)return index;if(index>0&&notes[index]?.tieFromPrevious)return index-1;return null;
    }
    function renderedTiePlacement(index){
      const measureList=scoreRenderer?.GraphicSheet?.MeasureList||[];
      for(const measureGroup of measureList)for(const measure of measureGroup||[])for(const staffEntry of measure?.staffEntries||[])for(const voiceEntry of staffEntry?.graphicalVoiceEntries||[])for(const graphicalNote of voiceEntry?.notes||[]){
        const objectId=graphicalNote?.sourceNote?.NoteToGraphicalNoteObjectId;if(renderedNoteObjectMap.get(objectId)!==index)continue;
        const vexRef=graphicalNote.vfnote,vexNote=Array.isArray(vexRef)?vexRef[0]:vexRef;if(!vexNote)continue;
        let stemDirection=typeof vexNote.getStemDirection==='function'?Number(vexNote.getStemDirection()):Number(vexNote.stem_direction??vexNote.stemDirection);
        if(stemDirection>0)return 'below';if(stemDirection<0)return 'above';
      }
      return Number(notes[index]?.midi)>=71?'above':'below';
    }
    function captureAutomaticTiePlacements(){notes.forEach((note,index)=>{if(notes[index+1]?.tieFromPrevious&&note.tiePlacement!=='above'&&note.tiePlacement!=='below')note.tiePlacement=renderedTiePlacement(index)})}
    function syncSelectionToolbar(){
      pruneEditRanges();const indices=getSelectedNoteIndices(),range=getSelectionRange(),tieIndex=getSelectedTieStartIndex(),slur=findSelectionSlur(range),crescendo=findSelectionHairpin('crescendo',range),diminuendo=findSelectionHairpin('diminuendo',range),allStaccato=indices.length>0&&indices.every(index=>notes[index].staccato),allPortato=indices.length>0&&indices.every(index=>notes[index].portato),allAccent=indices.length>0&&indices.every(index=>notes[index].accent);
      const setButton=(button,enabled,active=false)=>{button.disabled=!enabled;button.setAttribute('aria-pressed',String(Boolean(active)))};
      setButton(selectionSlurButton,Boolean(range),Boolean(slur));setButton(selectionSlurFlipButton,Boolean(slur),false);setButton(selectionStemFlipButton,indices.length>0,false);setButton(selectionTieFlipButton,Number.isInteger(tieIndex),Number.isInteger(tieIndex));setButton(selectionStaccatoButton,indices.length>0,allStaccato);setButton(selectionPortatoButton,indices.length>0,allPortato);setButton(selectionAccentButton,indices.length>0,allAccent);setButton(selectionCrescendoButton,Boolean(range),Boolean(crescendo));setButton(selectionDiminuendoButton,Boolean(range),Boolean(diminuendo));
      const activeDynamic=indices.length?(notes[indices[0]].dynamic||''):'';selectionDynamicButtons.forEach(button=>{button.disabled=!indices.length;button.setAttribute('aria-pressed',String(Boolean(indices.length&&button.dataset.dynamic===activeDynamic))) });
      systemBreakButton.setAttribute('aria-pressed',String(systemBreakModeActive));barlineEditButton.setAttribute('aria-pressed',String(barlineEditModeActive));beamEditButton.setAttribute('aria-pressed',String(beamEditModeActive));endingOneButton.setAttribute('aria-pressed',String(endingModeActive===1));endingTwoButton.setAttribute('aria-pressed',String(endingModeActive===2));stretchLastLineButton.setAttribute('aria-pressed',String(stretchLastLine));stretchLastLineButton.setAttribute('aria-busy',String(stretchCommandRunning));
    }
    function writeSelectionBounds(){
      const hits=writeNoteHitboxes.filter(hit=>selectedNoteIndices.has(hit.entryIndex));if(!hits.length)return null;
      return {left:Math.min(...hits.map(hit=>hit.left)),top:Math.min(...hits.map(hit=>hit.top)),right:Math.max(...hits.map(hit=>hit.right)),bottom:Math.max(...hits.map(hit=>hit.bottom))};
    }
    function positionWriteSelectionActions(){
      if(!writeSelectionActions||writeSelectionActions.hidden)return;const bounds=writeSelectionBounds();if(!bounds)return;
      const scale=scorePageScale||1,shellLeft=scorePageShell.offsetLeft,shellTop=scorePageShell.offsetTop,toolbarWidth=writeSelectionActions.offsetWidth||184,toolbarHeight=writeSelectionActions.offsetHeight||52,scoreHeight=Math.max(score.clientHeight,score.scrollHeight);
      let left=shellLeft+((bounds.left+bounds.right)/2)*scale-toolbarWidth/2,top=shellTop+bounds.top*scale-toolbarHeight-8;
      left=clamp(left,score.scrollLeft+6,score.scrollLeft+score.clientWidth-toolbarWidth-6);top=clamp(top,score.scrollTop+6,Math.max(score.scrollTop+6,scoreHeight-toolbarHeight-6));writeSelectionActions.style.left=`${left}px`;writeSelectionActions.style.top=`${top}px`;
    }
    function syncWritePasteEndButton(){
      if(!writeSelectionActions)return;const show=workMode==='write'&&!writeSelectionActive&&selectedNoteIndices.size>0&&Boolean(selectionClipboard?.notes?.length);writeSelectionActions.hidden=!show;if(show)requestAnimationFrame(positionWriteSelectionActions);
    }
    const SELECTION_TOOLBAR_POSITION_KEY='pikakirjoitin-selection-toolbar-position-v1';
    function clampSelectionToolbarPosition(left,top){
      const areaRect=scoreArea.getBoundingClientRect(),toolbarRect=selectionToolbar.getBoundingClientRect(),pad=8,maxLeft=Math.max(pad,areaRect.width-toolbarRect.width-pad),maxTop=Math.max(pad,areaRect.height-toolbarRect.height-pad);return {left:clamp(left,pad,maxLeft),top:clamp(top,pad,maxTop)};
    }
    function setSelectionToolbarPosition(left,top,save=false){
      const pos=clampSelectionToolbarPosition(left,top);selectionToolbar.style.left=`${pos.left}px`;selectionToolbar.style.top=`${pos.top}px`;selectionToolbar.style.transform='none';if(save)try{localStorage.setItem(SELECTION_TOOLBAR_POSITION_KEY,JSON.stringify(pos))}catch{}
    }
    function restoreSelectionToolbarPosition(){
      let saved=null;try{saved=JSON.parse(localStorage.getItem(SELECTION_TOOLBAR_POSITION_KEY)||'null')}catch{}if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top)){setSelectionToolbarPosition(saved.left,saved.top);return}selectionToolbar.style.left='50%';selectionToolbar.style.top='16px';selectionToolbar.style.transform='translateX(-50%)';
    }
    function beginSelectionToolbarDrag(e){
      if(workMode!=='edit'||e.button>0)return;e.preventDefault();e.stopPropagation();const areaRect=scoreArea.getBoundingClientRect(),rect=selectionToolbar.getBoundingClientRect();selectionToolbarDrag={pointerId:e.pointerId,offsetX:e.clientX-rect.left,offsetY:e.clientY-rect.top};selectionToolbar.style.left=`${rect.left-areaRect.left}px`;selectionToolbar.style.top=`${rect.top-areaRect.top}px`;selectionToolbar.style.transform='none';try{selectionToolbarDragHandle.setPointerCapture(e.pointerId)}catch{}
    }
    function moveSelectionToolbarDrag(e){
      if(!selectionToolbarDrag||selectionToolbarDrag.pointerId!==e.pointerId)return;e.preventDefault();e.stopPropagation();const areaRect=scoreArea.getBoundingClientRect();setSelectionToolbarPosition(e.clientX-areaRect.left-selectionToolbarDrag.offsetX,e.clientY-areaRect.top-selectionToolbarDrag.offsetY);
    }
    function endSelectionToolbarDrag(e){
      if(!selectionToolbarDrag||selectionToolbarDrag.pointerId!==e.pointerId)return;e.preventDefault();e.stopPropagation();selectionToolbarDrag=null;const left=parseFloat(selectionToolbar.style.left)||0,top=parseFloat(selectionToolbar.style.top)||0;setSelectionToolbarPosition(left,top,true);try{selectionToolbarDragHandle.releasePointerCapture(e.pointerId)}catch{}
    }
    function toggleDynamicForSelection(value){const indices=getSelectedNoteIndices();if(!indices.length)return;const current=notes[indices[0]]?.dynamic||'';applyDynamicForSelection(current===value?'':value)}
    function captureSelectionClipboard(){
      ensureEntryIds();const indices=getSelectedNoteIndices();if(!indices.length){selectionClipboard=null;syncSelectionToolbar();syncWritePasteEndButton();return null}
      const first=indices[0],last=indices.at(-1),source=notes.slice(first,last+1).map(note=>({...note})),sourceIds=new Map();
      source.forEach((note,offset)=>sourceIds.set(note.id,offset));
      if(source[0])source[0].tieFromPrevious=false;
      const tupletCounts=new Map();source.forEach(note=>{if(note.tupletId)tupletCounts.set(note.tupletId,(tupletCounts.get(note.tupletId)||0)+1)});
      source.forEach(note=>{if(note.tupletId&&tupletCounts.get(note.tupletId)!==notes.filter(item=>item.tupletId===note.tupletId).length)stripTupletMetadata(note)});
      const copiedSlurs=slurs.filter(item=>sourceIds.has(item.startId)&&sourceIds.has(item.endId)).map(item=>({startOffset:sourceIds.get(item.startId),endOffset:sourceIds.get(item.endId),placement:item.placement}));
      selectionClipboard={notes:source,slurs:copiedSlurs};syncSelectionToolbar();syncWritePasteEndButton();return selectionClipboard;
    }
    function buildPastedSelection(){
      const clip=selectionClipboard;if(!clip?.notes?.length)return null;
      const tupletIdMap=new Map(),idByOffset=[];
      const pastedNotes=clip.notes.map((source,offset)=>{
        const note={...source,id:createEntryId()};idByOffset[offset]=note.id;
        if(note.tupletId){if(!tupletIdMap.has(note.tupletId))tupletIdMap.set(note.tupletId,`tuplet-${nextTupletId++}`);note.tupletId=tupletIdMap.get(note.tupletId)}
        if(offset===0)note.tieFromPrevious=false;return note;
      });
      const pastedSlurs=(clip.slurs||[]).map(item=>({startId:idByOffset[item.startOffset],endId:idByOffset[item.endOffset],placement:item.placement})).filter(item=>item.startId&&item.endId);
      return {notes:pastedNotes,slurs:pastedSlurs};
    }
    function pasteSelectionToEnd(){
      const pasted=buildPastedSelection();if(!pasted?.notes?.length)return;
      notes.push(...pasted.notes);slurs.push(...pasted.slurs);rememberAction({type:'paste-end',notes:pasted.notes.map(note=>({...note})),slurs:pasted.slurs.map(item=>({...item}))});
      status.textContent=`Liitetty loppuun: ${pasted.notes.length} ${pasted.notes.length===1?'nuotti':'nuottia'}`;renderScore();
    }
    function writeDeleteSnapshot(){return {notes:notes.map(note=>({...note})),slurs:slurs.map(item=>({...item})),hairpins:hairpins.map(item=>({...item})),systemBreaks:[...systemBreaks],barlineStyles:[...barlineStyles],beamOverrides:[...beamOverrides],endings:endings.map(item=>({...item}))}}
    function restoreWriteDeleteSnapshot(snapshot){if(!snapshot)return;notes=(snapshot.notes||[]).map(note=>({...note}));slurs=(snapshot.slurs||[]).map(item=>({...item}));hairpins=(snapshot.hairpins||[]).map(item=>({...item}));systemBreaks=new Set(snapshot.systemBreaks||[]);barlineStyles=new Map(snapshot.barlineStyles||[]);beamOverrides=new Map(snapshot.beamOverrides||[]);endings=(snapshot.endings||[]).map(item=>({...item}));selectedNoteIndices.clear();selectionClipboard=null;selectionHitboxes=[];clearWriteNoteEdit();syncWritePasteEndButton()}
    function deleteWriteSelection(){
      const indices=getSelectedNoteIndices();if(!indices.length)return;const first=indices[0],selected=new Set(indices),before=writeDeleteSnapshot();
      notes=notes.filter((note,index)=>!selected.has(index));selectedNoteIndices.clear();selectionClipboard=null;selectionHitboxes=[];repairTiesAround(Math.max(0,first-1));repairTiesAround(Math.min(first,Math.max(0,notes.length-1)));pruneEditRanges();const after=writeDeleteSnapshot();rememberAction({type:'delete-selection',before,after});status.textContent=`Poistettu ${indices.length} ${indices.length===1?'nuotti':'nuottia'}`;renderScore();
    }
    function clearSelection(){selectedNoteIndices.clear();selectionDrag=null;selectionClipboard=null;writeSelectionActive=false;writeSelectionCandidate=null;if(writeSelectionHoldTimer){clearTimeout(writeSelectionHoldTimer);writeSelectionHoldTimer=null}renderSelectionOverlay();syncWritePasteEndButton()}
    function rectanglesIntersect(a,b){return a.left<=b.right&&a.right>=b.left&&a.top<=b.bottom&&a.bottom>=b.top}
    function normalizedRectangle(start,end){return {left:Math.min(start.x,end.x),right:Math.max(start.x,end.x),top:Math.min(start.y,end.y),bottom:Math.max(start.y,end.y)}}
    function clientPointToScoreContent(clientX,clientY){
      const rect=osmdContainer.getBoundingClientRect(),scale=scorePageScale||1;
      return {x:(clientX-rect.left)/scale+osmdContainer.scrollLeft,y:(clientY-rect.top)/scale+osmdContainer.scrollTop};
    }
    function clientRectToScoreContent(rect){
      const topLeft=clientPointToScoreContent(rect.left,rect.top),bottomRight=clientPointToScoreContent(rect.right,rect.bottom);
      return {left:topLeft.x,top:topLeft.y,right:bottomRight.x,bottom:bottomRight.y,width:bottomRight.x-topLeft.x,height:bottomRight.y-topLeft.y};
    }
    function renderedMeasureElement(measure,svg){
      if(!measure||!svg)return null;const number=String(measure.MeasureNumber??'');if(!number)return null;
      for(const element of svg.querySelectorAll?.('.vf-measure')||[])if(element.id===number)return element;
      return null;
    }
    function svgElementPointToScoreContent(element,x,y){
      if(!element||!Number.isFinite(x)||!Number.isFinite(y))return null;
      try{
        const box=element.getBBox?.(),rect=element.getBoundingClientRect?.();
        if(box&&rect&&box.width>0&&box.height>0&&rect.width>0&&rect.height>0){
          return clientPointToScoreContent(rect.left+(x-box.x)*rect.width/box.width,rect.top+(y-box.y)*rect.height/box.height);
        }
      }catch{}
      try{
        const matrix=element.getScreenCTM?.(),svg=element.ownerSVGElement||element,point=svg.createSVGPoint?.();
        if(matrix&&point){point.x=x;point.y=y;const transformed=point.matrixTransform(matrix);return clientPointToScoreContent(transformed.x,transformed.y)}
      }catch{}
      return null;
    }
    function svgElementRectToScoreContent(element,x,y,width,height){
      const points=[[x,y],[x+width,y],[x,y+height],[x+width,y+height]].map(([px,py])=>svgElementPointToScoreContent(element,px,py)).filter(Boolean);
      if(points.length!==4)return null;const xs=points.map(point=>point.x),ys=points.map(point=>point.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
      return {left,top,right,bottom,width:right-left,height:bottom-top};
    }
    function contentPointFromPointer(e){return clientPointToScoreContent(e.clientX,e.clientY)}
    function buildSelectionHitboxes(){
      selectionHitboxes=[];if(workMode!=='edit'||!scoreRenderer)return;
      const measureList=scoreRenderer.GraphicSheet?.MeasureList||[],containerRect=osmdContainer.getBoundingClientRect(),scale=scorePageScale||1,visited=new Set();
      measureList.forEach(group=>(group||[]).forEach(measure=>(measure?.staffEntries||[]).forEach(staffEntry=>(staffEntry?.graphicalVoiceEntries||[]).forEach(voiceEntry=>(voiceEntry?.notes||[]).forEach(graphicalNote=>{
        const objectId=graphicalNote?.sourceNote?.NoteToGraphicalNoteObjectId,index=renderedNoteObjectMap.get(objectId);if(!Number.isInteger(index)||!isEditableNote(index))return;
        const vexRef=graphicalNote.vfnote,vexNote=Array.isArray(vexRef)?vexRef[0]:vexRef,element=vexNote?.attrs?.el||voiceEntry?.mVexFlowStaveNote?.attrs?.el;if(!element||visited.has(element))return;visited.add(element);
        const rect=element.getBoundingClientRect?.();if(!rect||!rect.width||!rect.height)return;
        const paddingX=7,paddingY=5,left=(rect.left-containerRect.left)/scale-paddingX,top=(rect.top-containerRect.top)/scale-paddingY,width=Math.max(28,rect.width/scale+paddingX*2),height=Math.max(30,rect.height/scale+paddingY*2);
        selectionHitboxes.push({entryIndex:index,left,top,right:left+width,bottom:top+height,width,height});
      })))))
    }
    function renderSelectionOverlay(){
      osmdContainer.querySelector('.note-selection-layer')?.remove();
      if(workMode==='edit')syncSelectionToolbar();else syncWritePasteEndButton();
      if(workMode!=='edit'&&workMode!=='write')return;
      if(workMode==='write'&&!writeSelectionActive&&!selectedNoteIndices.size)return;
      const layer=document.createElement('div');layer.className='note-selection-layer';layer.style.width=`${osmdContainer.scrollWidth}px`;layer.style.height=`${osmdContainer.scrollHeight}px`;
      selectionHitboxes.forEach(hitbox=>{if(!selectedNoteIndices.has(hitbox.entryIndex))return;const highlight=document.createElement('div');highlight.className='note-selection-highlight';highlight.style.left=`${hitbox.left}px`;highlight.style.top=`${hitbox.top}px`;highlight.style.width=`${hitbox.width}px`;highlight.style.height=`${hitbox.height}px`;layer.appendChild(highlight)});
      if(selectionDrag){const rect=normalizedRectangle(selectionDrag.start,selectionDrag.current),marquee=document.createElement('div');marquee.className='note-selection-marquee';marquee.style.left=`${rect.left}px`;marquee.style.top=`${rect.top}px`;marquee.style.width=`${Math.max(1,rect.right-rect.left)}px`;marquee.style.height=`${Math.max(1,rect.bottom-rect.top)}px`;layer.appendChild(marquee)}
      osmdContainer.appendChild(layer);if(workMode==='write')requestAnimationFrame(positionWriteSelectionActions);
    }
    function applyStaffTopRules(){
      if(!scoreRenderer?.EngravingRules)return;
      const rules=scoreRenderer.EngravingRules,zoom=noteSizeZoom(),compensatedValue=staffTopValue/zoom;
      if(!noteSizeBasePageMargins)noteSizeBasePageMargins={left:rules.PageLeftMargin,right:rules.PageRightMargin,bottom:rules.PageBottomMargin};
      rules.PageLeftMargin=noteSizeBasePageMargins.left/zoom;rules.PageRightMargin=noteSizeBasePageMargins.right/zoom;rules.PageBottomMargin=noteSizeBasePageMargins.bottom/zoom;
      rules.PageTopMargin=compensatedValue;
      rules.PageTopMarginNarrow=compensatedValue;
    }
    function staffTopRatio(value=staffTopValue){return (clamp(value,STAFF_TOP_MIN,STAFF_TOP_MAX)-STAFF_TOP_MIN)/(STAFF_TOP_MAX-STAFF_TOP_MIN)}
    function syncStaffTopSlider(value=staffTopValue){
      const ratio=staffTopRatio(value),travel=Math.max(0,staffTopSlider.clientHeight-staffTopThumb.offsetHeight-20),y=10+ratio*travel;
      staffTopThumb.style.transform=`translate3d(0,${y}px,0)`;
      staffTopFill.style.height=`${ratio*100}%`;
      staffTopSlider.setAttribute('aria-valuenow',String(Number(value.toFixed(2))));
      const delta=value-STAFF_TOP_DEFAULT;
      staffTopSlider.setAttribute('aria-valuetext',Math.abs(delta)<.01?'Nykyinen aloituskorkeus':delta>0?`Viivastot ${Math.round(delta*10)} px alempana`:`Viivastot ${Math.round(-delta*10)} px ylempänä`);
    }
    function applyLineSpacingRules(){
      if(!scoreRenderer?.EngravingRules)return;
      const compensatedValue=lineSpacingValue/noteSizeZoom();
      scoreRenderer.EngravingRules.MinimumDistanceBetweenSystems=compensatedValue;
      scoreRenderer.EngravingRules.MinSkyBottomDistBetweenSystems=compensatedValue;
    }
    function lineSpacingRatio(value=lineSpacingValue){return (clamp(value,LINE_SPACING_MIN,LINE_SPACING_MAX)-LINE_SPACING_MIN)/(LINE_SPACING_MAX-LINE_SPACING_MIN)}
    function syncLineSpacingSlider(value=lineSpacingValue){
      const ratio=lineSpacingRatio(value),travel=Math.max(0,lineSpacingSlider.clientHeight-lineSpacingThumb.offsetHeight-20),y=10+ratio*travel;
      lineSpacingThumb.style.transform=`translate3d(0,${y}px,0)`;
      lineSpacingFill.style.height=`${ratio*100}%`;
      lineSpacingSlider.setAttribute('aria-valuenow',String(Number(value.toFixed(2))));
      lineSpacingSlider.setAttribute('aria-valuetext',value<=LINE_SPACING_MIN+.01?'Nykyinen riviväli':`${Math.round(100+(value-LINE_SPACING_MIN)*50)} %`);
    }
    function renderedSystemGeometry(){
      if(!scoreRenderer)return[];
      const graphicSheet=scoreRenderer.GraphicSheet,measureList=graphicSheet?.MeasureList||[],musicPages=graphicSheet?.MusicPages||[],fallbackSvg=osmdContainer.querySelector('svg');
      if(!fallbackSvg||!measureList.length)return[];
      const svgByPage=new Map();
      musicPages.forEach((page,pageIndex)=>{const pageElement=osmdContainer.querySelector(`#osmdCanvasPage${pageIndex+1}`),svg=pageElement?.querySelector('svg');if(svg)svgByPage.set(page,svg)});
      const seen=new WeakSet(),systems=[];
      measureList.forEach(row=>row?.forEach(measure=>{
        if(!measure||measure.isVisible?.()===false)return;
        const staffLine=measure.ParentStaffLine;if(!staffLine||seen.has(staffLine))return;
        const musicSystem=measure.ParentMusicSystem||staffLine.ParentMusicSystem,musicPage=musicSystem?.Parent,svg=svgByPage.get(musicPage)||fallbackSvg,measureElement=renderedMeasureElement(measure,svg);
        if(!measureElement)return;
        const stave=measure.stave||measure.getVFStave?.();
        let rawY;
        if(stave?.getY){
          rawY=stave.getY();
        }else{
          const first=staffLine.Measures?.find(item=>item&&item.isVisible?.()!==false),firstStave=first&&(first.stave||first.getVFStave?.());
          if(firstStave?.getY)rawY=firstStave.getY();
          else{
            const source=first||measure,box=source?.PositionAndShape,pageOrigin=musicPage?.PositionAndShape?.AbsolutePosition||{x:0,y:0};
            if(box?.AbsolutePosition)rawY=(box.AbsolutePosition.y-pageOrigin.y+(box.BorderTop||0))*10;
          }
        }
        if(!Number.isFinite(rawY))return;
        seen.add(staffLine);
        const rowY=svgElementPointToScoreContent(measureElement,0,rawY)?.y;
        let top=null,bottom=null;
        const systemBox=musicSystem?.PositionAndShape,pageOrigin=musicPage?.PositionAndShape?.AbsolutePosition||{x:0,y:0};
        if(systemBox?.AbsolutePosition){
          const absY=(systemBox.AbsolutePosition.y-pageOrigin.y)*10;
          const a=svgElementPointToScoreContent(measureElement,0,absY+(Number(systemBox.BorderTop)||0)*10)?.y;
          const b=svgElementPointToScoreContent(measureElement,0,absY+(Number(systemBox.BorderBottom)||0)*10)?.y;
          if(Number.isFinite(a)&&Number.isFinite(b)){top=Math.min(a,b);bottom=Math.max(a,b)}
        }
        if(Number.isFinite(rowY))systems.push({rowY,top,bottom});
      }));
      systems.sort((a,b)=>a.rowY-b.rowY);
      return systems.filter((item,index,array)=>index===0||Math.abs(item.rowY-array[index-1].rowY)>2);
    }
    function lineSpacingSeparators(systems,totalHeight){
      const separators=[];
      for(let i=0;i<systems.length-1;i++){
        const upper=systems[i],lower=systems[i+1],mid=(upper.rowY+lower.rowY)/2;
        const upperBottom=Number.isFinite(upper.bottom)?upper.bottom:null,lowerTop=Number.isFinite(lower.top)?lower.top:null;
        let separator=mid;
        if(upperBottom!==null&&lowerTop!==null&&lowerTop>upperBottom+2)separator=(upperBottom+lowerTop)/2;
        else if(upperBottom!==null&&upperBottom<lower.rowY-2)separator=Math.max(mid,upperBottom+2);
        else if(lowerTop!==null&&lowerTop>upper.rowY+2)separator=Math.min(mid,lowerTop-2);
        separators.push(clamp(separator,upper.rowY+2,lower.rowY-2));
      }
      return separators;
    }
    function invalidateLineSpacingRasterCache(){lineSpacingRasterGeneration+=1;lineSpacingRasterCache=null;lineSpacingRasterCachePromise=null}
    function svgSnapshotImage(svg){
      return new Promise((resolve,reject)=>{
        const clone=svg.cloneNode(true);clone.querySelectorAll('.note-selection-layer,.system-break-markers,.system-break-candidate-svg,.barline-edit-markers,.ending-range-preview-layer').forEach(element=>element.remove());clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
        const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),image=new Image();
        image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};image.onerror=error=>{URL.revokeObjectURL(url);reject(error)};image.src=url;
      });
    }
    async function createLineSpacingRasterCache(generation=lineSpacingRasterGeneration){
      const systems=renderedSystemGeometry(),rows=systems.map(item=>item.rowY),width=Math.max(1,Math.ceil(osmdContainer.clientWidth||A4_WIDTH)),totalHeight=Math.max(osmdContainer.scrollHeight,scorePage.scrollHeight,A4_HEIGHT),pixelScale=Math.min(1,Math.sqrt(LINE_SPACING_PREVIEW_MAX_PIXELS/Math.max(1,width*totalHeight))),pixelWidth=Math.max(1,Math.round(width*pixelScale)),pixelHeight=Math.max(1,Math.round(totalHeight*pixelScale)),source=document.createElement('canvas');
      source.width=pixelWidth;source.height=pixelHeight;const ctx=source.getContext('2d',{alpha:true,desynchronized:true});if(!ctx)throw new Error('Canvas-esikatselua ei voitu avata');
      const containerRect=osmdContainer.getBoundingClientRect(),pageScale=scorePageScale||1,pages=[...osmdContainer.querySelectorAll('[id^="osmdCanvasPage"]')],pageSources=pages.length?pages:[...osmdContainer.querySelectorAll('svg')];
      for(const page of pageSources){
        if(generation!==lineSpacingRasterGeneration)return null;const svg=page.matches?.('svg')?page:page.querySelector('svg');if(!svg)continue;const rect=svg.getBoundingClientRect(),left=(rect.left-containerRect.left)/pageScale+osmdContainer.scrollLeft,top=(rect.top-containerRect.top)/pageScale+osmdContainer.scrollTop,w=rect.width/pageScale,h=rect.height/pageScale;if(!(w>0&&h>0))continue;
        try{const image=await svgSnapshotImage(svg);if(generation!==lineSpacingRasterGeneration)return null;ctx.drawImage(image,Math.round(left*pixelScale),Math.round(top*pixelScale),Math.max(1,Math.round(w*pixelScale)),Math.max(1,Math.round(h*pixelScale)))}catch(error){console.warn('Rivivälin canvas-esikatselu: SVG-snapshot epäonnistui',error)}
      }
      if(generation!==lineSpacingRasterGeneration)return null;return {source,systems,rows,separators:lineSpacingSeparators(systems,totalHeight),width,totalHeight,pixelScale,pixelWidth,pixelHeight,generation};
    }
    function ensureLineSpacingRasterCache(){
      if(lineSpacingRasterCache?.generation===lineSpacingRasterGeneration)return Promise.resolve(lineSpacingRasterCache);if(lineSpacingRasterCachePromise)return lineSpacingRasterCachePromise;const generation=lineSpacingRasterGeneration;
      lineSpacingRasterCachePromise=createLineSpacingRasterCache(generation).then(cache=>{if(cache&&generation===lineSpacingRasterGeneration)lineSpacingRasterCache=cache;return cache}).finally(()=>{if(generation===lineSpacingRasterGeneration)lineSpacingRasterCachePromise=null});return lineSpacingRasterCachePromise;
    }
    function queueLineSpacingRasterCache(){
      const generation=lineSpacingRasterGeneration,run=()=>{if(generation!==lineSpacingRasterGeneration||workMode!=='edit'||scoreRendering)return;ensureLineSpacingRasterCache().catch(()=>{})};if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:450});else setTimeout(run,80);
    }
    function makeVectorPreviewSource(){
      const source=osmdContainer.cloneNode(true);source.removeAttribute('id');source.className='line-spacing-preview-source';source.querySelectorAll('[id]').forEach(element=>element.removeAttribute('id'));source.querySelectorAll('.note-selection-layer,.system-break-markers,.system-break-candidate-svg,.barline-edit-markers,.ending-range-preview-layer').forEach(element=>element.remove());return source;
    }
    function buildStaffTopPreview(){
      destroyStaffTopPreview(false);if(staffTopPointerId===null)return null;
      const preview=document.createElement('div'),source=makeVectorPreviewSource();preview.className='line-spacing-preview';preview.appendChild(source);staffTopPreview={element:preview,source,startValue:staffTopDragStartValue,mode:'vector'};scorePage.appendChild(preview);osmdContainer.style.visibility='hidden';return staffTopPreview;
    }
    function updateStaffTopPreview(value){
      if(!staffTopPreview?.source)return;const delta=(value-staffTopPreview.startValue)*STAFF_TOP_PREVIEW_PX_PER_UNIT;staffTopPreview.source.style.transform=`translate3d(0,${delta}px,0)`;
    }
    function scheduleStaffTopPreview(value){staffTopPreviewPendingValue=value;if(staffTopPreviewFrame)return;staffTopPreviewFrame=requestAnimationFrame(()=>{staffTopPreviewFrame=0;updateStaffTopPreview(staffTopPreviewPendingValue)})}
    function destroyStaffTopPreview(showOriginal=true){if(staffTopPreviewFrame){cancelAnimationFrame(staffTopPreviewFrame);staffTopPreviewFrame=0}staffTopPreview?.element?.remove();staffTopPreview=null;if(showOriginal)osmdContainer.style.visibility='';if(!lineSpacingPreview)scorePage.classList.remove('slider-preview-active')}
    function pointerHitsSliderThumb(e,thumb){
      const rect=thumb.getBoundingClientRect();
      return e.clientY>=rect.top-SLIDER_GRAB_PAD_Y&&e.clientY<=rect.bottom+SLIDER_GRAB_PAD_Y&&e.clientX>=rect.left-SLIDER_GRAB_PAD_Y&&e.clientX<=rect.right+SLIDER_GRAB_PAD_Y;
    }
    function sliderValueFromDragDelta(clientY,startClientY,startValue,slider,thumb,min,max){
      const travel=Math.max(1,slider.clientHeight-thumb.offsetHeight-20),deltaRatio=(clientY-startClientY)/travel;
      return clamp(startValue+deltaRatio*(max-min),min,max);
    }
    function beginStaffTopDrag(e){
      if(workMode!=='edit'||staffTopCommitRunning||lineSpacingCommitRunning||noteSizeCommitRunning||lineSpacingPointerId!==null||scoreRendering||(e.pointerType==='mouse'&&e.button!==0)||!pointerHitsSliderThumb(e,staffTopThumb))return;
      e.preventDefault();e.stopPropagation();staffTopPointerId=e.pointerId;staffTopDragStartValue=staffTopValue;staffTopDragStartClientY=e.clientY;staffTopDragMoved=false;staffTopPreviewPendingValue=staffTopValue;try{staffTopSlider.setPointerCapture(e.pointerId)}catch{}
    }
    function setStaffTopPreviewValue(value){staffTopValue=clamp(value,STAFF_TOP_MIN,STAFF_TOP_MAX);syncStaffTopSlider();scheduleStaffTopPreview(staffTopValue)}
    function moveStaffTopDrag(e){
      if(e.pointerId!==staffTopPointerId)return;e.preventDefault();e.stopPropagation();const delta=e.clientY-staffTopDragStartClientY;if(!staffTopDragMoved&&Math.abs(delta)<SLIDER_DRAG_EPSILON_PX)return;
      if(!staffTopDragMoved){staffTopDragMoved=true;buildStaffTopPreview()}
      setStaffTopPreviewValue(sliderValueFromDragDelta(e.clientY,staffTopDragStartClientY,staffTopDragStartValue,staffTopSlider,staffTopThumb,STAFF_TOP_MIN,STAFF_TOP_MAX));
    }
    async function finishStaffTopDrag(e,cancelled=false){
      if(e.pointerId!==staffTopPointerId)return;e.preventDefault();e.stopPropagation();try{if(staffTopSlider.hasPointerCapture(e.pointerId))staffTopSlider.releasePointerCapture(e.pointerId)}catch{}staffTopPointerId=null;
      const changed=staffTopDragMoved&&Math.abs(staffTopValue-staffTopDragStartValue)>.0001;if(cancelled)staffTopValue=staffTopDragStartValue;syncStaffTopSlider();
      if(cancelled||!changed){destroyStaffTopPreview(true);staffTopDragMoved=false;return}
      updateStaffTopPreview(staffTopValue);staffTopCommitRunning=true;applyStaffTopRules();try{await renderScore()}finally{destroyStaffTopPreview(true);staffTopCommitRunning=false;staffTopDragMoved=false;if(workMode==='edit')refreshEditGeometry()}
    }
    function staffTopKey(e){
      let next=staffTopValue,step=.5;if(e.key==='ArrowUp')next-=step;else if(e.key==='ArrowDown')next+=step;else if(e.key==='PageUp')next-=1;else if(e.key==='PageDown')next+=1;else if(e.key==='Home')next=STAFF_TOP_MIN;else if(e.key==='End')next=STAFF_TOP_MAX;else return;
      e.preventDefault();staffTopValue=clamp(next,STAFF_TOP_MIN,STAFF_TOP_MAX);syncStaffTopSlider();applyStaffTopRules();renderScore();
    }
    function buildLineSpacingVectorPreview(systems=renderedSystemGeometry()){
      destroyLineSpacingPreview(false);if(lineSpacingPointerId===null)return null;
      const rows=systems.map(item=>item.rowY);if(rows.length<2)return null;
      const totalHeight=Math.max(osmdContainer.scrollHeight,scorePage.scrollHeight,A4_HEIGHT),preview=document.createElement('div');preview.className='line-spacing-preview';const strips=[],separators=lineSpacingSeparators(systems,totalHeight);
      rows.forEach((rowY,index)=>{const top=index===0?0:separators[index-1],bottom=index===rows.length-1?totalHeight:separators[index],strip=document.createElement('div'),source=makeVectorPreviewSource();strip.className='line-spacing-preview-strip';strip.style.top=`${top}px`;strip.style.height=`${Math.max(1,bottom-top)}px`;source.style.top=`${-top}px`;strip.appendChild(source);preview.appendChild(strip);strips.push(strip)});
      lineSpacingPreview={element:preview,strips,startValue:lineSpacingDragStartValue,mode:'vector-strips'};
      scorePage.appendChild(preview);osmdContainer.style.visibility='hidden';return lineSpacingPreview;
    }
    async function buildLineSpacingCanvasPreview(){
      destroyLineSpacingPreview(false);const generation=lineSpacingRasterGeneration,cache=await ensureLineSpacingRasterCache();if(!cache||generation!==lineSpacingRasterGeneration||lineSpacingPointerId===null)return null;
      const preview=document.createElement('div'),canvas=document.createElement('canvas');preview.className='line-spacing-preview';canvas.className='line-spacing-preview-canvas';canvas.width=cache.pixelWidth;canvas.height=cache.pixelHeight;canvas.style.width=`${cache.width}px`;canvas.style.height=`${cache.totalHeight}px`;preview.appendChild(canvas);lineSpacingPreview={element:preview,canvas,ctx:canvas.getContext('2d',{alpha:true,desynchronized:true}),cache,startValue:lineSpacingDragStartValue,mode:'canvas'};updateLineSpacingPreview(lineSpacingValue);scorePage.classList.add('slider-preview-active');scorePage.appendChild(preview);return lineSpacingPreview;
    }
    function updateLineSpacingPreview(value){
      if(!lineSpacingPreview)return;const unitDelta=(value-lineSpacingPreview.startValue)*LINE_SPACING_PREVIEW_PX_PER_UNIT;
      if(lineSpacingPreview.mode==='vector-strips'){lineSpacingPreview.strips.forEach((strip,index)=>{strip.style.transform=`translate3d(0,${index*unitDelta}px,0)`});return}
      if(lineSpacingPreview.mode!=='canvas'||!lineSpacingPreview.ctx)return;
      const {ctx,cache}=lineSpacingPreview,{source,rows,separators,pixelScale,pixelWidth,pixelHeight,totalHeight}=cache;ctx.clearRect(0,0,pixelWidth,pixelHeight);if(rows.length<2){ctx.drawImage(source,0,0);return}
      rows.forEach((rowY,index)=>{const top=index===0?0:separators[index-1],bottom=index===rows.length-1?totalHeight:separators[index],sy=Math.max(0,Math.round(top*pixelScale)),ey=Math.min(pixelHeight,Math.round(bottom*pixelScale)),sh=Math.max(1,ey-sy),dy=Math.round((top+index*unitDelta)*pixelScale);ctx.drawImage(source,0,sy,pixelWidth,sh,0,dy,pixelWidth,sh)});
    }
    function scheduleLineSpacingPreview(value){lineSpacingPreviewPendingValue=value;if(lineSpacingPreviewFrame)return;lineSpacingPreviewFrame=requestAnimationFrame(()=>{lineSpacingPreviewFrame=0;updateLineSpacingPreview(lineSpacingPreviewPendingValue)})}
    function destroyLineSpacingPreview(showOriginal=true){if(lineSpacingPreviewFrame){cancelAnimationFrame(lineSpacingPreviewFrame);lineSpacingPreviewFrame=0}const wasVector=Boolean(lineSpacingPreview?.mode?.startsWith('vector'));lineSpacingPreview?.element?.remove();lineSpacingPreview=null;if(showOriginal||wasVector)osmdContainer.style.visibility='';if(!staffTopPreview)scorePage.classList.remove('slider-preview-active')}
    function beginLineSpacingDrag(e){
      if(workMode!=='edit'||lineSpacingCommitRunning||staffTopCommitRunning||noteSizeCommitRunning||staffTopPointerId!==null||scoreRendering||(e.pointerType==='mouse'&&e.button!==0)||!pointerHitsSliderThumb(e,lineSpacingThumb))return;
      e.preventDefault();e.stopPropagation();lineSpacingPointerId=e.pointerId;lineSpacingDragStartValue=lineSpacingValue;lineSpacingDragStartClientY=e.clientY;lineSpacingDragMoved=false;lineSpacingPreviewPendingValue=lineSpacingValue;try{lineSpacingSlider.setPointerCapture(e.pointerId)}catch{}
    }
    function setLineSpacingPreviewValue(value){lineSpacingValue=clamp(value,LINE_SPACING_MIN,LINE_SPACING_MAX);syncLineSpacingSlider();scheduleLineSpacingPreview(lineSpacingValue)}
    function moveLineSpacingDrag(e){
      if(e.pointerId!==lineSpacingPointerId)return;e.preventDefault();e.stopPropagation();const delta=e.clientY-lineSpacingDragStartClientY;if(!lineSpacingDragMoved&&Math.abs(delta)<SLIDER_DRAG_EPSILON_PX)return;
      if(!lineSpacingDragMoved){
        lineSpacingDragMoved=true;const systems=renderedSystemGeometry();
        if(systems.length<=LINE_SPACING_VECTOR_PREVIEW_MAX_SYSTEMS){buildLineSpacingVectorPreview(systems)}
        else{buildLineSpacingCanvasPreview().then(()=>{if(lineSpacingPointerId===e.pointerId)scheduleLineSpacingPreview(lineSpacingValue)}).catch(error=>console.warn('Rivivälin canvas-esikatselu ei käynnistynyt',error))}
      }
      setLineSpacingPreviewValue(sliderValueFromDragDelta(e.clientY,lineSpacingDragStartClientY,lineSpacingDragStartValue,lineSpacingSlider,lineSpacingThumb,LINE_SPACING_MIN,LINE_SPACING_MAX));
    }
    async function finishLineSpacingDrag(e,cancelled=false){
      if(e.pointerId!==lineSpacingPointerId)return;e.preventDefault();e.stopPropagation();try{if(lineSpacingSlider.hasPointerCapture(e.pointerId))lineSpacingSlider.releasePointerCapture(e.pointerId)}catch{}lineSpacingPointerId=null;
      const changed=lineSpacingDragMoved&&Math.abs(lineSpacingValue-lineSpacingDragStartValue)>.0001;if(cancelled)lineSpacingValue=lineSpacingDragStartValue;syncLineSpacingSlider();
      if(cancelled||!changed){destroyLineSpacingPreview(true);lineSpacingDragMoved=false;return}
      updateLineSpacingPreview(lineSpacingValue);lineSpacingCommitRunning=true;applyLineSpacingRules();try{await renderScore()}finally{destroyLineSpacingPreview(true);lineSpacingCommitRunning=false;lineSpacingDragMoved=false;if(workMode==='edit')refreshEditGeometry()}
    }
    function lineSpacingKey(e){
      let next=lineSpacingValue,step=.5;
      if(e.key==='ArrowUp')next-=step;else if(e.key==='ArrowDown')next+=step;else if(e.key==='PageUp')next-=1;else if(e.key==='PageDown')next+=1;else if(e.key==='Home')next=LINE_SPACING_MIN;else if(e.key==='End')next=LINE_SPACING_MAX;else return;
      e.preventDefault();lineSpacingValue=clamp(next,LINE_SPACING_MIN,LINE_SPACING_MAX);syncLineSpacingSlider();applyLineSpacingRules();renderScore();
    }
    function noteSizeZoom(value=noteSizePercent){
      const number=Number(value);return clamp(Number.isFinite(number)?number:NOTE_SIZE_DEFAULT,NOTE_SIZE_MIN,NOTE_SIZE_MAX)/100;
    }
    function syncNoteSizeControls(){
      const shown=Math.round(clamp(noteSizePercent,NOTE_SIZE_MIN,NOTE_SIZE_MAX)),busy=noteSizeCommitRunning;
      noteSizeResetButton.textContent=`${shown} %`;noteSizeResetButton.setAttribute('aria-label',`Nuottikoko ${shown} prosenttia. Palauta sataan prosenttiin`);
      noteSizeDecreaseButton.disabled=busy||shown<=NOTE_SIZE_MIN;noteSizeIncreaseButton.disabled=busy||shown>=NOTE_SIZE_MAX;noteSizeResetButton.disabled=busy||shown===NOTE_SIZE_DEFAULT;noteSizePanel.setAttribute('aria-busy',String(busy));
    }
    function positionNoteSizePanel(){
      if(noteSizePanel.hidden)return;const buttonRect=noteSizeButton.getBoundingClientRect(),panelRect=noteSizePanel.getBoundingClientRect(),maxLeft=Math.max(8,window.innerWidth-panelRect.width-8),maxTop=Math.max(42,window.innerHeight-panelRect.height-8),left=clamp(buttonRect.right+10,8,maxLeft),top=clamp(buttonRect.top+(buttonRect.height-panelRect.height)/2,42,maxTop);noteSizePanel.style.left=`${left}px`;noteSizePanel.style.top=`${top}px`;
    }
    function openNoteSizePanel(e){
      if(workMode!=='edit'||!notes.length)return;e?.preventDefault();e?.stopPropagation();noteSizePanel.hidden=false;noteSizeButton.setAttribute('aria-expanded','true');noteSizeButton.setAttribute('aria-pressed','true');syncNoteSizeControls();requestAnimationFrame(()=>{positionNoteSizePanel();syncNoteSizeControls();(noteSizePercent<=NOTE_SIZE_MIN?noteSizeIncreaseButton:noteSizeDecreaseButton).focus()});
    }
    function closeNoteSizePanel({focusButton=false}={}){
      if(noteSizePanel.hidden)return;noteSizePanel.hidden=true;noteSizeButton.setAttribute('aria-expanded','false');noteSizeButton.setAttribute('aria-pressed','false');if(focusButton&&workMode==='edit')noteSizeButton.focus();
    }
    function toggleNoteSizePanel(e){if(noteSizePanel.hidden)openNoteSizePanel(e);else{e?.preventDefault();e?.stopPropagation();closeNoteSizePanel()}}
    function closeNoteSizeFromOutside(e){if(noteSizePanel.hidden||noteSizePanel.contains(e.target)||noteSizeButton.contains(e.target))return;closeNoteSizePanel()}
    async function commitNoteSizeFromControl(value){
      if(noteSizeCommitRunning||scoreRendering||staffTopCommitRunning||lineSpacingCommitRunning||staffTopPointerId!==null||lineSpacingPointerId!==null)return;const number=Number(value),next=clamp(Math.round((Number.isFinite(number)?number:NOTE_SIZE_DEFAULT)/NOTE_SIZE_STEP)*NOTE_SIZE_STEP,NOTE_SIZE_MIN,NOTE_SIZE_MAX);if(next===noteSizePercent){syncNoteSizeControls();return}noteSizePercent=next;noteSizeCommitRunning=true;syncNoteSizeControls();try{await renderScore();statusMessage(`Nuottikoko ${noteSizePercent} %`)}finally{noteSizeCommitRunning=false;syncNoteSizeControls();positionNoteSizePanel();if(workMode==='edit')refreshEditGeometry()}
    }
    function resetNoteSize(e){e.preventDefault();e.stopPropagation();commitNoteSizeFromControl(NOTE_SIZE_DEFAULT)}
    function changeNoteSizeByStep(direction,e){
      e?.preventDefault();e?.stopPropagation();const next=direction<0?Math.ceil(noteSizePercent/NOTE_SIZE_STEP)*NOTE_SIZE_STEP-NOTE_SIZE_STEP:Math.floor(noteSizePercent/NOTE_SIZE_STEP)*NOTE_SIZE_STEP+NOTE_SIZE_STEP;commitNoteSizeFromControl(next);
    }
    function noteSizePanelKey(e){
      if(e.key==='ArrowLeft'||e.key==='ArrowDown')changeNoteSizeByStep(-1,e);else if(e.key==='ArrowRight'||e.key==='ArrowUp')changeNoteSizeByStep(1,e);else if(e.key==='Home')resetNoteSize(e);
    }
    function refreshEditGeometry(){if(workMode!=='edit')return;buildSelectionHitboxes();renderSelectionOverlay();renderSystemBreakMarkers();renderBarlineMarkers();renderBeamEditMarkers()}
    function buildWriteNoteHitboxes(){
      writeNoteHitboxes=[];if(!scoreRenderer)return;
      const measureList=scoreRenderer.GraphicSheet?.MeasureList||[],containerRect=osmdContainer.getBoundingClientRect(),scale=scorePageScale||1,visited=new Set();
      measureList.forEach(group=>(group||[]).forEach(measure=>(measure?.staffEntries||[]).forEach(staffEntry=>(staffEntry?.graphicalVoiceEntries||[]).forEach(voiceEntry=>(voiceEntry?.notes||[]).forEach(graphicalNote=>{
        const objectId=graphicalNote?.sourceNote?.NoteToGraphicalNoteObjectId,index=renderedNoteObjectMap.get(objectId),note=notes[index];if(!Number.isInteger(index)||!note||note.rest||note.measureRest)return;
        const vexRef=graphicalNote.vfnote,vexNote=Array.isArray(vexRef)?vexRef[0]:vexRef,element=vexNote?.attrs?.el||voiceEntry?.mVexFlowStaveNote?.attrs?.el;if(!element||visited.has(element))return;visited.add(element);
        const rect=element.getBoundingClientRect?.();if(!rect||!rect.width||!rect.height)return;
        const paddingX=11,paddingY=9,left=(rect.left-containerRect.left)/scale-paddingX,top=(rect.top-containerRect.top)/scale-paddingY,width=Math.max(36,rect.width/scale+paddingX*2),height=Math.max(38,rect.height/scale+paddingY*2);
        const staffSpacing=Number(vexNote?.getStave?.()?.getSpacingBetweenLines?.())||10;writeNoteHitboxes.push({entryIndex:index,id:note.id,left,top,right:left+width,bottom:top+height,width,height,sourceElement:element,staffStepPx:Math.max(3,staffSpacing/2)});
      })))))
    }
    function writeNoteIndex(){return writeEditNoteId?notes.findIndex(note=>note.id===writeEditNoteId):-1}
    function writeNoteHitAtClient(clientX,clientY){
      const rect=osmdContainer.getBoundingClientRect(),scale=scorePageScale||1,point={x:(clientX-rect.left)/scale,y:(clientY-rect.top)/scale};
      return writeNoteHitboxes.filter(box=>point.x>=box.left&&point.x<=box.right&&point.y>=box.top&&point.y<=box.bottom).sort((a,b)=>a.width*a.height-b.width*b.height)[0]||null;
    }
    function restoreWritePitchPreview(){
      if(!writePitchDrag)return;const {sourceElement,originalTransform,highlight}=writePitchDrag;
      if(sourceElement){if(originalTransform===null)sourceElement.removeAttribute('transform');else sourceElement.setAttribute('transform',originalTransform)}
      if(highlight){highlight.style.transform='';highlight.classList.remove('dragging')}
    }
    function cancelWritePitchDrag(){restoreWritePitchPreview();writePitchDrag=null}
    function startWritePitchDrag(e){
      if(workMode!=='write'||writePitchDrag)return;const index=writeNoteIndex(),hit=writeNoteHitboxes.find(box=>box.entryIndex===index),note=notes[index];if(index<0||!hit||!note)return;
      if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();e.stopPropagation();cancelWriteSelectionHold();
      const spelling=noteSpellingParts(note,index),sourceElement=hit.sourceElement||null,originalTransform=sourceElement?.getAttribute('transform')??null;
      writePitchDrag={pointerId:e.pointerId,index,id:note.id,before:{...note},startClientY:e.clientY,steps:0,spelling,hit,sourceElement,originalTransform,highlight:e.currentTarget};
      e.currentTarget.classList.add('dragging');try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
    }
    function moveWritePitchDrag(e){
      if(!writePitchDrag||writePitchDrag.pointerId!==e.pointerId)return;e.preventDefault();e.stopPropagation();
      const scale=scorePageScale||1,stepPx=writePitchDrag.hit.staffStepPx||5,dy=(e.clientY-writePitchDrag.startClientY)/scale;let steps=Math.round(-dy/stepPx);
      let target=shiftedSpelling(writePitchDrag.spelling,steps),midi=midiFromSpelling(target.step,target.octave,target.alter);
      while(midi<0&&steps<0){steps+=1;target=shiftedSpelling(writePitchDrag.spelling,steps);midi=midiFromSpelling(target.step,target.octave,target.alter)}
      while(midi>127&&steps>0){steps-=1;target=shiftedSpelling(writePitchDrag.spelling,steps);midi=midiFromSpelling(target.step,target.octave,target.alter)}
      if(steps===writePitchDrag.steps)return;writePitchDrag.steps=steps;const previewDy=-steps*stepPx;
      writePitchDrag.highlight.style.transform=`translateY(${previewDy}px)`;
      if(writePitchDrag.sourceElement){const base=writePitchDrag.originalTransform||'';writePitchDrag.sourceElement.setAttribute('transform',`${base}${base?' ':''}translate(0 ${previewDy})`)}
      const accidental=target.alter<0?'♭':target.alter>0?'♯':'',name=target.step==='B'?'H':target.step;status.textContent=`${name}${accidental}${target.octave}`;
    }
    function endWritePitchDrag(e,cancelled=false){
      if(!writePitchDrag||writePitchDrag.pointerId!==e.pointerId)return;e.preventDefault();e.stopPropagation();
      const drag=writePitchDrag;restoreWritePitchPreview();try{drag.highlight.releasePointerCapture?.(e.pointerId)}catch{}writePitchDrag=null;
      if(cancelled||!drag.steps){positionWriteNoteContext();return}
      const index=notes.findIndex(note=>note.id===drag.id),note=notes[index];if(index<0||!note)return;const target=shiftedSpelling(drag.spelling,drag.steps),midi=midiFromSpelling(target.step,target.octave,target.alter);
      note.spellingStep=target.step;note.spellingOctave=target.octave;note.spellingAlter=target.alter;note.spellingManual=Boolean(drag.before.spellingManual);note.midi=midi;
      if(target.alter<0)note.accidentalStyle='flat';else if(target.alter>0)note.accidentalStyle='sharp';else delete note.accidentalStyle;
      repairTiesAround(index);rememberAction({type:'update-note',id:note.id,before:drag.before,after:{...note}});renderScore();
    }
    function clearWriteNoteEdit(){cancelWritePitchDrag();writeEditNoteId=null;writeEditHighlight?.remove();writeEditHighlight=null;writeNoteContext.hidden=true}
    function positionWriteNoteContext(){
      const index=writeNoteIndex(),hit=writeNoteHitboxes.find(box=>box.entryIndex===index);if(workMode!=='write'||index<0||!hit){clearWriteNoteEdit();return}
      writeEditHighlight?.remove();const highlight=document.createElement('div');highlight.className='write-note-highlight';highlight.style.left=`${hit.left}px`;highlight.style.top=`${hit.top}px`;highlight.style.width=`${hit.width}px`;highlight.style.height=`${hit.height}px`;scorePage.appendChild(highlight);writeEditHighlight=highlight;highlight.addEventListener('pointerdown',startWritePitchDrag,{passive:false});highlight.addEventListener('pointermove',moveWritePitchDrag,{passive:false});highlight.addEventListener('pointerup',e=>endWritePitchDrag(e,false),{passive:false});highlight.addEventListener('pointercancel',e=>endWritePitchDrag(e,true),{passive:false});
      const note=notes[index],spelling=noteSpellingParts(note,index),activeAlter=currentWriteNoteAccidental(note,index,spelling);writeNoteAccidentalButtons.forEach(button=>button.setAttribute('aria-pressed',String(activeAlter!==null&&Number(button.dataset.alter)===Number(activeAlter))));
      writeNoteContext.hidden=false;const scale=scorePageScale||1,shellLeft=scorePageShell.offsetLeft,shellTop=scorePageShell.offsetTop,toolbarWidth=writeNoteContext.offsetWidth||204,toolbarHeight=writeNoteContext.offsetHeight||52,scoreHeight=Math.max(score.clientHeight,score.scrollHeight);
      let left=shellLeft+(hit.left+hit.width/2)*scale-toolbarWidth/2,top=shellTop+hit.top*scale-toolbarHeight-7;
      if(top<score.scrollTop+6)top=shellTop+hit.bottom*scale+7;left=clamp(left,score.scrollLeft+6,score.scrollLeft+score.clientWidth-toolbarWidth-6);top=clamp(top,score.scrollTop+6,Math.max(score.scrollTop+6,scoreHeight-toolbarHeight-6));writeNoteContext.style.left=`${left}px`;writeNoteContext.style.top=`${top}px`;
    }
    function selectWriteNote(index){
      const note=notes[index];if(workMode!=='write'||!note||note.rest||note.measureRest)return false;writeEditNoteId=note.id;positionWriteNoteContext();return true;
    }
    function refreshWriteGeometry(){buildWriteNoteHitboxes();if(selectedNoteIndices.size||writeSelectionActive){selectionHitboxes=writeNoteHitboxes.map(hit=>({...hit}));renderSelectionOverlay()}else syncWritePasteEndButton();if(writeEditNoteId)positionWriteNoteContext()}
    function keySignatureAlterForStep(step,fifths=projectData?.keySignature??selectedKeyInfo().fifths){
      const count=Math.abs(Number(fifths)||0),order=Number(fifths)>0?['F','C','G','D','A','E','B']:['B','E','A','D','G','C','F'];
      return order.slice(0,count).includes(step)?(Number(fifths)>0?1:-1):0;
    }
    function currentWriteNoteAccidental(note,index,spelling=noteSpellingParts(note,index)){
      if(!note||note.rest||note.measureRest)return null;
      const alter=Number(spelling.alter)||0,defaultAlter=keySignatureAlterForStep(spelling.step);
      if(note.spellingManual)return alter;
      return alter!==defaultAlter?alter:null;
    }
    function setWriteNoteAccidental(alter){
      const index=writeNoteIndex(),note=notes[index];if(index<0||!note)return;
      const value=clamp(Number(alter)||0,-1,1),before={...note},spelling=noteSpellingParts(note,index),activeAlter=currentWriteNoteAccidental(note,index,spelling),turnOff=activeAlter!==null&&Number(activeAlter)===value;
      note.spellingStep=spelling.step;note.spellingOctave=spelling.octave;
      if(turnOff){
        const defaultAlter=keySignatureAlterForStep(spelling.step);note.spellingAlter=defaultAlter;note.spellingManual=false;delete note.accidentalStyle;note.midi=midiFromSpelling(spelling.step,spelling.octave,defaultAlter);
      }else{
        note.spellingAlter=value;note.spellingManual=true;note.accidentalStyle=value<0?'flat':value>0?'sharp':'natural';note.midi=midiFromSpelling(spelling.step,spelling.octave,value);
      }
      repairTiesAround(index);rememberAction({type:'update-note',id:note.id,before,after:{...note}});renderScore();
    }
    function repairTiesAround(index){
      const note=notes[index],previous=notes[index-1],next=notes[index+1];if(note?.tieFromPrevious&&(!previous||previous.rest||note.rest||previous.midi!==note.midi))note.tieFromPrevious=false;if(next?.tieFromPrevious&&(!note||note.rest||next.rest||note.midi!==next.midi))next.tieFromPrevious=false;
    }
    function deleteWriteNote(){
      const index=writeNoteIndex();if(index<0)return;const note=notes[index];rememberAction({type:'delete',index,note:{...note},slurs:slurs.map(item=>({...item})),hairpins:hairpins.map(item=>({...item}))});clearWriteNoteEdit();notes.splice(index,1);repairTiesAround(Math.max(0,index-1));pruneEditRanges();renderScore();
    }
    function clearEditorOverlays(){osmdContainer.querySelector('.note-selection-layer')?.remove();osmdContainer.querySelector('.system-break-markers')?.remove();osmdContainer.querySelectorAll('.system-break-candidate-svg').forEach(element=>element.remove());osmdContainer.querySelector('.barline-edit-markers')?.remove();osmdContainer.querySelector('.beam-edit-markers')?.remove();osmdContainer.querySelector('.ending-range-preview-layer')?.remove();endingDrag=null;closeBarlinePalette();syncSelectionToolbar()}
    function selectInRectangle(rect){selectedNoteIndices.clear();selectionHitboxes.forEach(hitbox=>{if(rectanglesIntersect(rect,hitbox))selectedNoteIndices.add(hitbox.entryIndex)})}
    function selectAtPoint(point){const hits=selectionHitboxes.filter(hitbox=>rectanglesIntersect({left:point.x,right:point.x,top:point.y,bottom:point.y},hitbox)).sort((a,b)=>a.width*a.height-b.width*b.height);selectedNoteIndices.clear();if(hits[0])selectedNoteIndices.add(hits[0].entryIndex)}
    function toggleBooleanForSelection(property,label){const indices=getSelectedNoteIndices();if(!indices.length)return;const enable=!indices.every(index=>Boolean(notes[index][property]));indices.forEach(index=>{notes[index][property]=enable});status.textContent=`${label} ${enable?'lisätty':'poistettu'}`;renderScore()}
    function applyDynamicForSelection(value){const indices=getSelectedNoteIndices();if(!indices.length)return;indices.forEach(index=>{delete notes[index].dynamic});if(['ppp','pp','p','mp','mf','f','ff','fff'].includes(value))notes[indices[0]].dynamic=value;renderScore()}
    function renderedStemDirection(index){
      const measureList=scoreRenderer?.GraphicSheet?.MeasureList||[];
      for(const measureGroup of measureList)for(const measure of measureGroup||[])for(const staffEntry of measure?.staffEntries||[])for(const voiceEntry of staffEntry?.graphicalVoiceEntries||[])for(const graphicalNote of voiceEntry?.notes||[]){
        const objectId=graphicalNote?.sourceNote?.NoteToGraphicalNoteObjectId;if(renderedNoteObjectMap.get(objectId)!==index)continue;
        const vexRef=graphicalNote.vfnote,vexNote=Array.isArray(vexRef)?vexRef[0]:vexRef;if(!vexNote)continue;
        const direction=typeof vexNote.getStemDirection==='function'?Number(vexNote.getStemDirection()):Number(vexNote.stem_direction??vexNote.stemDirection);
        if(direction>0)return 'up';if(direction<0)return 'down';
      }
      return Number(notes[index]?.midi)>=71?'down':'up';
    }
    function tupletPlacementForId(tupletId){
      const indices=[];for(let index=0;index<notes.length;index+=1)if(notes[index]?.tupletId===tupletId&&!notes[index].rest&&!notes[index].measureRest)indices.push(index);
      if(!indices.length)return 'above';let up=0,down=0;for(const index of indices){const note=notes[index],direction=note.stemDirection==='up'||note.stemDirection==='down'?note.stemDirection:(Number(note.midi)>=71?'down':'up');if(direction==='down')down+=1;else up+=1}
      return down>up?'below':'above';
    }
    function selectionTupletId(range=getSelectionRange()){
      if(!range)return null;const id=notes[range.first]?.tupletId;if(!id)return null;for(let index=range.first;index<=range.last;index+=1)if(notes[index]?.tupletId!==id)return null;return id;
    }
    function automaticSlurPlacement(range=getSelectionRange()){
      if(!range)return 'above';const tupletId=selectionTupletId(range);if(tupletId){const tupletSide=tupletPlacementForId(tupletId);return tupletSide==='above'?'below':'above'}
      const directions=[];for(let index=range.first;index<=range.last;index+=1)if(isEditableNote(index))directions.push(notes[index].stemDirection==='up'||notes[index].stemDirection==='down'?notes[index].stemDirection:renderedStemDirection(index));
      return directions.length&&directions.every(direction=>direction==='up')?'below':'above';
    }
    function toggleSlurForSelection(){const range=getSelectionRange();if(!range)return;const existing=findSelectionSlur(range);if(existing)slurs=slurs.filter(item=>item!==existing);else slurs.push({startId:range.startId,endId:range.endId,placement:automaticSlurPlacement(range)});renderScore()}
    function toggleSlurPlacement(){const range=getSelectionRange(),slur=findSelectionSlur(range);if(!slur)return;const current=slur.placement==='above'||slur.placement==='below'?slur.placement:automaticSlurPlacement(range);slur.placement=current==='above'?'below':'above';status.textContent=`Legatokaari ${slur.placement==='above'?'yläpuolelle':'alapuolelle'}`;renderScore()}
    function toggleStemDirectionForSelection(){const indices=getSelectedNoteIndices();if(!indices.length)return;indices.forEach(index=>{const note=notes[index];const current=note.stemDirection==='up'||note.stemDirection==='down'?note.stemDirection:renderedStemDirection(index);note.stemDirection=current==='up'?'down':'up'});status.textContent=`Nuottivarren suunta vaihdettu`;renderScore()}
    function toggleHairpinForSelection(type){const range=getSelectionRange();if(!range)return;const existing=findSelectionHairpin(type,range);hairpins=hairpins.filter(item=>!(item.startId===range.startId&&item.endId===range.endId));if(!existing)hairpins.push({type,startId:range.startId,endId:range.endId});renderScore()}
    function toggleTiePlacement(){const index=getSelectedTieStartIndex();if(!Number.isInteger(index))return;const current=notes[index].tiePlacement==='above'?'above':notes[index].tiePlacement==='below'?'below':renderedTiePlacement(index);notes[index].tiePlacement=current==='above'?'below':'above';renderScore()}
    function beamPairStates(){
      ensureEntryIds();const {beats,beatType,groups}=measureData(),noteIndices=new Map(notes.map((note,index)=>[note,index])),states=[];
      groups.forEach((group,measureIndex)=>{const {connections}=measureBeamConnections(group,beats,beatType);connections.forEach(item=>{if(!item.leftCandidate||!item.rightCandidate)return;const leftIndex=noteIndices.get(item.left),rightIndex=noteIndices.get(item.right);if(Number.isInteger(leftIndex)&&Number.isInteger(rightIndex))states.push({...item,leftIndex,rightIndex,measureIndex})})});
      return states;
    }
    function renderedBeamStemAnchor(index){
      const measureList=scoreRenderer?.GraphicSheet?.MeasureList||[];
      for(const measureGroup of measureList)for(const measure of measureGroup||[])for(const staffEntry of measure?.staffEntries||[])for(const voiceEntry of staffEntry?.graphicalVoiceEntries||[])for(const graphicalNote of voiceEntry?.notes||[]){
        const objectId=graphicalNote?.sourceNote?.NoteToGraphicalNoteObjectId;if(renderedNoteObjectMap.get(objectId)!==index)continue;
        const vexRef=graphicalNote.vfnote,vexNote=Array.isArray(vexRef)?vexRef[0]:vexRef,element=vexNote?.attrs?.el||voiceEntry?.mVexFlowStaveNote?.attrs?.el,svg=element?.ownerSVGElement;if(!vexNote||!svg)continue;
        try{
          const x=Number(vexNote.getStemX?.()),extents=vexNote.getStemExtents?.(),topY=Number(extents?.topY),baseY=Number(extents?.baseY),stemDirection=Number(vexNote.getStemDirection?.()??vexNote.stem_direction??vexNote.stemDirection);if(!Number.isFinite(x)||!Number.isFinite(topY)||!Number.isFinite(baseY))continue;
          const y=stemDirection<0?Math.max(topY,baseY):Math.min(topY,baseY),measureElement=element.closest?.('.vf-measure'),point=svgElementPointToScoreContent(measureElement,x,y);if(!point)continue;
          return {x:point.x,y:point.y,direction:stemDirection<0?'down':'up'};
        }catch{}
      }
      return null;
    }

    function renderedNoteheadAnchor(index){
      const measureList=scoreRenderer?.GraphicSheet?.MeasureList||[];
      for(const measureGroup of measureList)for(const measure of measureGroup||[])for(const staffEntry of measure?.staffEntries||[])for(const voiceEntry of staffEntry?.graphicalVoiceEntries||[])for(const graphicalNote of voiceEntry?.notes||[]){
        const objectId=graphicalNote?.sourceNote?.NoteToGraphicalNoteObjectId;if(renderedNoteObjectMap.get(objectId)!==index)continue;
        const vexRef=graphicalNote.vfnote,vexNote=Array.isArray(vexRef)?vexRef[0]:vexRef,element=vexNote?.attrs?.el||voiceEntry?.mVexFlowStaveNote?.attrs?.el,svg=element?.ownerSVGElement;if(!element||!svg)continue;
        try{
          const notehead=element.querySelector?.('.vf-notehead, [class*="notehead"], g.vf-notehead path, g.vf-notehead ellipse, path.vf-notehead, ellipse.vf-notehead')||element.querySelector?.('g path, g ellipse, path, ellipse');
          const rect=(notehead||element).getBoundingClientRect?.();if(!rect||!rect.width||!rect.height)continue;const box=clientRectToScoreContent(rect);
          return {x:box.left+box.width/2,y:box.top+box.height/2};
        }catch{}
      }
      return null;
    }
    function renderedEntryHitbox(index){
      const measureList=scoreRenderer?.GraphicSheet?.MeasureList||[],containerRect=osmdContainer.getBoundingClientRect(),scale=scorePageScale||1;
      for(const measureGroup of measureList)for(const measure of measureGroup||[])for(const staffEntry of measure?.staffEntries||[])for(const voiceEntry of staffEntry?.graphicalVoiceEntries||[])for(const graphicalNote of voiceEntry?.notes||[]){
        const objectId=graphicalNote?.sourceNote?.NoteToGraphicalNoteObjectId;if(renderedNoteObjectMap.get(objectId)!==index)continue;
        const vexRef=graphicalNote.vfnote,vexNote=Array.isArray(vexRef)?vexRef[0]:vexRef,element=vexNote?.attrs?.el||voiceEntry?.mVexFlowStaveNote?.attrs?.el;
        const rect=element?.getBoundingClientRect?.();if(!rect||!rect.width||!rect.height)continue;
        const paddingX=7,paddingY=5,left=(rect.left-containerRect.left)/scale-paddingX,top=(rect.top-containerRect.top)/scale-paddingY,width=Math.max(28,rect.width/scale+paddingX*2),height=Math.max(30,rect.height/scale+paddingY*2);
        return {entryIndex:index,left,top,right:left+width,bottom:top+height,width,height};
      }
      return null;
    }
    function beamMarkerAnchor(hitbox,index){
      const exact=renderedBeamStemAnchor(index);if(exact)return exact;const direction=notes[index]?.stemDirection==='up'||notes[index]?.stemDirection==='down'?notes[index].stemDirection:renderedStemDirection(index),x=hitbox.left+hitbox.width/2,y=direction==='down'?hitbox.bottom-7:hitbox.top+7;return {x,y,direction};
    }
    function renderBeamEditMarkers(){
      osmdContainer.querySelector('.beam-edit-markers')?.remove();
      if(workMode!=='edit'||!beamEditModeActive||!scoreRenderer)return;
      const hitByIndex=new Map(selectionHitboxes.map(hit=>[hit.entryIndex,hit])),layer=document.createElement('div');layer.className='beam-edit-markers';layer.style.width=`${osmdContainer.scrollWidth}px`;layer.style.height=`${osmdContainer.scrollHeight}px`;
      beamPairStates().forEach(state=>{
        const leftHit=hitByIndex.get(state.leftIndex)||renderedEntryHitbox(state.leftIndex),rightHit=hitByIndex.get(state.rightIndex)||renderedEntryHitbox(state.rightIndex);if(!leftHit||!rightHit)return;
        const left=beamMarkerAnchor(leftHit,state.leftIndex),right=beamMarkerAnchor(rightHit,state.rightIndex),x1=left.x,x2=right.x;if(x2<=x1+8)return;
        let y1=left.y,y2=right.y;if(left.direction!==right.direction){const upper=Math.min(leftHit.top,rightHit.top)+7;y1=upper;y2=upper}
        const dx=x2-x1,dy=y2-y1,marker=document.createElement('button'),midX=(x1+x2)/2,midY=(y1+y2)/2,beamSide=left.direction===right.direction?left.direction:(left.direction||right.direction||'up');
        const leftHead=renderedNoteheadAnchor(state.leftIndex),rightHead=renderedNoteheadAnchor(state.rightIndex);
        const noteMidX=leftHead&&rightHead?(leftHead.x+rightHead.x)/2:midX;
        const noteMidY=leftHead&&rightHead?(leftHead.y+rightHead.y)/2:((leftHit.top+leftHit.height/2)+(rightHit.top+rightHit.height/2))/2;
        const markerX=state.connected?midX:noteMidX,markerY=state.connected?(midY+(beamSide==='down'?10:-10)):noteMidY;
        const editableConnected=state.minimumLevel>0?state.fullConnected:state.connected;
        marker.type='button';marker.className=`beam-edit-marker${editableConnected?' is-connected':''}`;marker.dataset.beamAction=editableConnected?'cut':'glue';marker.dataset.beamSide=beamSide;marker.style.left=`${markerX}px`;marker.style.top=`${markerY}px`;marker.style.transform='translate(-50%,-50%)';marker.setAttribute('aria-label',editableConnected?'Katkaise palkki tästä':'Yhdistä palkki tästä');marker.title=editableConnected?'Katkaise palkki':'Yhdistä palkki';
        marker.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation()},{passive:false});
        marker.addEventListener('pointerup',event=>{event.preventDefault();event.stopPropagation();toggleBeamConnection(state)},{passive:false});
        marker.addEventListener('click',event=>{if(event.detail!==0)return;event.preventDefault();event.stopPropagation();toggleBeamConnection(state)});layer.appendChild(marker);
      });
      osmdContainer.appendChild(layer);
    }
    function toggleBeamConnection(state){
      const key=state?.key;if(!key)return;
      if(state.minimumLevel>0){
        const nextLevel=state.level>state.minimumLevel?state.minimumLevel:state.maxLevel;
        if(nextLevel===state.automaticLevel)beamOverrides.delete(key);else beamOverrides.set(key,nextLevel);
        status.textContent=nextLevel===state.maxLevel?'Palkitus yhdistetty':'Alemmat palkit katkaistu, yksi palkki säilyy';
        renderScore();return;
      }
      const next=!state.connected;if(next===state.automatic)beamOverrides.delete(key);else beamOverrides.set(key,next);status.textContent=next?'Palkki yhdistetty':'Palkki katkaistu';renderScore();
    }
    function toggleBeamEditMode(){
      beamEditModeActive=!beamEditModeActive;
      if(beamEditModeActive){systemBreakModeActive=false;barlineEditModeActive=false;endingModeActive=0;endingDrag=null;selectedNoteIndices.clear();selectionDrag=null;closeBarlinePalette();osmdContainer.querySelector('.system-break-markers')?.remove();osmdContainer.querySelectorAll('.system-break-candidate-svg').forEach(element=>element.remove());osmdContainer.querySelector('.barline-edit-markers')?.remove();osmdContainer.querySelector('.ending-range-preview-layer')?.remove();renderSelectionOverlay();status.textContent='Palkitus: napauta punaista kiilaa tai vihreää plussaa'}
      syncSelectionToolbar();renderBeamEditMarkers();
    }
    function toggleSystemBreakMode(){
      systemBreakModeActive=!systemBreakModeActive;
      if(systemBreakModeActive){barlineEditModeActive=false;beamEditModeActive=false;endingModeActive=0;endingDrag=null;osmdContainer.querySelector('.ending-range-preview-layer')?.remove();closeBarlinePalette();osmdContainer.querySelector('.barline-edit-markers')?.remove();osmdContainer.querySelector('.beam-edit-markers')?.remove()}
      syncSelectionToolbar();
      renderSystemBreakMarkers();
    }
    function closeBarlinePalette(){barlinePalette.hidden=true;barlineActiveBoundary=null}
    function barlineIconSvg(style,isFinal=false){
      if(isFinal&&style==='normal')return '<svg viewBox="0 0 32 28" aria-hidden="true"><path d="M14 3v22" stroke="currentColor" stroke-width="1.8"/><path d="M20 3v22" stroke="currentColor" stroke-width="4"/></svg>';
      if(style==='double')return '<svg viewBox="0 0 32 28" aria-hidden="true"><path d="M12 3v22M20 3v22" stroke="currentColor" stroke-width="2"/></svg>';
      if(style==='repeat-start')return '<svg viewBox="0 0 32 28" aria-hidden="true"><path d="M9 3v22" stroke="currentColor" stroke-width="4"/><path d="M15 3v22" stroke="currentColor" stroke-width="1.8"/><circle cx="23" cy="10" r="2" fill="currentColor"/><circle cx="23" cy="18" r="2" fill="currentColor"/></svg>';
      if(style==='repeat-end')return '<svg viewBox="0 0 32 28" aria-hidden="true"><circle cx="9" cy="10" r="2" fill="currentColor"/><circle cx="9" cy="18" r="2" fill="currentColor"/><path d="M17 3v22" stroke="currentColor" stroke-width="1.8"/><path d="M23 3v22" stroke="currentColor" stroke-width="4"/></svg>';
      return '<svg viewBox="0 0 32 28" aria-hidden="true"><path d="M16 3v22" stroke="currentColor" stroke-width="2"/></svg>';
    }
    function toggleBarlineEditMode(){
      barlineEditModeActive=!barlineEditModeActive;
      if(barlineEditModeActive){systemBreakModeActive=false;beamEditModeActive=false;endingModeActive=0;endingDrag=null;osmdContainer.querySelector('.ending-range-preview-layer')?.remove();osmdContainer.querySelector('.system-break-markers')?.remove();osmdContainer.querySelectorAll('.system-break-candidate-svg').forEach(element=>element.remove());osmdContainer.querySelector('.beam-edit-markers')?.remove()}else closeBarlinePalette();
      syncSelectionToolbar();renderBarlineMarkers();
    }
    function openBarlinePalette(boundary,marker,totalMeasures){
      barlineActiveBoundary=boundary;const current=barlineStyleForBoundary(boundary);
      barlineChoiceButtons.forEach(button=>{const style=button.dataset.barlineStyle;button.disabled=(boundary===0&&(style==='double'||style==='repeat-end'))||(boundary===totalMeasures&&(style==='double'||style==='repeat-start'));button.setAttribute('aria-pressed',String(style===current))});
      barlinePalette.hidden=false;requestAnimationFrame(()=>{const markerRect=marker.getBoundingClientRect(),areaRect=scoreArea.getBoundingClientRect(),paletteRect=barlinePalette.getBoundingClientRect(),pad=8;let left=markerRect.left-areaRect.left+markerRect.width/2-paletteRect.width/2,top=markerRect.top-areaRect.top-paletteRect.height-7;if(top<pad)top=markerRect.bottom-areaRect.top+7;left=clamp(left,pad,Math.max(pad,areaRect.width-paletteRect.width-pad));top=clamp(top,pad,Math.max(pad,areaRect.height-paletteRect.height-pad));barlinePalette.style.left=`${left}px`;barlinePalette.style.top=`${top}px`});
    }
    function applyBarlineStyle(style){
      if(!Number.isInteger(barlineActiveBoundary))return;const boundary=barlineActiveBoundary,totalMeasures=scoreRenderer?.GraphicSheet?.MeasureList?.length||measureData().groups.length;
      if((boundary===0&&(style==='double'||style==='repeat-end'))||(boundary===totalMeasures&&(style==='double'||style==='repeat-start')))return;
      if(style==='normal')barlineStyles.delete(boundary);else barlineStyles.set(boundary,style);closeBarlinePalette();renderScore();
    }
    function renderBarlineMarkers(){
      osmdContainer.querySelector('.barline-edit-markers')?.remove();
      if(workMode!=='edit'||!barlineEditModeActive||!scoreRenderer)return;
      const graphicSheet=scoreRenderer.GraphicSheet,measureList=graphicSheet?.MeasureList||[],musicPages=graphicSheet?.MusicPages||[],fallbackSvg=osmdContainer.querySelector('svg');if(!fallbackSvg||!measureList.length)return;
      const svgByPage=new Map();musicPages.forEach((page,pageIndex)=>{const svg=osmdContainer.querySelector(`#osmdCanvasPage${pageIndex+1}`)?.querySelector('svg');if(svg)svgByPage.set(page,svg)});
      const layer=document.createElement('div');layer.className='barline-edit-markers';layer.style.width=`${osmdContainer.scrollWidth}px`;layer.style.height=`${osmdContainer.scrollHeight}px`;const totalMeasures=measureList.length;
      const appendBoundary=(boundary)=>{
        const measureIndex=boundary===0?0:boundary-1,measure=measureList[measureIndex]?.find(item=>item&&item.isVisible?.()!==false);if(!measure)return;const musicPage=measure.ParentMusicSystem?.Parent||measure.ParentStaffLine?.ParentMusicSystem?.Parent,svg=svgByPage.get(musicPage)||fallbackSvg,measureElement=renderedMeasureElement(measure,svg),stave=measure.stave||measure.getVFStave?.();if(!measureElement)return;let x,y;
        if(stave?.getX&&stave?.getWidth&&stave?.getY){x=boundary===0?stave.getX():stave.getX()+stave.getWidth();y=stave.getY()}else{const box=measure.PositionAndShape;if(!box?.AbsolutePosition)return;const pageOrigin=musicPage?.PositionAndShape?.AbsolutePosition||{x:0,y:0};x=(box.AbsolutePosition.x-pageOrigin.x+(boundary===0?box.BorderLeft:box.BorderRight))*10;y=(box.AbsolutePosition.y-pageOrigin.y+box.BorderTop)*10}
        const point=svgElementPointToScoreContent(measureElement,x,y);if(!point)return;const left=point.x,top=point.y,style=barlineStyleForBoundary(boundary),marker=document.createElement('button');marker.type='button';marker.className='barline-edit-marker';marker.innerHTML=barlineIconSvg(style,boundary===totalMeasures);marker.setAttribute('aria-label',boundary===0?'Muokkaa alkutahtiviivaa':boundary===totalMeasures?'Muokkaa loppuviivaa':`Muokkaa tahtiviivaa ${boundary}`);marker.style.left=`${clamp(left-21,3,Math.max(3,osmdContainer.scrollWidth-45))}px`;marker.style.top=`${Math.max(3,top-37)}px`;marker.addEventListener('pointerdown',event=>event.stopPropagation());marker.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openBarlinePalette(boundary,marker,totalMeasures)});layer.appendChild(marker);
      };
      for(let boundary=0;boundary<=totalMeasures;boundary+=1)appendBoundary(boundary);osmdContainer.appendChild(layer);
    }
    function toggleEndingMode(number){
      endingModeActive=endingModeActive===number?0:number;endingDrag=null;osmdContainer.querySelector('.ending-range-preview-layer')?.remove();
      if(endingModeActive){systemBreakModeActive=false;barlineEditModeActive=false;beamEditModeActive=false;closeBarlinePalette();osmdContainer.querySelector('.system-break-markers')?.remove();osmdContainer.querySelectorAll('.system-break-candidate-svg').forEach(element=>element.remove());osmdContainer.querySelector('.barline-edit-markers')?.remove();osmdContainer.querySelector('.beam-edit-markers')?.remove();selectedNoteIndices.clear();renderSelectionOverlay()}
      syncSelectionToolbar();
    }
    function renderedMeasureHitboxes(){
      if(!scoreRenderer)return[];
      const graphicSheet=scoreRenderer.GraphicSheet,measureList=graphicSheet?.MeasureList||[],musicPages=graphicSheet?.MusicPages||[],fallbackSvg=osmdContainer.querySelector('svg');if(!fallbackSvg||!measureList.length)return[];
      const svgByPage=new Map();musicPages.forEach((page,pageIndex)=>{const svg=osmdContainer.querySelector(`#osmdCanvasPage${pageIndex+1}`)?.querySelector('svg');if(svg)svgByPage.set(page,svg)});
      const boxes=[];
      measureList.forEach((group,index)=>{
        const measure=(group||[]).find(item=>item&&item.isVisible?.()!==false);if(!measure)return;const musicPage=measure.ParentMusicSystem?.Parent||measure.ParentStaffLine?.ParentMusicSystem?.Parent,svg=svgByPage.get(musicPage)||fallbackSvg,measureElement=renderedMeasureElement(measure,svg),stave=measure.stave||measure.getVFStave?.();if(!measureElement)return;let x,y,width,height;
        if(stave?.getX&&stave?.getWidth&&stave?.getY){x=stave.getX();y=stave.getY()-26;width=stave.getWidth();height=Math.max(92,Number(stave.getHeight?.())||0)+44}
        else{const box=measure.PositionAndShape;if(!box?.AbsolutePosition)return;const pageOrigin=musicPage?.PositionAndShape?.AbsolutePosition||{x:0,y:0};x=(box.AbsolutePosition.x-pageOrigin.x-box.BorderLeft)*10;y=(box.AbsolutePosition.y-pageOrigin.y-box.BorderTop)*10;width=(box.BorderLeft+box.BorderRight)*10;height=Math.max(92,(box.BorderTop+box.BorderBottom)*10)}
        const rendered=svgElementRectToScoreContent(measureElement,x,y,width,height);if(!rendered)return;boxes.push({index,...rendered});
      });
      return boxes;
    }
    function measureIndexAtPoint(point,boxes=renderedMeasureHitboxes()){
      const inside=boxes.filter(box=>point.x>=box.left&&point.x<=box.right&&point.y>=box.top&&point.y<=box.bottom);if(inside.length)return inside.sort((a,b)=>a.width*a.height-b.width*b.height)[0].index;
      let best=null,bestDistance=Infinity;boxes.forEach(box=>{const dx=point.x<box.left?box.left-point.x:point.x>box.right?point.x-box.right:0,dy=point.y<box.top?box.top-point.y:point.y>box.bottom?point.y-box.bottom:0,d=Math.hypot(dx,dy);if(d<bestDistance){bestDistance=d;best=box.index}});return bestDistance<=42?best:null;
    }
    function renderEndingRangePreview(){
      osmdContainer.querySelector('.ending-range-preview-layer')?.remove();if(!endingDrag)return;const boxes=endingDrag.boxes||renderedMeasureHitboxes(),first=Math.min(endingDrag.startMeasure,endingDrag.currentMeasure),last=Math.max(endingDrag.startMeasure,endingDrag.currentMeasure),layer=document.createElement('div');layer.className='ending-range-preview-layer';layer.style.width=`${osmdContainer.scrollWidth}px`;layer.style.height=`${osmdContainer.scrollHeight}px`;
      boxes.filter(box=>box.index>=first&&box.index<=last).forEach((box,i)=>{const el=document.createElement('div');el.className='ending-range-preview-box';el.style.left=`${box.left}px`;el.style.top=`${box.top}px`;el.style.width=`${box.width}px`;el.style.height=`${box.height}px`;if(i===0){const label=document.createElement('span');label.className='ending-range-preview-label';label.textContent=`${endingDrag.number}.`;el.appendChild(label)}layer.appendChild(el)});osmdContainer.appendChild(layer);
    }
    function beginEndingDrag(e){
      if(!endingModeActive)return false;const boxes=renderedMeasureHitboxes(),point=contentPointFromPointer(e),measureIndex=measureIndexAtPoint(point,boxes);if(!Number.isInteger(measureIndex))return false;e.preventDefault();e.stopPropagation();endingDrag={pointerId:e.pointerId,number:endingModeActive,startMeasure:measureIndex,currentMeasure:measureIndex,boxes};try{osmdContainer.setPointerCapture(e.pointerId)}catch{}renderEndingRangePreview();return true;
    }
    function moveEndingDrag(e){
      if(!endingDrag||endingDrag.pointerId!==e.pointerId)return false;e.preventDefault();e.stopPropagation();const measureIndex=measureIndexAtPoint(contentPointFromPointer(e),endingDrag.boxes);if(Number.isInteger(measureIndex)&&measureIndex!==endingDrag.currentMeasure){endingDrag.currentMeasure=measureIndex;renderEndingRangePreview()}return true;
    }
    function finishEndingDrag(e,cancelled=false){
      if(!endingDrag||endingDrag.pointerId!==e.pointerId)return false;e.preventDefault();e.stopPropagation();const drag=endingDrag;endingDrag=null;osmdContainer.querySelector('.ending-range-preview-layer')?.remove();try{osmdContainer.releasePointerCapture(e.pointerId)}catch{}
      if(cancelled){syncSelectionToolbar();return true}
      const first=Math.min(drag.startMeasure,drag.currentMeasure),last=Math.max(drag.startMeasure,drag.currentMeasure),exact=endings.find(item=>item.number===drag.number&&item.startMeasure===first&&item.endMeasure===last);
      if(exact){endings=endings.filter(item=>item!==exact);status.textContent=`${drag.number}. maali poistettu`}else{endings=endings.filter(item=>item.endMeasure<first||item.startMeasure>last);endings.push({number:drag.number,startMeasure:first,endMeasure:last});endings.sort((a,b)=>a.startMeasure-b.startMeasure||a.number-b.number);status.textContent=`${drag.number}. maali: tahdit ${first+1}–${last+1}`}
      endingModeActive=0;syncSelectionToolbar();renderScore();return true;
    }

    function placeSystemBreakAfter(measureIndex){systemBreaks.add(measureIndex);renderScore()}
    function removeSystemBreakAfter(measureIndex){systemBreaks.delete(measureIndex);renderScore()}
    function renderSystemBreakMarkers(){
      osmdContainer.querySelector('.system-break-markers')?.remove();
      osmdContainer.querySelectorAll('.system-break-candidate-svg').forEach(element=>element.remove());
      if(workMode!=='edit'||!systemBreakModeActive||!scoreRenderer)return;

      const graphicSheet=scoreRenderer.GraphicSheet;
      const measureList=graphicSheet?.MeasureList||[];
      const musicPages=graphicSheet?.MusicPages||[];
      const fallbackSvg=osmdContainer.querySelector('svg');
      if(!fallbackSvg||measureList.length<1)return;

      const svgByPage=new Map();
      musicPages.forEach((page,pageIndex)=>{
        const pageElement=osmdContainer.querySelector(`#osmdCanvasPage${pageIndex+1}`);
        const svg=pageElement?.querySelector('svg');
        if(svg)svgByPage.set(page,svg);
      });

      const layer=document.createElement('div');
      layer.className='system-break-markers';
      layer.style.width=`${osmdContainer.scrollWidth}px`;
      layer.style.height=`${osmdContainer.scrollHeight}px`;
      const rowYByStaffLine=new WeakMap();

      const appendMarker=(measureIndex,candidate)=>{
        const measure=measureList[measureIndex-1]?.find(item=>item&&item.isVisible?.()!==false);
        if(!measure)return;

        const musicPage=measure.ParentMusicSystem?.Parent||measure.ParentStaffLine?.ParentMusicSystem?.Parent;
        const svg=svgByPage.get(musicPage)||fallbackSvg;
        const measureElement=renderedMeasureElement(measure,svg);
        if(!measureElement)return;
        const stave=measure.stave||measure.getVFStave?.();
        let x;
        let y;
        if(stave?.getX&&stave?.getWidth&&stave?.getY){
          x=stave.getX()+stave.getWidth();
          y=stave.getY();
        }else{
          const box=measure.PositionAndShape;
          if(!box?.AbsolutePosition)return;
          const pageOrigin=musicPage?.PositionAndShape?.AbsolutePosition||{x:0,y:0};
          x=(box.AbsolutePosition.x-pageOrigin.x+box.BorderRight)*10;
          y=(box.AbsolutePosition.y-pageOrigin.y+box.BorderTop)*10;
        }

        const staffLine=measure.ParentStaffLine;
        if(staffLine&&!rowYByStaffLine.has(staffLine)){
          const first=staffLine.Measures?.find(item=>(item?.stave||item?.getVFStave?.())?.getY);
          const firstStave=first&&(first.stave||first.getVFStave?.());
          rowYByStaffLine.set(staffLine,firstStave?.getY?.()??y);
        }
        const rowY=staffLine?(rowYByStaffLine.get(staffLine)??y):y;
        const point=svgElementPointToScoreContent(measureElement,x,rowY);if(!point)return;const left=point.x,top=point.y;

        const marker=document.createElement('button');
        marker.type='button';
        marker.textContent=candidate?'+':'↵';
        marker.className=candidate?'system-break-candidate-marker':'system-break-marker';
        const pickup=Number(projectData?.pickupDuration)||0,displayMeasureIndex=pickup?Math.max(0,measureIndex-1):measureIndex,actionLabel=candidate?`Tee rivinvaihto tahdin ${displayMeasureIndex} jälkeen`:`Poista rivinvaihto tahdin ${displayMeasureIndex} jälkeen`;
        marker.setAttribute('aria-label',actionLabel);
        marker.title=actionLabel;
        const markerOffset=candidate?18:40;
        const maximumLeft=Math.max(4,osmdContainer.scrollWidth-40);
        marker.style.left=`${clamp(left-markerOffset,4,maximumLeft)}px`;
        marker.style.top=`${Math.max(4,top-(candidate?40:34))}px`;
        marker.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation()},{passive:false});
        marker.addEventListener('pointerup',event=>{
          event.preventDefault();
          event.stopPropagation();
          if(candidate)placeSystemBreakAfter(measureIndex);else removeSystemBreakAfter(measureIndex);
        },{passive:false});
        marker.addEventListener('click',event=>{
          if(event.detail!==0)return;
          event.preventDefault();
          event.stopPropagation();
          if(candidate)placeSystemBreakAfter(measureIndex);else removeSystemBreakAfter(measureIndex);
        });
        layer.appendChild(marker);
      };

      [...systemBreaks].sort((a,b)=>a-b).forEach(index=>appendMarker(index,false));
      measureList.forEach((_,position)=>{
        if(position>=measureList.length-1)return;
        const index=position+1;
        if(!systemBreaks.has(index))appendMarker(index,true);
      });
      osmdContainer.appendChild(layer);
    }
    async function toggleStretchLastLine(){if(stretchCommandRunning)return;stretchLastLine=!stretchLastLine;stretchCommandRunning=true;syncSelectionToolbar();try{await renderScore();await new Promise(resolve=>requestAnimationFrame(resolve));await renderScore()}finally{stretchCommandRunning=false;syncSelectionToolbar()}}
    function rememberAction(action){
      editHistory.push(action);if(editHistory.length>250)editHistory.shift();
    }
    function setTieArmed(value){
      tieArmed=Boolean(value);tieButton.setAttribute('aria-pressed',String(tieArmed));
    }
    function stripTupletMetadata(note){delete note.tupletId;delete note.tupletIndex;delete note.tupletSize;delete note.tupletBaseUnits;delete note.tupletBeamPattern;return note}
    function currentTupletNotes(){return tripletGroupId?notes.filter(note=>note?.tupletId===tripletGroupId).sort((a,b)=>(Number(a.tupletIndex)||0)-(Number(b.tupletIndex)||0)):[]}
    function currentTupletHasEntries(){return currentTupletNotes().length>0}
    function currentTupletTargetUnits(){return tripletBaseUnits&&tripletSize?tripletBaseUnits*tripletSize:null}
    function currentTupletUsedUnits(excludeId=null){return currentTupletNotes().reduce((sum,note)=>sum+(note.id===excludeId?0:nominalNoteDurationValue(note)),0)}
    function currentTupletRemainingUnits(excludeId=null){const target=currentTupletTargetUnits();return target===null?null:Math.max(0,target-currentTupletUsedUnits(excludeId))}
    function formatTupletUnits(units){
      const rounded=Math.round(units*1000)/1000,common=new Map([[1,'1/32'],[2,'1/16'],[4,'1/8'],[8,'1/4'],[16,'1/2'],[32,'1/1']]);if(common.has(rounded))return common.get(rounded);
      const scaled=Math.round(rounded*2),denominator=64,divisor=gcd(Math.abs(scaled),denominator);return `${scaled/divisor}/${denominator/divisor}`;
    }
    function showTupletWarning(message){
      status.textContent=message;tripletButton.classList.remove('tuplet-warning-flash');void tripletButton.offsetWidth;tripletButton.classList.add('tuplet-warning-flash');setTimeout(()=>tripletButton.classList.remove('tuplet-warning-flash'),500);if(!tupletWarning)return;clearTimeout(tupletWarningTimer);tupletWarning.textContent=message;
      const railRect=modifierRail.getBoundingClientRect(),buttonRect=tripletButton.getBoundingClientRect(),top=clamp(buttonRect.top+buttonRect.height/2-18,42,window.innerHeight-70);tupletWarning.style.left=`${Math.max(68,railRect.right+8)}px`;tupletWarning.style.top=`${top}px`;tupletWarning.hidden=false;
      requestAnimationFrame(()=>tupletWarning.classList.add('visible'));tupletWarningTimer=setTimeout(()=>{tupletWarning.classList.remove('visible');setTimeout(()=>{if(!tupletWarning.classList.contains('visible'))tupletWarning.hidden=true},140)},1450);
    }
    function syncTupletButtonState(){
      tripletButton.setAttribute('aria-pressed',String(tripletArmed));if(tupletButtonNumber)tupletButtonNumber.textContent=String(tripletArmed?tripletSize:3);
      if(!tripletArmed){tripletButton.setAttribute('aria-label','Trioli: seuraavat kolme nuottia tai taukoa; liu\'uta kvintoliin tai sekstoliin');return}
      const name=tripletSize===3?'Trioli':tripletSize===5?'Kvintoli':'Sekstoli',remaining=currentTupletRemainingUnits();tripletButton.setAttribute('aria-label',remaining===null?`${name} aktiivinen`: `${name} aktiivinen, jäljellä ${formatTupletUnits(remaining)}`);
    }
    function setCurrentTupletBaseUnits(value){
      const base=Number(value);if(!Number.isFinite(base)||base<=0)return;tripletBaseUnits=base;
      notes.forEach(note=>{if(note.tupletId===tripletGroupId)note.tupletBaseUnits=base});
      editHistory.forEach(action=>{if(action.type==='add'&&action.note?.tupletId===tripletGroupId)action.note={...action.note,tupletBaseUnits:base}});
    }
    function cancelPendingTriplet(){
      if(!tripletGroupId||!currentTupletHasEntries())return false;let changed=false;
      notes.forEach(note=>{if(note.tupletId===tripletGroupId){stripTupletMetadata(note);changed=true}});
      editHistory.forEach(action=>{if(action.type==='add'&&action.note?.tupletId===tripletGroupId)action.note={...stripTupletMetadata({...action.note})}});return changed;
    }
    function setTripletArmed(value,{cancelPending=true,size=tripletSize}={}){
      const next=Boolean(value),nextSize=[3,5,6].includes(Number(size))?Number(size):3,sizeChanged=tripletArmed&&tripletSize!==nextSize;
      if((!next||sizeChanged)&&tripletArmed&&cancelPending){const changed=cancelPendingTriplet();if(changed)renderScore()}
      if(sizeChanged){tripletGroupId=null;tripletCount=0;tripletBaseUnits=null}
      tripletArmed=next;tripletSize=next?nextSize:3;
      if(next){if(!tripletGroupId){tripletGroupId=`tuplet-${nextTupletId++}`;tripletCount=0;tripletBaseUnits=null}}
      else{tripletGroupId=null;tripletCount=0;tripletBaseUnits=null}
      syncTupletButtonState();
    }
    function applyPendingTriplet(note){
      if(!tripletArmed)return null;if(!tripletGroupId)tripletGroupId=`tuplet-${nextTupletId++}`;
      note.tupletId=tripletGroupId;note.tupletIndex=tripletCount;note.tupletSize=tripletSize;if(tripletBaseUnits)note.tupletBaseUnits=tripletBaseUnits;tripletCount+=1;syncTupletButtonState();return tripletGroupId;
    }
    function rollbackActiveTupletEntry(){
      if(!activeNote||activeNote?.tupletId!==tripletGroupId)return;
      if(activeNoteAction?.type==='add'){const index=notes.findIndex(note=>note.id===activeNote.id);if(index>=0)notes.splice(index,1);const historyIndex=editHistory.lastIndexOf(activeNoteAction);if(historyIndex>=0)editHistory.splice(historyIndex,1);tripletCount=Math.max(0,tripletCount-1)}
      else if(activeNoteAction?.type==='update-note'){const index=notes.findIndex(note=>note.id===activeNote.id);if(index>=0)notes[index]={...activeNoteAction.before};activeNote=notes[index];activeNoteAction.after={...activeNoteAction.before}}
      syncTupletButtonState();renderScore();
    }
    function candidateFitsCurrentTuplet(note,{duration=note?.duration,dotted=note?.dotted,doubleDotted=note?.doubleDotted}={}){
      if(!tripletArmed||!tripletGroupId||note?.tupletId!==tripletGroupId||tripletBaseUnits===null)return true;
      const remaining=currentTupletRemainingUnits(note.id),candidate=nominalNoteDurationValue({...note,duration,dotted,doubleDotted});return candidate<=remaining+1e-7;
    }
    function finalizeActiveTupletEntry(){
      if(!activeNote?.tupletId||!tripletArmed||activeNote.tupletId!==tripletGroupId)return true;
      if(tripletBaseUnits===null)setCurrentTupletBaseUnits(nominalNoteDurationValue(activeNote));
      const remainingBefore=currentTupletRemainingUnits(activeNote.id),candidate=nominalNoteDurationValue(activeNote);
      if(candidate>remainingBefore+1e-7){const message=`Ei mahdu tuplettiin · jäljellä ${formatTupletUnits(remainingBefore)}`;rollbackActiveTupletEntry();showTupletWarning(message);return false}
      activeNote.tupletBaseUnits=tripletBaseUnits;if(activeNoteAction?.type==='add')activeNoteAction.note={...activeNote};else if(activeNoteAction?.type==='update-note')activeNoteAction.after={...activeNote};
      const remaining=currentTupletRemainingUnits();if(remaining<=1e-7){const id=tripletGroupId,finishedSize=tripletSize;completedTupletId=id;setTripletArmed(false,{cancelPending:false,size:finishedSize});return true}
      syncTupletButtonState();return true;
    }
    function collapseCompletedTripletHistory(id){
      if(!id)return;const groupNotes=notes.filter(note=>note.tupletId===id).sort((a,b)=>(Number(a.tupletIndex)||0)-(Number(b.tupletIndex)||0));if(!groupNotes.length)return;
      const ids=new Set(groupNotes.map(note=>note.id)),kept=[];for(const action of editHistory){if(action.type==='add'&&ids.has(action.note?.id))continue;kept.push(action)}
      kept.push({type:'add-tuplet',notes:groupNotes.map(note=>({...note}))});editHistory=kept.slice(-250);
    }
    function consumeTie(midi,rest){
      if(!tieArmed)return false;
      const previous=notes.at(-1),tieFromPrevious=Boolean(!rest&&previous&&!previous.rest&&!previous.measureRest&&previous.midi===midi);
      setTieArmed(false);return tieFromPrevious;
    }
    function addScoreNote(midi,{duration='quarter',dotted=false,doubleDotted=false,rest=false}={}){
      const note={id:createEntryId(),midi,duration,dotted,doubleDotted,rest,measureRest:false,tieFromPrevious:consumeTie(midi,rest)};applyPendingTriplet(note);const action={type:'add',note:{...note}};
      notes.push(note);rememberAction(action);renderScore();return {note,action};
    }
    const spillDurationShapes=[
      {units:56,duration:'whole',doubleDotted:true},{units:48,duration:'whole',dotted:true},{units:32,duration:'whole'},
      {units:28,duration:'half',doubleDotted:true},{units:24,duration:'half',dotted:true},{units:16,duration:'half'},
      {units:14,duration:'quarter',doubleDotted:true},{units:12,duration:'quarter',dotted:true},{units:8,duration:'quarter'},
      {units:7,duration:'eighth',doubleDotted:true},{units:6,duration:'eighth',dotted:true},{units:4,duration:'eighth'},
      {units:3.5,duration:'sixteenth',doubleDotted:true},{units:3,duration:'sixteenth',dotted:true},{units:2,duration:'sixteenth'},
      {units:1.75,duration:'thirtysecond',doubleDotted:true},{units:1.5,duration:'thirtysecond',dotted:true},{units:1,duration:'thirtysecond'}
    ];
    function measureStateBeforeNoteIndex(targetIndex){
      const [beats,beatType]=timeSignatureParts(projectData?.timeSignature||timeSignatureSelect.value),capacity=beats*32/beatType,rawPickup=Number(projectData?.pickupDuration??pickupSelect.value)||0,pickupCapacity=rawPickup>0&&rawPickup<capacity?rawPickup:0;
      let currentCapacity=pickupCapacity||capacity,used=0,hasEntries=false;
      for(let index=0;index<targetIndex;index+=1){
        const note=notes[index];
        if(note?.measureRest){currentCapacity=capacity;used=0;hasEntries=false;continue}
        const duration=noteDurationValue(note);
        if(hasEntries&&used+duration>currentCapacity+1e-7){currentCapacity=capacity;used=0;hasEntries=false}
        used+=duration;hasEntries=true;
      }
      if(hasEntries&&used>=currentCapacity-1e-7){currentCapacity=capacity;used=0;hasEntries=false}
      return {capacity,currentCapacity,used,hasEntries,remaining:Math.max(0,currentCapacity-used)};
    }
    function spillDurationPieces(units){
      const target=Math.round(Number(units)*4);if(!Number.isFinite(target)||target<=0||Math.abs(target/4-units)>1e-7)return null;
      const shapes=spillDurationShapes.map(shape=>({...shape,ticks:Math.round(shape.units*4)})).filter(shape=>shape.ticks<=target);
      const best=Array(target+1).fill(null);best[0]=[];
      for(let ticks=1;ticks<=target;ticks+=1){
        for(const shape of shapes){
          if(shape.ticks>ticks||!best[ticks-shape.ticks])continue;
          const candidate=[...best[ticks-shape.ticks],shape];
          if(!best[ticks]||candidate.length<best[ticks].length)best[ticks]=candidate;
        }
      }
      return best[target]?.slice().sort((a,b)=>b.units-a.units).map(({duration,dotted=false,doubleDotted=false})=>({duration,dotted,doubleDotted}))||null;
    }
    function splitOverflowingActiveEntry(){
      if(!activeNote||activeNote.tupletId||activeReplacingExisting||activeNoteAction?.type!=='add')return false;
      const index=notes.findIndex(note=>note.id===activeNote.id);if(index<0||index!==notes.length-1)return false;
      const state=measureStateBeforeNoteIndex(index),total=noteDurationValue(activeNote);
      if(!state.hasEntries||state.remaining<=1e-7||total<=state.remaining+1e-7)return false;
      let left=total,first=true;const chunks=[];
      while(left>1e-7){const room=first?state.remaining:state.capacity,amount=Math.min(room,left),pieces=spillDurationPieces(amount);if(!pieces?.length)return false;chunks.push(...pieces);left-=amount;first=false}
      if(chunks.length<2)return false;
      const original={...activeNote},fragments=chunks.map((shape,fragmentIndex)=>{
        const fragment={...original,...shape,id:fragmentIndex===0?original.id:createEntryId(),measureRest:false};
        if(fragmentIndex>0)fragment.tieFromPrevious=!fragment.rest;
        else if(fragment.rest)fragment.tieFromPrevious=false;
        return fragment;
      });
      notes.splice(index,1,...fragments);
      const historyIndex=editHistory.lastIndexOf(activeNoteAction);if(historyIndex>=0)editHistory.splice(historyIndex,1);
      const action={type:'add-overflow',notes:fragments.map(note=>({...note}))};rememberAction(action);activeNote=fragments[0];activeNoteAction=action;
      renderScore();return true;
    }
    function clearLongPress(){
      if(longPressTimer===null)return;
      clearTimeout(longPressTimer);longPressTimer=null;
    }
    function setActiveNoteDuration(duration){
      if(!activeNote)return;const measureRest=duration==='whole'&&activeNote.rest&&!activeNote.tupletId;if(activeNote.duration===duration&&activeNote.measureRest===measureRest)return;
      if(!candidateFitsCurrentTuplet(activeNote,{duration})){const remaining=currentTupletRemainingUnits(activeNote.id);showTupletWarning(`Ei mahdu tuplettiin · jäljellä ${formatTupletUnits(remaining)}`);return}
      activeNote.duration=duration;activeNote.measureRest=measureRest;if(activeNoteAction?.type==='add'){activeNoteAction.note.duration=duration;activeNoteAction.note.measureRest=measureRest}else if(activeNoteAction?.type==='update-note')activeNoteAction.after={...activeNote};renderScore();
    }
    function undoLastChange(){
      const action=editHistory.pop();
      if(!action)return null;
      if(action.type==='add'){const removed=notes.pop();if(removed?.tupletId&&tripletArmed&&removed.tupletId===tripletGroupId){tripletCount=Math.max(0,tripletCount-1);syncTupletButtonState()}}
      else if(action.type==='add-triplet'||action.type==='add-tuplet'||action.type==='add-overflow'){const ids=new Set((action.notes||[]).map(note=>note.id));notes=notes.filter(note=>!ids.has(note.id))}
      else if(action.type==='paste-end'){const ids=new Set((action.notes||[]).map(note=>note.id));notes=notes.filter(note=>!ids.has(note.id));slurs=slurs.filter(item=>!ids.has(item.startId)&&!ids.has(item.endId))}
      else if(action.type==='delete'){notes.splice(clamp(action.index,0,notes.length),0,{...action.note});slurs=(action.slurs||[]).map(item=>({...item}));hairpins=(action.hairpins||[]).map(item=>({...item}))}
      else if(action.type==='delete-selection')restoreWriteDeleteSnapshot(action.before)
      else if(action.type==='update-note'){const index=notes.findIndex(note=>note.id===action.id);if(index>=0)notes[index]={...action.before}}
      else if(action.type==='clear'){notes=action.notes.map(note=>({...note}));slurs=(action.slurs||[]).map(item=>({...item}));hairpins=(action.hairpins||[]).map(item=>({...item}));systemBreaks=new Set(action.systemBreaks||[]);barlineStyles=new Map(action.barlineStyles||[]);beamOverrides=new Map(action.beamOverrides||[]);endings=(action.endings||[]).map(item=>({...item}))}
      pruneEditRanges();
      renderScore();return action;
    }
    function redoChange(action){
      if(!action)return;
      if(action.type==='add'){notes.push({...action.note});if(action.note?.tupletId&&tripletArmed&&action.note.tupletId===tripletGroupId)tripletCount=Math.max(tripletCount,(action.note.tupletIndex||0)+1)}
      else if(action.type==='add-triplet'||action.type==='add-tuplet'||action.type==='add-overflow')notes.push(...(action.notes||[]).map(note=>({...note})));
      else if(action.type==='paste-end'){notes.push(...(action.notes||[]).map(note=>({...note})));slurs.push(...(action.slurs||[]).map(item=>({...item})))}
      else if(action.type==='delete'){const index=notes.findIndex(note=>note.id===action.note.id);if(index>=0)notes.splice(index,1);pruneEditRanges()}
      else if(action.type==='delete-selection')restoreWriteDeleteSnapshot(action.after)
      else if(action.type==='update-note'){const index=notes.findIndex(note=>note.id===action.id);if(index>=0)notes[index]={...action.after}}
      else if(action.type==='clear'){notes=[];slurs=[];hairpins=[];systemBreaks.clear();barlineStyles.clear();beamOverrides.clear();endings=[];selectedNoteIndices.clear();selectionClipboard=null}
      rememberAction(action);
    }
    function clearScore(){
      setTieArmed(false);setTripletArmed(false);
      if(!notes.length)return;
      rememberAction({type:'clear',notes:notes.map(note=>({...note})),slurs:slurs.map(item=>({...item})),hairpins:hairpins.map(item=>({...item})),systemBreaks:[...systemBreaks],barlineStyles:[...barlineStyles],beamOverrides:[...beamOverrides],endings:endings.map(item=>({...item}))});notes=[];slurs=[];hairpins=[];systemBreaks.clear();barlineStyles.clear();beamOverrides.clear();endings=[];selectedNoteIndices.clear();selectionClipboard=null;renderScore();
    }
    function restoreNotationSettings(){
      try{
        const clef=localStorage.getItem(CLEF_KEY);
        tuningSelect.value='C';
        if(clef&&Object.hasOwn(clefKeyboardStarts,clef))clefSelect.value=clef;
      }catch{}
    }
    function saveNotationSettings(){
      try{localStorage.setItem(TUNING_KEY,tuningSelect.value);localStorage.setItem(CLEF_KEY,clefSelect.value)}catch{}
    }
    function currentThemeId(){return themeDefinitions[themeSelect?.value]?themeSelect.value:'kupari'}
    function applyTheme(themeId=currentThemeId()){
      const theme=themeDefinitions[themeId]||themeDefinitions.kupari;
      if(themeSelect&&themeSelect.value!==themeId&&themeDefinitions[themeSelect.value])themeSelect.value=themeId;
      themeStyleTag.textContent=`
        body,.app{background:${theme.appBg};color:#18202a;}
        .mode-tab,.new-project-tab{background:${theme.tabIdle};border-color:${theme.tabBorder};color:${theme.panelText};}
        .mode-tab[aria-pressed="true"],.new-project-tab:active{background:${theme.panel};border-color:${theme.panelBorder};color:${theme.panelText};box-shadow:0 5px 12px ${theme.pageShadow};}
        .project-start-action[aria-pressed="true"],.notation-choice[aria-pressed="true"],.pickup-choice[aria-pressed="true"],.key-wheel-slot[aria-pressed="true"],.meter-wheel-slot[aria-pressed="true"]{border-color:${theme.accent};background:${theme.accentSoft};color:${theme.accentText};box-shadow:inset 0 0 0 1px ${theme.accent}55;}
        .start-button,.keyboard-scroll-thumb{background:${theme.panel};color:${theme.panelText};}
        .key-trigger-icon,.meter-trigger-icon,.key-trigger-icon::before,.key-trigger-icon::after,.meter-trigger-icon::before{border-color:${theme.panel};background-color:transparent;}
        .key-trigger-icon::after,.meter-trigger-icon::before{background:${theme.panel};}
        .score-page{background:${theme.pageBg};box-shadow:0 4px 16px ${theme.pageShadow};}
        .publish-header-icon,.publish-card-icon{background:${theme.accentSoft};color:${theme.panel};box-shadow:inset 0 0 0 1px ${theme.accent}66;}
        .project-card{box-shadow:0 24px 70px ${theme.pageShadow};}
        .field select:focus-visible,.field input:focus-visible,.key-trigger:focus-visible,.meter-trigger:focus-visible,.project-start-action:focus-visible,.start-button:focus-visible{outline:3px solid ${theme.accent}66;outline-offset:2px;}
      `;
    }
    function restoreThemePreference(){
      try{
        const storedTheme=localStorage.getItem(THEME_KEY);
        if(storedTheme&&themeDefinitions[storedTheme])themeSelect.value=storedTheme;
      }catch{}
      applyTheme(currentThemeId());
    }
    function saveThemePreference(){
      try{localStorage.setItem(THEME_KEY,currentThemeId())}catch{}
    }
    function selectedText(select){return select.options[select.selectedIndex].textContent}
    function syncNotationChoices(){
      tuningChoices.querySelectorAll('[data-tuning]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tuning===tuningSelect.value)));
      clefChoices.querySelectorAll('[data-clef]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.clef===clefSelect.value)));
    }
    function chooseNotationSetting(e){
      const tuningButton=e.target.closest('[data-tuning]'),clefButton=e.target.closest('[data-clef]');
      if(!tuningButton&&!clefButton)return;
      e.preventDefault();
      if(tuningButton)tuningSelect.value=tuningButton.dataset.tuning;
      if(clefButton)clefSelect.value=clefButton.dataset.clef;
      syncNotationChoices();
    }
    function focusNewProjectStart(e){e?.preventDefault();newProjectStartButton.setAttribute('aria-pressed','true');openProjectButton.setAttribute('aria-pressed','false');titleInput.focus()}
    function applyProjectData(){
      saveNotationSettings();
      const headerPositions=normalizedHeaderPositions(projectData?.headerPositions),keyInfo=selectedKeyInfo();projectData={instrumentName:'Pikakirjoitin',tuning:tuningSelect.value,title:titleInput.value.trim(),composer:composerInput.value.trim(),tempoText:tempoInput.value.trim(),themeId:currentThemeId(),keySignature:keyInfo.fifths,keyMode:keyInfo.mode,keyTonic:keyInfo.tonic,keySignatureName:selectedText(keySignatureSelect),timeSignature:timeSignatureSelect.value,pickupDuration:Number(pickupSelect.value)||0,clef:clefSelect.value||'treble',transpose:tuningTransposes[tuningSelect.value]||0,headerPositions};
      saveThemePreference();
      applyTheme(projectData.themeId);
      syncNotationChoices();
      scoreTitle.textContent=projectData.title||'Nimetön kappale';
      scoreTempo.textContent=projectData.tempoText;scoreComposer.textContent=projectData.composer;syncHeaderTextPresentation();applyHeaderPositions();
      buildKeyboard();applyNotationSettings();projectModal.hidden=true;app.inert=false;app.removeAttribute('aria-hidden');score.focus();
      renderScore();
      requestAnimationFrame(()=>{updateScorePagePreview();if(!keyboardPanel.hidden)positionKeyboardForClef()});
    }
    function saveProject(e){
      e.preventDefault();const firstStart=!projectData;applyProjectData();if(firstStart)togglePiano(e);
    }

    function visibleName(midi){
      const octave=Math.floor(midi/12)-1,name=whitePitchNames[mod(midi,12)];
      if(octave<=0)return 'SK-'+name;
      if(octave===1)return 'K-'+name;
      if(octave===2)return name;
      if(octave===3)return name.toLowerCase();
      return name.toLowerCase()+(octave-3);
    }
    function spokenName(midi){
      return pitchDisplay(midi,false);
    }
    function keyboardRange(){
      return {min:DEFAULT_MIN_MIDI,max:DEFAULT_MAX_MIDI};
    }
    function clearSoundingMarker(){
      if(!soundingKey)return;
      soundingKey.classList.remove('sounding-note','sounding-resting');soundingKey=null;
    }
    function showSoundingMarker(midi){
      clearSoundingMarker();soundingKey=piano.querySelector(`.key[data-midi="${midi}"]`);
      if(soundingKey)soundingKey.classList.add('sounding-note');
    }
    function buildKeyboard(){
      const range=keyboardRange();
      if(whiteKeys.children.length&&range.min===keyboardMinMidi&&range.max===keyboardMaxMidi)return;
      clearSoundingMarker();whiteKeys.replaceChildren();piano.querySelectorAll('.black').forEach(key=>key.remove());
      keyboardMinMidi=range.min;keyboardMaxMidi=range.max;
      let whiteIndex=0;
      for(let midi=keyboardMinMidi;midi<=keyboardMaxMidi;midi+=1){
        const pitch=midi%12,isWhite=Object.hasOwn(whitePitchNames,pitch),key=document.createElement('button');
        key.type='button';key.className='key '+(isWhite?'white':'black');key.dataset.midi=String(midi);key.setAttribute('aria-label',spokenName(midi));
        if(isWhite){
          key.textContent=visibleName(midi);whiteKeys.appendChild(key);whiteIndex+=1;
        }else{
          const whiteWidth=100/WHITE_COUNT;
          key.style.left=`${whiteIndex*whiteWidth-whiteWidth*BLACK_WIDTH/2}%`;
          key.style.width=`${whiteWidth*BLACK_WIDTH}%`;
          piano.appendChild(key);
        }
      }
    }
    function applyNotationSettings(){
      const useFlats=+(projectData?.keySignature??keySignatureSelect.value)<0;
      clearSoundingMarker();
      piano.querySelectorAll('.key').forEach(key=>{
        const midi=+key.dataset.midi;key.classList.remove('out-of-range');key.setAttribute('aria-label',pitchDisplay(midi,useFlats));
      });
      needsInstrumentPosition=true;
    }
    function positionKeyboardForClef(){
      if(keyboardPanel.hidden||!keyboardViewport.clientWidth)return;
      const startMidi=clefKeyboardStarts[currentClef()]??60,whites=[...whiteKeys.children],startIndex=whites.findIndex(key=>+key.dataset.midi===startMidi),maxScroll=Math.max(0,keyboardViewport.scrollWidth-keyboardViewport.clientWidth);
      keyboardViewport.scrollLeft=clamp(Math.max(0,startIndex)*(piano.scrollWidth/WHITE_COUNT),0,maxScroll);
      needsInstrumentPosition=false;syncScrollThumb();
    }

    function buildAudio(){
      try{audio=new AC({latencyHint:'interactive'})}catch{audio=new AC()}
      osc=audio.createOscillator();gain=audio.createGain();osc.type='triangle';gain.gain.value=.0001;osc.connect(gain).connect(audio.destination);started=false;
      audio.onstatechange=()=>status.textContent='Audio: '+audio.state;
      status.textContent='Audio: '+audio.state;
    }
    function hideThirtysecondButton(){
      thirtysecondButton.classList.remove('visible','active');thirtysecondButton.setAttribute('aria-pressed','false');
    }
    function hideDoubleDotButton(){
      doubleDotButton.classList.remove('visible','active');doubleDotButton.setAttribute('aria-pressed','false');
    }
    function hideTupletChoiceButtons(){
      for(const button of [quintupletButton,sextupletButton]){button.classList.remove('visible','active');button.setAttribute('aria-pressed','false')}
    }
    function hideRestDurationButtons(){
      for(const button of [restSixteenthButton,restThirtysecondButton]){button.classList.remove('visible','active');button.setAttribute('aria-pressed','false')}
    }
    function clearModifier(){
      const button=activeModifierButton,pointerId=modifierPointerId;
      if(button){button.classList.remove('active');button.setAttribute('aria-pressed','false');try{if(pointerId!==null&&button.hasPointerCapture(pointerId))button.releasePointerCapture(pointerId)}catch{}}
      hideThirtysecondButton();hideDoubleDotButton();hideRestDurationButtons();hideTupletChoiceButtons();modifierPointerId=null;activeModifier=null;activeModifierButton=null;
    }
    function startModifier(e){
      const button=e.target.closest('.modifier-button');
      if(!button||(e.pointerType==='mouse'&&e.button!==0)||modifierDragPointerId!==null)return;
      if(button===tieButton){
        if(modifierPointerId!==null)return;
        e.preventDefault();e.stopPropagation();setTieArmed(!tieArmed);return;
      }
      if(modifierPointerId!==null)return;
      e.preventDefault();e.stopPropagation();
      modifierPointerId=e.pointerId;activeModifier=button===tripletButton?(tripletArmed?`tuplet-${tripletSize}`:'tuplet-3'):button.dataset.modifier;activeModifierButton=button;button.setAttribute('aria-pressed','true');
      if(button===tripletButton){
        quintupletButton.style.top=button.offsetTop+'px';sextupletButton.style.top=button.offsetTop+'px';quintupletButton.classList.add('visible');sextupletButton.classList.add('visible');
        const currentSize=tripletArmed?tripletSize:3;
        quintupletButton.classList.toggle('active',currentSize===5);quintupletButton.setAttribute('aria-pressed',currentSize===5?'true':'false');
        sextupletButton.classList.toggle('active',currentSize===6);sextupletButton.setAttribute('aria-pressed',currentSize===6?'true':'false');
      }
      if(activeModifier==='dot'){doubleDotButton.style.top=button.offsetTop+'px';doubleDotButton.classList.add('visible')}
      if(activeModifier==='sixteenth'){thirtysecondButton.style.top=button.offsetTop+'px';thirtysecondButton.classList.add('visible')}
      if(activeModifier==='rest'){
        restSixteenthButton.style.top=button.offsetTop+'px';restThirtysecondButton.style.top=button.offsetTop+'px';
        restSixteenthButton.classList.add('visible');restThirtysecondButton.classList.add('visible');
      }
      try{button.setPointerCapture(e.pointerId)}catch{}
    }
    function moveModifier(e){
      if(e.pointerId!==modifierPointerId)return;
      const source=activeModifierButton?.dataset.modifier;
      if(source!=='dot'&&source!=='sixteenth'&&source!=='rest'&&source!=='tuplet')return;
      e.preventDefault();e.stopPropagation();
      if(source==='dot'){
        const rect=doubleDotButton.getBoundingClientRect(),inside=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
        activeModifier=inside?'double-dot':'dot';
        doubleDotButton.classList.toggle('active',inside);doubleDotButton.setAttribute('aria-pressed',inside?'true':'false');
        return;
      }
      if(source==='tuplet'){
        const r5=quintupletButton.getBoundingClientRect(),r6=sextupletButton.getBoundingClientRect();
        const in5=e.clientX>=r5.left&&e.clientX<=r5.right&&e.clientY>=r5.top&&e.clientY<=r5.bottom,in6=e.clientX>=r6.left&&e.clientX<=r6.right&&e.clientY>=r6.top&&e.clientY<=r6.bottom;
        activeModifier=in6?'tuplet-6':in5?'tuplet-5':(tripletArmed?`tuplet-${tripletSize}`:'tuplet-3');
        quintupletButton.classList.toggle('active',in5);quintupletButton.setAttribute('aria-pressed',in5?'true':'false');
        sextupletButton.classList.toggle('active',in6);sextupletButton.setAttribute('aria-pressed',in6?'true':'false');
        return;
      }
      if(source==='sixteenth'){
        const rect=thirtysecondButton.getBoundingClientRect(),inside=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
        activeModifier=inside?'thirtysecond':'sixteenth';
        thirtysecondButton.classList.toggle('active',inside);thirtysecondButton.setAttribute('aria-pressed',inside?'true':'false');
        return;
      }
      const r16=restSixteenthButton.getBoundingClientRect(),r32=restThirtysecondButton.getBoundingClientRect();
      const in16=e.clientX>=r16.left&&e.clientX<=r16.right&&e.clientY>=r16.top&&e.clientY<=r16.bottom;
      const in32=e.clientX>=r32.left&&e.clientX<=r32.right&&e.clientY>=r32.top&&e.clientY<=r32.bottom;
      activeModifier=in32?'rest-thirtysecond':in16?'rest-sixteenth':'rest';
      restSixteenthButton.classList.toggle('active',in16);restSixteenthButton.setAttribute('aria-pressed',in16?'true':'false');
      restThirtysecondButton.classList.toggle('active',in32);restThirtysecondButton.setAttribute('aria-pressed',in32?'true':'false');
    }
    function endModifier(e){
      if(e.pointerId!==modifierPointerId)return;
      const source=activeModifierButton?.dataset.modifier,selected=activeModifier;
      if(source==='tuplet'){
        const size=selected==='tuplet-6'?6:selected==='tuplet-5'?5:3,turnOff=tripletArmed&&tripletSize===size;clearModifier();
        if(tripletArmed&&currentTupletHasEntries()&&(turnOff||tripletSize!==size)){showTupletWarning('Kirjoita tupletti loppuun');return}
        setTripletArmed(!turnOff,{size});return;
      }
      clearModifier();
    }
    function modifierBounds(){
      const minTop=8,maxTop=Math.max(minTop,scoreArea.clientHeight-modifierRail.offsetHeight-18);
      return {minTop,maxTop};
    }
    function positionModifierRail(){
      const {minTop,maxTop}=modifierBounds();
      modifierRail.style.top=minTop+(maxTop-minTop)*modifierYRatio+'px';
    }
    function restoreModifierPosition(){
      try{const saved=Number.parseFloat(localStorage.getItem(MODIFIER_Y_KEY));if(Number.isFinite(saved))modifierYRatio=clamp(saved,0,1)}catch{}
    }
    function saveModifierPosition(){
      try{localStorage.setItem(MODIFIER_Y_KEY,modifierYRatio.toFixed(4))}catch{}
    }
    function startModifierDrag(e){
      if((e.pointerType==='mouse'&&e.button!==0)||modifierDragPointerId!==null||modifierPointerId!==null)return;
      e.preventDefault();e.stopPropagation();modifierDragPointerId=e.pointerId;modifierDragStartY=e.clientY;modifierDragStartTop=modifierRail.offsetTop;
      try{modifierDragHandle.setPointerCapture(e.pointerId)}catch{}
    }
    function moveModifierDrag(e){
      if(e.pointerId!==modifierDragPointerId)return;
      e.preventDefault();e.stopPropagation();
      const {minTop,maxTop}=modifierBounds(),top=clamp(modifierDragStartTop+e.clientY-modifierDragStartY,minTop,maxTop);
      modifierRail.style.top=top+'px';modifierYRatio=maxTop>minTop?(top-minTop)/(maxTop-minTop):0;
    }
    function finishModifierDrag(pointerId){
      if(pointerId!==modifierDragPointerId)return;
      modifierDragPointerId=null;try{if(modifierDragHandle.hasPointerCapture(pointerId))modifierDragHandle.releasePointerCapture(pointerId)}catch{}saveModifierPosition();
    }
    function endModifierDrag(e){
      e.preventDefault();e.stopPropagation();finishModifierDrag(e.pointerId);
    }
    function cancelModifierDrag(){
      if(modifierDragPointerId!==null)finishModifierDrag(modifierDragPointerId);
    }
    function togglePiano(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      e.preventDefault();
      if(!keyboardPanel.hidden){if(tripletArmed&&currentTupletHasEntries()){showTupletWarning('Kirjoita tupletti loppuun');return}clearModifier();setTieArmed(false);setTripletArmed(false);cancelModifierDrag();app.classList.remove('keyboard-open');modifierRail.setAttribute('aria-hidden','true');keyboardPanel.hidden=true;score.setAttribute('aria-expanded','false');requestAnimationFrame(updateScorePagePreview);return}
      if(!audio||audio.state==='closed')buildAudio();
      if(!started){osc.start();started=true}
      const done=()=>{
        if(audio.state!=='running')return;
        keyboardPanel.hidden=false;app.classList.add('keyboard-open');modifierRail.setAttribute('aria-hidden','false');score.setAttribute('aria-expanded','true');status.textContent='Audio: running';requestAnimationFrame(()=>{positionModifierRail();updateScorePagePreview();needsInstrumentPosition?positionKeyboardForClef():syncScrollThumb()});
      };
      if(audio.state==='running')done();else audio.resume().then(done).catch(()=>status.textContent='Audio: avaaminen epäonnistui');
    }
    function startNote(e){
      const key=e.target.closest('.key');
      if(!key||(e.pointerType==='mouse'&&e.button!==0))return;
      e.preventDefault();
      if(!audio||audio.state!=='running'){status.textContent='Audio: suspended';return}
      if(activeId!==null)return;
      activeId=e.pointerId;activeKey=key;key.classList.add('active');
      const modifier=activeModifier,duration=(modifier==='thirtysecond'||modifier==='rest-thirtysecond')?'thirtysecond':(modifier==='sixteenth'||modifier==='rest-sixteenth')?'sixteenth':'quarter',doubleDotted=modifier==='double-dot',dotted=modifier==='dot',rest=modifier==='rest'||modifier==='rest-sixteenth'||modifier==='rest-thirtysecond';
      noteStartX=e.clientX;noteStartY=e.clientY;noteSwipeThreshold=clamp(keyboardViewport.clientHeight*.12,24,48);noteGestureLocked=duration==='sixteenth'||duration==='thirtysecond';
      try{piano.setPointerCapture(e.pointerId)}catch{}
      const writtenMidi=+key.dataset.midi,soundingMidi=writtenMidi+currentTranspose(),t=audio.currentTime,editIndex=writeNoteIndex();
      activeReplacingExisting=editIndex>=0;
      if(activeReplacingExisting){
        const existing=notes[editIndex],before={...existing};existing.midi=writtenMidi;existing.duration=duration;existing.dotted=dotted;existing.doubleDotted=doubleDotted;existing.rest=rest;existing.measureRest=false;delete existing.accidentalStyle;delete existing.spellingStep;delete existing.spellingOctave;delete existing.spellingAlter;delete existing.spellingManual;repairTiesAround(editIndex);const action={type:'update-note',id:existing.id,before,after:{...existing}};rememberAction(action);activeNote=existing;activeNoteAction=action;renderScore();
      }else{const created=addScoreNote(writtenMidi,{duration,dotted,doubleDotted,rest});activeNote=created.note;activeNoteAction=created.action}
      if(!noteGestureLocked)longPressTimer=setTimeout(()=>{
        longPressTimer=null;
        if(activeId!==e.pointerId||!activeNote||noteGestureLocked)return;
        noteGestureLocked=true;setActiveNoteDuration('whole');
      },LONG_PRESS_MS);
      activeNoteSounds=!rest;
      if(activeNoteSounds){
        if(currentTranspose())showSoundingMarker(soundingMidi);else clearSoundingMarker();
        osc.frequency.setValueAtTime(440*Math.pow(2,(soundingMidi-69)/12),t);gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(.16,t+.012);
      }else clearSoundingMarker();
    }
    function moveNote(e){
      if(e.pointerId!==activeId||!activeNote||noteGestureLocked)return;
      e.preventDefault();
      const dx=e.clientX-noteStartX,dy=e.clientY-noteStartY;
      if(Math.hypot(dx,dy)>LONG_PRESS_MOVE)clearLongPress();
      if(Math.abs(dy)<noteSwipeThreshold)return;
      clearLongPress();noteGestureLocked=true;setActiveNoteDuration(dy>0?'eighth':'half');
    }
    function stopNote(e){
      if(e.pointerId!==activeId||!activeKey)return;
      clearLongPress();
      if(activeNoteSounds){const t=audio.currentTime;gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(.16,t);gain.gain.exponentialRampToValueAtTime(.0001,t+.06)}
      activeKey.classList.remove('active');if(activeNoteSounds&&soundingKey)soundingKey.classList.add('sounding-resting');
      try{if(piano.hasPointerCapture(e.pointerId))piano.releasePointerCapture(e.pointerId)}catch{}
      const tupletOk=finalizeActiveTupletEntry();if(tupletOk)splitOverflowingActiveEntry();const replaced=activeReplacingExisting,finishedTupletId=completedTupletId;completedTupletId=null;if(finishedTupletId)collapseCompletedTripletHistory(finishedTupletId);activeId=null;activeKey=null;activeNote=null;activeNoteAction=null;activeNoteSounds=false;noteGestureLocked=false;activeReplacingExisting=false;if(replaced)clearWriteNoteEdit();
    }

    function syncScrollThumb(){
      const maxScroll=Math.max(0,keyboardViewport.scrollWidth-keyboardViewport.clientWidth),travel=Math.max(0,keyboardScrollTrack.clientWidth-keyboardScrollThumb.offsetWidth),ratio=maxScroll?keyboardViewport.scrollLeft/maxScroll:0;
      keyboardScrollThumb.style.transform=`translate3d(${ratio*travel}px,0,0)`;
      keyboardScrollRail.setAttribute('aria-valuenow',String(Math.round(ratio*100)));
    }
    function setScrollFromPointer(clientX){
      const trackRect=keyboardScrollTrack.getBoundingClientRect(),travel=Math.max(0,trackRect.width-keyboardScrollThumb.offsetWidth),left=clamp(clientX-trackRect.left-scrollGrabOffset,0,travel),maxScroll=Math.max(0,keyboardViewport.scrollWidth-keyboardViewport.clientWidth);
      keyboardViewport.scrollLeft=travel?left/travel*maxScroll:0;
      syncScrollThumb();
    }
    function startScroll(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      e.preventDefault();scrollPointerId=e.pointerId;
      const thumbRect=keyboardScrollThumb.getBoundingClientRect();
      scrollGrabOffset=keyboardScrollThumb.contains(e.target)?e.clientX-thumbRect.left:thumbRect.width/2;
      keyboardScrollRail.setPointerCapture(e.pointerId);setScrollFromPointer(e.clientX);
    }
    function moveScroll(e){
      if(e.pointerId!==scrollPointerId)return;
      e.preventDefault();setScrollFromPointer(e.clientX);
    }
    function endScroll(e){
      if(e.pointerId!==scrollPointerId)return;
      if(keyboardScrollRail.hasPointerCapture(e.pointerId))keyboardScrollRail.releasePointerCapture(e.pointerId);
      scrollPointerId=null;
    }
    function keyboardScrollKey(e){
      const maxScroll=Math.max(0,keyboardViewport.scrollWidth-keyboardViewport.clientWidth),step=keyboardViewport.clientWidth/2;
      if(e.key==='Home')keyboardViewport.scrollLeft=0;
      else if(e.key==='End')keyboardViewport.scrollLeft=maxScroll;
      else if(e.key==='ArrowLeft'||e.key==='PageUp')keyboardViewport.scrollLeft=clamp(keyboardViewport.scrollLeft-step,0,maxScroll);
      else if(e.key==='ArrowRight'||e.key==='PageDown')keyboardViewport.scrollLeft=clamp(keyboardViewport.scrollLeft+step,0,maxScroll);
      else return;
      e.preventDefault();syncScrollThumb();
    }
    function resizeLayout(){
      syncScrollThumb();positionModifierRail();updateScorePagePreview();requestAnimationFrame(()=>{syncStaffTopSlider();syncLineSpacingSlider();syncNoteSizeControls();positionNoteSizePanel();if(workMode==='edit')refreshEditGeometry();else if(workMode==='write')refreshWriteGeometry()});
    }
    function keepOuterViewportFixed(){
      if(window.scrollX||window.scrollY)window.scrollTo(0,0);
    }
    function preventOuterTouchScroll(e){
      if(e.target.closest('.score,.project-modal'))return;
      if(e.cancelable)e.preventDefault();
      keepOuterViewportFixed();
    }
    function resetSingleScoreTouch(){
      scoreSingleTouchId=null;scoreSingleTouchStartX=0;scoreSingleTouchStartY=0;scoreSingleTouchScrollTop=0;scoreSingleTouchScrolling=false;
    }
    function startScoreTouchLock(e){
      if(workMode!=='write')return;
      // Yhden sormen vieritys kuuluu selaimelle. Oma kosketuslukko aktivoituu
      // vasta kahdella tai useammalla sormella (undo / tyhjennys).
      for(const touch of e.changedTouches||[])scoreTouchIds.add(touch.identifier);
      if(scoreTouchIds.size>=2&&!scoreMultiTouchLocked){
        resetSingleScoreTouch();
        scoreMultiTouchLocked=true;
        scoreMultiTouchScrollTop=score.scrollTop;
        scoreMultiTouchScrollLeft=score.scrollLeft;
      }
      if(scoreMultiTouchLocked){
        if(e.cancelable)e.preventDefault();
        score.scrollTop=scoreMultiTouchScrollTop;
        score.scrollLeft=scoreMultiTouchScrollLeft;
        keepOuterViewportFixed();
      }
    }
    function moveScoreTouchLock(e){
      if(workMode!=='write')return;
      if(writeSelectionActive){
        if(e.cancelable)e.preventDefault();
        score.scrollTop=writeSelectionScrollTop;score.scrollLeft=writeSelectionScrollLeft;keepOuterViewportFixed();return;
      }
      if(scoreMultiTouchLocked){
        if(e.cancelable)e.preventDefault();
        score.scrollTop=scoreMultiTouchScrollTop;
        score.scrollLeft=scoreMultiTouchScrollLeft;
        keepOuterViewportFixed();
        return;
      }
      // Ei preventDefaultia eikä scrollTopin käsin muuttamista yhden sormen eleelle.
      // Näin iPad/Safari hoitaa myös monisivuisen inertiascrollauksen itse.
    }
    function endScoreTouchLock(e){
      for(const touch of e.changedTouches||[])scoreTouchIds.delete(touch.identifier);
      if(scoreMultiTouchLocked){
        if(e.cancelable)e.preventDefault();
        score.scrollTop=scoreMultiTouchScrollTop;
        score.scrollLeft=scoreMultiTouchScrollLeft;
        keepOuterViewportFixed();
      }
      if(!scoreTouchIds.size){
        scoreMultiTouchLocked=false;
        scoreMultiTouchScrollTop=0;
        scoreMultiTouchScrollLeft=0;
        resetSingleScoreTouch();
      }
    }
    function preventScoreNativeGesture(e){
      if(workMode==='write'&&scoreMultiTouchLocked&&e.cancelable)e.preventDefault();
    }
    function cancelWriteSelectionHold(){
      if(writeSelectionHoldTimer){clearTimeout(writeSelectionHoldTimer);writeSelectionHoldTimer=null}
      if(!writeSelectionActive)writeSelectionCandidate=null;
    }
    function armWriteSelection(e){
      if(workMode!=='write'||scorePointers.size!==1||writeSelectionActive)return;
      const hit=writeNoteHitAtClient(e.clientX,e.clientY);if(!hit)return;
      writeSelectionCandidate={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,start:clientPointToScoreContent(e.clientX,e.clientY)};
      writeSelectionHoldTimer=setTimeout(()=>{
        const candidate=writeSelectionCandidate;if(!candidate||candidate.pointerId!==e.pointerId||workMode!=='write'||scorePointers.size!==1||scoreGesture!==0||scoreMoved)return;
        writeSelectionHoldTimer=null;writeSelectionActive=true;writeSelectionScrollTop=score.scrollTop;writeSelectionScrollLeft=score.scrollLeft;clearWriteNoteEdit();selectionHitboxes=writeNoteHitboxes.map(item=>({...item}));selectedNoteIndices.clear();selectionDrag={pointerId:e.pointerId,start:candidate.start,current:candidate.start,moved:false};try{score.setPointerCapture(e.pointerId)}catch{}selectAtPoint(candidate.start);renderSelectionOverlay();status.textContent='Valitse kopioitava alue vetämällä';
      },WRITE_SELECTION_HOLD_MS);
    }
    function finishWriteSelection(e,cancelled=false){
      if(!writeSelectionActive||!selectionDrag||selectionDrag.pointerId!==e.pointerId)return false;
      if(e.cancelable)e.preventDefault();
      selectionDrag.current=contentPointFromPointer(e);
      if(cancelled){selectedNoteIndices.clear();selectionClipboard=null}else if(selectionDrag.moved)selectInRectangle(normalizedRectangle(selectionDrag.start,selectionDrag.current));else selectAtPoint(selectionDrag.current);
      selectionDrag=null;writeSelectionActive=false;writeSelectionCandidate=null;cancelWriteSelectionHold();
      if(!cancelled)captureSelectionClipboard();
      renderSelectionOverlay();syncWritePasteEndButton();
      if(!cancelled&&selectionClipboard?.notes?.length)status.textContent=`Valittu ${selectionClipboard.notes.length} ${selectionClipboard.notes.length===1?'nuotti':'nuottia'}`;
      return true;
    }
    function startScoreGesture(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      if(!scorePointers.size){scoreGesture=0;scoreUndoneAction=null;scoreStartX=e.clientX;scoreStartY=e.clientY;scoreMoved=false}
      scorePointers.add(e.pointerId);
      // Älä kaappaa yhden sormen touch-pointeria: pointer capture voi estää
      // Safarin oman pan-y-vierityksen. Hiirellä capture säilyy.
      if(e.pointerType==='mouse'){try{score.setPointerCapture(e.pointerId)}catch{}}
      if(scorePointers.size===1)armWriteSelection(e);else cancelWriteSelectionHold();
      if(scorePointers.size>=3&&scoreGesture!==3){
        if(scoreGesture===2&&scoreUndoneAction)redoChange(scoreUndoneAction);
        scoreGesture=3;scoreUndoneAction=null;clearScore();
      }else if(scorePointers.size===2&&scoreGesture===0){
        scoreGesture=2;scoreUndoneAction=undoLastChange();
      }
    }
    function moveScoreGesture(e){
      if(!scorePointers.has(e.pointerId)||scoreGesture!==0||scorePointers.size!==1)return;
      if(writeSelectionActive&&selectionDrag?.pointerId===e.pointerId){
        if(e.cancelable)e.preventDefault();e.stopPropagation();selectionDrag.current=contentPointFromPointer(e);selectionDrag.moved=selectionDrag.moved||Math.hypot(e.clientX-scoreStartX,e.clientY-scoreStartY)>4;if(selectionDrag.moved)selectInRectangle(normalizedRectangle(selectionDrag.start,selectionDrag.current));score.scrollTop=writeSelectionScrollTop;score.scrollLeft=writeSelectionScrollLeft;renderSelectionOverlay();return;
      }
      if(writeSelectionCandidate&&writeSelectionCandidate.pointerId===e.pointerId&&Math.hypot(e.clientX-writeSelectionCandidate.startX,e.clientY-writeSelectionCandidate.startY)>WRITE_SELECTION_MOVE)cancelWriteSelectionHold();
      if(!scoreMoved&&Math.hypot(e.clientX-scoreStartX,e.clientY-scoreStartY)>=SCORE_SCROLL_SLOP)scoreMoved=true;
    }
    function endScoreGesture(e,cancelled=false){
      if(!scorePointers.has(e.pointerId))return;
      const wasWriteSelection=writeSelectionActive&&selectionDrag?.pointerId===e.pointerId;
      if(wasWriteSelection)finishWriteSelection(e,cancelled);else cancelWriteSelectionHold();
      const singleTap=!wasWriteSelection&&scorePointers.size===1&&scoreGesture===0&&!scoreMoved&&!cancelled;
      scorePointers.delete(e.pointerId);
      try{if(score.hasPointerCapture(e.pointerId))score.releasePointerCapture(e.pointerId)}catch{}
      if(singleTap&&workMode==='write'){
        if(selectedNoteIndices.size||selectionClipboard){selectedNoteIndices.clear();selectionClipboard=null;selectionHitboxes=[];renderSelectionOverlay();syncWritePasteEndButton()}
        const hit=writeNoteHitAtClient(e.clientX,e.clientY);if(hit)selectWriteNote(hit.entryIndex);else if(writeEditNoteId&&keyboardPanel.hidden)togglePiano(e);else{clearWriteNoteEdit();togglePiano(e)}
      }
      if(!scorePointers.size){
        scoreGesture=0;scoreUndoneAction=null;scoreMoved=false;cancelWriteSelectionHold();
        if(writeSelectionActive){writeSelectionActive=false;selectionDrag=null;writeSelectionCandidate=null;selectedNoteIndices.clear();selectionClipboard=null;selectionHitboxes=[];renderSelectionOverlay();syncWritePasteEndButton()}
      }
    }
    function finishWritePointerFallback(e,cancelled=false){
      if(writePitchDrag?.pointerId===e.pointerId)endWritePitchDrag(e,cancelled);
      if(scorePointers.has(e.pointerId))endScoreGesture(e,cancelled);
    }
    function resetTransientWritePointers(){
      cancelWriteSelectionHold();writeSelectionCandidate=null;
      if(writeSelectionActive){writeSelectionActive=false;selectionDrag=null;selectedNoteIndices.clear();selectionClipboard=null;selectionHitboxes=[];renderSelectionOverlay();syncWritePasteEndButton()}
      cancelWritePitchDrag();scorePointers.clear();scoreGesture=0;scoreUndoneAction=null;scoreMoved=false;
      scoreTouchIds.clear();scoreMultiTouchLocked=false;scoreMultiTouchScrollTop=0;scoreMultiTouchScrollLeft=0;resetSingleScoreTouch();
    }
    function scoreKey(e){
      if(workMode!=='write'||(e.key!=='Enter'&&e.key!==' '))return;
      e.preventDefault();togglePiano({pointerType:'keyboard',preventDefault(){}});
    }
    function activateWorkMode(e){
      const button=e.target.closest('.mode-tab');
      if(!button||button.disabled)return;
      if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;
      if(e.type==='pointerup'&&e.pointerType==='mouse'&&e.button!==0)return;
      e.preventDefault();setWorkMode(button.dataset.workMode,e);
    }
    function startNewProject(e){
      e?.preventDefault();
      if(!window.confirm('Aloitetaanko uusi nuotti? Nykyisen työn tallentamattomat muutokset häviävät.'))return;
      closeKeyboardForWorkMode();
      window.location.reload();
    }

    function activateThumbGuideMode(){
      const params=new URLSearchParams(window.location.search);
      if(params.get('peukalopalkki')!=='ohje')return false;
      document.body.classList.add('thumb-guide-mode');
      projectModal.hidden=true;
      app.inert=false;app.removeAttribute('aria-hidden');
      modifierRail.setAttribute('aria-hidden','false');
      const dotButton=modifierRail.querySelector('[data-modifier="dot"]');
      const sixteenthMain=modifierRail.querySelector('[data-modifier="sixteenth"]');
      const restMain=modifierRail.querySelector('[data-modifier="rest"]');
      const place=(button,source)=>{if(button&&source){button.style.top=source.offsetTop+'px';button.classList.add('visible');button.setAttribute('aria-hidden','false')}};
      place(doubleDotButton,dotButton);
      place(thirtysecondButton,sixteenthMain);
      place(restSixteenthButton,restMain);
      place(restThirtysecondButton,restMain);
      place(quintupletButton,tripletButton);
      place(sextupletButton,tripletButton);
      return true;
    }

    restoreNotationSettings();restoreThemePreference();restoreModifierPosition();syncNotationChoices();syncPickupOptions();buildKeyWheel();buildMeterWheel();
    buildKeyboard();
    applyNotationSettings();
    applyHeaderPositions();
    syncWorkModeUI();
    syncSelectionToolbar();
    const thumbGuideMode=activateThumbGuideMode();
    requestAnimationFrame(()=>{if(!thumbGuideMode)positionModifierRail();updateScorePagePreview();syncStaffTopSlider();syncLineSpacingSlider();syncNoteSizeControls();if(thumbGuideMode)activateThumbGuideMode()});
    newProjectButton.addEventListener('click',startNewProject);
    newProjectStartButton.addEventListener('click',focusNewProjectStart);
    openProjectButton.addEventListener('click',chooseProjectFile);
    projectFileInput.addEventListener('change',projectFileChosen);
    modeTabs.addEventListener('pointerup',activateWorkMode);
    modeTabs.addEventListener('keydown',activateWorkMode);
    tuningChoices.addEventListener('click',chooseNotationSetting);
    clefChoices.addEventListener('click',chooseNotationSetting);
    keyTrigger.addEventListener('click',openKeyWheel);
    keyWheelSlots.addEventListener('click',chooseKeyWheelSlot);
    keyWheelClose.addEventListener('click',closeKeyWheel);
    keyWheelPopover.addEventListener('click',keyWheelBackdrop);
    meterTrigger.addEventListener('click',openMeterWheel);
    meterWheelSlots.addEventListener('click',chooseMeterWheelSlot);
    meterWheelClose.addEventListener('click',closeMeterWheel);
    meterWheelPopover.addEventListener('click',meterWheelBackdrop);
    document.addEventListener('keydown',pickerEscapeKey);
    timeSignatureSelect.addEventListener('change',()=>{syncMeterPicker();syncPickupOptions()});
    pickupChoices.addEventListener('click',choosePickup);
    publishShareButton?.addEventListener('click',sharePdf);
    publishPrintButton?.addEventListener('click',printScore);
    publishProjectButton?.addEventListener('click',saveProjectFile);
    projectForm.addEventListener('submit',saveProject);
    themeSelect?.addEventListener('change',()=>{applyTheme(currentThemeId());saveThemePreference();if(projectData){projectData.themeId=currentThemeId();}});
    [scoreTitle,scoreTempo,scoreComposer].forEach(element=>{
      element.addEventListener('pointerdown',startHeaderInlineEdit);
      element.addEventListener('keydown',startHeaderInlineEdit);
    });
    [titleDragHandle,tempoDragHandle,composerDragHandle].forEach(handle=>{
      handle.addEventListener('pointerdown',startHeaderDrag);
      handle.addEventListener('pointermove',moveHeaderDrag,{passive:false});
      handle.addEventListener('pointerup',endHeaderDrag);
      handle.addEventListener('pointercancel',cancelHeaderDrag);
    });
    modifierRail.addEventListener('pointerdown',startModifier);
    modifierRail.addEventListener('pointermove',moveModifier,{passive:false});
    modifierDragHandle.addEventListener('pointerdown',startModifierDrag);
    modifierDragHandle.addEventListener('pointermove',moveModifierDrag);
    modifierDragHandle.addEventListener('pointerup',endModifierDrag);
    modifierDragHandle.addEventListener('pointercancel',endModifierDrag);
    piano.addEventListener('pointerdown',startNote);
    piano.addEventListener('pointermove',moveNote);
    window.addEventListener('pointerup',stopNote);
    window.addEventListener('pointercancel',stopNote);
    window.addEventListener('pointerup',endModifier);
    window.addEventListener('pointercancel',endModifier);
    window.addEventListener('pointerup',e=>finishWritePointerFallback(e,false),{passive:false});
    window.addEventListener('pointercancel',e=>finishWritePointerFallback(e,true),{passive:false});
    window.addEventListener('blur',resetTransientWritePointers);
    window.addEventListener('pagehide',resetTransientWritePointers);
    keyboardScrollRail.addEventListener('pointerdown',startScroll);
    keyboardScrollRail.addEventListener('pointermove',moveScroll);
    keyboardScrollRail.addEventListener('pointerup',endScroll);
    keyboardScrollRail.addEventListener('pointercancel',endScroll);
    keyboardScrollRail.addEventListener('keydown',keyboardScrollKey);
    keyboardViewport.addEventListener('scroll',syncScrollThumb,{passive:true});
    document.addEventListener('touchmove',preventOuterTouchScroll,{passive:false,capture:true});
    window.addEventListener('scroll',keepOuterViewportFixed,{passive:true});
    window.addEventListener('resize',resizeLayout);
    window.addEventListener('osmd-ready',renderScore);
    restoreSelectionToolbarPosition();
    writeNoteContext.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation()},{passive:false});
    writeNoteContext.addEventListener('pointerup',e=>e.stopPropagation());
    writeNoteAccidentalButtons.forEach(button=>button.addEventListener('pointerup',e=>{e.preventDefault();e.stopPropagation();setWriteNoteAccidental(Number(button.dataset.alter))},{passive:false}));
    writeNoteDeleteButton.addEventListener('pointerup',e=>{e.preventDefault();e.stopPropagation();deleteWriteNote()},{passive:false});
    score.addEventListener('scroll',()=>{if(writeEditNoteId)positionWriteNoteContext();if(!barlinePalette.hidden)closeBarlinePalette()},{passive:true});
    score.addEventListener('touchstart',startScoreTouchLock,{passive:false,capture:true});
    score.addEventListener('touchmove',moveScoreTouchLock,{passive:false,capture:true});
    score.addEventListener('touchend',endScoreTouchLock,{passive:false,capture:true});
    score.addEventListener('touchcancel',endScoreTouchLock,{passive:false,capture:true});
    score.addEventListener('gesturestart',preventScoreNativeGesture,{passive:false,capture:true});
    score.addEventListener('gesturechange',preventScoreNativeGesture,{passive:false,capture:true});
    score.addEventListener('pointerdown',startScoreGesture);
    score.addEventListener('pointermove',moveScoreGesture,{passive:false});
    score.addEventListener('pointerup',e=>endScoreGesture(e));
    score.addEventListener('pointercancel',e=>endScoreGesture(e,true));
    score.addEventListener('keydown',scoreKey);
    selectionSlurButton.addEventListener('click',toggleSlurForSelection);
    selectionSlurFlipButton.addEventListener('click',toggleSlurPlacement);
    selectionStemFlipButton.addEventListener('click',toggleStemDirectionForSelection);
    selectionTieFlipButton.addEventListener('click',toggleTiePlacement);
    selectionStaccatoButton.addEventListener('click',()=>toggleBooleanForSelection('staccato','Staccato'));
    selectionPortatoButton.addEventListener('click',()=>toggleBooleanForSelection('portato','Portato'));
    selectionAccentButton.addEventListener('click',()=>toggleBooleanForSelection('accent','Aksentti'));
    selectionDynamicButtons.forEach(button=>button.addEventListener('click',()=>toggleDynamicForSelection(button.dataset.dynamic)));
    selectionToolbarDragHandle.addEventListener('pointerdown',beginSelectionToolbarDrag,{passive:false});
    selectionToolbarDragHandle.addEventListener('pointermove',moveSelectionToolbarDrag,{passive:false});
    selectionToolbarDragHandle.addEventListener('pointerup',endSelectionToolbarDrag,{passive:false});
    selectionToolbarDragHandle.addEventListener('pointercancel',endSelectionToolbarDrag,{passive:false});
    selectionCrescendoButton.addEventListener('click',()=>toggleHairpinForSelection('crescendo'));
    selectionDiminuendoButton.addEventListener('click',()=>toggleHairpinForSelection('diminuendo'));
    staffTopSlider.addEventListener('pointerdown',beginStaffTopDrag,{passive:false});
    staffTopSlider.addEventListener('pointermove',moveStaffTopDrag,{passive:false});
    staffTopSlider.addEventListener('pointerup',e=>finishStaffTopDrag(e),{passive:false});
    staffTopSlider.addEventListener('pointercancel',e=>finishStaffTopDrag(e,true),{passive:false});
    staffTopSlider.addEventListener('keydown',staffTopKey);
    lineSpacingSlider.addEventListener('pointerdown',beginLineSpacingDrag,{passive:false});
    lineSpacingSlider.addEventListener('pointermove',moveLineSpacingDrag,{passive:false});
    lineSpacingSlider.addEventListener('pointerup',e=>finishLineSpacingDrag(e),{passive:false});
    lineSpacingSlider.addEventListener('pointercancel',e=>finishLineSpacingDrag(e,true),{passive:false});
    lineSpacingSlider.addEventListener('keydown',lineSpacingKey);
    noteSizeButton.addEventListener('click',toggleNoteSizePanel);
    noteSizeDecreaseButton.addEventListener('click',e=>changeNoteSizeByStep(-1,e));
    noteSizeResetButton.addEventListener('click',resetNoteSize);
    noteSizeIncreaseButton.addEventListener('click',e=>changeNoteSizeByStep(1,e));
    noteSizePanel.addEventListener('keydown',noteSizePanelKey);
    document.addEventListener('pointerdown',closeNoteSizeFromOutside);
    systemBreakButton.addEventListener('click',toggleSystemBreakMode);
    beamEditButton.addEventListener('click',toggleBeamEditMode);
    barlineEditButton.addEventListener('click',toggleBarlineEditMode);
    endingOneButton.addEventListener('click',()=>toggleEndingMode(1));
    endingTwoButton.addEventListener('click',()=>toggleEndingMode(2));
    barlineChoiceButtons.forEach(button=>button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();applyBarlineStyle(button.dataset.barlineStyle)}));
    stretchLastLineButton.addEventListener('click',toggleStretchLastLine);
    writePasteEndButton.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation()},{passive:false});
    writePasteEndButton.addEventListener('pointerup',event=>{event.preventDefault();event.stopPropagation();pasteSelectionToEnd();syncWritePasteEndButton()},{passive:false});
    writePasteEndButton.addEventListener('click',event=>{if(event.detail!==0)return;event.preventDefault();event.stopPropagation();pasteSelectionToEnd();syncWritePasteEndButton()});
    writeSelectionDeleteButton.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation()},{passive:false});
    writeSelectionDeleteButton.addEventListener('pointerup',event=>{event.preventDefault();event.stopPropagation();deleteWriteSelection()},{passive:false});
    writeSelectionDeleteButton.addEventListener('click',event=>{if(event.detail!==0)return;event.preventDefault();event.stopPropagation();deleteWriteSelection()});
    function clearEditSelectionHold(drag=selectionDrag){
      if(drag?.holdTimer){clearTimeout(drag.holdTimer);drag.holdTimer=null}
    }
    osmdContainer.addEventListener('pointerdown',e=>{
      if(workMode!=='edit'||barlineEditModeActive||beamEditModeActive||(e.pointerType==='mouse'&&e.button!==0)||e.target.closest?.('.system-break-marker,.system-break-candidate-marker,.system-break-candidate-svg,.barline-edit-marker,.beam-edit-marker'))return;
      if(endingModeActive){beginEndingDrag(e);return}
      const start=contentPointFromPointer(e),isMouse=e.pointerType==='mouse';
      // Stopataan vain kuplinta score-elementin elekäsittelijälle. Touchilla ei
      // kutsuta preventDefaultia eikä pointer capturea ennen pitkää painallusta,
      // jotta Safari saa hoitaa normaalin pystyscrollauksen.
      e.stopPropagation();
      if(isMouse)e.preventDefault();
      selectionDrag={pointerId:e.pointerId,start,current:start,moved:false,mode:isMouse?'select':'pending',startClientX:e.clientX,startClientY:e.clientY,scrollTop:score.scrollTop,scrollLeft:score.scrollLeft,holdTimer:null};
      if(isMouse){
        try{osmdContainer.setPointerCapture(e.pointerId)}catch{}
        selectedNoteIndices.clear();selectionClipboard=null;renderSelectionOverlay();return;
      }
      const drag=selectionDrag;
      drag.holdTimer=setTimeout(()=>{
        if(workMode!=='edit'||selectionDrag!==drag||drag.mode!=='pending')return;
        drag.holdTimer=null;drag.mode='select';drag.current=contentPointFromPointer({clientX:drag.startClientX,clientY:drag.startClientY});
        try{osmdContainer.setPointerCapture(drag.pointerId)}catch{}
        selectedNoteIndices.clear();selectionClipboard=null;selectAtPoint(drag.start);renderSelectionOverlay();status.textContent='Valitse nuotit vetämällä';
      },EDIT_SELECTION_HOLD_MS);
    },{passive:false});
    osmdContainer.addEventListener('pointermove',e=>{
      if(workMode!=='edit')return;if(endingDrag){moveEndingDrag(e);return}if(!selectionDrag||selectionDrag.pointerId!==e.pointerId)return;
      const drag=selectionDrag,dx=e.clientX-drag.startClientX,dy=e.clientY-drag.startClientY,distance=Math.hypot(dx,dy);
      if(drag.mode==='pending'){
        if(distance<Math.min(SCORE_SCROLL_SLOP,EDIT_SELECTION_MOVE))return;
        if(Math.abs(dy)>=SCORE_SCROLL_SLOP&&Math.abs(dy)>=Math.abs(dx)){
          drag.mode='scroll-native';drag.moved=true;clearEditSelectionHold(drag);
          // Ei preventDefaultia: selaimen oma pan-y jatkaa eleen loppuun asti.
          return;
        }
        if(distance>=EDIT_SELECTION_MOVE){drag.mode='cancelled';drag.moved=true;clearEditSelectionHold(drag);return}
      }
      if(drag.mode==='scroll-native'||drag.mode==='cancelled')return;
      if(drag.mode!=='select')return;
      if(e.cancelable)e.preventDefault();e.stopPropagation();selectionDrag.current=contentPointFromPointer(e);selectionDrag.moved=selectionDrag.moved||distance>4;if(selectionDrag.moved)selectInRectangle(normalizedRectangle(selectionDrag.start,selectionDrag.current));score.scrollTop=drag.scrollTop;score.scrollLeft=drag.scrollLeft;renderSelectionOverlay();
    },{passive:false});
    const finishSelectionGesture=(e,cancelled=false)=>{
      if(!selectionDrag||selectionDrag.pointerId!==e.pointerId)return;
      const drag=selectionDrag;clearEditSelectionHold(drag);selectionDrag=null;
      try{if(osmdContainer.hasPointerCapture(e.pointerId))osmdContainer.releasePointerCapture(e.pointerId)}catch{}
      if(drag.mode==='scroll-native'||drag.mode==='cancelled'){e.stopPropagation();return}
      if(e.cancelable)e.preventDefault();e.stopPropagation();
      if(cancelled){if(drag.mode==='select'){selectedNoteIndices.clear();selectionClipboard=null}}
      else{drag.current=contentPointFromPointer(e);if(drag.mode==='select'&&drag.moved)selectInRectangle(normalizedRectangle(drag.start,drag.current));else{selectedNoteIndices.clear();selectAtPoint(drag.current)}selectionClipboard=null}
      renderSelectionOverlay();
    };
    osmdContainer.addEventListener('pointerup',e=>{if(endingDrag){finishEndingDrag(e);return}finishSelectionGesture(e)});
    osmdContainer.addEventListener('pointercancel',e=>{if(endingDrag){finishEndingDrag(e,true);return}finishSelectionGesture(e,true)});
  
