import { layoutNotesIntoMeasures } from './measure-layout.js';

const SCROLL_THRESHOLD = 7;
const SELECTION_THRESHOLD = 12;
const VERTICAL_DOMINANCE = 1.5;
const STAFF_EXTRA_Y = 15;
const SAME_LINE_TOLERANCE = 1.8;
const TAP_MOVE_TOLERANCE = 9;
const NOTE_HIT_PADDING_X = 22;
const NOTE_HIT_PADDING_Y = 20;

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
        staffTop: five[0].y,
        staffBottom: five[4].y,
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
  #cursor = null;

  constructor({ viewport, container }) {
    this.#viewport = viewport;
    this.#container = container;
    this.#createCursor();
    this.#bind();
  }

  refresh({ notes = [], settings = {} } = {}) {
    this.#hideCursor();
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
        rect,
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
    this.#hideCursor();
    if (!this.#selectedIds.size) return;
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

    // Pidämme pending-tilan myös viivaston ulkopuolella, jotta lyhyt napautus
    // tyhjään paperiin voi poistaa valinnan. Emme kuitenkaan estä selaimen
    // natiivia pystyscrollausta missään vaiheessa.
    const band = this.#bandAt(ev.clientX, ev.clientY);
    this.#gesture = {
      pointerId: ev.pointerId,
      state: 'pending',
      band,
      startX: ev.clientX,
      startY: ev.clientY,
      currentX: ev.clientX,
      anchorHead: null,
      endHead: null,
      maxMove: 0
    };
  }

  #pointerMove(ev) {
    const g = this.#gesture;
    if (!g || ev.pointerId !== g.pointerId) return;

    const dx = ev.clientX - g.startX;
    const dy = ev.clientY - g.startY;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    g.maxMove = Math.max(g.maxMove, Math.hypot(dx,dy));

    if (g.state === 'pending') {
      const distance = Math.hypot(dx, dy);

      // Scrollaus saa etuoikeuden vain, kun ele on JO HYVIN selvästi pystysuuntainen.
      // Pieni 7 px pystysuuntainen liike riittää, kun y-liike on vähintään
      // 1,5-kertainen x-liikkeeseen verrattuna. Tällöin JavaScript luopuu eleestä
      // heti ja Safari jatkaa natiivia pan-y-scrollausta.
      if (ay >= SCROLL_THRESHOLD && ay > ax * VERTICAL_DOMINANCE) {
        this.#gesture = null;
        return;
      }

      // Vaakavalinnan ei tarvitse olla laser-suora. Kun liike on riittävän pitkä
      // eikä sitä ole jo tunnistettu selväksi pystyscrollaukseksi, viivaston päältä
      // alkanut ele hyväksytään valinnaksi myös melko voimakkaasti vinossa.
      if (distance < SELECTION_THRESHOLD) return;

      // Vaakavalinta voi alkaa vain viivaston alueelta. Muualta alkanut pidempi
      // ele jätetään selaimen hoidettavaksi.
      if (!g.band) {
        this.#gesture = null;
        return;
      }

      // TARKKA ALOITUS: raakaa startX-pikseliä ei käytetä valintarajana.
      // Aloitus napsahtaa saman viivaston lähimpään nuotinpäähän. Näin paksu
      // sormi voi osua nuotin ympärille, eikä valinnan ensimmäinen nuotti ole
      // kiinni muutamasta pikselistä.
      g.anchorHead = this.#nearestHeadInBand(g.band, g.startX);
      if (!g.anchorHead) {
        this.#gesture = null;
        return;
      }

      g.state = 'selecting';
      try { this.#viewport.setPointerCapture(ev.pointerId); } catch {}
      g.endHead = this.#nearestHeadInBand(g.band, ev.clientX) || g.anchorHead;
      this.#selectBetweenHeads(g.band, g.anchorHead, g.endHead);
      return;
    }

    if (g.state === 'selecting') {
      ev.preventDefault();
      g.currentX = Math.max(g.band.left, Math.min(g.band.right, ev.clientX));
      g.endHead = this.#nearestHeadInBand(g.band, g.currentX) || g.anchorHead;
      this.#selectBetweenHeads(g.band, g.anchorHead, g.endHead);
    }
  }

  #pointerUp(ev) {
    const g = this.#gesture;
    if (!g || ev.pointerId !== g.pointerId) return;

    const dx = ev.clientX - g.startX;
    const dy = ev.clientY - g.startY;
    g.maxMove = Math.max(g.maxMove, Math.hypot(dx,dy));

    if (g.state === 'selecting') {
      ev.preventDefault();
      g.currentX = Math.max(g.band.left, Math.min(g.band.right, ev.clientX));
      g.endHead = this.#nearestHeadInBand(g.band, g.currentX) || g.anchorHead;
      this.#selectBetweenHeads(g.band, g.anchorHead, g.endHead);
      try { this.#viewport.releasePointerCapture(ev.pointerId); } catch {}
      this.#hideCursor();
    } else if (g.state === 'pending' && g.maxMove <= TAP_MOVE_TOLERANCE) {
      // Napautus tyhjään kohtaan poistaa valinnan. Nuotin ympärillä on reilu,
      // näkymätön osuma-alue, joten paksu sormi ei vahingossa tulkitse nuottiin
      // osunutta napautusta tyhjäksi.
      const hitHead = this.#headAt(ev.clientX, ev.clientY);
      if (!hitHead) this.clear();
    }

    this.#gesture = null;
  }

  #pointerCancel(ev) {
    if (this.#gesture?.pointerId !== ev.pointerId) return;
    this.#hideCursor();
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

  #headsInBand(band) {
    return this.#heads
      .filter(head => head.band === band)
      .sort((a,b) => a.x - b.x);
  }

  #nearestHeadInBand(band, x) {
    const heads = this.#headsInBand(band);
    if (!heads.length) return null;
    return heads.reduce((best, head) => Math.abs(x-head.x) < Math.abs(x-best.x) ? head : best, heads[0]);
  }

  #headAt(x,y) {
    // Käytetään nuottipäätä paljon suurempaa näkymätöntä osuma-aluetta.
    // Jos alueet limittyvät, valitaan geometrisesti lähin nuotin pää.
    const candidates = this.#heads.filter(head => {
      const r = head.rect;
      return x >= r.left - NOTE_HIT_PADDING_X && x <= r.right + NOTE_HIT_PADDING_X &&
             y >= r.top - NOTE_HIT_PADDING_Y && y <= r.bottom + NOTE_HIT_PADDING_Y;
    });
    if (!candidates.length) return null;
    return candidates.reduce((best, head) => {
      const d = Math.hypot(x-head.x, y-head.y);
      const bestD = Math.hypot(x-best.x, y-best.y);
      return d < bestD ? head : best;
    }, candidates[0]);
  }

  #selectBetweenHeads(band, startHead, endHead) {
    if (!startHead || !endHead) return;
    const left = Math.min(startHead.x, endHead.x);
    const right = Math.max(startHead.x, endHead.x);
    const ids = new Set();

    for (const head of this.#heads) {
      if (head.band !== band) continue;
      if (head.x >= left - 0.5 && head.x <= right + 0.5) ids.add(head.sourceId);
    }
    this.#selectedIds = ids;
    this.#paint();
    this.#showCursor(band, endHead);
  }

  #createCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'pk-selection-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="pk-selection-cursor-triangle"></span><span class="pk-selection-cursor-line"></span>';
    document.body.appendChild(cursor);
    this.#cursor = cursor;
  }

  #showCursor(band, head) {
    if (!this.#cursor || !band || !head) return;
    const staffTop = Number.isFinite(band.staffTop) ? band.staffTop : band.top + STAFF_EXTRA_Y;
    this.#cursor.style.left = `${head.x}px`;
    this.#cursor.style.top = `${Math.max(2, staffTop - 24)}px`;
    this.#cursor.classList.add('is-visible');
  }

  #hideCursor() {
    this.#cursor?.classList.remove('is-visible');
  }

  #paint() {
    for (const head of this.#heads) {
      head.element.classList.toggle('pk-selected-notehead', this.#selectedIds.has(head.sourceId));
    }
  }
}
