const TUNING_TRANSPOSES = { C: 0, Bb: -2, Eb: -9, F: -7 };
const CLEF_KEYBOARD_STARTS = { treble: 60, alto: 48, bass: 36 };
const THEME_KEY = 'pikakirjoitin.theme';
const CLEF_KEY = 'pikakirjoitin.clef';

export const THEME_DEFINITIONS = {
  kupari:{name:'Kupari',accent:'#C97B63',accentSoft:'#F2EDE3',accentText:'#6c3c2f',panel:'#284B63',panelBorder:'#1E2A38',panelText:'#ffffff',appBg:'#eef1f5',pageBg:'#ffffff',pageShadow:'rgba(30,42,56,.22)'},
  salvia:{name:'Salvia',accent:'#A3B18A',accentSoft:'#F5F1E8',accentText:'#425039',panel:'#6B705C',panelBorder:'#59604b',panelText:'#ffffff',appBg:'#f1f3ed',pageBg:'#ffffff',pageShadow:'rgba(76,84,63,.18)'},
  luumu:{name:'Luumu',accent:'#6D597A',accentSoft:'#F4F1EE',accentText:'#4d3d58',panel:'#355070',panelBorder:'#24384f',panelText:'#ffffff',appBg:'#f1eef4',pageBg:'#ffffff',pageShadow:'rgba(53,80,112,.18)'},
  sahko:{name:'Sähkö',accent:'#5BC0EB',accentSoft:'#E9ECEF',accentText:'#174d83',panel:'#2B2D42',panelBorder:'#1f2131',panelText:'#ffffff',appBg:'#eef2f6',pageBg:'#ffffff',pageShadow:'rgba(43,45,66,.2)'},
  koralli:{name:'Koralli',accent:'#F28482',accentSoft:'#F7EDE2',accentText:'#8f4745',panel:'#22577A',panelBorder:'#173c54',panelText:'#ffffff',appBg:'#f7f1ee',pageBg:'#ffffff',pageShadow:'rgba(34,87,122,.18)'},
  vanilja:{name:'Vanilja',accent:'#E9C46A',accentSoft:'#F4F1DE',accentText:'#6f581c',panel:'#3D405B',panelBorder:'#2d3045',panelText:'#ffffff',appBg:'#f5f2e7',pageBg:'#ffffff',pageShadow:'rgba(61,64,91,.18)'}
};

