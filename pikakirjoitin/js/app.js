import { AudioEngine } from './audio-engine.js';
import { ScoreModel } from './score-model.js';
import { ScoreRenderer } from './score-renderer.js';
import { PianoKeyboard } from './keyboard.js';
import { StartScreen } from './start-screen.js';
import { ScoreRangeSelection } from './score-range-selection.js';
import { ThumbRail } from './thumb-rail.js';
import { SelectionEditor } from './selection-editor.js';
import { spellMidi } from './pitch-spelling.js';

const app=document.querySelector('#app');
app.inert=true;
app.setAttribute('aria-hidden','true');

const model=new ScoreModel();
const renderer=new ScoreRenderer(document.querySelector('#osmdContainer'));
const audio=new AudioEngine();
const selection=new ScoreRangeSelection({
  viewport:document.querySelector('#scoreViewport'),
  container:document.querySelector('#osmdContainer')
});
renderer.subscribeRendered(snapshot=>selection.refresh(snapshot));
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

selection.subscribe(state => {
  const note = state.count === 1 ? model.getEntry(state.selectedIds[0]) : null;
  const isSingleNote = Boolean(note?.kind === 'note' && state.anchor);
  selectionEditor.update({
    visible: isSingleNote,
    x: state.anchor?.x || 0,
    staffTop: state.anchor?.staffTop || 0,
    staffBottom: state.anchor?.staffBottom || 0,
    canEnharmonic: isSingleNote && Boolean(enharmonicPreferenceFor(note.id))
  });
});

const thumbRail=new ThumbRail({
  rail:document.querySelector('#thumbRail'),
  boundsElement:document.querySelector('#scoreViewport'),
  onChange:state=>{ thumbState=state; }
});

let keyboardEditId = null;

const keyboard=new PianoKeyboard({
  piano:document.querySelector('#piano'),whiteKeys:document.querySelector('#whiteKeys'),viewport:document.querySelector('#keyboardViewport'),
  rail:document.querySelector('#keyboardScrollRail'),track:document.querySelector('#keyboardScrollTrack'),thumb:document.querySelector('#keyboardScrollThumb'),
  onStart:(midi,duration)=>{
    const selected = selectedSingleNote();
    if (selected) {
      model.beginAction();
      keyboardEditId = selected.id;
      // Valitun nuotin editointi: kosketin määrää sävelkorkeuden ja
      // sama elekartta kuin kirjoituksessa määrää aika-arvon.
      // Uusi korkeus palautuu sävellajin normaaliin kirjoitusasuun.
      model.updateEntry(selected.id, {
        midi:Number(midi),
        duration,
        spellingPreference:null
      });
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
    if (keyboardEditId) model.updateEntry(keyboardEditId,{duration});
    else model.setDuration(id,duration);
  },
  onSoundStart:midi=>audio.noteOn(midi+(settings.transpose||0)),
  onSoundStop:()=>audio.noteOff(),
  onFinish:()=>{
    model.endAction();
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
