const SILENT_GAIN = 0.0001;
const NOTE_GAIN = 0.16;
const ATTACK_SECONDS = 0.012;
const RELEASE_SECONDS = 0.06;

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Yksi pysyvä Web Audio -ääni iPadia varten.
 *
 * Ensimmäinen nuotti:
 * 1) AudioContext + audioketju luodaan suoraan pointerdown-kutsuketjussa.
 * 2) oscillator.start() tehdään samassa käyttäjäeleessä.
 * 3) context.resume() kutsutaan samassa käyttäjäeleessä.
 * 4) Ensimmäinen attack tehdään vasta kun resume() on oikeasti valmistunut.
 *
 * Seuraavat nuotit soivat heti, kun context on jo running.
 */
export class AudioEngine {
  #context = null;
  #oscillator = null;
  #gain = null;
  #started = false;
  #pressed = false;
  #requestedMidi = null;
  #requestSerial = 0;

  noteOn(midi) {
    if (!Number.isFinite(midi)) return false;
    if (!this.#ensureGraph()) return false;

    this.#pressed = true;
    this.#requestedMidi = midi;
    const serial = ++this.#requestSerial;

    // Nämä on tehtävä suoraan käyttäjän pointerdown-kutsuketjussa iOS:ää varten.
    if (!this.#started) {
      try {
        this.#oscillator.start();
        this.#started = true;
      } catch {
        return false;
      }
    }

    if (this.#context.state === 'running') {
      this.#attack(midi);
      return true;
    }

    try {
      const resumeResult = this.#context.resume();

      // Ensimmäisen nuotin varsinainen attack vasta, kun Safari kertoo
      // AudioContextin olevan käynnissä. Sarjanumero estää vanhan kosketuksen
      // soimisen myöhemmin, jos sormi on jo nostettu tai uusi nuotti painettu.
      if (resumeResult?.then) {
        resumeResult
          .then(() => {
            if (
              this.#context?.state === 'running' &&
              this.#pressed &&
              this.#requestSerial === serial &&
              this.#requestedMidi === midi
            ) {
              this.#attack(midi);
            }
          })
          .catch(() => {});
      } else if (this.#context.state === 'running') {
        this.#attack(midi);
      }
    } catch {}

    return true;
  }

  noteOff() {
    this.#pressed = false;
    this.#requestedMidi = null;
    ++this.#requestSerial;

    if (!this.#context || !this.#gain) return;
    const now = this.#context.currentTime;

    try {
      this.#gain.gain.cancelScheduledValues(now);
      const current = Math.max(this.#gain.gain.value || SILENT_GAIN, SILENT_GAIN);
      this.#gain.gain.setValueAtTime(current, now);
      this.#gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, now + RELEASE_SECONDS);
    } catch {}
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
    if (!context || !this.#oscillator || !this.#gain || context.state !== 'running') return;

    const now = context.currentTime;
    try {
      this.#oscillator.frequency.cancelScheduledValues(now);
      this.#oscillator.frequency.setValueAtTime(midiToFrequency(midi), now);
      this.#gain.gain.cancelScheduledValues(now);
      this.#gain.gain.setValueAtTime(SILENT_GAIN, now);
      this.#gain.gain.linearRampToValueAtTime(NOTE_GAIN, now + ATTACK_SECONDS);
    } catch {}
  }
}
