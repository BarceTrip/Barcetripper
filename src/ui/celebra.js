/* Celebrazioni: ogni passaggio fatto ha la sua festa, con suono, animazione e particelle a seconda del tipo di tappa. */
import { ICONS } from '../icons.js';
import { $ } from './dom.js';
import { sfx } from '../audio/sfx.js';
import { confetti, burst, sparkles, fireworks } from './confetti.js';

const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = a => a[Math.floor(Math.random() * a.length)];
const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

/* per tipo di tappa: suono, frasi del timbro, colore, particelle */
const M = {
  rail: { snd: 'whistle', txt: ['Treno fatto!', 'Arrivati!', 'Prossima fermata!'], c: 'var(--rail)', cols: ['#EC6B6B', '#fff', '#FFCD3C'] },
  air:  { snd: 'takeoff', txt: ['Atterrati!', 'Volo fatto!', 'Cieli blu!'], c: 'var(--air)', cols: ['#F2C94C', '#fff', '#5B8DEF'] },
  stay: { snd: 'bell', txt: ['Sistemati!', 'Check fatto!', 'Casa dolce hotel!'], c: 'var(--stay)', cols: ['#5F9C97', '#fff', '#FFCD3C'] },
  free: { snd: 'party', txt: ['Olé!', 'Che giornata!', 'Fiesta!'], c: 'var(--free)', cols: ['#B29BDD', '#FF5A5A', '#FFCD3C', '#2ED3C0'] },
  road: { snd: 'road', txt: ['Arrivati!', 'Strada fatta!', 'Si va avanti!'], c: 'var(--road)', cols: ['#7F97A4', '#fff', '#FFCD3C'] },
  box:  { snd: 'box', txt: ['Pacco preso!', 'Ritirato!', 'Nelle tue mani!'], c: 'var(--box)', cols: ['#5B8DEF', '#fff', '#FFCD3C'] },
};
const DEF = { snd: 'done', txt: ['Fatto!', 'Avanti!', 'Grande!'], c: 'var(--coral)', cols: ['#EC6B6B', '#fff', '#FFCD3C'] };

function layer() {
  let el = $('#cele');
  if (!el) { el = document.createElement('div'); el.id = 'cele'; document.body.appendChild(el); }
  return el;
}
let timer = 0;
function show(cls, html, ms) {
  const L = layer(); clearTimeout(timer);
  L.className = 'cele on ' + cls; L.innerHTML = html;
  timer = setTimeout(() => { L.className = 'cele'; L.innerHTML = ''; }, ms);
}
const stamp = (txt, sub) => '<div class="stamp">' + txt + (sub ? '<small>' + sub + '</small>' : '') + '</div>';

/* tappa completata: mode è quello della tappa appena chiusa; last vale per l'ultima */
export function celebrate(mode, last) {
  const m = M[mode] || DEF;
  if (last) return finale();
  sfx(m.snd); buzz([12, 40, 24]);
  let extra = '';
  if (mode === 'rail') extra = [0, .12, .26, .42, .6].map(d => '<i class="puff" style="animation-delay:' + d + 's"></i>').join('');
  else if (mode === 'air') extra = '<svg class="trail" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M-5 84 L105 22" pathLength="1"/></svg>';
  else if (mode === 'free') extra = '<i class="rays"></i>';
  else if (mode === 'stay') extra = '<i class="glow"></i>';
  else if (mode === 'road') extra = '<i class="lane"></i><i class="lane l2"></i>';
  else if (mode === 'box') extra = '<i class="glow"></i>';
  const html = '<i class="flash"></i>' + extra + '<div class="mover">' + (ICONS[mode] || ICONS.sign) + '</div>' + stamp(pick(m.txt));
  show(mode, html.replace(/--c/g, '--c'), 2100);
  layer().style.setProperty('--c', m.c);
  if (!RM) {
    setTimeout(() => burst(innerWidth / 2, innerHeight * .38, { n: 34, cols: m.cols, speed: 6, star: mode === 'free' || mode === 'stay' }), 260);
    if (mode === 'free' || mode === 'stay') setTimeout(() => confetti(60), 400);
    if (mode === 'air') setTimeout(() => burst(innerWidth * .8, innerHeight * .28, { n: 24, cols: m.cols, speed: 4 }), 1500);
  }
  const h = $('#pOggi .hero'); if (h) { h.classList.remove('pulse'); void h.offsetWidth; h.classList.add('pulse'); }
}

/* viaggio finito: gran finale */
export function finale() {
  sfx('fanfare'); buzz([30, 60, 30, 60, 90]);
  show('last', '<i class="flash"></i><i class="rays"></i><div class="mover">' + ICONS.stay + '</div>' + stamp('Viaggio finito!', 'Bentornato a casa'), 4200);
  layer().style.setProperty('--c', 'var(--coral)');
  confetti(160); fireworks(5);
  setTimeout(() => confetti(90), 1800);
}

/* tessera spuntata: rimbalzo e scintille; ok=true se ora è spuntata */
export function tilePop(el, ok) {
  if (!el) return;
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  if (ok) { sparkles(el.getBoundingClientRect()); buzz(10); }
}
/* tutto pronto in una lista: banda, arpeggio e scoppio */
export function allReady(txt) {
  sfx('allset'); buzz([15, 30, 15, 30, 40]);
  show('ready', '<i class="flash"></i><div class="ban">' + ICONS.check + '<span>' + (txt || 'Tutto pronto!') + '</span></div>', 1900);
  layer().style.setProperty('--c', 'var(--ok)');
  setTimeout(() => { burst(innerWidth / 2, innerHeight * .24, { n: 40, cols: ['#5FBF9B', '#fff', '#FFCD3C'], speed: 5.5, star: true }); confetti(40); }, 120);
}
/* valigia completa */
export function bagDone(back) {
  sfx('fanfare'); buzz([20, 50, 20, 50, 60]);
  show('last', '<i class="flash"></i><i class="rays"></i><div class="mover">' + ICONS.bag + '</div>' + stamp(back ? 'Tutto in valigia!' : 'Si può partire!', back ? 'Non hai dimenticato nulla' : 'Valigia pronta'), 3600);
  layer().style.setProperty('--c', 'var(--lav)');
  confetti(140); fireworks(3);
}
/* elemento che sparisce: si accartoccia e vola via con uno sbuffo di particelle, poi chiama fn */
export function vanish(el, fn) {
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, { n: 22, cols: ['#fff', '#EC6B6B', '#B29BDD'], speed: 3.5, size: 5 });
  buzz(12);
  if (RM) { fn(); return; }
  el.classList.add('bye'); el.style.pointerEvents = 'none';
  let done = false; const go = () => { if (!done) { done = true; fn(); } };
  el.addEventListener('animationend', go, { once: true }); setTimeout(go, 600);
}
/* moneta che cade nel salvadanaio: scoppio dorato dal punto toccato */
export function coin(el) {
  const r = el && el.getBoundingClientRect();
  if (r) burst(r.left + r.width / 2, r.top + r.height / 2, { n: 18, cols: ['#F2C94C', '#FFE28A', '#fff'], speed: 4, size: 5 });
  buzz(10);
}
