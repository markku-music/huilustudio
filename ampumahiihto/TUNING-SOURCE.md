Version 10 uses the continuous pitch-meter estimator from the user's
ResonatorEngine_1.0.11_PWA_JATKUVA_MIKROFONI.zip. The requested earlier 1.0.5
archive was not found. The retrieved 1.0.11 README and source contain the
continuous chromatic, 12-semitone tuning line discussed with the user.

Ported from resonator-engine.js: _periodMatch and _estimateContinuousPitch.
The estimator uses a 16 ms comparison window, a +/-140-cent search around a
Resonator target, a minimum period match of 0.55 and parabolic refinement.
game.js samples it every 22 ms, matching the scale game's interval.

For target shooting, the frequency is measured relative to the target locked
at the beginning of the breath. The existing aiming smoother, octave guard,
onset timing and release-triggered shot are retained. No scale-game UI or
note-acceptance thresholds were copied into the game.

Validation: tests/tuning.cjs checks harmonic signals with quiet interference
through the full selectable note range, 44.1/48/96 kHz, +/-125 cents and a
continuous bend. tests/aim.cjs checks the actual Resonator analysis path and
one-shot release behavior. These are synthetic checks, not a live flute or
browser microphone test.
