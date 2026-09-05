/* Vista "Mappa": timeline verticale con l'omino sulla tappa corrente. */
import { STEPS } from '../data/steps.js';
import { ICONS } from '../icons.js';
import { S } from '../state.js';
import { $, emit } from './dom.js';
import { codeTag } from './step.js';

export function drawMap() {
  const w = $('#walker'); const m = $('#map');
  m.querySelectorAll('.node,.city').forEach(n => n.remove());
  let lastCity = '';
  STEPS.forEach((s, k) => {
    if (s.city !== lastCity) { const c = document.createElement('div'); c.className = 'city'; c.textContent = s.city; m.appendChild(c); lastCity = s.city; }
    const b = document.createElement('button');
    b.className = 'node ' + (k < S.i ? 'done' : '') + (k === S.i ? ' now' : '');
    b.style.setProperty('--c', 'var(--' + s.mode + ')');
    b.innerHTML = '<span class="gut"></span><span class="track"><span class="seg"></span><span class="dot"></span></span>' +
      '<span class="g ncard"><span class="mi">' + ICONS[s.mode] + '</span><span class="nb"><span class="nt">' + s.time + '</span><strong>' + s.title + codeTag(s) + '</strong><em>' + s.place + '</em><span class="det">' + s.det + '</span></span></span>';
    b.onclick = () => emit('goto', k);
    m.appendChild(b);
  });
  requestAnimationFrame(() => { const now = $('#map .node.now'); if (now) w.style.top = (now.offsetTop + 26 - 22) + 'px'; });
}
export function scrollMapToNow() {
  setTimeout(() => { const n = $('#map .node.now'); if (n) n.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
}
