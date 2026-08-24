import { DIVISIONS, layoutNotesIntoMeasures } from './measure-layout.js';
import { beamTagsForMeasure, beamTagsXml } from './beaming.js';
import { spellMidi } from './pitch-spelling.js';

function esc(v=''){ return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;'); }
function pitchXml(midi, index, notes, settings){ const {step,alter,octave}=spellMidi(midi,{index,notes,settings}); return `<pitch><step>${step}</step>${alter?`<alter>${alter}</alter>`:''}<octave>${octave}</octave></pitch>`; }
function dotXml(count){ return '<dot/>'.repeat(Math.max(0, Number(count)||0)); }
function xmlNoteType(type){
  return ({ sixteenth: '16th', 'thirty-second': '32nd' })[type] || type;
}
function tieXml(note){ return `${note.tieStop?'<tie type="stop"/>':''}${note.tieStart?'<tie type="start"/>':''}`; }
function tiedNotationXml(note){
  const tied=`${note.tieStop?'<tied type="stop"/>':''}${note.tieStart?'<tied type="start"/>':''}`;
  return tied?`<notations>${tied}</notations>`:'';
}
function noteXml(note, beamTags=[], noteIndex=0, measureNotes=[], settings={}){
  if (note.kind === 'rest') {
    const restTag = note.measureRest ? '<rest measure="yes"/>' : '<rest/>';
    const type = note.measureRest ? 'whole' : xmlNoteType(note.type);
    const dots = note.measureRest ? '' : dotXml(note.dots);
    return `<note>${restTag}<duration>${note.duration * 2}</duration><voice>1</voice><type>${type}</type>${dots}${beamTagsXml(beamTags)}</note>`;
  }
  return `<note>${pitchXml(note.midi,noteIndex,measureNotes,settings)}<duration>${note.duration * 2}</duration>${tieXml(note)}<voice>1</voice><type>${xmlNoteType(note.type)}</type>${dotXml(note.dots)}${beamTagsXml(beamTags)}${tiedNotationXml(note)}</note>`;
}
function hiddenRestXml(d){ return d>0?`<note print-object="no"><rest/><duration>${d * 2}</duration><voice>1</voice></note>`:''; }
function timeSymbol(v){ return v==='C'?' symbol="common"':v==='cutC'?' symbol="cut"':''; }
function clefXml(v){ const [sign,line]=({treble:['G',2],alto:['C',3],bass:['F',4]})[v]||['G',2]; return `<clef><sign>${sign}</sign><line>${line}</line></clef>`; }



function sheetMetadataXml(settings={}) {
  // Otsikko ja säveltäjä annetaan OSMD:lle MusicXML:n natiiveina tietoina.
  // Niille ei aseteta sovelluksessa omia X/Y-koordinaatteja.
  const title = settings.title
    ? `<work><work-title>${esc(settings.title)}</work-title></work>`
    : '';
  const composer = settings.composer
    ? `<identification><creator type="composer">${esc(settings.composer)}</creator></identification>`
    : '';
  return `${title}${composer}`;
}

function tempoDirectionXml(settings={}) {
  // Tempoteksti on OSMD:n normaali ensimmäisen tahdin direction/words-ilmaisu.
  // placement="above" on ainoa sijoitusohje; OSMD hoitaa varsinaisen ladonnan.
  return settings.tempoText
    ? `<direction placement="above"><direction-type><words>${esc(settings.tempoText)}</words></direction-type></direction>`
    : '';
}

function explicitMultiRestRuns(measures) {
  const starts = new Map();
  for (let i = 0; i < measures.length; ) {
    if (!measures[i]?.explicitMeasureRest) { i += 1; continue; }
    let end = i + 1;
    while (end < measures.length && measures[end]?.explicitMeasureRest) end += 1;
    const count = end - i;
    if (count >= 2) starts.set(i, count);
    i = end;
  }
  return starts;
}

function attributesXml({ index, settings, beats, beatType, multiRestCount }) {
  const common = index === 0
    ? `<divisions>${DIVISIONS}</divisions><key><fifths>${Number(settings.keySignature)||0}</fifths><mode>${esc(settings.keyMode||'major')}</mode></key><time${timeSymbol(settings.timeSignature)}><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>${clefXml(settings.clef)}`
    : '';
  const multi = multiRestCount >= 2
    ? `<measure-style><multiple-rest use-symbols="no">${multiRestCount}</multiple-rest></measure-style>`
    : '';
  return (common || multi) ? `<attributes>${common}${multi}</attributes>` : '';
}

export function buildMusicXml(notes, settings={}){
  const { beats, beatType, pickupCapacity, measures } = layoutNotesIntoMeasures(notes, settings);
  const multiRestStarts = explicitMultiRestRuns(measures);
  const xmlMeasures=measures.map((measure,index)=>{
    const attr=attributesXml({ index, settings, beats, beatType, multiRestCount: multiRestStarts.get(index) || 0 });
    const tempo = index === 0 ? tempoDirectionXml(settings) : '';
    const beamTags=beamTagsForMeasure(measure.notes, beats, beatType, { osmdCompatible: true });
    const content=measure.notes.length?measure.notes.map((note,noteIndex)=>noteXml(note,beamTags[noteIndex],noteIndex,measure.notes,settings)).join('')+hiddenRestXml(measure.capacity-measure.used):hiddenRestXml(measure.capacity);
    const number=pickupCapacity?(index===0?0:index):index+1,implicit=pickupCapacity&&index===0?' implicit="yes"':'';
    return `<measure number="${number}"${implicit}>${attr}${tempo}${content}</measure>`;
  }).join('');
  const metadata = sheetMetadataXml(settings);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<score-partwise version="3.1">${metadata}<part-list><score-part id="P1"><part-name>Pikakirjoitin</part-name></score-part></part-list><part id="P1">${xmlMeasures}</part></score-partwise>`;
}
