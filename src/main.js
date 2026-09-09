import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { STEPS } from './data/steps.js';
import { ICONS } from './icons.js';
import { S, save, load } from './state.js';
import { $, $$, on, toast } from './ui/dom.js';
import { sfx } from './audio/sfx.js';
import { musicStart, musicStop, musicOn, armAutoplay } from './audio/music.js';
import { drawOggi, nowIndex, marquee } from './ui/oggi.js';
import { drawPercorso, scrollPercorsoToNow } from './ui/percorso.js';
import { drawSpese } from './ui/spese.js';
import { drawSos } from './ui/sos.js';
import { applyTheme, syncSwitches, drawSettings } from './ui/settings.js';
import { confetti } from './ui/confetti.js';
import { notifInit, notifAsk, icsExport } from './notify.js';
import { luoghiShow, luoghiPause } from './ui/luoghi.js';
import { drawValigia } from './ui/valigia.js';
import { drawDocumenti } from './ui/documenti.js';
import { drawSalute } from './ui/salute.js';
import { frasiStop } from './ui/frasi.js';

/* ---- schede ---- */
const TABS = [
  { id: 'oggi', lbl: 'Oggi', ico: ICONS.today, page: 'pOggi', draw: () => drawOggi(0) },
  { id: 'percorso', lbl: 'Percorso', ico: ICONS.route, page: 'pPercorso', draw: () => { drawPercorso(); scrollPercorsoToNow(); } },
  { id: 'spese', lbl: 'Spese', ico: ICONS.wallet, page: 'pSpese', draw: drawSpese },
  { id: 'luoghi', lbl: 'Luoghi', ico: ICONS.pin, page: 'pLuoghi', draw: luoghiShow },
  { id: 'sos', lbl: 'SOS', ico: ICONS.alert, page: 'pSos', draw: drawSos, cls: 'sos' },
];
/* pagine senza scheda: si aprono sopra la scheda corrente e con "indietro" tornano lì */
const SUB = { settings: 'pSettings', valigia: 'pValigia', documenti: 'pDocumenti', salute: 'pSalute' };
let prevTab = 'oggi', subFrom = 'oggi';

function show(t, opts = {}) {
  if (!SUB[t]) prevTab = t;
  if (SUB[t] && t !== 'settings' && S.tab !== t) subFrom = TABS.some(x => x.id === S.tab) || S.tab === 'settings' ? S.tab : 'oggi';
  S.tab = t;
  $$('.page').forEach(p => p.classList.remove('on'));
  $('#' + (SUB[t] || TABS.find(x => x.id === t).page)).classList.add('on');
  $$('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === t));
  if (t === 'settings') { syncSwitches(); }
  else if (t === 'valigia') drawValigia();
  else if (t === 'documenti') drawDocumenti();
  else if (t === 'salute') drawSalute();
  else if (!opts.noDraw) TABS.find(x => x.id === t).draw();
  if (t === 'oggi') marquee();   // il nastro dei chip si misura solo a pagina visibile
  if (t !== 'luoghi') luoghiPause();
  if (t !== 'sos') frasiStop();   // il carosello delle frasi gira solo mentre lo guardi
  closeOverlays();
  if (t === 'sos') sfx('sos');
  window.scrollTo({ top: 0, behavior: opts.smooth ? 'smooth' : 'auto' });
}
$('#tabs').innerHTML = TABS.map(t => '<button role="tab" data-t="' + t.id + '"' + (t.cls ? ' class="' + t.cls + '"' : '') + '>' + t.ico + t.lbl + '</button>').join('');
$$('#tabs button').forEach(b => b.onclick = () => { if (S.tab !== b.dataset.t) { sfx('tick'); show(b.dataset.t); } else window.scrollTo({ top: 0, behavior: 'smooth' }); });
/* ingranaggio in ogni intestazione, delegato perché le pagine si ridisegnano */
document.addEventListener('click', e => { if (e.target.closest('.gear')) { sfx('tick'); show('settings'); } });

/* i pannelli a tutto schermo non devono sopravvivere a un cambio di pagina */
function closeOverlays() {
  const b = $('#bigtxt'); if (b && b.classList.contains('on')) b.classList.remove('on');
  const d = $('#docview'); if (d && d.classList.contains('on')) { d.classList.remove('on'); d.innerHTML = ''; }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlays(); });

/* ---- navigazione tappe ---- */
/* dir: 1 la tessera entra da destra, -1 da sinistra, 0 senza animazione */
function goto(k, dir) {
  S.i = k; save(); drawOggi(dir);
  if (S.tab !== 'oggi') show('oggi', { noDraw: true }); else window.scrollTo({ top: 0, behavior: 'smooth' });
}
/* suono per tipo di tappa: quelli senza suono proprio fanno il tic secco */
const SFX_MODE = { rail: 'rail', air: 'air', stay: 'stay', free: 'free' };
function advance(d) {
  const n = S.i + d; if (n < 0 || n >= STEPS.length) return;
  const last = n === STEPS.length - 1;
  if (d > 0) { const m = STEPS[n].mode; sfx(last ? 'done' : (SFX_MODE[m] || 'tick')); if (last) confetti(); } else sfx('back');
  if (navigator.vibrate) navigator.vibrate(8);
  goto(n, d);
}
on('goto', k => goto(k, k > S.i ? 1 : k < S.i ? -1 : 0));
on('advance', d => advance(d));
on('open', t => show(t === 'back' ? subFrom : t));   // Valigia e Documenti si aprono da Oggi o dalle impostazioni e tornano da dove sono venute

/* swipe fra le tappe nella pagina Oggi */
let tx = 0, ty = 0, drag = false; const po = $('#pOggi');
po.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; drag = false; }, { passive: true });
po.addEventListener('touchmove', e => {
  const dx = e.touches[0].clientX - tx, dy = e.touches[0].clientY - ty, sv = $('#sv'); if (!sv) return;
  if (!drag && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) drag = true;
  if (drag) { sv.classList.add('drag'); sv.style.transform = 'translateX(' + dx * .35 + 'px)'; }
}, { passive: true });
po.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty, sv = $('#sv');
  if (sv) { sv.style.transform = ''; sv.classList.remove('drag'); }
  if (drag && Math.abs(dx) > 70 && Math.abs(dy) < 60) advance(dx < 0 ? 1 : -1);
}, { passive: true });
/* niente zoom: doppio tocco (touch-action nel CSS) e pinch */
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

/* ---- impostazioni ---- */
drawSettings();
$('#bSetBack').onclick = () => { sfx('back'); show(prevTab); };
$('#sNow').onclick = () => {
  const k = nowIndex(); sfx('tick');
  if (k < 0) { toast('Il viaggio non è ancora iniziato'); goto(0, -1); } else goto(k, k >= S.i ? 1 : -1);
};
$('#sBag').onclick = () => { sfx('tick'); show('valigia'); };
$('#sDocs').onclick = () => { sfx('tick'); show('documenti'); };
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
if (Q.has('step') && STEPS[+Q.get('step')]) S.i = +Q.get('step');
applyTheme(); syncSwitches();
show(TABS.some(t => t.id === Q.get('tab')) || SUB[Q.get('tab')] ? Q.get('tab') : 'oggi');
armAutoplay(); notifInit();
registerSW({ immediate: true, onOfflineReady() { toast('Pronta anche senza rete'); } });
