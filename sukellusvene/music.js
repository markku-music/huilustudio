(() => {
  'use strict';
  const names=['C','C♯','D','Es','E','F','F♯','G','As','A','B','H'];
  const subs=['₀','₁','₂','₃','₄'];
  // This edition always uses four natural notes G1–C2, bottom to top.
  const choice=()=>({id:'G1-C2',notes:[67,69,71,72]});
  window.SeaMusic={
    noteName:midi=>names[midi%12]+subs[Math.floor(midi/12)-4],
    pitchName:midi=>names[midi%12],
    level:index=>index,
    validate:choice,
    read:choice
  };
})();
