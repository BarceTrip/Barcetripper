import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { STEPS } from './data/steps.js';
import { ICONS } from './icons.js';
import { S, save, load } from './state.js';
import { $, $$, on, toast } from './ui/dom.js';
import { sfx } from './audio/sfx.js';
import { musicStart, musicStop, musicOn, armAutoplay } from './audio/music.js';
import { drawOggi, nowIndex } from './ui/oggi.js';
import { drawPercorso, scrollPercorsoToNow } from './ui/percorso.js';
import { drawSpese } from './ui/spese.js';
import { drawSos } from './ui/sos.js';
import { applyTheme, syncSwitches, drawSettings } from './ui/settings.js';
import { confetti } from './ui/confetti.js';
import { notifInit, notifAsk, icsExport } from './notify.js';
import { drawRadar, radarShow } from './radar.js';

/* ---- schede ---- */
const TABS = [
  { id: 'oggi', lbl: 'Oggi', ico: ICONS.today, page: 'pOggi', draw: () => drawOggi(false) },
  { id: 'percorso', lbl: 'Percorso', ico: ICONS.route, page: 'pPercorso', draw: () => { drawPercorso(); scrollPercorsoToNow(); } },
  { id: 'spese', lbl: 'Spese', ico: ICONS.wallet, page: 'pSpese', draw: drawSpese },
  { id: 'radar', lbl: 'Radar', ico: ICONS.radar, page: 'pRadar', draw: radarShow },
  { id: 'sos', lbl: 'SOS', ico: ICONS.alert, page: 'pSos', draw: drawSos, cls: 'sos' },
];
let prevTab = 'oggi';

function show(t, opts = {}) {
  if (t !== 'settings') prevTab = t;
  S.tab = t;
  $$('.page').forEach(p => p.classList.remove('on'));
  $('#' + (t === 'settings' ? 'pSettings' : TABS.find(x => x.id === t).page)).classList.add('on');
  $$('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === t));
  if (t === 'settings') { syncSwitches(); }
  else if (!opts.noDraw) TABS.find(x => x.id === t).draw();
  if (t === 'sos') sfx('sos');
  window.scrollTo({ top: 0, behavior: opts.smooth ? 'smooth' : 'auto' });
}
$('#tabs').innerHTML = TABS.map(t => '<button role="tab" data-t="' + t.id + '"' + (t.cls ? ' class="' + t.cls + '"' : '') + '>' + t.ico + t.lbl + '</button>').join('');
$$('#tabs button').forEach(b => b.onclick = () => { if (S.tab !== b.dataset.t) { sfx('tick'); show(b.dataset.t); } else window.scrollTo({ top: 0, behavior: 'smooth' }); });
/* ingranaggio in ogni intestazione, delegato perché le pagine si ridisegnano */
document.addEventListener('click', e => { if (e.target.closest('.gear')) { sfx('tick'); show('settings'); } });

/* ---- navigazione tappe ---- */
function goto(k, animate) {
  S.i = k; save(); drawOggi(animate);
  if (S.tab !== 'oggi') show('oggi', { noDraw: true }); else window.scrollTo({ top: 0, behavior: 'smooth' });
}
function advance(d) {
  const n = S.i + d; if (n < 0 || n >= STEPS.length) return;
  const last = n === STEPS.length - 1;
  if (d > 0) { const m = STEPS[n].mode; sfx(last ? 'done' : (m === 'road' ? 'tick' : m)); if (last) confetti(); } else sfx('back');
  if (navigator.vibrate) navigator.vibrate(8);
  goto(n, true);
}
on('goto', k => goto(k, true));
on('advance', d => advance(d));

/* swipe fra le tappe nella pagina Oggi */
let tx = 0, ty = 0; const po = $('#pOggi');
po.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
po.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 70 && Math.abs(dy) < 50) advance(dx < 0 ? 1 : -1);
}, { passive: true });

/* ---- impostazioni ---- */
drawSettings();
$('#bSetBack').onclick = () => { sfx('back'); show(prevTab); };
$('#sNow').onclick = () => {
  const k = nowIndex(); sfx('tick');
  if (k < 0) { toast('Il viaggio non è ancora iniziato'); goto(0, true); } else goto(k, true);
};
$('#sNotif').onclick = notifAsk;
$('#sIcs').onclick = icsExport;
$('#sSnd').onclick = () => { S.snd = !S.snd; syncSwitches(); if (S.snd) sfx('tick'); save(); };
$('#sMus').onclick = () => { if (musicOn()) { musicStop(); S.music = false; } else { musicStart(); S.music = true; } syncSwitches(); save(); };
$('#sTheme').onclick = () => { S.theme = S.theme === 'light' ? 'dark' : 'light'; applyTheme(); syncSwitches(); sfx('tick'); save(); };

/* ---- avvio ---- */
load();
/* ?tab=spese&theme=light per aprire direttamente una scheda (utile per i test) */
const Q = new URLSearchParams(location.search);
if (Q.get('theme') === 'light' || Q.get('theme') === 'dark') S.theme = Q.get('theme');
applyTheme(); syncSwitches();
show(TABS.some(t => t.id === Q.get('tab')) || Q.get('tab') === 'settings' ? Q.get('tab') : 'oggi');
armAutoplay(); notifInit();
registerSW({ immediate: true, onOfflineReady() { toast('Pronta anche senza rete'); } });
