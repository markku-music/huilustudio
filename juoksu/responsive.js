/* Presentation coordinates only. The race keeps its original 1100-unit
 * horizontal path, audio, timing and records at every viewport size. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const arena = el('arenaSvg');
  const host = arena.parentElement;
  const clamp = (lo, value, hi) => Math.max(lo, Math.min(hi, value));
  let scheduled = false;

  function layout() {
    scheduled = false;
    const {width, height} = host.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    const unit = width / 1100;
    const sceneTop = 147 * unit;
    const sceneHeight = Math.max(1, height - sceneTop);
    // Use physical pixels for minimum readable sizes; convert only at the
    // SVG boundary. Scale sprites uniformly, never stretch their artwork.
    const runnerHeight = Math.min(clamp(48, 78 * unit, 96), Math.max(32, (sceneHeight-24)/2));
    const bubbleScale = clamp(.70, unit, 1.15);
    const gap = 8;
    const roomAboveRunner = runnerHeight + gap + 76 * bubbleScale + 4;
    const tight = sceneHeight < roomAboveRunner + runnerHeight + 22;
    let playerY = tight ? sceneTop+runnerHeight+6 : Math.max(sceneTop + sceneHeight * .524, sceneTop + roomAboveRunner);
    let ghostY = Math.max(sceneTop + sceneHeight * .841, playerY + runnerHeight + 12);
    // Extremely short windows remain viewable; usual phone/tablet landscape
    // sizes have space for both rows and the finish bubble without this clamp.
    if (ghostY > height - 10) {
      ghostY = height - 10;
      playerY = ghostY - runnerHeight - 12;
    }
    const svgHeight = height / unit;
    arena.setAttribute('viewBox', `0 0 1100 ${svgHeight}`);
    for (const id of ['parkFill', 'parkImage']) {
      el(id).setAttribute('height', Math.max(1, svgHeight - 147));
    }
    for (const [id, oldY, newY] of [['player',358,playerY],['ghost',486,ghostY]]) {
      el(id+'Layout').setAttribute('transform', `translate(0 ${newY/unit-oldY})`);
      const sprite = el(id+'Sprite');
      const h = runnerHeight/unit, w = h*84/78;
      for (const [name,value] of Object.entries({x:-w/2,y:-h,width:w,height:h})) sprite.setAttribute(name,value);
      if(id==='player'){
        const reaction=el('playerReactionSprite');
        for(const [name,value]of Object.entries({x:-256/389*h,y:-420/389*h,width:512/389*h,height:432/389*h}))reaction.setAttribute(name,value);
      }
    }
    Array.from(el('points').children).forEach((point,i) => {
      point.setAttribute('cy', ((i%2 ? ghostY : playerY)+5)/unit);
      point.setAttribute('r', clamp(2.5,5*unit,5)/unit);
    });
    for (const label of el('noteLabels').children) label.setAttribute('font-size',clamp(12,16*unit,18)/unit);
    const stripe = el('finishStripe');
    const stripeWidth = clamp(14,32*unit,32)/unit;
    for (const [name,value] of Object.entries({x:-stripeWidth/2,y:(playerY-18)/unit,width:stripeWidth,height:(ghostY-playerY+36)/unit})) stripe.setAttribute(name,value);
    window.raceLayout = {playerY:playerY/unit, runnerHeight:runnerHeight/unit,
      bubbleScale:bubbleScale/unit, bubbleGap:gap/unit, tight};
    window.finishBubble?.relayout();
  }

  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(layout); }
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(schedule).observe(host);
  window.addEventListener('resize',schedule);
  window.visualViewport?.addEventListener('resize',schedule);
  layout();
})();
