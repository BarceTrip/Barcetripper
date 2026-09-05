/* Vista "Tappa": hero, checklist, note, piano B. Più la barra del percorso nell'header. */
import { STEPS } from '../data/steps.js';
import { ICONS } from '../icons.js';
import { S, save } from '../state.js';
import { $, $$, toast } from './dom.js';
import { sfx } from '../audio/sfx.js';

export const codeTag = s => s.code ? '<span class="code">' + s.code + '</span>' : '';

export function copyTxt(v) {
  (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
    .then(() => { toast('Copiato: ' + v); sfx('copy'); })
    .catch(() => toast(v));
}

export function drawRoute() {
  $('#route').innerHTML = STEPS.map((s, k) => '<i style="--c:var(--' + s.mode + ')" class="' + (k < S.i ? 'done' : k === S.i ? 'now' : '') + '"></i>').join('');
}

function fmtDelta(ms) {
  const m = Math.round(ms / 60000), a = Math.abs(m);
  if (a <= 5) return { t: 'adesso', c: 'now' };
  const d = Math.floor(a / 1440), h = Math.floor((a % 1440) / 60), mm = a % 60;
  const s = d > 0 ? d + ' g ' + h + ' h' : h > 0 ? h + ' h ' + mm + ' min' : mm + ' min';
  if (m > 0) return { t: 'tra ' + s, c: a <= 60 ? 'soon' : '' };
  return { t: s + ' fa', c: '' };
}
export function updCd() {
  const s = STEPS[S.i]; const el = $('#cd'); if (!el) return;
  if (!s.at) { el.textContent = 'giorni liberi'; el.className = 'cd'; return; }
  const r = fmtDelta(new Date(s.at) - Date.now()); el.textContent = r.t; el.className = 'cd ' + r.c;
}
setInterval(updCd, 30000);

export function drawStep(animate) {
  const s = STEPS[S.i];
  document.documentElement.style.setProperty('--mode', 'var(--' + s.mode + ')');
  const addr = s.addr ? '<div class="addr">' + s.addr + '</div>' : '';
  const chips = s.facts ? '<div class="chips">' + s.facts.map(f => {
    const cp = /PNR|Posto|Carrozza|Prenotazione/.test(f[0]);
    return '<span class="chip' + (cp ? ' copy' : '') + '"' + (cp ? ' data-v="' + f[1] + '" role="button"' : '') + '>' + f[0] + ' <b>' + f[1] + '</b>' + (cp ? ICONS.copy : '') + '</span>';
  }).join('') + '</div>' : '';
  let acts = '';
  if (s.tel) acts += '<a class="g pill tint" href="tel:' + s.tel + '">' + ICONS.phone + 'Chiama</a>';
  if (s.nav) acts += '<a class="g pill" href="' + s.nav + '" target="_blank" rel="noopener">' + ICONS.nav + 'Indicazioni</a>';
  acts = acts ? '<div class="acts">' + acts + '</div>' : '';
  const ck = S.checks[S.i] || [];
  const ready = s.ready ? '<div class="sec"><div class="eyebrow">Da avere in mano</div>' + s.ready.map((r, k) =>
    '<button class="g row' + (ck[k] ? ' ok' : '') + '" data-k="' + k + '"><span class="cb">' + ICONS.check + '</span><span class="t">' + r + '</span></button>').join('') + '</div>' : '';
  const notes = '<div class="sec"><div class="eyebrow">Da sapere</div>' + s.notes.map((n, k) => '<div class="g note' + (s.warn === k ? ' warn' : '') + '">' + n + '</div>').join('') + '</div>';
  const planb = s.planB ? '<div class="sec"><div class="eyebrow">Se va storto</div><div class="g planb"><div class="mi">' + ICONS.compass + '</div><p>' + s.planB + '</p></div></div>' : '';

  $('#viewStep').innerHTML =
    '<div class="g card hero"><div class="glow"></div><div class="hero-top"><div class="mi">' + ICONS[s.mode] + '</div><span class="day">' + s.day + '</span><span class="cd" id="cd"></span></div>' +
    '<div class="time' + (animate ? ' flip' : '') + '">' + s.time + '</div><h1 class="title">' + s.title + codeTag(s) + '</h1><div class="place">' + s.place + '</div>' + addr + chips + acts + '</div>' +
    ready + notes + planb;
  updCd();

  $$('#viewStep .row').forEach(b => b.onclick = () => {
    const k = +b.dataset.k; S.checks[S.i] = S.checks[S.i] || []; S.checks[S.i][k] = !S.checks[S.i][k];
    b.classList.toggle('ok', S.checks[S.i][k]); sfx(S.checks[S.i][k] ? 'check' : 'uncheck'); save();
  });
  $$('#viewStep .chip.copy').forEach(f => f.onclick = () => copyTxt(f.dataset.v));
}
