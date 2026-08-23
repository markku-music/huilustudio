import { layoutNotesIntoMeasures } from './measure-layout.js';

const DIRECTION_THRESHOLD = 11;
const DIRECTION_DOMINANCE = 1.18;
const STAFF_EXTRA_Y = 15;
const SAME_LINE_TOLERANCE = 1.8;

function rectCenterX(rect) { return rect.left + rect.width / 2; }
function rectCenterY(rect) { return rect.top + rect.height / 2; }

function unionWidth(intervals) {
  if (!intervals.length) return 0;
  const sorted = intervals
    .map(([a,b]) => a <= b ? [a,b] : [b,a])
    .sort((a,b) => a[0] - b[0]);
  let total = 0;
  let [start,end] = sorted[0];
  for (let i=1;i<sorted.length;i++) {
    const [a,b] = sorted[i];
    if (a <= end + 2) end = Math.max(end,b);
    else { total += end - start; start = a; end = b; }
  }
  return total + end - start;
}

/**
 * Etsii OSMD/VexFlow-SVG:stä viivastojen viisi vaakaviivaa.
 * Emme sido elelogiikkaa VexFlow'n sisäisiin class-nimiin, vaan etsimme
 * geometrisesti pitkät, ohuet vaakasuorat viivat ja ryhmittelemme ne viiden
 * tasavälisen viivan viivastoiksi.
 */
function detectStaffBands(container) {
  const bands = [];
  const pageSvgs = [...container.querySelectorAll('svg')]
    .filter(svg => svg.getBoundingClientRect().width > 80);

  for (const svg of pageSvgs) {
    const pageRect = svg.getBoundingClientRect();
    if (pageRect.width <= 0 || pageRect.height <= 0) continue;

    const raw = [];
    for (const el of svg.querySelectorAll('path,line,rect')) {
      if (el.closest('.vf-notehead')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < Math.max(28, pageRect.width * 0.045)) continue;
      if (r.height > 3.2) continue;
      if (r.right < pageRect.left || r.left > pageRect.right) continue;
      raw.push({ y:rectCenterY(r), left:r.left, right:r.right });
    }

    raw.sort((a,b) => a.y - b.y);
    const rows = [];
    for (const item of raw) {
      let row = rows.at(-1);
      if (!row || Math.abs(item.y - row.y) > SAME_LINE_TOLERANCE) {
        row = { y:item.y, ys:[item.y], intervals:[[item.left,item.right]] };
        rows.push(row);
      } else {
        row.ys.push(item.y);
        row.intervals.push([item.left,item.right]);
        row.y = row.ys.reduce((a,b)=>a+b,0) / row.ys.length;
      }
    }

    const lineRows = rows
      .map(row => ({
        ...row,
        coverage: unionWidth(row.intervals),
        left: Math.min(...row.intervals.map(v=>v[0])),
        right: Math.max(...row.intervals.map(v=>v[1]))
      }))
      .filter(row => row.coverage >= Math.max(70, pageRect.width * 0.15))
      .sort((a,b) => a.y - b.y);

    for (let i=0;i<=lineRows.length-5;) {
      const five = lineRows.slice(i,i+5);
      const gaps = five.slice(1).map((row,j) => row.y - five[j].y);
      const avg = gaps.reduce((a,b)=>a+b,0) / gaps.length;
      const even = avg >= 3 && avg <= 28 && gaps.every(g => Math.abs(g-avg) <= Math.max(2.2, avg*0.28));
      if (!even) { i += 1; continue; }

      bands.push({
        page: svg,
        top: five[0].y - STAFF_EXTRA_Y,
        bottom: five[4].y + STAFF_EXTRA_Y,
        centerY: (five[0].y + five[4].y) / 2,
        left: Math.min(...five.map(row=>row.left)),
        right: Math.max(...five.map(row=>row.right))
      });
      i += 5;
    }
  }
  return bands;
}

function logicalSegments(notes, settings) {
  const layout = layoutNotesIntoMeasures(notes, settings);
  return layout.measures.flatMap(measure => measure.notes);
}

export class ScoreRangeSelection {
  #viewport;
  #container;
  #bands = [];
  #heads = [];
  #selectedIds = new Set();
  #gesture = null;

  constructor({ viewport, container }) {
    this.#viewport = viewport;
    this.#container = container;
    this.#bind();
  }

