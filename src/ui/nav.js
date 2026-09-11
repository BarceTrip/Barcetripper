/* Indicazioni: ogni tasto "Indicazioni", "Portami lì", "A piedi" o "Con i mezzi" chiede con quale app aprire
   il percorso: Mappe di Apple, Google Maps o HERE WeGo. Stessa destinazione e stessa modalità in tutte e tre. */
import { ICONS } from '../icons.js';
import { $, $$ } from './dom.js';
import { sfx } from '../audio/sfx.js';

const MODE = { walking: { g: 'walking', a: 'w', h: 'w' }, transit: { g: 'transit', a: 'r', h: 'pt' }, driving: { g: 'driving', a: 'd', h: 'd' } };
const ll = p => p[0].toFixed(5) + ',' + p[1].toFixed(5);

/* o: { p: [lat, lon], q: destinazione scritta (facoltativa, per Google e Apple), name, mode, from: [lat, lon] facoltativo } */
export function navLinks(o) {
  const m = MODE[o.mode] || MODE.walking, dest = o.q || (o.p ? ll(o.p) : ''), from = o.from ? ll(o.from) : '';
  return {
    apple: 'https://maps.apple.com/?daddr=' + encodeURIComponent(dest) + '&dirflg=' + m.a + (from ? '&saddr=' + from : ''),
    google: 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dest) + '&travelmode=' + m.g + (from ? '&origin=' + from : ''),
    /* HERE vuole le coordinate; parte sempre da dove sei */
    here: o.p ? 'https://share.here.com/r/' + ll(o.p) + ((o.q || o.name) ? ',' + encodeURIComponent(o.q || o.name) : '') + '?m=' + m.h : '',
  };
}
export function openNav(o) {
  const L = navLinks(o), el = $('#sheet');
  el.innerHTML = '<div class="sheet-bg"></div><div class="sheet-box"><div class="eyebrow">Apri il percorso con</div>' +
    '<a class="btn" href="' + L.apple + '" target="_blank" rel="noopener">' + ICONS.pin + 'Mappe di Apple</a>' +
    '<a class="btn" href="' + L.google + '" target="_blank" rel="noopener">' + ICONS.nav + 'Google Maps</a>' +
    (L.here ? '<a class="btn" href="' + L.here + '" target="_blank" rel="noopener">' + ICONS.route + 'HERE WeGo</a>' : '') +
    '<button class="btn ghost" id="sheetX">Annulla</button></div>';
  el.classList.add('on'); sfx('tick');
  el.querySelector('.sheet-bg').onclick = closeNav;
  $('#sheetX').onclick = () => { sfx('back'); closeNav(); };
  $$('#sheet a').forEach(a => a.addEventListener('click', () => { sfx('tick'); setTimeout(closeNav, 150); }));
}
export function closeNav() { const el = $('#sheet'); if (el && el.classList.contains('on')) { el.classList.remove('on'); el.innerHTML = ''; } }
