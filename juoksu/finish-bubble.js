/* The time is captured on the last accepted note. Reveal is separate and
 * waits for the player's rendered path to reach the finish, including pauses. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const group = el('finishBubble');
  let pending = null, shown = false, finishX = 0, finishY = 358;
  function position() {
    if (!shown) return;
    const layout = window.raceLayout;
    const scale = layout?.bubbleScale || 1;
    const margin = 110*scale;
    let center = Math.max(margin, Math.min(1100-margin, finishX));
    if (layout?.tight) {
      // Browser toolbars can leave very little height in phone landscape.
      // Put the bubble beside the finisher so it cannot cover the score.
      const side = finishX > 550 ? -1 : 1;
      center = finishX + side*(layout.runnerHeight*84/78/2+layout.bubbleGap+82*scale);
      center = Math.max(margin,Math.min(1100-margin,center));
      group.setAttribute('transform', `translate(${center} ${layout.playerY-layout.runnerHeight}) scale(${scale})`);
      const edge = -side;
      el('bubbleTail').setAttribute('d', `M${81*edge} 23L${94*edge} 32L${81*edge} 41`);
      return;
    }
    const top = layout ? layout.playerY-layout.runnerHeight-layout.bubbleGap-76*scale : finishY-162;
    const tail = (finishX-center)/scale;
    group.setAttribute('transform', `translate(${center} ${top}) scale(${scale})`);
    el('bubbleTail').setAttribute('d', `M${tail-8} 63L${tail} 76L${tail+8} 63`);
  }
  window.finishBubble = {
    relayout: position,
    reset() {
      pending = null;
      shown = false;
      group.style.display = 'none';
      group.classList.remove('shown','record');
      el('finishAnnouncement').textContent = '';
    },
    prepare(time, isBest) {
      pending = {time, isBest};
    },
    update(x, y, arrived) {
      if (!pending || shown || !arrived) return;
      shown = true;
      // Sibling of the runner: never inherit the left-facing mirror transform.
      // Keep the box and sparkles inside the viewport at either finish.
      finishX = x;
      finishY = y;
      position();
      el('bubbleTime').textContent = pending.time;
      el('bubbleTime').setAttribute('y', pending.isBest ? 49 : 42);
      // Fit rare long times without changing the usual two-decimal typography.
      el('bubbleTime').setAttribute('font-size', pending.time.length>9 ? 21 : 27);
      el('bubbleTitle').style.display = pending.isBest ? '' : 'none';
      group.classList.toggle('record', pending.isBest);
      group.style.display = '';
      group.classList.add('shown');
      el('finishAnnouncement').textContent = (pending.isBest ? 'Uusi paras! ' : 'Loppuaika: ')+pending.time;
    }
  };
  window.finishBubble.reset();
})();
