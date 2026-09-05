/* Radar: confronta la posizione GPS con quella prevista dall'itinerario in questo istante. */
import { STEPS } from './data/steps.js';
import { P } from './data/places.js';
import { $, toast, header } from './ui/dom.js';
import { ICONS } from './icons.js';
import { sfx } from './audio/sfx.js';
import { S } from './state.js';

const TOL = { stay: .8, road: 2, rail: 8, air: 30 };   // km
const GOPT = { enableHighAccuracy: true, timeout: 15000, maximumAge: 20000 };
const RAD = { pos: null, acc: null, ts: null, watch: null, timer: null, err: null, open: false };

export function hav(a, b) {
  const R = 6371, dLa = (b[0] - a[0]) * Math.PI / 180, dLo = (b[1] - a[1]) * Math.PI / 180, l1 = a[0] * Math.PI / 180, l2 = b[0] * Math.PI / 180;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(l1) * Math.cos(l2) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

/* Dove dovresti essere all'istante T. */
export function expectedAt(T) {
  const t0 = Date.parse(STEPS[0].at), tEnd = Date.parse(STEPS[STEPS.length - 1].at);
  if (T < t0) { const d = Math.ceil((t0 - T) / 864e5); return { pos: P.SIB, label: 'Stazione di Sibari', sub: 'Il viaggio inizia il 15 alle 06:19' + (d > 1 ? ' — tra ' + d + ' giorni' : ''), phase: 'pre', tol: null }; }
  if (T >= tEnd) return { pos: P.SIB, label: 'Sibari', sub: 'Viaggio concluso', phase: 'post', tol: null };
  let k = 0; STEPS.forEach((s, j) => { if (s.at && Date.parse(s.at) <= T) k = j; });
  const s = STEPS[k], g = s.geo;
  if (g.freeAfterH && T > Date.parse(s.at) + g.freeAfterH * 36e5) return { pos: g.p, label: g.freeLabel, sub: g.freeSub, phase: 'free', tol: null, k: k + 1 };
  if (g.from) {
    const ta = Date.parse(s.at), tb = Date.parse(g.arr);
    if (T < tb) { const f = Math.max(0, Math.min(1, (T - ta) / (tb - ta))); return { pos: lerp(g.from, g.to, f), label: s.title + (s.code ? ' ' + s.code : ''), sub: 'In viaggio verso ' + g.dest + ', ' + Math.round(f * 100) + '% del percorso', phase: 'transit', tol: TOL[s.mode] || 2, k }; }
    return { pos: g.to, label: g.dest, sub: 'Arrivato con ' + s.title + ', in attesa della prossima tappa', phase: 'wait', tol: 1.5, k };
  }
  return { pos: g.p, label: s.title, sub: s.place, phase: 'stay', tol: s.mode === 'stay' ? .8 : s.mode === 'air' ? 1.5 : 1, k };
}

const fmtKm = d => d < 1 ? Math.round(d * 1000) + '<small>m</small>' : (d < 10 ? d.toFixed(1) : Math.round(d)).toString().replace('.', ',') + '<small>km</small>';
const LAB = { ok: 'In posizione', warn: 'Vicino', bad: 'Fuori rotta' };

function state() {
  const e = expectedAt(Date.now()); let d = null, st = 'info';
  if (RAD.pos) { d = hav(RAD.pos, e.pos); if (e.tol != null) st = d <= e.tol ? 'ok' : d <= e.tol * 4 ? 'warn' : 'bad'; }
  return { e, d, st };
}
export function drawRadar() {
  const { e, d, st } = state();
  const lab = LAB[st] || (e.phase === 'free' ? 'Giornata libera' : e.phase === 'pre' ? 'Prima del viaggio' : e.phase === 'post' ? 'Viaggio concluso' : 'Posizione');
  const gm = 'https://www.google.com/maps/dir/?api=1&destination=' + e.pos[0].toFixed(5) + ',' + e.pos[1].toFixed(5) + '&travelmode=' + (e.phase === 'transit' ? 'transit' : 'walking');
  const when = RAD.ts ? new Date(RAD.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : null;
  let body;
  if (RAD.err) body = '<div class="rmsg">' + RAD.err + '</div>';
  else if (!RAD.pos) body = '<div class="rmsg">Cerco la tua posizione…</div>';
  else body = '<div class="rnum tnum">' + fmtKm(d) + '</div><div class="rlab">dal punto previsto</div>' +
    '<div class="chips rmeta"><span class="chip">±' + Math.round(RAD.acc) + ' m</span>' + (when ? '<span class="chip">Aggiornato <b>' + when + '</b></span>' : '') +
    (e.tol != null ? '<span class="chip">Tolleranza <b>' + (e.tol < 1 ? Math.round(e.tol * 1000) + ' m' : e.tol + ' km') + '</b></span>' : '') + (RAD.watch ? '<span class="chip">Monitoraggio attivo</span>' : '') + '</div>';

  $('#pRadar').innerHTML = header('Dove dovresti essere', 'Radar', { gear: true }) +
    '<div class="card"><div class="rstat"><span class="dotc ' + (RAD.pos ? st : 'idle') + '">' + ICONS.radar + '</span><div><b>' + lab + '</b><span>' + e.label + '</span></div></div>' + body +
    '<div class="racts"><button class="btn ghost" id="rRefresh">Aggiorna</button><button class="btn ' + (RAD.watch ? 'pri' : 'ghost') + '" id="rWatch">' + (RAD.watch ? 'Ferma' : 'Monitora') + '</button></div></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">Punto previsto adesso</span></div><div class="card"><div class="rstat"><span class="dotc info">' + ICONS.nav + '</span><div><b>' + e.label + '</b><span>' + e.sub + '</span></div></div>' +
    '<div class="racts"><a class="btn tealb" href="' + gm + '" target="_blank" rel="noopener">' + ICONS.nav + 'Portami lì</a></div></div></div>' +
    '<div class="sec"><div class="note">Il radar confronta il GPS del telefono con il punto in cui l\'itinerario prevede che tu sia in questo momento. Durante i giorni liberi misura solo la distanza dall\'hotel.</div></div>';
  $('#rRefresh').onclick = () => { sfx('tick'); radarFix(); };
  $('#rWatch').onclick = () => { sfx('tick'); RAD.watch ? radarStop() : radarWatch(); };
}
const redraw = () => { if (S.tab === 'radar') drawRadar(); };
function radarOk(p) { RAD.pos = [p.coords.latitude, p.coords.longitude]; RAD.acc = p.coords.accuracy; RAD.ts = p.timestamp; RAD.err = null; redraw(); }
function radarErr(x) {
  RAD.err = x.code === 1 ? 'Accesso alla posizione negato. Abilitalo nelle impostazioni del telefono per questa app.' : x.code === 2 ? 'Posizione non disponibile in questo momento.' : 'Timeout: riprova tra qualche secondo.';
  redraw();
}
function radarFix() {
  if (!navigator.geolocation) { RAD.err = 'Geolocalizzazione non supportata.'; redraw(); return; }
  RAD.err = null; redraw(); navigator.geolocation.getCurrentPosition(radarOk, radarErr, GOPT);
}
function radarWatch() {
  if (!navigator.geolocation) return;
  RAD.watch = navigator.geolocation.watchPosition(radarOk, radarErr, GOPT); RAD.timer = setInterval(redraw, 30000); redraw(); toast('Radar in monitoraggio');
}
function radarStop() {
  if (RAD.watch != null) navigator.geolocation.clearWatch(RAD.watch);
  RAD.watch = null; clearInterval(RAD.timer); RAD.timer = null; redraw();
}
/* chiamata quando si apre la scheda Radar */
export function radarShow() { if (!RAD.pos && !RAD.err) radarFix(); else drawRadar(); }
setInterval(() => { if (RAD.pos) redraw(); }, 60000);
