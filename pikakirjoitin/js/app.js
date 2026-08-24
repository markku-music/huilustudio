import { AudioEngine } from './audio-engine.js';
import { ScoreModel } from './score-model.js';
import { ScoreRenderer } from './score-renderer.js';
import { PianoKeyboard } from './keyboard.js';
import { StartScreen } from './start-screen.js';
import { ScoreRangeSelection } from './score-range-selection.js';
import { ThumbRail } from './thumb-rail.js';
import { SelectionEditor } from './selection-editor.js';
import { SystemSpacingRail } from './system-spacing-rail.js';
import { spellMidi, isDiatonicKeySpelling } from './pitch-spelling.js';

const app=document.querySelector('#app');
app.inert=true;
app.setAttribute('aria-hidden','true');

const model=new ScoreModel();
const renderer=new ScoreRenderer(document.querySelector('#osmdContainer'));

// Väliaikaiset OSMD:n Y-säätimet yläosan asettelun hakemiseen.
// Arvot eivät tallennu muistiin; tarkoitus on löytää hyvät vakioarvot.
new SystemSpacingRail({
  rail: document.querySelector('#tempoYRail'),
  track: document.querySelector('#tempoYTrack'),
  thumb: document.querySelector('#tempoYThumb'),
  bubble: document.querySelector('#tempoYBubble'),
  min: 0,
  max: 8,
  step: 0.5,
  value: 0.5,
  onChange: (value, { initial }) => renderer.setTempoYSpacing(value, { render: !initial })
});

new SystemSpacingRail({
  rail: document.querySelector('#composerYRail'),
  track: document.querySelector('#composerYTrack'),
  thumb: document.querySelector('#composerYThumb'),
  bubble: document.querySelector('#composerYBubble'),
  min: 0,
  max: 8,
  step: 0.5,
  value: 2,
  onChange: (value, { initial }) => renderer.setSystemComposerDistance(value, { render: !initial })
});

new SystemSpacingRail({
  rail: document.querySelector('#systemSpacingRail'),
  track: document.querySelector('#systemSpacingTrack'),
  thumb: document.querySelector('#systemSpacingThumb'),
  bubble: document.querySelector('#systemSpacingBubble'),
  min: 5,
  max: 15,
  step: 0.5,
  value: 9,
  onChange: (value, { initial }) => renderer.setMinimumSystemDistance(value, { render: !initial })
});
const audio=new AudioEngine();
const selection=new ScoreRangeSelection({
  viewport:document.querySelector('#scoreViewport'),
  container:document.querySelector('#osmdContainer')
});
let keyboardEditId = null;
renderer.subscribeRendered(snapshot=>{
  selection.refresh(snapshot);
  // Kosketineditoinnin aikana OSMD rakentaa SVG:n kokonaan uudelleen.
  // Palauta sama looginen nuotti valituksi jokaisen renderöinnin jälkeen.
  if (keyboardEditId && model.getEntry(keyboardEditId)?.kind === 'note') {
    selection.retainSingle(keyboardEditId);
  }
});
let settings={transpose:0,keyboardStartMidi:60};
let thumbState={dot:false,rest:false,tie:false};

model.subscribe(notes=>renderer.render(notes));

function selectedSingleNote() {
  const ids = selection.selectedIds;
  if (ids.length !== 1) return null;
  const entry = model.getEntry(ids[0]);
  return entry?.kind === 'note' ? entry : null;
}

function enharmonicPreferenceFor(id) {
  const notes = model.notes;
  const index = notes.findIndex(entry => entry.id === id);
  if (index < 0 || notes[index]?.kind !== 'note') return null;
  const written = spellMidi(notes[index].midi, { index, notes, settings });

  // Älä tarjoa enharmonista vaihtoa sävellajin omalle normaalille
  // diatoniselle kirjoitusasulle. Es-duurissa Es on jo oikea asu,
  // D-duurissa Fis on jo oikea asu jne. Jos sama soiva sävel on
  // kirjoitettu poikkeavasti (esim. Dis Es-duurissa), nappi saa näkyä.
  if (isDiatonicKeySpelling(written, settings)) return null;

  if (written.alter > 0) return 'flat';
  if (written.alter < 0) return 'sharp';
  return null;
}

const selectionEditor = new SelectionEditor({
  onEnharmonic: () => {
    const note = selectedSingleNote();
    if (!note) return;
    const preference = enharmonicPreferenceFor(note.id);
    if (preference) model.updateEntry(note.id, { spellingPreference: preference });
  },
  onDelete: () => {
    const note = selectedSingleNote();
    if (!note) return;
    if (model.deleteEntry(note.id)) selection.clear();
  }
});

let lastSelectionEditorAnchor = null;

