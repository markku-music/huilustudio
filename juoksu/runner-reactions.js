/* Player feedback, independent of pitch acceptance and the race clock. */
(() => {
  'use strict';
  const FALL_MS = 500, CAUGHT_MS = 500, RETURN_MS = 300;
  class RunnerReactions {
    constructor() { this.reset(170); }
    reset(path) {
      this.pose = 'normal'; this.since = 0; this.wrongs = 0;
      this.lastWrong = null; this.recovered = false;
      this.path = path; this.offset = 0; this.returnAt = null;
      this.wasBlocked = false;
    }
    newAttack() { this.lastWrong = null; }
    wrong(pitch, now) {
      if (pitch === this.lastWrong) return false;
      this.lastWrong = pitch; this.wrongs++;
      this.recovered = false;
      // Finish the first tumble before turning to the player.
      if (this.pose !== 'fall') {
        this.pose = this.wrongs === 1 ? 'fall' : 'shrug';
        this.since = now;
      }
      return true;
    }
    correct(now) {
      this.wrongs = 0; this.lastWrong = null; this.recovered = true;
      if (this.pose === 'shrug' || this.pose === 'waiting') {
        this.pose = 'normal'; this.since = now;
      }
    }
    caught(now) {
      if (this.pose !== 'normal') return false;
      this.pose = 'caught'; this.since = now;
      return true;
    }
    step(rawPath, now) {
      if (this.pose === 'caught' && now - this.since >= CAUGHT_MS) this.pose = 'normal';
      if (this.pose === 'fall' && now - this.since >= FALL_MS) {
        this.pose = this.recovered ? 'normal' : this.wrongs > 1 ? 'shrug' : 'waiting';
        this.since = now;
      }
      if (this.pose !== 'normal') {
        this.offset = rawPath - this.path;
        this.wasBlocked = true; this.returnAt = null;
      } else {
        if (this.wasBlocked) {
          this.offset = rawPath - this.path;
          this.returnAt = now; this.wasBlocked = false;
        }
        const u = this.returnAt === null ? 1 : Math.min(1, Math.max(0, (now - this.returnAt) / RETURN_MS));
        this.path = rawPath - this.offset * (1 - u * u * (3 - 2 * u));
        if (u === 1) { this.offset = 0; this.returnAt = null; }
      }
      return this.path;
    }
    frame(now) {
      const age = Math.max(0, now - this.since);
      if (this.pose === 'fall') return age < 100 ? 0 : age < 250 ? 1 : age < 390 ? 2 : 3;
      if (this.pose === 'shrug') return age < 90 ? 4 : age < 180 ? 5 : age < 320 ? 6 : 7;
      return null;
    }
  }
  window.RunnerReactions = RunnerReactions;
  window.runnerReactions = new RunnerReactions();
})();
