(() => {
  'use strict';
  // Constant travel speed followed by three seconds of continuous deceleration.
  // Exact integration keeps the stop consistent at 30, 60 and 120 Hz.
  window.advanceJourney = function(position, destination, speed, seconds) {
    let remaining = destination - position;
    if (remaining <= 0) return destination;
    if (seconds <= 0 || speed <= 0) return position;
    const brakingDistance = speed * 1.5;
    if (remaining > brakingDistance) {
      const cruisingTime = Math.min(seconds, (remaining - brakingDistance) / speed);
      remaining -= cruisingTime * speed;
      seconds -= cruisingTime;
    }
    if (seconds > 0) {
      const root = Math.max(0, Math.sqrt(remaining) - speed * seconds / (2 * Math.sqrt(brakingDistance)));
      remaining = root * root;
    }
    return destination - remaining;
  };
})();
