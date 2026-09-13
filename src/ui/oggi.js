/* Pagina "Oggi": la tappa corrente. */
import { STEPS } from '../data/steps.js';
import { ICONS } from '../icons.js';
import { S, save } from '../state.js';
import { $, $$, toast, header, emit, tileTxt } from './dom.js';
import { sfx } from '../audio/sfx.js';
import { weatherFor, WX_ICONS, deg, stepPos } from '../weather.js';
import { openNav } from './nav.js';
import { bagStrip, bagStripBind } from './valigia.js';
import { tilePop, allReady } from './celebra.js';

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const codeTag = s => s.code ? '<span class="code">' + esc(s.code) + '</span>' : '';
const ON = { air: '#26333A' };  // colore testo sulla tessera gialla

export function copyTxt(v) {
  (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
    .then(() => { toast('Copiato: ' + v); sfx('copy'); })
    .catch(() => toast(v));
}
/* indice della tappa "giusta per adesso", o -1 se il viaggio non è iniziato */
export function nowIndex() {
  const now = Date.now(); let best = -1;
  STEPS.forEach((s, k) => {
    /* i giorni liberi non hanno orario: valgono dalla mezzanotte del primo giorno */
    const t = s.at ? Date.parse(s.at) : (s.days && s.days.length ? Date.parse(s.days[0] + 'T00:00') : NaN);
    if (!isNaN(t) && t <= now) best = k;
  });
  return best;
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

/* "sab 19": per la riga "Poi" quando la tappa successiva è in un altro giorno */
function shortDay(x) {
  const d = new Date(x.at || (x.days && x.days.length ? x.days[0] + 'T12:00' : ''));
  return isNaN(d) ? '' : d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }).replace('.', '');
}
const route = dir => '<div class="route">' + STEPS.map((s, k) => '<i style="--c:var(--' + s.mode + ')" class="' + (k < S.i ? 'done' : k === S.i ? 'now' + (dir > 0 ? ' pulse' : '') : '') + '"></i>').join('') + '</div>';
const tile = (txt, k, ok) => '<button class="tile' + (ok ? ' ok' : '') + '" data-k="' + k + '"><span class="ti">' + ICONS.check + '</span><span class="tt">' + tileTxt(txt) + '</span></button>';

