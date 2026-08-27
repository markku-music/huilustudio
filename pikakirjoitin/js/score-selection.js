(function () {
  "use strict";
const SCROLL_THRESHOLD = 7;
const SELECTION_THRESHOLD = 12;
const VERTICAL_DOMINANCE = 1.5;
const STAFF_EXTRA_Y = 15;
const SAME_LINE_TOLERANCE = 1.8;
const TAP_MOVE_TOLERANCE = 9;
const EVENT_HIT_PADDING_X = 30;
const EVENT_HIT_PADDING_Y = 24;
const EVENT_NEAREST_FALLBACK_X = 48;
const EVENT_NEAREST_FALLBACK_Y = 34;

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
 * Elelogiikka ei nojaa VexFlow'n sisäisiin viivastoluokkiin, vaan tunnistaa
 * viivastot geometriasta. Näin pystyscrollaus ja vaakavalinta pysyvät erillään.
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


/**
 * Palauttaa yhden näkyvän VexFlow-tapahtuman per nuotti/tauko.
 * Nuotilla maalaamme vain .vf-notehead-elementin. Tauolla .vf-note-ryhmässä
 * ei ole noteheadia, joten itse taukosymbolin ryhmä toimii maalauskohteena.
 * Jos VexFlow-rakenne joskus poikkeaa tästä, notehead-fallback pitää nykyisen
 * nuottivalinnan toiminnassa.
 */
function collectVisualEvents(container) {
  const groups = [...container.querySelectorAll('.vf-note')]
    .filter(group => {
      const r = group.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });

  if (groups.length) {
    return groups.map(group => {
      const head = group.querySelector('.vf-notehead');
      const element = head || group;
      const rect = element.getBoundingClientRect();
      const hitRect = group.getBoundingClientRect();
      return {
        element,
        kind: head ? 'note' : 'rest',
        rect,
        hitRect,
        x: rectCenterX(rect),
        y: rectCenterY(rect)
      };
    });
  }

  return [...container.querySelectorAll('.vf-notehead')]
    .filter(element => element.getBoundingClientRect().width > 0)
    .map(element => {
      const rect = element.getBoundingClientRect();
      return { element, kind:'note', rect, hitRect:rect, x:rectCenterX(rect), y:rectCenterY(rect) };
    });
}

class ScoreRangeSelection {
  #viewport;
  #container;
  #bands = [];
  #events = [];
  #selectedIds = new Set();
  #gesture = null;
  #cursor = null;
  #cursorTarget = null;
  #listeners = new Set();
  #commitListeners = new Set();
  #enabled = true;

  constructor({ viewport, container }) {
    this.#viewport = viewport;
    this.#container = container;
    this.#createCursor();
    this.#bind();
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    listener(this.#selectionState());
    return () => this.#listeners.delete(listener);
  }

  subscribeCommit(listener) {
    this.#commitListeners.add(listener);
    return () => this.#commitListeners.delete(listener);
  }

  setEnabled(enabled) {
    const next = Boolean(enabled);
    if (next === this.#enabled) return;
    this.#enabled = next;

    if (!next) {
      const g = this.#gesture;
      if (g) {
        try { this.#viewport.releasePointerCapture(g.pointerId); } catch {}
      }
      this.#gesture = null;
      this.#viewport.classList.remove('pk-selection-gesture-locked');
      this.clear();
    }
  }

  isEnabled() { return this.#enabled; }

  refresh({ segments = [] } = {}) {
    // OSMD on juuri renderöinyt uuden SVG:n, joten vanhat elementtiviitteet
    // eivät enää kelpaa. Säilytetään kuitenkin looginen valinta ja kohdistin.
    this.#bands = detectStaffBands(this.#container);
    const visuals = collectVisualEvents(this.#container);

    this.#events = [];
    const count = Math.min(segments.length, visuals.length);
    for (let i=0;i<count;i++) {
      const visual = visuals[i];
      const segment = segments[i];
      const band = this.#nearestBand(visual.x, visual.y);
      this.#events.push({
        ...visual,
        sourceId: segment.sourceId,
        segmentIndex: segment.segmentIndex,
        kind: segment.kind || visual.kind || 'note',
        band
      });
    }

    this.#paint();
    this.#restoreCursorFromTarget();
    this.#emitChange();
  }

  get selectedIds() { return [...this.#selectedIds]; }

  /**
   * Pitää yhden loogisen ScoreModel-tapahtuman valittuna myös OSMD:n
   * uudelleenrenderöinnin yli. Editointi saa muuttaa nuotin korkeutta,
   * kestoa ja jopa näkyvien segmenttien määrää, mutta sourceId pysyy samana.
   */
  retainSingle(sourceId) {
    if (!sourceId) return false;
    this.#selectedIds = new Set([sourceId]);

    const event = this.#events.find(item => item.sourceId === sourceId) || null;
    if (event) {
      this.#cursorTarget = { sourceId:event.sourceId, segmentIndex:event.segmentIndex };
      this.#paint();
      this.#showCursor(event.band, event);
    } else {
      // SVG voi olla juuri vaihtumassa. Looginen valinta säilytetään ja
      // kohdistin palautetaan seuraavassa refresh()-kierroksessa.
      this.#paint();
    }
    this.#emitChange();
    return true;
  }

  retainIds(sourceIds) {
    const ids = Array.from(new Set(sourceIds || [])).filter(Boolean);
    this.#selectedIds = new Set(ids);

    const event = this.#events.find(item => this.#selectedIds.has(item.sourceId)) || null;
    if (event) {
      this.#cursorTarget = {
        sourceId:event.sourceId,
        segmentIndex:event.segmentIndex
      };
      this.#paint();
      this.#showCursor(event.band, event);
    } else {
      this.#paint();
      if (!ids.length) this.#hideCursor();
    }

    this.#emitChange();
    return ids.length > 0;
  }

  clear() {
    this.#viewport.classList.remove('pk-selection-gesture-locked');
    this.#selectedIds.clear();
    this.#cursorTarget = null;
    this.#paint();
    this.#hideCursor();
    this.#emitChange();
  }

  #bind() {
    this.#viewport.addEventListener('pointerdown', ev => this.#pointerDown(ev));
    this.#viewport.addEventListener('pointermove', ev => this.#pointerMove(ev));
    this.#viewport.addEventListener('pointerup', ev => this.#pointerUp(ev));
    this.#viewport.addEventListener('pointercancel', ev => this.#pointerCancel(ev));
    // Safari voi yrittää ottaa jo käynnissä olevan vaakavalinnan pan-y-scrollaukseksi,
    // jos sormi karkaa myöhemmin alaviistoon viivaston ulkopuolelle. Kun sama ele
    // on jo valinnut vähintään kaksi loogista tapahtumaa, käyttäjän tarkoitus on
    // yksiselitteinen: lukitaan ele valinnaksi ja estetään natiivi scrollaus vain
    // tämän kosketuksen loppuun asti.
    this.#viewport.addEventListener('touchmove', ev => {
      if (this.#gesture?.selectionLocked) ev.preventDefault();
    }, { passive:false });
    this.#viewport.addEventListener('scroll', () => {
      if (!this.#selectedIds.size) return;
      this.#restoreCursorFromTarget();
      this.#emitChange();
    }, { passive:true });
  }

  #pointerDown(ev) {
    if (!this.#enabled) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    if (this.#gesture) return;

    // getBoundingClientRect()-arvot muuttuvat aina, kun sivua tai score-viewportia
    // scrollataan. Refresh() tallentaa geometrian renderöintihetkellä, joten ennen
    // jokaista uutta valintaelettä synkronoidaan tapahtumien ja viivastojen
    // ruutukoordinaatit nykyiseen viewportiin. Näin hit-test ei tarvitse mitään
    // erillistä scrollTop/pageY-korjausta ja toimii samalla tavalla body- ja
    // sisäisen viewport-scrollauksen jälkeen.
    this.#syncGeometry();

    const band = this.#bandAt(ev.clientX, ev.clientY);
    const hitEvent = this.#eventAt(ev.clientX, ev.clientY);
    const previous = this.#snapshotSelection();

    this.#gesture = {
      pointerId: ev.pointerId,
      state: 'pending',
      band: hitEvent?.band || band,
      startX: ev.clientX,
      startY: ev.clientY,
      currentX: ev.clientX,
      anchorEvent: hitEvent || null,
      endEvent: hitEvent || null,
      initialEvent: hitEvent || null,
      previous,
      maxMove: 0,
      selectionLocked: false
    };

    // Ensimmäinen kosketus nuottiin tai taukoon antaa palautteen heti.
    // Mitään preventDefaultia ei tehdä tässä, joten Safari voi edelleen
    // ottaa eleen pystyscrollaukseksi. Jos niin käy, palautamme edellisen valinnan.
    if (hitEvent) this.#selectSingleEvent(hitEvent);
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

      // Vain selvästi pystysuora liike kuuluu scrollaukselle. Koska pointerdown
      // saattoi jo näyttää yksittäisen valinnan, palautamme tässä elettä edeltäneen
      // valinnan ennen kuin luovutamme kosketuksen Safarille.
      if (ay >= SCROLL_THRESHOLD && ay > ax * VERTICAL_DOMINANCE) {
        this.#restoreSelection(g.previous);
        this.#gesture = null;
        return;
      }

      if (distance < SELECTION_THRESHOLD) return;

      // Vaakavalinta voi alkaa vain viivaston alueelta.
      if (!g.band) {
        this.#restoreSelection(g.previous);
        this.#gesture = null;
        return;
      }

      // Jos kosketus osui heti tapahtumaan, juuri se on ankkuri. Muussa tapauksessa
      // ankkuri napsahtaa saman viivaston lähimpään tapahtumaan.
      g.anchorEvent = g.anchorEvent || this.#nearestEventInBand(g.band, g.startX);
      if (!g.anchorEvent) {
        this.#restoreSelection(g.previous);
        this.#gesture = null;
        return;
      }

      g.state = 'selecting';
      try { this.#viewport.setPointerCapture(ev.pointerId); } catch {}
      g.endEvent = this.#nearestEventInBand(g.band, ev.clientX) || g.anchorEvent;
      this.#selectBetweenEvents(g.band, g.anchorEvent, g.endEvent);
      return;
    }

    if (g.state === 'selecting') {
      ev.preventDefault();
      g.currentX = Math.max(g.band.left, Math.min(g.band.right, ev.clientX));
      g.endEvent = this.#nearestEventInBand(g.band, g.currentX) || g.anchorEvent;
      this.#selectBetweenEvents(g.band, g.anchorEvent, g.endEvent);
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
      g.endEvent = this.#nearestEventInBand(g.band, g.currentX) || g.anchorEvent;
      this.#selectBetweenEvents(g.band, g.anchorEvent, g.endEvent);
      try { this.#viewport.releasePointerCapture(ev.pointerId); } catch {}
      // Kohdistin jää näkyviin viimeisen tapahtuman kohdalle sormen noston jälkeenkin.
    } else if (g.state === 'pending') {
      if (g.initialEvent) {
        // Lyhyt napautus jäi jo pointerdownissa yksittäiseksi valinnaksi.
        // Pidetään valinta ja kohdistin näkyvissä.
        this.#selectSingleEvent(g.initialEvent);
      } else if (g.maxMove <= TAP_MOVE_TOLERANCE) {
        // Tyhjään paperiin napautus poistaa valinnan.
        this.clear();
      }
    }

    this.#viewport.classList.remove('pk-selection-gesture-locked');
    this.#gesture = null;
    this.#emitCommit();
  }

  #pointerCancel(ev) {
    const g = this.#gesture;
    if (!g || g.pointerId !== ev.pointerId) return;

    // iPad/Safari voi lähettää pointercancelin, kun natiivi pan-y-scrollaus
    // ottaa eleen. Pending-vaiheessa palautetaan siksi aiempi valinta.
    if (g.state === 'pending') this.#restoreSelection(g.previous);
    this.#viewport.classList.remove('pk-selection-gesture-locked');
    this.#gesture = null;
  }

  #syncGeometry() {
    // Viivastojen geometriakin elää viewport-koordinaateissa, joten se lasketaan
    // uudelleen nykyisestä SVG:stä. Tapahtumien looginen sourceId/segmentIndex
    // säilyy; vain niiden ruudulla oleva geometria päivitetään.
    this.#bands = detectStaffBands(this.#container);

    for (const event of this.#events) {
      const element = event.element;
      if (!element?.isConnected) continue;

      const rect = element.getBoundingClientRect();
      const group = element.closest?.('.vf-note');
      const hitRect = group?.getBoundingClientRect?.() || rect;
      if (rect.width <= 0 && rect.height <= 0) continue;

      event.rect = rect;
      event.hitRect = hitRect;
      event.x = rectCenterX(rect);
      event.y = rectCenterY(rect);
      event.band = this.#nearestBand(event.x, event.y);
    }
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

  #eventsInBand(band) {
    return this.#events
      .filter(event => event.band === band)
      .sort((a,b) => a.x - b.x);
  }

  #nearestEventInBand(band, x) {
    const events = this.#eventsInBand(band);
    if (!events.length) return null;
    return events.reduce((best, event) => Math.abs(x-event.x) < Math.abs(x-best.x) ? event : best, events[0]);
  }

  #eventAt(x,y) {
    // Osuma-alue perustuu koko VexFlow-nuottiryhmään (nuotinpää + varsi +
    // palkki/merkinnät), vaikka valinnan väri kohdistetaan edelleen vain
    // nuotinpään/tauon symboliin. Tämä tekee etenkin harvan ensimmäisen tahdin
    // yksittäisestä nuotista paljon helpommin napautettavan.
    const candidates = this.#events.filter(event => {
      const r = event.hitRect || event.rect;
      return x >= r.left - EVENT_HIT_PADDING_X && x <= r.right + EVENT_HIT_PADDING_X &&
             y >= r.top - EVENT_HIT_PADDING_Y && y <= r.bottom + EVENT_HIT_PADDING_Y;
    });

    if (candidates.length) {
      return candidates.reduce((best, event) => {
        const d = Math.hypot(x-event.x, y-event.y);
        const bestD = Math.hypot(x-best.x, y-best.y);
        return d < bestD ? event : best;
      }, candidates[0]);
    }

    // Hallittu fallback: jos napautus on viivaston alueella mutta osuu hieman
    // harvan yksittäisen nuotin sivuun, hyväksytään lähin nuotti vain rajatun
    // etäisyyden sisällä. Tämä ei muuta tyhjään paperiin napautusta yleisesti
    // valinnaksi.
    const band = this.#bandAt(x, y);
    if (!band) return null;

    const nearest = this.#nearestEventInBand(band, x);
    if (!nearest) return null;

    const horizontal = Math.abs(x - nearest.x);
    const vertical = Math.abs(y - nearest.y);

    return (
      horizontal <= EVENT_NEAREST_FALLBACK_X &&
      vertical <= EVENT_NEAREST_FALLBACK_Y
    ) ? nearest : null;
  }

  #selectSingleEvent(event) {
    if (!event) return;
    this.#selectedIds = new Set([event.sourceId]);
    this.#paint();
    this.#showCursor(event.band, event);
    this.#emitChange();
  }

  #selectBetweenEvents(band, startEvent, endEvent) {
    if (!startEvent || !endEvent) return;
    const left = Math.min(startEvent.x, endEvent.x);
    const right = Math.max(startEvent.x, endEvent.x);
    const ids = new Set();

    for (const event of this.#events) {
      if (event.band !== band) continue;
      if (event.x >= left - 0.5 && event.x <= right + 0.5) ids.add(event.sourceId);
    }
    this.#selectedIds = ids;
    if (this.#gesture && ids.size >= 2) {
      this.#gesture.selectionLocked = true;
      this.#viewport.classList.add('pk-selection-gesture-locked');
    }
    this.#paint();
    this.#showCursor(band, endEvent);
    this.#emitChange();
  }

  #snapshotSelection() {
    return {
      ids: new Set(this.#selectedIds),
      cursorTarget: this.#cursorTarget ? { ...this.#cursorTarget } : null
    };
  }

  #restoreSelection(snapshot) {
    if (!snapshot) return;
    this.#selectedIds = new Set(snapshot.ids || []);
    this.#cursorTarget = snapshot.cursorTarget ? { ...snapshot.cursorTarget } : null;
    this.#paint();
    this.#restoreCursorFromTarget();
    this.#emitChange();
  }

  #createCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'pk-selection-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="pk-selection-cursor-triangle"></span><span class="pk-selection-cursor-line"></span>';
    document.body.appendChild(cursor);
    this.#cursor = cursor;
  }

  #showCursor(band, event) {
    if (!this.#cursor || !band || !event) return;
    this.#cursorTarget = { sourceId:event.sourceId, segmentIndex:event.segmentIndex };
    const rect = event.element?.getBoundingClientRect?.() || event.rect;
    const x = rect ? rectCenterX(rect) : event.x;
    const y = rect ? rectCenterY(rect) : event.y;
    const deltaY = y - event.y;
    const originalStaffTop = Number.isFinite(band.staffTop) ? band.staffTop : band.top + STAFF_EXTRA_Y;
    const staffTop = originalStaffTop + deltaY;
    this.#cursor.style.left = `${x}px`;
    this.#cursor.style.top = `${Math.max(2, staffTop - 24)}px`;
    this.#cursor.classList.add('is-visible');
  }

  #restoreCursorFromTarget() {
    if (!this.#cursorTarget || !this.#selectedIds.size) {
      this.#hideCursor();
      return;
    }
    const exact = this.#events.find(event =>
      event.sourceId === this.#cursorTarget.sourceId &&
      event.segmentIndex === this.#cursorTarget.segmentIndex
    );
    const fallback = this.#events.find(event => event.sourceId === this.#cursorTarget.sourceId);
    const event = exact || fallback;
    if (!event?.band) {
      this.#hideCursor();
      return;
    }
    this.#showCursor(event.band, event);
  }

  #hideCursor() {
    this.#cursor?.classList.remove('is-visible');
  }

  #selectionState() {
    const ids = [...this.#selectedIds];
    let target = null;
    if (this.#cursorTarget) {
      target = this.#events.find(event => event.sourceId === this.#cursorTarget.sourceId && event.segmentIndex === this.#cursorTarget.segmentIndex)
        || this.#events.find(event => event.sourceId === this.#cursorTarget.sourceId);
    }
    if (!target && ids.length) target = this.#events.find(event => this.#selectedIds.has(event.sourceId));

    let anchor = null;
    if (target?.band) {
      const rect = target.element?.getBoundingClientRect?.() || target.rect;
      const x = rect ? rectCenterX(rect) : target.x;
      const y = rect ? rectCenterY(rect) : target.y;
      const deltaY = y - target.y;
      const top = (Number.isFinite(target.band.staffTop) ? target.band.staffTop : target.band.top + STAFF_EXTRA_Y) + deltaY;
      const bottom = (Number.isFinite(target.band.staffBottom) ? target.band.staffBottom : target.band.bottom - STAFF_EXTRA_Y) + deltaY;
      anchor = { x, staffTop:top, staffBottom:bottom, sourceId:target.sourceId };
    }
    return { selectedIds:ids, count:ids.length, anchor };
  }

  #emitChange() {
    const state = this.#selectionState();
    for (const listener of this.#listeners) listener(state);
  }

  #emitCommit() {
    const state = this.#selectionState();
    for (const listener of this.#commitListeners) listener(state);
  }

  #paint() {
    for (const event of this.#events) {
      const selected = this.#selectedIds.has(event.sourceId);
      event.element.classList.toggle('pk-selected-notehead', selected && event.kind !== 'rest');
      event.element.classList.toggle('pk-selected-rest', selected && event.kind === 'rest');
    }
  }
}


window.PikakirjoitinSelection = { ScoreRangeSelection };
})();