  refresh({ notes = [], settings = {} } = {}) {
    // OSMD on juuri renderöinyt uuden SVG:n, joten vanhat elementtiviitteet eivät enää kelpaa.
    this.#bands = detectStaffBands(this.#container);
    const segments = logicalSegments(notes, settings);
    const elements = [...this.#container.querySelectorAll('.vf-notehead')]
      .filter(el => el.getBoundingClientRect().width > 0);

    this.#heads = [];
    const count = Math.min(segments.length, elements.length);
    for (let i=0;i<count;i++) {
      const element = elements[i];
      const rect = element.getBoundingClientRect();
      const band = this.#nearestBand(rectCenterX(rect), rectCenterY(rect));
      this.#heads.push({
        element,
        sourceId: segments[i].sourceId,
        segmentIndex: segments[i].segmentIndex,
        x: rectCenterX(rect),
        y: rectCenterY(rect),
        band
      });
    }

    if (segments.length !== elements.length) {
      console.warn(`Nuotinpäiden kartoitus: MusicXML-segmenttejä ${segments.length}, SVG-nuotinpäitä ${elements.length}.`);
    }
    this.#paint();
  }

  get selectedIds() { return [...this.#selectedIds]; }

  clear() {
    this.#selectedIds.clear();
    this.#paint();
  }

  #bind() {
    this.#viewport.addEventListener('pointerdown', ev => this.#pointerDown(ev));
    this.#viewport.addEventListener('pointermove', ev => this.#pointerMove(ev));
    this.#viewport.addEventListener('pointerup', ev => this.#pointerUp(ev));
    this.#viewport.addEventListener('pointercancel', ev => this.#pointerCancel(ev));
  }

  #pointerDown(ev) {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    if (this.#gesture) return;
    const band = this.#bandAt(ev.clientX, ev.clientY);
    if (!band) return; // viivaston ulkopuolelta alkava kosketus ei koskaan ole aluevalinta

    this.#gesture = {
      pointerId: ev.pointerId,
      state: 'pending',
      band,
      startX: ev.clientX,
      startY: ev.clientY,
      currentX: ev.clientX
    };
  }

  #pointerMove(ev) {
    const g = this.#gesture;
    if (!g || ev.pointerId !== g.pointerId) return;

    const dx = ev.clientX - g.startX;
    const dy = ev.clientY - g.startY;
    const ax = Math.abs(dx), ay = Math.abs(dy);

    if (g.state === 'pending') {
      if (Math.max(ax,ay) < DIRECTION_THRESHOLD) return;

      // Pystysuunta kuuluu aina Safarille. Emme preventDefaultaa emmekä kaappaa pointeria.
      if (ay > ax * DIRECTION_DOMINANCE) {
        this.#gesture = null;
        return;
      }

      // Vasta selkeä vaakaliike aktivoi valinnan ja lukitsee eleen siihen.
      if (ax > ay * DIRECTION_DOMINANCE) {
        g.state = 'selecting';
        try { this.#viewport.setPointerCapture(ev.pointerId); } catch {}
      } else return;
    }

    if (g.state === 'selecting') {
      ev.preventDefault();
      g.currentX = Math.max(g.band.left, Math.min(g.band.right, ev.clientX));
      this.#selectRange(g.band, g.startX, g.currentX);
    }
  }

  #pointerUp(ev) {
    const g = this.#gesture;
    if (!g || ev.pointerId !== g.pointerId) return;
    if (g.state === 'selecting') {
      ev.preventDefault();
      g.currentX = Math.max(g.band.left, Math.min(g.band.right, ev.clientX));
      this.#selectRange(g.band, g.startX, g.currentX);
      try { this.#viewport.releasePointerCapture(ev.pointerId); } catch {}
    }
    this.#gesture = null;
  }

  #pointerCancel(ev) {
    if (this.#gesture?.pointerId !== ev.pointerId) return;
    this.#gesture = null;
  }

  #bandAt(x,y) {
    return this.#bands.find(b => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) || null;
  }

  #nearestBand(x,y) {
    const samePage = this.#bands.filter(b => x >= b.left - 60 && x <= b.right + 60);
    const pool = samePage.length ? samePage : this.#bands;
    if (!pool.length) return null;
    return pool.reduce((best,b) => Math.abs(y-b.centerY) < Math.abs(y-best.centerY) ? b : best, pool[0]);
  }

  #selectRange(band, startX, endX) {
    const left = Math.min(startX,endX);
    const right = Math.max(startX,endX);
    const ids = new Set();

    for (const head of this.#heads) {
      if (head.band !== band) continue;
      if (head.x >= left && head.x <= right) ids.add(head.sourceId);
    }
    this.#selectedIds = ids;
    this.#paint();
  }

  #paint() {
    for (const head of this.#heads) {
      head.element.classList.toggle('pk-selected-notehead', this.#selectedIds.has(head.sourceId));
    }
  }
}
