const SILENT_GAIN = 0.0001;
const NOTE_GAIN = 0.16;
const ATTACK_SECONDS = 0.012;
const RELEASE_SECONDS = 0.06;

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Yksi pysyvä Web Audio -ääni.
 *
 * iPad/iOS-periaate:
 * - AudioContext luodaan vasta oikeassa käyttäjäeleessä.
 * - oscillator.start() tehdään samassa ensimmäisessä käyttäjäeleessä.
 * - context.resume() kutsutaan samassa ensimmäisessä käyttäjäeleessä.
 * - oskillaattoria ei luoda nuotti kerrallaan uudelleen.
 */
export class AudioEngine {
  #context = null;
  #oscillator = null;
  #gain = null;
  #started = false;
  #active = false;
  #activeMidi = null;

  noteOn(midi) {
    if (!Number.isFinite(midi)) return false;
    if (!this.#ensureGraph()) return false;

    // Tärkeää iOS:lle: nämä tapahtuvat suoraan pointerdown-kutsuketjussa,
    // eivät awaitin tai .then()-ketjun jälkeen.
    if (!this.#started) {
      try {
        this.#oscillator.start();
        this.#started = true;
      } catch {
        return false;
      }
    }

    if (this.#context.state !== 'running') {
      try {
        const resumeResult = this.#context.resume();
        if (resumeResult?.catch) resumeResult.catch(() => {});
      } catch {}
    }

    this.#active = true;
    this.#activeMidi = midi;
    this.#attack(midi);
    return true;
  }

  noteOff() {
    if (!this.#context || !this.#gain || !this.#active) return;
    const now = this.#context.currentTime;

    try {
      this.#gain.gain.cancelScheduledValues(now);
      this.#gain.gain.setValueAtTime(NOTE_GAIN, now);
      this.#gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, now + RELEASE_SECONDS);
    } catch {}

    this.#active = false;
    this.#activeMidi = null;
  }

  get state() {
    return this.#context?.state ?? 'uninitialized';
  }

  #ensureGraph() {
    if (this.#context && this.#context.state !== 'closed' && this.#oscillator && this.#gain) {
      return true;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    try {
      try {
        this.#context = new AudioContextClass({ latencyHint: 'interactive' });
      } catch {
        this.#context = new AudioContextClass();
      }

      this.#oscillator = this.#context.createOscillator();
      this.#gain = this.#context.createGain();
      this.#oscillator.type = 'triangle';
      this.#gain.gain.value = SILENT_GAIN;
      this.#oscillator.connect(this.#gain).connect(this.#context.destination);
      this.#started = false;
      return true;
    } catch {
      this.#context = null;
      this.#oscillator = null;
      this.#gain = null;
      this.#started = false;
      return false;
    }
  }

  #attack(midi) {
    const context = this.#context;
    if (!context || !this.#oscillator || !this.#gain) return;

    const now = context.currentTime;
    try {
      this.#oscillator.frequency.setValueAtTime(midiToFrequency(midi), now);
      this.#gain.gain.cancelScheduledValues(now);
      this.#gain.gain.setValueAtTime(SILENT_GAIN, now);
      this.#gain.gain.linearRampToValueAtTime(NOTE_GAIN, now + ATTACK_SECONDS);
    } catch {}
  }
}
