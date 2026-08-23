import { DIVISIONS, layoutNotesIntoMeasures } from './measure-layout.js';

const SHARP_SPELLING = [['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]];

function esc(v=''){ return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;'); }
function pitchXml(midi){ const pc=((midi%12)+12)%12,[step,alter]=SHARP_SPELLING[pc],oct=Math.floor(midi/12)-1; return `<pitch><step>${step}</step>${alter?`<alter>${alter}</alter>`:''}<octave>${oct}</octave></pitch>`; }
function dotXml(count){ return '<dot/>'.repeat(Math.max(0, Number(count)||0)); }
function tieXml(note){ return `${note.tieStop?'<tie type="stop"/>':''}${note.tieStart?'<tie type="start"/>':''}`; }
function tiedNotationXml(note){
  const tied=`${note.tieStop?'<tied type="stop"/>':''}${note.tieStart?'<tied type="start"/>':''}`;
  return tied?`<notations>${tied}</notations>`:'';
}
function noteXml(note){
  if (note.kind === 'rest') return `<note><rest/><duration>${note.duration}</duration><voice>1</voice><type>${note.type}</type>${dotXml(note.dots)}</note>`;
  return `<note>${pitchXml(note.midi)}<duration>${note.duration}</duration>${tieXml(note)}<voice>1</voice><type>${note.type}</type>${dotXml(note.dots)}${tiedNotationXml(note)}</note>`;
}
function hiddenRestXml(d){ return d>0?`<note print-object="no"><rest/><duration>${d}</duration><voice>1</voice></note>`:''; }
function timeSymbol(v){ return v==='C'?' symbol="common"':v==='cutC'?' symbol="cut"':''; }
function clefXml(v){ const [sign,line]=({treble:['G',2],alto:['C',3],bass:['F',4]})[v]||['G',2]; return `<clef><sign>${sign}</sign><line>${line}</line></clef>`; }

export function buildMusicXml(notes, settings={}){
  const { beats, beatType, pickupCapacity, measures } = layoutNotesIntoMeasures(notes, settings);
  const xmlMeasures=measures.map((measure,index)=>{
    const attr=index===0?`<attributes><divisions>${DIVISIONS}</divisions><key><fifths>${Number(settings.keySignature)||0}</fifths><mode>${esc(settings.keyMode||'major')}</mode></key><time${timeSymbol(settings.timeSignature)}><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>${clefXml(settings.clef)}</attributes>`:'';
    const tempo=index===0&&settings.tempoText?`<direction placement="above"><direction-type><words>${esc(settings.tempoText)}</words></direction-type></direction>`:'';
    const content=measure.notes.length?measure.notes.map(noteXml).join('')+hiddenRestXml(measure.capacity-measure.used):hiddenRestXml(measure.capacity);
    const number=pickupCapacity?(index===0?0:index):index+1,implicit=pickupCapacity&&index===0?' implicit="yes"':'';
    return `<measure number="${number}"${implicit}>${attr}${tempo}${content}</measure>`;
  }).join('');
  const title=settings.title?`<work><work-title>${esc(settings.title)}</work-title></work>`:'';
  const creator=settings.composer?`<identification><creator type="composer">${esc(settings.composer)}</creator></identification>`:'';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<score-partwise version="3.1">${title}${creator}<part-list><score-part id="P1"><part-name>Pikakirjoitin</part-name></score-part></part-list><part id="P1">${xmlMeasures}</part></score-partwise>`;
}
