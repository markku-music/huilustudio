/* OSMD glyphs from the supplied ResonatorEngine score display, aligned to
 * the game's evenly spaced note positions. Layout runs once, never in the audio loop. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  class RaceScore {
    constructor(host) {
      this.host = host;
      this.notes = [];
      this.progress = -1;
      this.direction = 'up';
      this.renderToken = 0;
    }

    // Screen matrices include OSMD's own zoom and the responsive arena scale.
    // Convert to the arena's SVG units before aligning anything.
    matrix(node) {
      return this.host.getScreenCTM().inverse().multiply(node.getScreenCTM());
    }

    point(node, x, y) {
      return new DOMPoint(x, y).matrixTransform(this.matrix(node));
    }

    bounds(node) {
      const b = node.getBBox();
      const corners = [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]]
        .map(([x,y]) => this.point(node,x,y));
      return {
        left: Math.min(...corners.map(p => p.x)), right: Math.max(...corners.map(p => p.x)),
        top: Math.min(...corners.map(p => p.y)), bottom: Math.max(...corners.map(p => p.y))
      };
    }

    shiftX(node, delta) {
      const inverse = this.matrix(node.parentNode).inverse();
      const origin = new DOMPoint(0,0).matrixTransform(inverse);
      const moved = new DOMPoint(delta,0).matrixTransform(inverse);
      const original = node.getAttribute('transform') || '';
      node.setAttribute('transform', `translate(${moved.x-origin.x} ${moved.y-origin.y}) ${original}`.trim());
    }

    setProgress(value, direction = 'up') {
      this.progress = value;
      this.direction = direction;
      this.notes.forEach((note, i) => {
        // On the return leg, lower notes become pending again.
        const step = direction === 'down' ? 7-i : direction === 'both' && value >= 7 ? 14-i : i;
        const color = step <= value ? '#a6b3a8' : step === value+1 ? '#d08023' : '#000000';
        for (const {node} of note.parts) {
          node.setAttribute('fill', color);
          for (const glyph of [node, ...node.querySelectorAll('*')]) {
            for (const attribute of ['fill','stroke']) {
              const old = glyph.getAttribute(attribute);
              if (old && old !== 'none' && old !== 'transparent') glyph.setAttribute(attribute, color);
            }
          }
        }
      });
    }

    message(text, error=false) {
      const node = document.createElementNS(NS,'text');
      for (const [key,value] of Object.entries({x:550,y:80,'text-anchor':'middle','font-size':16,fill:error?'#9b3d26':'#586f66'})) node.setAttribute(key,value);
      node.textContent = text;
      this.host.replaceChildren(node);
    }

    setScale(scale) {
      return this.init(offsets.map((_,i) => x(i)),scale);
    }

    async init(positions, scale=activeScale) {
      const token = ++this.renderToken;
      this.notes = [];
      this.host.dataset.ready = 'loading';
      this.message('Ladataan nuotteja…');
      const staging = document.createElement('div');
      staging.className = 'score-staging';
      staging.style.width = '640px';
      staging.setAttribute('aria-hidden','true');
      document.body.append(staging);
      try {
        // Use the same OSMD renderer, MusicXML and engraving defaults as the
        // reference package. Only horizontal placement follows the race.
        const display = new ResonatorScoreDisplay(staging);
        await display.init([scale]);
        if (token !== this.renderToken) return;
        const frame = display.frames.get(scale.id);
        const geometry = display.spacingFrames.get(frame);
        if (!geometry || geometry.notes.length !== 8 || geometry.staffLines.length !== 5) {
          throw new Error('Nuottien kohdistaminen ei onnistunut.');
        }
        const wrapper = document.createElementNS(NS,'g');
        wrapper.setAttribute('class','osmd-score');
        for (const attr of ['font-family','font-size','font-weight','fill','stroke']) {
          if (frame.hasAttribute(attr)) wrapper.setAttribute(attr,frame.getAttribute(attr));
        }
        wrapper.append(...frame.childNodes);
        this.host.replaceChildren(wrapper);

        const lines = geometry.staffLines;
        const ys = lines.map(line => this.point(line.node,line.x,line.y).y);
        const top = Math.min(...ys), height = Math.max(...ys)-top;
        if (!(height > 0)) throw new Error('Nuottiviivaston koko puuttuu.');
        const size = 48/height;
        wrapper.setAttribute('transform',`translate(0 ${55-top*size}) scale(${size})`);

        const clef = wrapper.querySelector('.vf-clef');
        this.shiftX(clef, 110-this.bounds(clef).left);
        geometry.notes.forEach((note, i) => {
          const head = note.node.querySelector('.vf-notehead');
          if (!head) throw new Error('Nuotin pää puuttuu.');
          const b = this.bounds(head);
          const delta = positions[i]-(b.left+b.right)/2;
          // Keep accidentals and ledger lines attached to their note.
          for (const part of note.parts) this.shiftX(part.node,delta);
          note.node.id = 'note'+i;
        });
        for (const line of lines) {
          const y = this.point(line.node,line.x,line.y).y;
          const inverse = this.matrix(line.node).inverse();
          const left = new DOMPoint(100,y).matrixTransform(inverse);
          const right = new DOMPoint(1040,y).matrixTransform(inverse);
          line.node.setAttribute('d',`M${left.x} ${left.y}L${right.x} ${right.y}`);
        }
        this.notes = geometry.notes;
        this.host.dataset.osmdVersion = display.osmdVersion;
        this.host.dataset.ready = 'true';
        this.host.dataset.scale = scale.id;
        this.setProgress(this.progress,this.direction);
      } catch(error) {
        if (token !== this.renderToken) return;
        console.error('OSMD-nuottinäyttö:',error);
        this.notes = [];
        this.message('Nuottinäyttö ei latautunut. Valitse asteikko uudelleen tai lataa sivu uudelleen.',true);
        this.host.dataset.ready = 'error';
      } finally {
        staging.remove();
      }
    }
  }

  const score = window.raceScore = new RaceScore(document.getElementById('staff'));
  score.setProgress(index,direction);
  score.setScale(activeScale);
})();