selection.subscribe(state => {
  const note = state.count === 1 ? model.getEntry(state.selectedIds[0]) : null;
  const isSingleNote = Boolean(note?.kind === 'note');

  // OSMD rakentaa SVG:n uudelleen aina, kun valittua nuottia muutetaan.
  // Looginen valinta (sourceId) säilyy, mutta uuden SVG:n ankkuri voi olla
  // yhden renderöintikierroksen ajan tyhjä. Älä piilota työkalupalkkia siksi.
  if (state.anchor) lastSelectionEditorAnchor = { ...state.anchor };

  if (!isSingleNote) {
    lastSelectionEditorAnchor = null;
    selectionEditor.update({ visible:false });
    return;
  }

  const anchor = state.anchor || lastSelectionEditorAnchor;
  if (!anchor) {
    // Tätä voi tapahtua vain ennen ensimmäistä onnistunutta graafista osumaa.
    // Säilytä editorin nykyinen tila sen sijaan, että väläytetään se pois.
    return;
  }

  selectionEditor.update({
    visible: true,
    x: anchor.x,
    staffTop: anchor.staffTop,
    staffBottom: anchor.staffBottom,
    canEnharmonic: Boolean(enharmonicPreferenceFor(note.id))
  });
});

const thumbRail=new ThumbRail({
  rail:document.querySelector('#thumbRail'),
  boundsElement:document.querySelector('#scoreViewport'),
  onChange:state=>{ thumbState=state; }
});

const keyboard=new PianoKeyboard({
  piano:document.querySelector('#piano'),whiteKeys:document.querySelector('#whiteKeys'),viewport:document.querySelector('#keyboardViewport'),
  rail:document.querySelector('#keyboardScrollRail'),track:document.querySelector('#keyboardScrollTrack'),thumb:document.querySelector('#keyboardScrollThumb'),
  onStart:(midi,duration)=>{
    const selected = selectedSingleNote();
    if (selected) {
      model.beginAction();
      keyboardEditId = selected.id;

      // Valitun nuotin editointi käyttää täsmälleen samoja rytmisiä
      // peukalopalkin modifikaattoreita kuin uuden tapahtuman kirjoitus.
      // Kosketin määrää korkeuden, ele aika-arvon, piste lisää pisteen ja
      // Tauko muuttaa valitun nuotin saman aika-arvon tauoksi.
      if (thumbState.rest) {
        model.updateEntry(selected.id, {
          kind:'rest',
          duration,
          dotted:Boolean(thumbState.dot),
          measureRest:duration === 'whole' && !Boolean(thumbState.dot),
          tieFromPrevious:false,
          spellingPreference:null
        });
        selection.retainSingle(selected.id);
        return { id:selected.id, sound:false };
      }

      // Uusi korkeus palautuu sävellajin normaaliin kirjoitusasuun.
      model.updateEntry(selected.id, {
        midi:Number(midi),
        duration,
        dotted:Boolean(thumbState.dot),
        spellingPreference:null
      });
      selection.retainSingle(selected.id);
      return { id:selected.id, sound:true };
    }

    model.beginAction();
    const tieWasArmed=Boolean(thumbState.tie);
    // Vanhan Pikakirjoittimen logiikka: sidekaari on kertakäyttöinen.
    // Se kulutetaan heti seuraavaan syötettyyn tapahtumaan.
    if(tieWasArmed) thumbRail.setToggle('tie',false);
    if(thumbState.rest){
      return { id:model.addRest({duration,dotted:thumbState.dot}), sound:false };
    }
    const previous=model.notes.at(-1);
    const tieFromPrevious=Boolean(tieWasArmed && previous?.kind==='note' && Number(previous.midi)===Number(midi));
    return { id:model.addNote({midi,duration,dotted:thumbState.dot,tieFromPrevious}), sound:true };
  },
  onDuration:(id,duration)=>{
    if (keyboardEditId) {
      model.updateEntry(keyboardEditId,{duration});
      selection.retainSingle(keyboardEditId);
    } else model.setDuration(id,duration);
  },
  onSoundStart:midi=>audio.noteOn(midi+(settings.transpose||0)),
  onSoundStop:()=>audio.noteOff(),
  onFinish:()=>{
    model.endAction();
    // Koskettimella tehty editointi on valmis. Tämän jälkeen valinta
    // puretaan tarkoituksella, jotta koskettimisto palaa heti normaaliin
    // uuden nuotin kirjoitustilaan.
    if (keyboardEditId) selection.clear();
    keyboardEditId=null;
  }
});


const undoButton=document.querySelector('#undoButton');
const redoButton=document.querySelector('#redoButton');

model.subscribeHistory(({canUndo,canRedo})=>{
  undoButton.disabled=!canUndo;
  redoButton.disabled=!canRedo;
});

undoButton.addEventListener('click',()=>{
  if(model.undo()) selection.clear();
});
redoButton.addEventListener('click',()=>{
  if(model.redo()) selection.clear();
});

new StartScreen({
  audio,
  onStart:async nextSettings=>{
    settings={...nextSettings};
    renderer.setSettings(settings);
    await renderer.render(model.notes);
    requestAnimationFrame(()=>keyboard.scrollToMidi(settings.keyboardStartMidi));
  }
});

// Nuottialueen pystyscrollaus on edelleen täysin natiivi.
// Paperilla: kosketus tapahtumaan valitsee heti, vaakaveto laajentaa valintaa,
// pystysuuntainen veto jää selaimen natiiviksi scrollaukseksi.
