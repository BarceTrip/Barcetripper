/* Frasario parlante: le frasi scorrono a turno, tocchi quella giusta e il telefono la dice in spagnolo.
   Sotto ogni frase c'è la traduzione italiana, così sai sempre cosa stai facendo dire. */
import { FRASI, FRASI_CATS } from '../data/frasi.js';
import { curHotel } from '../data/steps.js';
import { ICONS } from '../icons.js';
import { $, $$, toast } from './dom.js';
import { sfx } from '../audio/sfx.js';
import { showBig } from './sos.js';

const VISIBILI = 3, GIRO = 2600;   // tre frasi alla volta, una cambia ogni 2,6 secondi
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const F = { cat: 'all', slot: [0, 1, 2], next: 3, timer: null, turno: 0, ferma: false, sel: -1, voce: null };

const lista = () => FRASI.map((f, i) => ({ ...f, i })).filter(f => F.cat === 'all' || f.c === F.cat);
const testo = f => f.es.replace('{ADDR}', curHotel().addr);

/* ---- voce spagnola del telefono, funziona anche senza rete ---- */
function vociPronte() {
  if (!('speechSynthesis' in window)) return;
  const v = speechSynthesis.getVoices();
  F.voce = v.find(x => /^es[-_]ES/i.test(x.lang)) || v.find(x => /^es/i.test(x.lang)) || null;
}
if ('speechSynthesis' in window) { vociPronte(); speechSynthesis.addEventListener('voiceschanged', vociPronte); }
export function parla(txt) {
  if (!('speechSynthesis' in window)) { toast('Questo telefono non legge ad alta voce'); return false; }
  try {
    if (!F.voce) vociPronte();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'es-ES'; u.rate = 0.9; u.pitch = 1;
    if (F.voce) u.voice = F.voce;
    speechSynthesis.cancel(); speechSynthesis.speak(u); return true;
  } catch (e) { toast('Non riesco a leggerla'); return false; }
}

/* ---- carosello ---- */
function avanza() {
  const L = lista(); if (L.length <= VISIBILI) return;
  const pos = F.turno % VISIBILI; F.turno++;
  const usati = new Set(F.slot);
  let giri = 0, nuovo;
  do { nuovo = F.next % L.length; F.next++; } while (usati.has(nuovo) && ++giri < L.length);
  F.slot[pos] = nuovo;
  const card = $$('#frCards .frcard')[pos];
  if (!card) return;
  card.classList.add('via');
  setTimeout(() => { riempi(card, L[nuovo], pos); card.classList.remove('via'); card.classList.add('entra'); setTimeout(() => card.classList.remove('entra'), 340); }, 260);
}
function riempi(card, f, pos) {
  if (!f) { card.hidden = true; return; }
  card.hidden = false; card.dataset.i = f.i;
  card.innerHTML = '<span class="frs">' + esc(testo(f)) + '</span><span class="frit">' + esc(f.it) + '</span><span class="frv">' + ICONS.speak + '</span>';
}
function start() {
  clearInterval(F.timer);
  if (!F.ferma) F.timer = setInterval(avanza, GIRO);
}
export function frasiStop() { clearInterval(F.timer); F.timer = null; if ('speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) {} }

export function frasiHtml() {
  const L = lista();
  F.slot = [0, 1, 2].map(k => (k < L.length ? k : -1)); F.next = Math.min(3, L.length); F.turno = 0; F.sel = -1;
  const cards = F.slot.map(k => k >= 0 ? '<button class="frcard" data-i="' + L[k].i + '"><span class="frs">' + esc(testo(L[k])) + '</span><span class="frit">' + esc(L[k].it) + '</span><span class="frv">' + ICONS.speak + '</span></button>' : '<button class="frcard" hidden></button>').join('');
  return '<div class="sec"><div class="sh"><span class="eyebrow">Frasi che parlano</span><small>' + L.length + ' frasi · tocca per farle dire</small></div>' +
    '<div class="chips frfil">' + FRASI_CATS.map(c => '<button class="chip' + (c.k === F.cat ? ' on' : '') + '" data-c="' + c.k + '">' + c.n + '</button>').join('') + '</div>' +
    '<div class="frbox"><div class="frcards" id="frCards">' + cards + '</div>' +
    '<div class="fract"><button class="chipbtn" id="frPlay">' + (F.ferma ? ICONS.play + 'Riprendi' : ICONS.pause + 'Ferma') + '</button>' +
    '<button class="chipbtn" id="frNext">' + ICONS.chevR + 'Altre frasi</button></div></div></div>';
}
export function frasiBind() {
  const box = $('#frCards'); if (!box) return;
  start();
  $$('#frCards .frcard').forEach(c => c.onclick = () => {
    const f = FRASI[+c.dataset.i]; if (!f) return;
    F.ferma = true; frasiStop(); sfx('tick');
    $$('#frCards .frcard').forEach(x => x.classList.toggle('on', x === c));
    const p = $('#frPlay'); if (p) p.innerHTML = ICONS.play + 'Riprendi';
    parla(testo(f));
    const b = $('#frBig'); if (b) b.dataset.txt = testo(f) + '|' + f.it;
    const bar = $('#frSel');
    if (bar) { bar.hidden = false; bar.querySelector('.fsx').textContent = testo(f); bar.querySelector('.fsi').textContent = f.it; bar.dataset.txt = testo(f); }
  });
  $('#frPlay').onclick = () => { F.ferma = !F.ferma; sfx('tick'); $('#frPlay').innerHTML = F.ferma ? ICONS.play + 'Riprendi' : ICONS.pause + 'Ferma'; F.ferma ? frasiStop() : start(); };
  $('#frNext').onclick = () => { sfx('tick'); for (let k = 0; k < VISIBILI; k++) avanza(); };
  $$('#pSos .frfil .chip').forEach(b => b.onclick = () => { F.cat = b.dataset.c; sfx('tick'); redraw(); });
  const bar = $('#frSel');
  if (bar) {
    bar.querySelector('[data-act=ripeti]').onclick = () => { parla(bar.dataset.txt); sfx('tick'); };
    bar.querySelector('[data-act=grande]').onclick = () => { showBig(esc(bar.querySelector('.fsx').textContent)); sfx('tick'); };
    bar.querySelector('[data-act=chiudi]').onclick = () => { bar.hidden = true; $$('#frCards .frcard').forEach(x => x.classList.remove('on')); sfx('back'); };
  }
}
let redraw = () => {};
export const frasiOnRedraw = fn => { redraw = fn; };
