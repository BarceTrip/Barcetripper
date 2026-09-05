/* Pagina "Percorso": tutte le tappe raggruppate per giorno. */
import { STEPS } from '../data/steps.js';
import { ICONS } from '../icons.js';
import { S } from '../state.js';
import { $, $$, header, emit } from './dom.js';
import { codeTag } from './oggi.js';

export function drawPercorso() {
  let out = '', lastDay = '';
  STEPS.forEach((s, k) => {
    if (s.day !== lastDay) { out += '<div class="dayh"><b>' + s.day + '</b><span>' + s.city + '</span></div>'; lastDay = s.day; }
    out += '<button class="trow ' + s.mode + (k < S.i ? ' done' : k === S.i ? ' now' : '') + '" style="--c:var(--' + s.mode + ')" data-k="' + k + '">' +
      '<span class="mi">' + (k < S.i ? ICONS.check : ICONS[s.mode]) + '</span><span class="tb"><b>' + s.title + codeTag(s) + '</b><span>' + s.place + '</span></span><span class="tm tnum">' + s.time + '</span></button>';
  });
  $('#pPercorso').innerHTML = header(STEPS.length + ' tappe · 15–20 settembre', 'Percorso', { gear: true }) + out;
  $$('#pPercorso .trow').forEach(b => b.onclick = () => emit('goto', +b.dataset.k));
}
export function scrollPercorsoToNow() {
  setTimeout(() => { const n = $('#pPercorso .trow.now'); if (n) n.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
}
