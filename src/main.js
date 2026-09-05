import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { STEPS } from './data/steps.js';
import { S, save, load } from './state.js';
import { $, on, toast } from './ui/dom.js';
import { sfx } from './audio/sfx.js';
import { musicStart, musicStop, musicOn, armAutoplay } from './audio/music.js';
import { drawRoute, drawStep } from './ui/step.js';
import { drawMap, scrollMapToNow } from './ui/map.js';
import { drawSpese } from './ui/spese.js';
import { openSos } from './ui/sos.js';
import { applyTheme, syncSwitches, openSheet, closeSheet } from './ui/sheet.js';
import { confetti } from './ui/confetti.js';
import { notifInit, notifAsk, icsExport } from './notify.js';
import { radarInit } from './radar.js';

/* ---- render ---- */
function render(animate) {
  $('#hdb').textContent = 'Tappa ' + (S.i + 1) + ' di ' + STEPS.length;
  $('#daytag').textContent = STEPS[S.i].day;
  $('#back').disabled = S.i === 0;
  $('#next').textContent = S.i === STEPS.length - 1 ? 'Viaggio finito' : 'Fatto, avanti';
  $('#next').disabled = S.i === STEPS.length - 1;
  drawRoute(); drawStep(animate); drawMap(); drawSpese(); save();
  if (S.tab === 'step') window.scrollTo({ top: 0, behavior: 'smooth' });
}
function advance(d) {
  const n = S.i + d; if (n < 0 || n >= STEPS.length) return; S.i = n;
  if (d > 0) { const m = STEPS[S.i].mode; sfx(S.i === STEPS.length - 1 ? 'done' : (m === 'road' ? 'tick' : m)); if (S.i === STEPS.length - 1) confetti(); }
  else sfx('back');
  if (navigator.vibrate) navigator.vibrate(8);
  render(true);
}
function setTab(t) {
  S.tab = t; const idx = { step: 0, map: 1, spese: 2 }[t];
  $('#ind').style.transform = 'translateX(' + (idx * 100) + '%)';
  ['step', 'map', 'spese'].forEach(x => {
    const id = x === 'step' ? 'Step' : x === 'map' ? 'Map' : 'Spese';
    $('#tab' + id).setAttribute('aria-selected', t === x); $('#view' + id).classList.toggle('on', t === x);
  });
  sfx('tick');
  if (t === 'map') { drawMap(); scrollMapToNow(); }
  if (t === 'spese') drawSpese();
}
function goNow() {
  const now = Date.now(); let best = 0;
  STEPS.forEach((s, k) => { if (s.at && new Date(s.at) <= now) best = k; });
  if (new Date(STEPS[0].at) > now) { toast('Il viaggio non è ancora iniziato'); S.i = 0; } else S.i = best;
  render(true);
}

/* ---- eventi ---- */
$('#next').onclick = () => advance(1);
$('#back').onclick = () => advance(-1);
$('#tabStep').onclick = () => setTab('step');
$('#tabMap').onclick = () => setTab('map');
$('#tabSpese').onclick = () => setTab('spese');
$('#bMenu').onclick = () => { sfx('tick'); openSheet(); };
$('#scrim').onclick = closeSheet;
$('#sNow').onclick = () => { closeSheet(); sfx('tick'); goNow(); };
$('#sNotif').onclick = notifAsk;
$('#sIcs').onclick = () => { closeSheet(); icsExport(); };
$('#sSnd').onclick = () => { S.snd = !S.snd; syncSwitches(); if (S.snd) sfx('tick'); save(); };
$('#sMus').onclick = () => { if (musicOn()) { musicStop(); S.music = false; } else { musicStart(); S.music = true; } syncSwitches(); save(); };
$('#sTheme').onclick = () => { S.theme = S.theme === 'light' ? 'dark' : 'light'; applyTheme(); syncSwitches(); sfx('tick'); save(); };
$('#bSos').onclick = openSos;
on('goto', k => { S.i = k; render(true); });

/* swipe fra le tappe */
let tx = 0, ty = 0; const vs = $('#viewStep');
vs.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
vs.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 70 && Math.abs(dy) < 50) advance(dx < 0 ? 1 : -1);
}, { passive: true });
window.addEventListener('resize', () => { if (S.tab === 'map') drawMap(); });

/* ---- avvio ---- */
load();
applyTheme(); syncSwitches(); render(false); armAutoplay(); notifInit(); radarInit();
registerSW({ immediate: true, onOfflineReady() { toast('Pronta anche senza rete'); } });
