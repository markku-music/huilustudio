/* Same octave ranges and Finnish spellings as the supplied OSMD scale app. */
(() => {
  'use strict';
  const pitches = [
    ['c','C',0],['cis','C',1],['d','D',0],['es','E',-1],
    ['e','E',0],['f','F',0],['fis','F',1],['g','G',0],
    ['gis','G',1],['a','A',0],['b','B',-1],['h','B',0]
  ];
  const major = [0,2,4,5,7,9,11,12];
  const octaves = {1:'¹',2:'²',3:'³'};
  const definitions = [
    ['F','F-duuri',65,-1],['G','G-duuri',67,1],
    ['D1','D-duuri',62,2],['D2','D-duuri',74,2],
    ['B','B-duuri',70,-2],['C','C-duuri',72,0]
  ];
  window.ASTEIKKO_SCALES = Object.fromEntries(definitions.map(([id,label,tonic,fifths]) => {
    const notes = major.map(offset => {
      const midi = tonic+offset;
      const [spelling,musicStep,alter] = pitches[midi%12];
      const oct = Math.floor(midi/12)-1;
      return {midi,musicStep,alter,oct,name:spelling+octaves[oct-3]};
    });
    const names = notes.map(n => n.name);
    return [id,{id,label,fifths,notes,names,midi:notes.map(n => n.midi),range:names[0]+'–'+names[7]}];
  }));
})();