const KEY_WHEEL_DATA = [
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

const METER_WHEEL_DATA = ['2/4','3/4','4/4','C','2/2','cutC','3/8','6/8','9/8','12/8'];
const METER_IMAGE_SOURCES = {
  '2/4':'assets/time-2-4.svg','3/4':'assets/time-3-4.svg','4/4':'assets/time-4-4.svg',C:'assets/Common_time.svg',
  '2/2':'assets/time-2-2.svg',cutC:'assets/Alla_breve.svg','3/8':'assets/time-3-8.svg','6/8':'assets/time-6-8.svg','9/8':'assets/time-9-8.svg','12/8':'assets/time-12-8.svg'
};
const PICKUP_PRESETS = {
  '2/4':[4,8,12],'3/4':[4,8,12,16],'4/4':[4,8,12,16,24],C:[4,8,12,16,24],
  '2/2':[8,12,16,24],cutC:[8,12,16,24],'3/8':[4,8],'6/8':[4,8,12],'9/8':[4,8,12,24],'12/8':[4,8,12,24]
};
const PICKUP_ICONS = {4:'assets/pickup-eighth.svg',8:'assets/pickup-quarter.svg',12:'assets/pickup-dotted-quarter.svg',16:'assets/pickup-half.svg',24:'assets/pickup-dotted-half.svg'};

function gcd(a,b){ while(b){ [a,b]=[b,a%b]; } return Math.abs(a)||1; }
function timeParts(value){ if(value==='C') return [4,4]; if(value==='cutC') return [2,2]; const [b,t]=String(value||'4/4').split('/').map(Number); return [b||4,t||4]; }
function capacity(value){ const [b,t]=timeParts(value); return b*32/t; }
function pickupFraction(units){ const d=gcd(units,32); return `${units/d}/${32/d}`; }

export class StartScreen {
  #audio;
  #onStart;
  #els;
  #themeStyle;

  constructor({ audio, onStart }) {
    this.#audio = audio;
    this.#onStart = onStart;
    this.#els = this.#collect();
    this.#themeStyle = document.createElement('style');
    this.#themeStyle.id = 'dynamicThemeStyle';
    document.head.appendChild(this.#themeStyle);
    this.#restorePreferences();
    this.#buildKeyWheel();
    this.#buildMeterWheel();
    this.#syncPickupOptions();
    this.#syncNotationChoices();
    this.#bind();
    this.#applyTheme(this.#currentThemeId());
    requestAnimationFrame(() => this.#els.titleInput.focus());
  }

  #collect() {
    const byId = id => document.getElementById(id);
    return {
      modal:byId('projectModal'), form:byId('projectForm'), startButton:byId('projectSaveButton'), status:byId('startStatus'),
      newProjectStartButton:byId('newProjectStartButton'), openProjectButton:byId('openProjectButton'),
      titleInput:byId('titleInput'), tempoInput:byId('tempoInput'), composerInput:byId('composerInput'), themeSelect:byId('themeSelect'),
      keySignatureSelect:byId('keySignatureSelect'), keyTrigger:byId('keyTrigger'), keyTriggerValue:byId('keyTriggerValue'), keyWheelPopover:byId('keyWheelPopover'), keyWheelSlots:byId('keyWheelSlots'), keyWheelClose:byId('keyWheelClose'),
      timeSignatureSelect:byId('timeSignatureSelect'), meterTrigger:byId('meterTrigger'), meterTriggerValue:byId('meterTriggerValue'), meterWheelPopover:byId('meterWheelPopover'), meterWheelSlots:byId('meterWheelSlots'), meterWheelClose:byId('meterWheelClose'),
      pickupSelect:byId('pickupSelect'), pickupChoices:byId('pickupChoices'), tuningSelect:byId('tuningSelect'), tuningChoices:byId('tuningChoices'), clefSelect:byId('clefSelect'), clefChoices:byId('clefChoices')
    };
  }

  #bind() {
    const e=this.#els;
    e.newProjectStartButton.addEventListener('click', ev => { ev.preventDefault(); e.titleInput.focus(); });
    e.keyTrigger.addEventListener('click', ev => this.#openKeyWheel(ev));
    e.keyWheelSlots.addEventListener('click', ev => this.#chooseKeyWheelSlot(ev));
    e.keyWheelClose.addEventListener('click', () => this.#closeKeyWheel());
    e.keyWheelPopover.addEventListener('click', ev => { if(ev.target===e.keyWheelPopover) this.#closeKeyWheel(); });
    e.meterTrigger.addEventListener('click', ev => this.#openMeterWheel(ev));
    e.meterWheelSlots.addEventListener('click', ev => this.#chooseMeterWheelSlot(ev));
    e.meterWheelClose.addEventListener('click', () => this.#closeMeterWheel());
    e.meterWheelPopover.addEventListener('click', ev => { if(ev.target===e.meterWheelPopover) this.#closeMeterWheel(); });
    e.pickupChoices.addEventListener('click', ev => this.#choosePickup(ev));
    e.tuningChoices.addEventListener('click', ev => this.#chooseNotation(ev));
    e.clefChoices.addEventListener('click', ev => this.#chooseNotation(ev));
    e.themeSelect.addEventListener('change', () => { this.#applyTheme(this.#currentThemeId()); this.#savePreferences(); });
    e.form.addEventListener('submit', ev => this.#submit(ev));
    document.addEventListener('keydown', ev => {
      if(ev.key!=='Escape') return;
      if(!e.meterWheelPopover.hidden){ ev.preventDefault(); this.#closeMeterWheel(); }
      else if(!e.keyWheelPopover.hidden){ ev.preventDefault(); this.#closeKeyWheel(); }
    });
  }

  #selectedKeyInfo(){ const o=this.#els.keySignatureSelect.selectedOptions[0]; return {fifths:+(o?.value||0),mode:o?.dataset.mode||'major',tonic:o?.dataset.tonic||'C',name:o?.textContent||'C-duuri'}; }
  #keyOptionFor(choice,mode){ return [...this.#els.keySignatureSelect.options].find(o=>+o.value===choice.fifths&&o.dataset.mode===mode&&o.dataset.tonic===choice.tonic); }
  #keyChoiceName(choice,mode){ return this.#keyOptionFor(choice,mode)?.textContent || `${choice.label}-${mode==='major'?'duuri':'molli'}`; }
  #syncKeyPicker(){
    const e=this.#els, info=this.#selectedKeyInfo(); e.keyTriggerValue.textContent=info.name;
    e.keyWheelSlots.querySelectorAll('.key-wheel-slot').forEach(button=>{ const variants=KEY_WHEEL_DATA[+button.dataset.slot]?.[button.dataset.mode]||[]; button.setAttribute('aria-pressed',String(variants.some(c=>c.fifths===info.fifths&&c.tonic===info.tonic))); });
  }
  #buildKeyWheel(){ const e=this.#els; e.keyWheelSlots.replaceChildren(); KEY_WHEEL_DATA.forEach((slot,index)=>{ const angle=(index*30-90)*Math.PI/180; [['major',39],['minor',25]].forEach(([mode,radius])=>{ const choice=slot[mode][0], b=document.createElement('button'); b.type='button'; b.className=`key-wheel-slot ${mode}`; b.dataset.slot=String(index); b.dataset.mode=mode; b.style.left=`${50+Math.cos(angle)*radius}%`; b.style.top=`${50+Math.sin(angle)*radius}%`; b.textContent=choice.label; b.setAttribute('aria-label',this.#keyChoiceName(choice,mode)); b.setAttribute('aria-pressed','false'); e.keyWheelSlots.appendChild(b); }); }); this.#syncKeyPicker(); }
  #openKeyWheel(ev){ ev?.preventDefault(); this.#syncKeyPicker(); this.#els.keyWheelPopover.hidden=false; this.#els.keyTrigger.setAttribute('aria-expanded','true'); }
  #closeKeyWheel(){ const e=this.#els; if(e.keyWheelPopover.hidden) return; e.keyWheelPopover.hidden=true; e.keyTrigger.setAttribute('aria-expanded','false'); e.keyTrigger.focus(); }
  #chooseKeyWheelSlot(ev){ const b=ev.target.closest('.key-wheel-slot'); if(!b) return; ev.preventDefault(); const choice=KEY_WHEEL_DATA[+b.dataset.slot]?.[b.dataset.mode]?.[0]; const o=choice&&this.#keyOptionFor(choice,b.dataset.mode); if(!o) return; this.#els.keySignatureSelect.selectedIndex=o.index; this.#syncKeyPicker(); this.#closeKeyWheel(); }

  #renderMeterLabel(element,value){ element.replaceChildren(); const img=document.createElement('img'); img.className=`meter-symbol-image ${value==='cutC'?'cut':(value==='C'?'common':'numeric')}`; img.src=METER_IMAGE_SOURCES[value]||METER_IMAGE_SOURCES['4/4']; img.alt=''; img.setAttribute('aria-hidden','true'); element.appendChild(img); }
  #meterAriaLabel(v){ return v==='C'?'C-tahtiosoitus, 4/4':v==='cutC'?'Cut C -tahtiosoitus, 2/2':`Tahtiosoitus ${v}`; }
  #syncMeterPicker(){ const e=this.#els,v=e.timeSignatureSelect.value||'4/4'; this.#renderMeterLabel(e.meterTriggerValue,v); e.meterWheelSlots.querySelectorAll('.meter-wheel-slot').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.meter===v))); }
  #buildMeterWheel(){ const e=this.#els; e.meterWheelSlots.replaceChildren(); METER_WHEEL_DATA.forEach((v,index)=>{ const angle=(index*(360/METER_WHEEL_DATA.length)-90)*Math.PI/180,b=document.createElement('button'); b.type='button'; b.className='meter-wheel-slot'; b.dataset.meter=v; this.#renderMeterLabel(b,v); b.setAttribute('aria-label',this.#meterAriaLabel(v)); b.setAttribute('aria-pressed','false'); b.style.left=`${50+Math.cos(angle)*37}%`; b.style.top=`${50+Math.sin(angle)*37}%`; e.meterWheelSlots.appendChild(b); }); this.#syncMeterPicker(); }
  #openMeterWheel(ev){ ev?.preventDefault(); this.#syncMeterPicker(); this.#els.meterWheelPopover.hidden=false; this.#els.meterTrigger.setAttribute('aria-expanded','true'); }
  #closeMeterWheel(){ const e=this.#els; if(e.meterWheelPopover.hidden) return; e.meterWheelPopover.hidden=true; e.meterTrigger.setAttribute('aria-expanded','false'); e.meterTrigger.focus(); }
  #chooseMeterWheelSlot(ev){ const b=ev.target.closest('.meter-wheel-slot'); if(!b) return; ev.preventDefault(); this.#els.timeSignatureSelect.value=b.dataset.meter; this.#syncMeterPicker(); this.#syncPickupOptions(); this.#closeMeterWheel(); }

  #syncPickupOptions(){ const e=this.#els,cap=capacity(e.timeSignatureSelect.value),prev=Number(e.pickupSelect.value)||0,values=(PICKUP_PRESETS[e.timeSignatureSelect.value]||[]).filter(u=>u>0&&u<cap); e.pickupSelect.value=String(values.includes(prev)?prev:0); e.pickupChoices.innerHTML=values.map(u=>`<button class="pickup-choice" type="button" data-units="${u}" aria-label="Kohotahti ${pickupFraction(u)}" aria-pressed="false"><img src="${PICKUP_ICONS[u]}" alt=""></button>`).join(''); this.#syncPickupButtons(); }
  #syncPickupButtons(){ const selected=Number(this.#els.pickupSelect.value)||0; this.#els.pickupChoices.querySelectorAll('.pickup-choice').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.units)===selected))); }
  #choosePickup(ev){ const b=ev.target.closest('.pickup-choice'); if(!b) return; const u=Number(b.dataset.units)||0,c=Number(this.#els.pickupSelect.value)||0; this.#els.pickupSelect.value=String(c===u?0:u); this.#syncPickupButtons(); }

  #syncNotationChoices(){ const e=this.#els; e.tuningChoices.querySelectorAll('[data-tuning]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tuning===e.tuningSelect.value))); e.clefChoices.querySelectorAll('[data-clef]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.clef===e.clefSelect.value))); }
  #chooseNotation(ev){ const t=ev.target.closest('[data-tuning]'),c=ev.target.closest('[data-clef]'); if(!t&&!c) return; ev.preventDefault(); if(t)this.#els.tuningSelect.value=t.dataset.tuning; if(c)this.#els.clefSelect.value=c.dataset.clef; this.#syncNotationChoices(); }

  #currentThemeId(){ return THEME_DEFINITIONS[this.#els.themeSelect.value]?this.#els.themeSelect.value:'kupari'; }
  #applyTheme(id){ const t=THEME_DEFINITIONS[id]||THEME_DEFINITIONS.kupari; this.#themeStyle.textContent=`
    body,.app{background:${t.appBg};}
    .project-start-action[aria-pressed="true"],.notation-choice[aria-pressed="true"],.pickup-choice[aria-pressed="true"],.key-wheel-slot[aria-pressed="true"],.meter-wheel-slot[aria-pressed="true"]{border-color:${t.accent};background:${t.accentSoft};color:${t.accentText};box-shadow:inset 0 0 0 1px ${t.accent}55;}
    .start-button,.keyboard-scroll-thumb{background:${t.panel};color:${t.panelText};}
    .key-trigger-icon,.meter-trigger-icon,.key-trigger-icon::before,.key-trigger-icon::after{border-color:${t.panel};}.key-trigger-icon::after,.meter-trigger-icon::before{background:${t.panel};}
    #osmdContainer>div[id^="osmdCanvasPage"]{background:${t.pageBg};box-shadow:0 4px 16px ${t.pageShadow};}
    .project-card{box-shadow:0 24px 70px ${t.pageShadow};}
    .field select:focus-visible,.field input:focus-visible,.key-trigger:focus-visible,.meter-trigger:focus-visible,.project-start-action:focus-visible,.start-button:focus-visible{outline:3px solid ${t.accent}66;outline-offset:2px;}`; }
  #restorePreferences(){ try{ const theme=localStorage.getItem(THEME_KEY); if(theme&&THEME_DEFINITIONS[theme])this.#els.themeSelect.value=theme; const clef=localStorage.getItem(CLEF_KEY); if(clef&&Object.hasOwn(CLEF_KEYBOARD_STARTS,clef))this.#els.clefSelect.value=clef; }catch{} }
  #savePreferences(){ try{ localStorage.setItem(THEME_KEY,this.#currentThemeId()); localStorage.setItem(CLEF_KEY,this.#els.clefSelect.value); }catch{} }

  #settings(){ const e=this.#els,key=this.#selectedKeyInfo(); return { title:e.titleInput.value.trim(), composer:e.composerInput.value.trim(), tempoText:e.tempoInput.value.trim(), themeId:this.#currentThemeId(), keySignature:key.fifths, keyMode:key.mode, keyTonic:key.tonic, keySignatureName:key.name, timeSignature:e.timeSignatureSelect.value, pickupDuration:Number(e.pickupSelect.value)||0, tuning:e.tuningSelect.value, transpose:TUNING_TRANSPOSES[e.tuningSelect.value]||0, clef:e.clefSelect.value||'treble', keyboardStartMidi:CLEF_KEYBOARD_STARTS[e.clefSelect.value]??60 }; }

  async #submit(ev){
    ev.preventDefault();
    const e=this.#els;
    e.startButton.disabled=true; e.status.textContent='Avataan ääni…';
    const ok=await this.#audio.unlock();
    if(!ok){ e.startButton.disabled=false; e.status.textContent='Äänen avaaminen epäonnistui. Napauta ALOITA uudelleen.'; return; }
    const settings=this.#settings(); this.#savePreferences(); this.#applyTheme(settings.themeId);
    try { await this.#onStart?.(settings); }
    catch(err){ console.error(err); e.startButton.disabled=false; e.status.textContent='Aloitus epäonnistui.'; return; }
    e.modal.hidden=true; const app=document.getElementById('app'); app.inert=false; app.removeAttribute('aria-hidden'); e.status.textContent='';
  }
}
