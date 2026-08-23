import { AudioEngine } from './audio-engine.js';
import { ScoreModel } from './score-model.js';
import { ScoreRenderer } from './score-renderer.js';
import { PianoKeyboard } from './keyboard.js';

const app = document.querySelector('#app');
const startScreen = document.querySelector('#startScreen');
const startButton = document.querySelector('#startButton');
const startStatus = document.querySelector('#startStatus');

const model = new ScoreModel();
const renderer = new ScoreRenderer(document.querySelector('#osmdContainer'));
const audio = new AudioEngine();

model.subscribe(notes => renderer.render(notes));
renderer.render(model.notes);

const keyboard = new PianoKeyboard({
  piano: document.querySelector('#piano'),
  whiteKeys: document.querySelector('#whiteKeys'),
  viewport: document.querySelector('#keyboardViewport'),
  rail: document.querySelector('#keyboardScrollRail'),
  track: document.querySelector('#keyboardScrollTrack'),
  thumb: document.querySelector('#keyboardScrollThumb'),
  onStart: (midi, duration) => model.addNote({ midi, duration }),
  onDuration: (id, duration) => model.setDuration(id, duration),
  onSoundStart: midi => audio.noteOn(midi),
  onSoundStop: () => audio.noteOff()
});

async function startApplication() {
  if (startButton.disabled) return;
  startButton.disabled = true;
  startButton.textContent = 'AVATAAN…';
  startStatus.textContent = '';

  const unlocked = await audio.unlock();
  if (!unlocked) {
    startButton.disabled = false;
    startButton.textContent = 'YRITÄ UUDELLEEN';
    startStatus.textContent = 'Ääntä ei saatu vielä avattua.';
    return;
  }

  app.inert = false;
  app.removeAttribute('aria-hidden');
  startScreen.classList.add('is-hidden');
  keyboard.centerOnMiddleC();
}

startButton.addEventListener('click', startApplication);

// Tarkoituksella ei yhtään pointer-, touch- tai scroll-listeneria nuottialueelle.
