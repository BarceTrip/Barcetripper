/* Radar: confronta la posizione GPS con quella prevista dall'itinerario in questo istante. */
import { STEPS } from './data/steps.js';
import { P } from './data/places.js';
import { $ } from './ui/dom.js';
import { sfx } from './audio/sfx.js';
import { toast } from './ui/dom.js';

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

function radarEval() {
  const e = expectedAt(Date.now()); let d = null, st = 'info';
  if (RAD.pos) { d = hav(RAD.pos, e.pos); if (e.tol != null) st = d <= e.tol ? 'ok' : d <= e.tol * 4 ? 'warn' : 'bad'; }
  $('#bRadar').className = 'g radar ' + (RAD.pos ? st : 'idle');
  const bd = $('#rBadge');
  if (RAD.pos) { bd.innerHTML = fmtKm(d).replace('<small>', ' ').replace('</small>', ''); bd.classList.add('on'); } else bd.classList.remove('on');
  if (RAD.open) radarDraw(e, d, st);
}
function radarDraw(e, d, st) {
  const lab = { ok: 'In posizione', warn: 'Vicino', bad: 'Fuori rotta', info: e.phase === 'free' ? 'Libero' : e.phase === 'pre' ? 'Prima del viaggio' : 'Info' }[st];
  const gm = 'https://www.google.com/maps/dir/?api=1&destination=' + e.pos[0].toFixed(5) + ',' + e.pos[1].toFixed(5) + '&travelmode=' + (e.phase === 'transit' ? 'transit' : 'walking');
  const when = RAD.ts ? new Date(RAD.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '—';
  let body;
  if (RAD.err) body = '<div class="rp-msg">' + RAD.err + '</div>';
  else if (!RAD.pos) body = '<div class="rp-msg">Cerco la tua posizione…</div>';
  else body = '<div class="rp-num">' + fmtKm(d) + '</div><div class="rp-lab">dal punto previsto: ' + e.label + '</div><div class="rp-sub">' + e.sub + '</div>' +
    '<div class="rp-meta"><span>Precisione ±' + Math.round(RAD.acc) + ' m</span><span>Aggiornato ' + when + '</span>' + (e.tol != null ? '<span>Tolleranza ' + (e.tol < 1 ? Math.round(e.tol * 1000) + ' m' : e.tol + ' km') + '</span>' : '') + (RAD.watch ? '<span>Monitoraggio attivo</span>' : '') + '</div>';
  $('#rPanel').innerHTML = '<div class="rp-h"><b>Radar</b><span class="rp-st ' + st + '"><i></i>' + lab + '</span></div>' + body +
    '<div class="rp-acts"><button class="g pill" id="rRefresh">Aggiorna</button><a class="g pill" href="' + gm + '" target="_blank" rel="noopener">Portami lì</a><button class="g pill' + (RAD.watch ? ' tint' : '') + '" id="rWatch">' + (RAD.watch ? 'Ferma' : 'Monitora') + '</button></div>';
  $('#rRefresh').onclick = () => { sfx('tick'); radarFix(); };
  $('#rWatch').onclick = () => { sfx('tick'); RAD.watch ? radarStop() : radarWatch(); };
}
function radarOk(p) { RAD.pos = [p.coords.latitude, p.coords.longitude]; RAD.acc = p.coords.accuracy; RAD.ts = p.timestamp; RAD.err = null; radarEval(); }
function radarErr(x) {
  RAD.err = x.code === 1 ? 'Accesso alla posizione negato. Abilitalo nelle impostazioni del telefono per questa app.' : x.code === 2 ? 'Posizione non disponibile in questo momento.' : 'Timeout: riprova tra qualche secondo.';
  radarEval();
}
function radarFix() {
  if (!navigator.geolocation) { RAD.err = 'Geolocalizzazione non supportata.'; radarEval(); return; }
  RAD.err = null; radarEval(); navigator.geolocation.getCurrentPosition(radarOk, radarErr, GOPT);
}
function radarWatch() {
  if (!navigator.geolocation) return;
  RAD.watch = navigator.geolocation.watchPosition(radarOk, radarErr, GOPT); RAD.timer = setInterval(radarEval, 30000); radarEval(); toast('Radar in monitoraggio');
}
function radarStop() {
  if (RAD.watch != null) navigator.geolocation.clearWatch(RAD.watch);
  RAD.watch = null; clearInterval(RAD.timer); RAD.timer = null; radarEval();
}
export function radarToggle() {
  RAD.open = !RAD.open; $('#rPanel').classList.toggle('on', RAD.open); $('#scrim').classList.toggle('on', RAD.open);
  if (RAD.open) { sfx('tick'); if (!RAD.pos) radarFix(); else radarEval(); }
}
export function radarClose() { if (RAD.open) { RAD.open = false; $('#rPanel').classList.remove('on'); } }
export function radarInit() {
  $('#bRadar').onclick = radarToggle;
  $('#scrim').addEventListener('click', radarClose);
  setInterval(() => { if (RAD.pos) radarEval(); }, 60000);
}
