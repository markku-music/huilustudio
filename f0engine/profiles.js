/* PROFILE FAST 1 - esimerkkiprofiilit. */
(function (global) {
  'use strict';

  global.F0_PROFILES = Object.freeze({
    fluteBeginner5: Object.freeze({
      name: 'Huilu · g¹ a¹ h¹ c² d²',
      minHz: 350,
      maxHz: 650,
      allowedMidi: Object.freeze([67, 69, 71, 72, 74]),
      fastAccept: Object.freeze({
        enabled: true,
        frames: 2,
        toleranceCents: 30
      })
    })
  });
})(window);