/* dir: 1 avanti, -1 indietro, 0 nessuna animazione */
export function drawOggi(dir) {
  const s = STEPS[S.i], last = S.i === STEPS.length - 1;
  const ni = nowIndex();
  const nowBtn = '';   // l'orologio nell'intestazione (dom.js) sostituisce il vecchio chip "Adesso"

  /* i chip scorrono in un nastro lento e continuo se non entrano nella tessera (vedi marquee) */
  const chips = s.facts ? '<div class="mq" id="mq"><div class="mq-track" id="mqTrack"><span class="mq-set">' + s.facts.map(f => {
    const cp = /PNR|Posto|Carrozza|Prenotazione|Biglietto/.test(f[0]);
    return '<span class="chip' + (cp ? ' copy' : '') + '"' + (cp ? ' data-v="' + esc(f[1]) + '" role="button"' : '') + '>' + esc(f[0]) + ' <b>' + esc(f[1]) + '</b>' + (cp ? ICONS.copy : '') + '</span>';
  }).join('') + '</span></div></div>' : '';
  let acts = '';
  if (s.tel) acts += '<a class="btn" href="tel:' + s.tel + '">' + ICONS.phone + 'Chiama</a>';
  if (s.nav) acts += '<button class="btn dk" id="bNav">' + ICONS.nav + 'Indicazioni</button>';
  if (s.docs) acts += '<button class="btn dk" id="bDocs">' + ICONS.doc + 'Documenti</button>';
  acts = acts ? '<div class="acts">' + acts + '</div>' : '';

  const hero = '<div class="hero" style="--mode:var(--' + s.mode + ');--on:' + (ON[s.mode] || '#fff') + '"><div class="mark">' + ICONS[s.mode] + '</div>' +
    '<div class="hero-top">' + ICONS[s.mode] + '<span class="day">' + s.day + '</span><span class="cd" id="cd"></span></div>' +
    '<div class="time tnum">' + (s.at ? s.time : '') + '</div><h2 class="title">' + s.title + codeTag(s) + '</h2>' +
    '<div class="place">' + s.place + '</div>' + (s.addr ? '<div class="addr">' + s.addr + '</div>' : '') + (s.det ? '<div class="det">' + s.det + '</div>' : '') + '<div class="wx" id="wx"><span class="wxp">Meteo in arrivo…</span></div>' + chips + acts + '</div>';

  const nav = '<div class="nav2"><button class="btn ghost" id="bBack"' + (S.i === 0 ? ' disabled' : '') + '>' + ICONS.chevL + 'Indietro</button>' +
    '<button class="btn pri next" id="bNext"' + (last ? ' disabled' : '') + '><span class="mark">' + ICONS.sign + '</span>' + (last ? 'Viaggio finito' : ICONS.sign + 'Fatto, avanti' + ICONS.chevR) + '</button></div>';

  /* cosa viene dopo: il giorno solo se cambia, poi ora e titolo */
  const nx = STEPS[S.i + 1];
  const nextup = nx ? '<div class="nextup">' + ICONS.chevR + '<span>Poi' + (nx.day !== s.day ? ' ' + shortDay(nx) : '') + (nx.at ? ' alle <b class="tnum">' + nx.time + '</b>' : '') + ' · ' + nx.title + codeTag(nx) + '</span></div>' : '';

  let ready = '';
  if (s.ready) {
    const ck = S.checks[S.i] || [];
    const todo = s.ready.map((r, k) => [r, k]).filter(x => !ck[x[1]]);
    const done = s.ready.map((r, k) => [r, k]).filter(x => ck[x[1]]);
    ready = '<div class="sec"><div class="sh"><span class="eyebrow">Da avere in mano</span><small>' + (todo.length ? todo.length + ' da controllare' : 'tutto pronto') + '</small></div>' +
      (todo.length ? '<div class="grid">' + todo.map(x => tile(x[0], x[1], false)).join('') + '</div>' : '') + '</div>';
    if (done.length) ready += '<div class="sec done"><div class="sh"><span class="eyebrow">Pronto</span><small>tocca per riportare su</small></div><div class="grid">' + done.map(x => tile(x[0], x[1], true)).join('') + '</div></div>';
  }
  const notes = '<div class="sec"><div class="sh"><span class="eyebrow">Da sapere</span></div>' + s.notes.map((n, k) => '<div class="note' + (s.warn === k ? ' warn' : '') + '">' + n + '</div>').join('') + '</div>';
  const planb = s.planB ? '<div class="sec"><div class="sh"><span class="eyebrow">Se va storto</span></div><div class="planb"><div class="mi">' + ICONS.compass + '</div><p>' + s.planB + '</p></div></div>' : '';

  /* striscia della valigia: alla partenza (pack "out") e ai check-out (pack "back") */
  $('#pOggi').innerHTML = header('Tappa ' + (S.i + 1) + ' di ' + STEPS.length, 'Oggi', { gear: true, extra: nowBtn }) + route(dir) + (s.pack ? bagStrip(s.pack) : '') +
    '<div class="sv' + (dir > 0 ? ' in-r' : dir < 0 ? ' in-l' : '') + '" id="sv">' + hero + nav + nextup + ready + notes + planb + '</div>';
  updCd(); loadWx(s); bagStripBind(); marquee();

  $('#bBack').onclick = () => emit('advance', -1);
  $('#bNext').onclick = () => emit('advance', 1);
  const nb = $('#bNow'); if (nb) nb.onclick = () => { sfx('tick'); emit('goto', ni); };
  const bd = $('#bDocs'); if (bd) bd.onclick = () => { sfx('tick'); emit('open', 'documenti'); };
  /* la tappa ha il link Google già scritto: destinazione e modalità si leggono da lì, le coordinate dal meteo */
  const bn = $('#bNav'); if (bn) bn.onclick = () => { const u = new URL(s.nav); openNav({ p: stepPos(s), q: u.searchParams.get('destination'), name: s.place, mode: u.searchParams.get('travelmode') || 'walking' }); };
  $$('#pOggi .tile').forEach(b => b.onclick = () => {
    const k = +b.dataset.k; S.checks[S.i] = S.checks[S.i] || []; S.checks[S.i][k] = !S.checks[S.i][k];
    const ok = !!S.checks[S.i][k], all = ok && s.ready.every((r, j) => S.checks[S.i][j]);
    sfx(ok ? 'pop' : 'uncheck'); save(); drawOggi(0);
    tilePop($('#pOggi .tile[data-k="' + k + '"]'), ok);
    if (all) setTimeout(() => allReady('Tutto in mano!'), 250);
  });
  $$('#pOggi .chip.copy').forEach(f => f.onclick = () => copyTxt(f.dataset.v));
}

