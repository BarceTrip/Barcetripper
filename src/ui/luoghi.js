/* Pagina "Luoghi": mappa stilizzata di Barcellona con l'hotel al centro, i tuoi posti, le cose da vedere
   e le fontanelle; per ogni luogo il modo più comodo per arrivarci da dove sei (o dall'hotel). */
import { HOTEL, SANTS, ZONES, PLACES, FOUNTAINS, METRO, GEO } from '../data/luoghi.js';
import { ICONS } from '../icons.js';
import { S, save } from '../state.js';
import { $, $$, toast, header } from './dom.js';
import { sfx } from '../audio/sfx.js';

const YOU = { pos: null, acc: null, ts: 0, err: null, busy: false };
let sel = null, filter = 'all';
const HP = { id: 'hotel', n: 'Abba Sants', z: 'sants', p: HOTEL, a: 'Carrer de Numància 32', d: 'Il tuo hotel: metro Sants Estació a 300 m, reception 24 ore, deposito bagagli gratuito.', near: true, big: true };
const byId = id => id === 'hotel' ? HP : PLACES.find(p => p.id === id);

export function hav(a, b) {
  const R = 6371, dLa = (b[0] - a[0]) * Math.PI / 180, dLo = (b[1] - a[1]) * Math.PI / 180, l1 = a[0] * Math.PI / 180, l2 = b[0] * Math.PI / 180;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(l1) * Math.cos(l2) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/* proiezione centrata sull'hotel: 1 unità = 10 m, y verso il basso */
const xy = p => [(p[1] - HOTEL[1]) * 8350, -(p[0] - HOTEL[0]) * 11132];
const VIEW = { near: 440, city: 1200 };   // larghezza della mappa in unità: 4,4 km e 12 km

const inBcn = () => !!YOU.pos && hav(YOU.pos, HOTEL) < 30;
const origin = () => inBcn() ? YOU.pos : HOTEL;
/* a piedi: linea d'aria × 1,28 di strade, 78 m al minuto */
const walkMin = (a, b) => Math.max(1, Math.round(hav(a, b) * 1.28 * 1000 / 78));
const fmtKm = d => d < 1 ? Math.round(d * 100) * 10 + ' m' : d.toFixed(1).replace('.', ',') + ' km';
const metroTxt = m => (m.txt || 'da Sants Estació ' + m.l + ' direzione ' + m.dir + ', ' + m.n + (m.n === 1 ? ' fermata' : ' fermate') + ', scendi a ' + m.st) + (m.walk ? ', poi ' + m.walk + ' min a piedi' : '');

/* Il modo più comodo per arrivare a p: a piedi, in metro da Sants (2 min a fermata, 3 di attesa,
   6 per un cambio) oppure "con i mezzi" quando sei lontano da Sants e la strada è lunga. */
export function route(p) {
  const o = origin(), you = inBcn(), dist = hav(o, p.p) * 1.28, walk = walkMin(o, p.p);
  let metro = null;
  if (p.m && hav(o, SANTS) < 0.9) { const toSants = walkMin(o, SANTS); metro = { ...p.m, toSants, tot: toSants + 3 + p.m.n * 2 + (p.m.chg ? 6 : 0) + (p.m.walk || 0) }; }
  const best = metro && walk > 22 && metro.tot < walk - 5 ? 'metro' : !metro && walk > 35 ? 'transit' : 'walk';
  return { o, you, dist, walk, metro, best };
}

/* ---- mappa ---- */
const fx = v => v.toFixed(0);
const path = pts => 'M' + pts.map(p => xy(p).map(fx).join(' ')).join('L');
function mapSvg() {
  const city = S.pl.zoom === 'city', W = VIEW[city ? 'city' : 'near'], k = W / 400;
  let s = '<svg class="bcn" viewBox="' + (-W / 2) + ' ' + (-W / 2) + ' ' + W + ' ' + W + '" xmlns="http://www.w3.org/2000/svg">';
  s += '<path class="sea" d="' + path(GEO.sea) + 'Z"/><path class="hill" d="' + path(GEO.collserola) + 'Z"/><path class="hill" d="' + path(GEO.montjuic) + 'Z"/>';
  GEO.streets.forEach(st => { s += '<path class="street" d="' + path(st.pts) + '" stroke-width="' + (2.4 * k) + '"/>'; });
  s += '<path class="l3" d="' + path(METRO.L3) + '" stroke-width="' + (2.8 * k) + '"/><path class="l5" d="' + path(METRO.L5) + '" stroke-width="' + (2.8 * k) + '"/>';
  if (!city) s += FOUNTAINS.map(f => { const [x, y] = xy(f); return '<circle class="fnt" cx="' + fx(x) + '" cy="' + fx(y) + '" r="2.6"/>'; }).join('');
  GEO.labels.forEach(l => {
    if (city ? l.near : !l.near) return;
    const [x, y] = xy(l.p);
    s += '<text class="glab" x="' + fx(x) + '" y="' + fx(y) + '" font-size="' + l.sz + '"' + (l.rot ? ' transform="rotate(' + l.rot + ' ' + fx(x) + ' ' + fx(y) + ')"' : '') + '>' + l.t + '</text>';
  });
  if (sel) { const p = byId(sel); if (p) { const a = xy(origin()), b = xy(p.p); s += '<path class="rt" d="M' + a.map(fx).join(' ') + 'L' + b.map(fx).join(' ') + '" stroke-width="' + (2.4 * k) + '" stroke-dasharray="' + (7 * k) + ' ' + (6 * k) + '"/>'; } }
  const r = 6 * k, fs = 12 * k;
  const lab = (p, x, y) => {
    const lp = p.lp || 'r', off = r + 4 * k; let ax = x + off, ay = y + fs * .36, an = 'start';
    if (lp === 'l') { ax = x - off; an = 'end'; } else if (lp === 't') { ax = x; ay = y - off - fs * .2; an = 'middle'; } else if (lp === 'b') { ax = x; ay = y + off + fs * .85; an = 'middle'; }
    return '<text x="' + fx(ax) + '" y="' + fx(ay) + '" font-size="' + fs + '" text-anchor="' + an + '" stroke-width="' + (3.5 * k) + '">' + (p.s || p.n) + '</text>';
  };
  PLACES.forEach(p => {
    const [x, y] = xy(p.p), on = sel === p.id, inside = Math.abs(x) < W / 2 - 4 && Math.abs(y) < W / 2 - 4;
    if (!inside) return;
    /* nella vista città solo i luoghi principali hanno il nome, gli altri restano pallini piccoli */
    const show = !city || p.cl || on, rr = on ? r * 1.4 : city && !(p.big || p.z === 'mine') ? r * .6 : r;
    s += '<g class="pt' + (on ? ' on' : '') + (S.pl.done[p.id] ? ' done' : '') + '" data-id="' + p.id + '"><circle class="hit" cx="' + fx(x) + '" cy="' + fx(y) + '" r="' + (16 * k) + '"/>' +
      (S.pl.want[p.id] ? '<circle class="wr" cx="' + fx(x) + '" cy="' + fx(y) + '" r="' + (rr + 3.5 * k) + '" stroke-width="' + (2 * k) + '"/>' : '') +
      '<circle class="d" cx="' + fx(x) + '" cy="' + fx(y) + '" r="' + rr + '" fill="' + ZONES[p.z].c + '" stroke-width="' + (1.6 * k) + '"/>' + (show ? lab(p, x, y) : '') + '</g>';
  });
  /* l'hotel: uno spillo con la punta sul punto esatto */
  const hk = 1.1 * k;
  s += '<g class="hpin' + (sel === 'hotel' ? ' on' : '') + '" data-id="hotel"><g transform="scale(' + hk + ')"><path d="M0 0C-9-10-11-15-11-20a11 11 0 0 1 22 0c0 5-2 10-11 20z" stroke-width="1.6"/><circle cx="0" cy="-20" r="4.2"/></g>' +
    '<text class="hlab" x="' + fx(14 * hk) + '" y="' + fx(-15 * hk) + '" font-size="' + (12.5 * k) + '" stroke-width="' + (3.5 * k) + '">Abba Sants</text></g>';
  if (inBcn()) { const [x, y] = xy(YOU.pos), ar = Math.min(60 * k, Math.max(0, (YOU.acc || 0) / 10)); s += '<circle class="youa" cx="' + fx(x) + '" cy="' + fx(y) + '" r="' + fx(ar) + '"/><circle class="you" cx="' + fx(x) + '" cy="' + fx(y) + '" r="' + (6.5 * k) + '" stroke-width="' + (2.2 * k) + '"/>'; }
  return s + '</svg>';
}

/* ---- scheda del luogo scelto ---- */
function detail(p) {
  const r = route(p), from = r.you ? 'dalla tua posizione' : 'dall\'hotel';
  let main, alt = '', ico = ICONS.road;
  if (p.id === 'hotel' && r.you && r.dist < .08) main = '<b>Sei in hotel.</b>';
  else if (p.id === 'hotel' && !r.you) main = '<b>Il punto di partenza.</b> Quando sei a Barcellona, da qui ti porto indietro.';
  else if (r.best === 'walk') { main = '<b>A piedi, ' + r.walk + ' min</b> ' + from + ', ' + fmtKm(r.dist) + '.'; if (r.metro && r.walk > 15) alt = 'In metro circa ' + r.metro.tot + ' min: ' + metroTxt(r.metro) + '.'; }
  else if (r.best === 'metro') { ico = ICONS.rail; main = '<b>In metro, circa ' + r.metro.tot + ' min.</b> ' + (r.metro.toSants > 1 ? r.metro.toSants + ' min a piedi fino a Sants Estació, poi ' : '') + metroTxt(r.metro) + '.'; alt = 'A piedi sarebbero ' + r.walk + ' min, ' + fmtKm(r.dist) + '.'; }
  else { ico = ICONS.rail; main = '<b>Con i mezzi.</b> Sei lontano da Sants: apri le indicazioni e prendi la soluzione proposta.'; alt = 'A piedi ' + r.walk + ' min, ' + fmtKm(r.dist) + '.'; }
  const dest = p.p[0].toFixed(5) + ',' + p.p[1].toFixed(5), org = r.you ? '' : '&origin=' + HOTEL[0] + ',' + HOTEL[1];
  const gm = mode => 'https://www.google.com/maps/dir/?api=1&destination=' + dest + org + '&travelmode=' + mode;
  const chips = (p.h ? '<span class="chip">' + ICONS.clock + p.h + '</span>' : '') + (p.book ? '<span class="chip warn">Prenota prima</span>' : '') + (p.sun ? '<span class="chip">Bello al tramonto</span>' : '');
  const hotel = p.id === 'hotel';
  return '<div class="card pdet" style="--c:' + ZONES[p.z].c + '"><div class="pdh"><i class="zdot"></i><div class="pt"><b>' + p.n + '</b><span>' + (p.a || ZONES[p.z].n) + '</span></div>' +
    (hotel ? '' : '<button class="ibtn' + (S.pl.want[p.id] ? ' on' : '') + '" id="lWant" aria-label="Da vedere">' + ICONS.star + '</button><button class="ibtn' + (S.pl.done[p.id] ? ' ok' : '') + '" id="lDone" aria-label="Fatto">' + ICONS.check + '</button>') + '</div>' +
    '<p>' + p.d + '</p>' + (chips ? '<div class="chips">' + chips + '</div>' : '') +
    '<div class="rte"><span class="mi">' + ico + '</span><div>' + main + (alt ? '<small>' + alt + '</small>' : '') + '</div></div>' +
    '<div class="acts"><a class="btn tealb" href="' + gm('walking') + '" target="_blank" rel="noopener">' + ICONS.road + 'A piedi</a><a class="btn" href="' + gm('transit') + '" target="_blank" rel="noopener">' + ICONS.rail + 'Con i mezzi</a></div></div>';
}
function row(p) {
  const r = route(p), on = sel === p.id;
  const how = r.best === 'walk' ? r.walk + ' min a piedi' : r.best === 'metro' ? (r.metro.l || 'Metro') + ' · ' + r.metro.tot + ' min' : fmtKm(r.dist);
  return '<button class="prow' + (on ? ' on' : '') + (S.pl.done[p.id] ? ' done' : '') + '" data-id="' + p.id + '" style="--c:' + ZONES[p.z].c + '"><i class="zdot"></i><span class="pb"><b>' + p.n + (S.pl.want[p.id] ? '<em class="wm">' + ICONS.star + '</em>' : '') + '</b><span>' + (p.a || '') + '</span></span><span class="ph tnum">' + how + '</span></button>';
}

export function drawLuoghi() {
  const city = S.pl.zoom === 'city', you = inBcn(), o = origin();
  const eyebrow = you ? 'Dalla tua posizione · ±' + Math.round(YOU.acc) + ' m' : (YOU.err || 'Distanze dall\'hotel');
  const locBtn = '<button class="ibtn' + (YOU.busy ? ' busy' : '') + '" id="lLoc" aria-label="Dove sono">' + ICONS.locate + '</button>';
  const map = '<div class="map">' + mapSvg() + '<div class="mapz"><button data-z="near"' + (!city ? ' class="on"' : '') + '>Vicino</button><button data-z="city"' + (city ? ' class="on"' : '') + '>Città</button></div></div>' +
    '<div class="legend">' + Object.keys(ZONES).map(z => '<span><i style="--c:' + ZONES[z].c + '"></i>' + ZONES[z].n + '</span>').join('') + '<span><i style="--c:#7FC4E8;width:7px;height:7px"></i>Fontanelle</span><span><i style="--c:#4DA3FF"></i>Tu</span></div>';
  const det = sel && byId(sel) ? detail(byId(sel)) : '<div class="hint">Tocca un pallino sulla mappa o un posto nell\'elenco: ti dico come arrivarci.</div>';
  const groups = [['I tuoi posti', PLACES.filter(p => p.z === 'mine')], ['A piedi dall\'hotel', PLACES.filter(p => p.z !== 'mine' && p.near)], ['In città, in metro', PLACES.filter(p => p.z !== 'mine' && !p.near)]];
  const chips = '<div class="chips lfil">' + [['all', 'Tutti'], ['want', ICONS.star + 'Da vedere'], ['done', ICONS.check + 'Fatti']].map(f => '<button class="chip' + (filter === f[0] ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>';
  const list = groups.map(g => {
    let its = g[1]; if (filter === 'want') its = its.filter(p => S.pl.want[p.id]); if (filter === 'done') its = its.filter(p => S.pl.done[p.id]); if (!its.length) return '';
    its = its.slice().sort((a, b) => hav(o, a.p) - hav(o, b.p));
    return '<div class="sec"><div class="sh"><span class="eyebrow">' + g[0] + '</span><small>' + its.length + '</small></div>' + its.map(row).join('') + '</div>';
  }).join('') || '<div class="hint">Niente qui: segna i posti con la stella o con la spunta.</div>';
  $('#pLuoghi').innerHTML = header(eyebrow, 'Luoghi', { gear: true, extra: locBtn }) + map + det + chips + list + '<div class="about">Tempi stimati. Orari indicativi, verifica prima. Dati da OpenStreetMap.</div>';

  $$('#pLuoghi .bcn .pt, #pLuoghi .bcn .hpin').forEach(g => g.addEventListener('click', () => select(g.dataset.id, false)));
  $$('#pLuoghi .prow').forEach(b => b.onclick = () => select(b.dataset.id, true));
  $$('#pLuoghi .mapz button').forEach(b => b.onclick = () => { if (S.pl.zoom !== b.dataset.z) { S.pl.zoom = b.dataset.z; save(); sfx('tick'); drawLuoghi(); } });
  $('#lLoc').onclick = () => { sfx('tick'); locate(true); };
  $$('#pLuoghi .lfil .chip').forEach(b => b.onclick = () => { filter = b.dataset.f; sfx('tick'); drawLuoghi(); });
  const w = $('#lWant'); if (w) w.onclick = () => { if (S.pl.want[sel]) delete S.pl.want[sel]; else S.pl.want[sel] = true; save(); sfx(S.pl.want[sel] ? 'check' : 'uncheck'); drawLuoghi(); };
  const d = $('#lDone'); if (d) d.onclick = () => { if (S.pl.done[sel]) delete S.pl.done[sel]; else S.pl.done[sel] = true; save(); sfx(S.pl.done[sel] ? 'check' : 'uncheck'); drawLuoghi(); };
}
function select(id, scroll) {
  sel = sel === id && !scroll ? null : id; sfx('tick'); drawLuoghi();
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---- posizione ---- */
export function locate(force) {
  if (!navigator.geolocation) { if (force) toast('Posizione non disponibile'); return; }
  if (!force && YOU.pos && Date.now() - YOU.ts < 120000) return;
  YOU.busy = true; if (force) drawLuoghi();
  navigator.geolocation.getCurrentPosition(p => {
    YOU.pos = [p.coords.latitude, p.coords.longitude]; YOU.acc = p.coords.accuracy; YOU.ts = Date.now(); YOU.err = null; YOU.busy = false;
    if (S.tab === 'luoghi') { drawLuoghi(); if (force) toast(inBcn() ? 'Posizione aggiornata' : 'Non sei a Barcellona: distanze dall\'hotel'); }
  }, e => {
    YOU.busy = false; YOU.err = e.code === 1 ? 'Posizione negata: distanze dall\'hotel' : 'Posizione non trovata: distanze dall\'hotel';
    if (S.tab === 'luoghi') drawLuoghi();
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}
/* chiamata quando si apre la scheda */
export function luoghiShow() {
  /* ?tab=luoghi&luogo=sagrada apre direttamente un luogo (comodo per i test) */
  if (sel === null) { const q = new URLSearchParams(location.search).get('luogo'); if (q && byId(q)) sel = q; }
  drawLuoghi(); locate(false);
}