/* nastro dei chip: parte solo se i chip non entrano; 26 px al secondo, si ferma mentre lo tieni premuto */
export function marquee() {
  const t = $('#mqTrack'), box = $('#mq'); if (!t || !box || t.dataset.mq) return;
  const set = t.firstElementChild, w = set.getBoundingClientRect().width;
  if (!box.clientWidth || !w) return;              // pagina non ancora visibile: si riprova quando lo è
  if (w <= box.clientWidth - 2) { t.dataset.mq = 'fermo'; return; }
  t.dataset.mq = 'scorre';
  t.appendChild(set.cloneNode(true));
  t.style.setProperty('--w', w.toFixed(1) + 'px'); t.style.animationDuration = (w / 26).toFixed(1) + 's'; t.classList.add('on');
  const hold = on => t.classList.toggle('hold', on);
  box.addEventListener('touchstart', () => hold(true), { passive: true }); box.addEventListener('touchend', () => hold(false), { passive: true }); box.addEventListener('touchcancel', () => hold(false), { passive: true });
  box.addEventListener('mousedown', () => hold(true)); box.addEventListener('mouseup', () => hold(false)); box.addEventListener('mouseleave', () => hold(false));
  $$('#mqTrack .chip.copy').forEach(f => f.onclick = () => copyTxt(f.dataset.v));
}

/* meteo nel luogo e all'ora della tappa */
function loadWx(s) {
  const k = S.i;
  weatherFor(s).then(w => {
    const el = $('#wx'); if (!el || S.i !== k) return;
    if (!w) { el.innerHTML = '<span class="wxp">Meteo non disponibile</span>'; return; }
    const tt = (x, when) => '<span class="wxt">' + (when ? '<small>' + when + '</small>' : '') + '<b>' + deg(x.tmax) + '</b><i>' + deg(x.tmin) + '</i></span>';
    if (w.days) {
      const dlab = d => { const v = new Date(d + 'T12:00'); return isNaN(v) ? '' : v.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }).replace('.', ''); };
      el.innerHTML = '<div class="wxd">' + w.days.map(x => x ? '<div class="wxc">' + WX_ICONS[x.ico] + tt(x, dlab(x.date)) + '<em>' + x.label + '</em></div>' : '').join('') + '</div><span class="src">Open-Meteo</span>';
    } else {
      el.innerHTML = WX_ICONS[w.ico] + '<div class="wxb"><b>' + w.label + (w.pop >= 30 ? ' · ' + w.pop + '% pioggia' : '') + '</b><span>' + (w.temp != null ? deg(w.temp) + ' alle ' + s.time + ' · ' : '') + 'max ' + deg(w.tmax) + ' · min ' + deg(w.tmin) + '</span></div><span class="src">Open-Meteo</span>';
    }
  }).catch(() => { const el = $('#wx'); if (el && S.i === k) el.innerHTML = '<span class="wxp">Meteo non disponibile</span>'; });
}
