/* Pagina "Luoghi": mappa 3D interattiva (MapLibre GL, mappe OpenFreeMap, rilievo AWS Terrain Tiles) con l'hotel,
   i tuoi posti, le cose da vedere e le fontanelle; per ogni luogo il modo più comodo per arrivarci da dove sei.
   La mappa e il percorso a piedi reale (OSRM) hanno bisogno della rete; elenco e stime funzionano anche senza. */
import { Map as GLMap, NavigationControl, GeolocateControl, Marker, setWorkerUrl } from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { HOTEL, SANTS, ZONES, PLACES, FOUNTAINS, METRO } from '../data/luoghi.js';
import { ICONS } from '../icons.js';
import { S, save } from '../state.js';
import { $, $$, toast, header, emit } from './dom.js';
import { sfx } from '../audio/sfx.js';

/* il worker di MapLibre viene impacchettato da Vite come modulo separato */
setWorkerUrl(mapWorkerUrl);

const STYLE = { light: 'https://tiles.openfreemap.org/styles/liberty', dark: 'https://tiles.openfreemap.org/styles/fiord' };
const DEM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const OSRM = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/';
const EMPTY = { type: 'FeatureCollection', features: [] };
const YOU = { pos: null, acc: null, err: null, drawn: null };
const M = { map: null, geo: null, theme: null, ready: false, pitch: true };
let sel = null, filter = 'all';
const walks = new Map();   // percorso a piedi reale per luogo: { o, km, min, geo }
const NEAR = 0.15;         // km: sotto questa distanza il percorso salvato vale ancora
const HP = { id: 'hotel', n: 'Abba Sants', z: 'sants', p: HOTEL, a: 'Carrer de Numància 32', d: 'Il tuo hotel: metro Sants Estació a 300 m, reception 24 ore, deposito bagagli gratuito.', near: true, big: true };
const byId = id => id === 'hotel' ? HP : PLACES.find(p => p.id === id);

export function hav(a, b) {
  const R = 6371, dLa = (b[0] - a[0]) * Math.PI / 180, dLo = (b[1] - a[1]) * Math.PI / 180, l1 = a[0] * Math.PI / 180, l2 = b[0] * Math.PI / 180;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(l1) * Math.cos(l2) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const inBcn = () => !!YOU.pos && hav(YOU.pos, HOTEL) < 30;
const origin = () => inBcn() ? YOU.pos : HOTEL;
/* stima a piedi senza rete: linea d'aria × 1,28 di strade, 78 m al minuto */
const walkMin = (a, b) => Math.max(1, Math.round(hav(a, b) * 1.28 * 1000 / 78));
const fmtKm = d => d < 1 ? Math.round(d * 100) * 10 + ' m' : d.toFixed(1).replace('.', ',') + ' km';
const metroTxt = m => (m.txt || 'da Sants Estació ' + m.l + ' direzione ' + m.dir + ', ' + m.n + (m.n === 1 ? ' fermata' : ' fermate') + ', scendi a ' + m.st) + (m.walk ? ', poi ' + m.walk + ' min a piedi' : '');
const lngLat = p => [p[1], p[0]];

/* Il modo più comodo per arrivare a p: a piedi (con il percorso reale se è già arrivato, altrimenti la stima),
   in metro da Sants (2 min a fermata, 3 di attesa, 6 per un cambio) oppure "con i mezzi" quando sei lontano da Sants. */
const walkOf = (o, p) => { const w = walks.get(p.id); return w && hav(o, w.o) < NEAR ? w : null; };
export function route(p) {
  const o = origin(), you = inBcn(), w = walkOf(o, p);
  const dist = w ? w.km : hav(o, p.p) * 1.28, walk = w ? w.min : walkMin(o, p.p);
  let metro = null;
  if (p.m && hav(o, SANTS) < 0.9) { const toSants = walkMin(o, SANTS); metro = { ...p.m, toSants, tot: toSants + 3 + p.m.n * 2 + (p.m.chg ? 6 : 0) + (p.m.walk || 0) }; }
  /* per tornare in hotel da lontano: la fermata L3/L5 più comoda vicino a te, fino a Sants */
  if (!metro && p.id === 'hotel' && you) metro = metroToSants(o);
  const best = metro && walk > 22 && metro.tot < walk - 5 ? 'metro' : !metro && walk > 35 ? 'transit' : 'walk';
  return { o, you, dist, walk, metro, best, real: !!w };
}
function metroToSants(o) {
  let best = null;
  METRO.forEach(L => {
    const si = L.st.findIndex(s => s[0] === 'Sants Estació');
    L.st.forEach((s, i) => {
      if (i === si) return; const pos = [s[1], s[2]]; if (hav(o, pos) > 1.2) return;
      const walkTo = walkMin(o, pos), n = Math.abs(i - si), dir = i < si ? L.ends[1] : L.ends[0], tot = walkTo + 3 + 2 * n + 5;
      if (!best || tot < best.tot) best = { l: L.l, n, walk: 5, tot, txt: 'dalla fermata ' + s[0] + ', a ' + walkTo + ' min a piedi, ' + L.l + ' direzione ' + dir + ', ' + n + (n === 1 ? ' fermata' : ' fermate') + ', scendi a Sants Estació' };
    });
  });
  return best;
}
/* percorso a piedi reale da OSRM (server FOSSGIS, profilo pedonale) */
async function fetchWalk(o, p) {
  const have = walkOf(o, p); if (have) return have;
  const r = await fetch(OSRM + o[1] + ',' + o[0] + ';' + p.p[1] + ',' + p.p[0] + '?overview=full&geometries=geojson');
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json(); const rt = j.routes && j.routes[0]; if (j.code !== 'Ok' || !rt) throw new Error('no route');
  const v = { o, km: rt.distance / 1000, min: Math.max(1, Math.round(rt.duration / 60)), geo: rt.geometry };
  walks.set(p.id, v); return v;
}

/* ---- mappa ---- */
function placesGeo() {
  return { type: 'FeatureCollection', features: PLACES.map(p => ({ type: 'Feature', geometry: { type: 'Point', coordinates: lngLat(p.p) },
    properties: { id: p.id, s: p.s || p.n, color: ZONES[p.z].c, prio: p.z === 'mine' ? 0 : p.big ? 1 : 2, want: S.pl.want[p.id] ? 1 : 0, done: S.pl.done[p.id] ? 1 : 0, sel: sel === p.id ? 1 : 0 } })) };
}
function initMap() {
  M.theme = S.theme;
  const map = M.map = new GLMap({ container: 'lCanvas', style: STYLE[S.theme], center: lngLat(HOTEL), zoom: 14.3, pitch: 55, bearing: -20, maxPitch: 72, attributionControl: { compact: true }, preserveDrawingBuffer: new URLSearchParams(location.search).has('shot') });   // ?shot serve solo agli screenshot di test
  map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
  M.geo = new GeolocateControl({ positionOptions: { enableHighAccuracy: true, timeout: 12000 }, trackUserLocation: true, showAccuracyCircle: true, fitBoundsOptions: { maxZoom: 16 } });
  map.addControl(M.geo, 'top-right');
  M.geo.on('trackuserlocationstart', () => { M.tracking = true; });
  M.geo.on('trackuserlocationend', () => { M.tracking = false; });
  M.geo.on('geolocate', e => {
    YOU.pos = [e.coords.latitude, e.coords.longitude]; YOU.acc = e.coords.accuracy; YOU.err = null; eyebrow();
    /* la lista si ridisegna solo se ti sei spostato di almeno 30 m */
    if (!YOU.drawn || hav(YOU.drawn, YOU.pos) > .03) { const first = !YOU.drawn; YOU.drawn = YOU.pos; drawBody(); drawRoute(); if (first && sel === 'hotel') fitSel(); }
  });
  M.geo.on('error', e => { YOU.err = e.code === 1 ? 'Posizione negata: distanze dall\'hotel' : 'Posizione non trovata: distanze dall\'hotel'; eyebrow(); });
  map.on('style.load', addData);
  map.on('load', () => { if (S.tab === 'luoghi') geoOn(); });
  map.on('error', e => { console.warn('Mappa:', e && e.error ? e.error.message || e.error : e); if (!M.ready) { const el = $('#lOff'); if (el) el.hidden = false; } });
  /* lo spillo dell'hotel */
  const el = document.createElement('button'); el.className = 'hpin'; el.setAttribute('aria-label', 'Abba Sants');
  el.innerHTML = '<span class="hpin-b">' + ICONS.stay + '</span><span class="hpin-t">Abba Sants</span>';
  el.onclick = () => select('hotel', false);
  new Marker({ element: el, anchor: 'bottom' }).setLngLat(lngLat(HOTEL)).addTo(map);
}
/* rilievo, edifici 3D, fontanelle, luoghi, percorso: si rifanno a ogni cambio di stile (tema) */
function addData() {
  const map = M.map, dark = M.theme === 'dark', style = map.getStyle();
  const firstSym = (style.layers.find(l => l.type === 'symbol') || {}).id;
  if (!map.getSource('dem')) map.addSource('dem', { type: 'raster-dem', tiles: [DEM], encoding: 'terrarium', tileSize: 256, maxzoom: 15, attribution: 'Terrain Tiles (AWS)' });
  map.setTerrain({ source: 'dem', exaggeration: 1.15 });
  map.addLayer({ id: 'hills', type: 'hillshade', source: 'dem', paint: { 'hillshade-exaggeration': dark ? .28 : .38, 'hillshade-shadow-color': dark ? '#0b1320' : '#6b5d4a', 'hillshade-highlight-color': dark ? '#5a6d8a' : '#ffffff' } }, firstSym);
  if (!map.getLayer('building-3d')) {
    const vec = Object.keys(style.sources).find(k => style.sources[k].type === 'vector');
    if (vec) map.addLayer({ id: 'building-3d', type: 'fill-extrusion', source: vec, 'source-layer': 'building', minzoom: 14, paint: { 'fill-extrusion-color': dark ? '#5d6f92' : '#d8cfc2', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': .7 } }, firstSym);
  }
  map.addSource('fnt', { type: 'geojson', data: { type: 'FeatureCollection', features: FOUNTAINS.map(f => ({ type: 'Feature', geometry: { type: 'Point', coordinates: lngLat(f) }, properties: {} })) } });
  map.addLayer({ id: 'fnt', type: 'circle', source: 'fnt', minzoom: 13.5, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 13.5, 2, 17, 5.5], 'circle-color': '#4DB6E8', 'circle-stroke-color': '#fff', 'circle-stroke-width': 1, 'circle-pitch-alignment': 'map' } });
  map.addSource('rt', { type: 'geojson', data: EMPTY });
  map.addLayer({ id: 'rt', type: 'line', source: 'rt', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': dark ? '#F3F6F7' : '#26333A', 'line-width': 4, 'line-opacity': .8, 'line-dasharray': [1.2, 1.4] } });
  map.addSource('pl', { type: 'geojson', data: placesGeo() });
  map.addLayer({ id: 'pl-want', type: 'circle', source: 'pl', filter: ['==', ['get', 'want'], 1], paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 8, 15, 13], 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': dark ? '#fff' : '#26333A', 'circle-stroke-width': 2, 'circle-pitch-alignment': 'map' } });
  map.addLayer({ id: 'pl', type: 'circle', source: 'pl', paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, ['case', ['==', ['get', 'sel'], 1], 9, ['<=', ['get', 'prio'], 1], 5, 3.5], 15, ['case', ['==', ['get', 'sel'], 1], 12, 8]],
    'circle-color': ['get', 'color'], 'circle-stroke-color': ['case', ['==', ['get', 'sel'], 1], '#fff', dark ? '#1F2A31' : '#ffffff'], 'circle-stroke-width': 2,
    'circle-opacity': ['case', ['==', ['get', 'done'], 1], .5, 1] } });
  map.addLayer({ id: 'pl-lab', type: 'symbol', source: 'pl', layout: {
    'text-field': ['step', ['zoom'], ['case', ['<=', ['get', 'prio'], 1], ['get', 's'], ''], 14, ['get', 's']], 'text-font': ['Noto Sans Bold'], 'text-size': 12.5,
    'text-variable-anchor': ['left', 'right', 'top', 'bottom'], 'text-radial-offset': 1, 'text-justify': 'auto', 'symbol-sort-key': ['get', 'prio'] },
    paint: { 'text-color': dark ? '#F3F6F7' : '#26333A', 'text-halo-color': dark ? '#1F2A31' : '#ffffff', 'text-halo-width': 1.6 } });
  if (!M.clicks) { M.clicks = true; ['pl', 'pl-lab'].forEach(l => map.on('click', l, e => { const f = e.features && e.features[0]; if (f) select(f.properties.id, false); })); }
  M.ready = true; drawRoute(); offline(); if (sel === 'hotel') fitSel();
}
const refreshPl = () => { if (M.ready) M.map.getSource('pl').setData(placesGeo()); };
function drawRoute() {
  if (!M.ready) return;
  const p = sel && byId(sel); if (!p) { M.map.getSource('rt').setData(EMPTY); return; }
  const o = origin(), w = walkOf(o, p);
  M.map.getSource('rt').setData({ type: 'Feature', geometry: w ? w.geo : { type: 'LineString', coordinates: [lngLat(o), lngLat(p.p)] }, properties: {} });
}
/* l'avviso copre la mappa solo finché lo stile non è arrivato e la rete manca (o il caricamento è fallito) */
function offline() { const el = $('#lOff'); if (el) el.hidden = M.ready || navigator.onLine !== false; }
/* inquadra origine e destinazione (e il percorso reale, se è già arrivato) così il tratteggio si vede tutto */
function fitSel() {
  const p = sel && byId(sel); if (!M.ready || !p) return;
  const pts = [lngLat(origin()), lngLat(p.p)], w = walkOf(origin(), p); if (w) pts.push(...w.geo.coordinates);
  const lng = pts.map(c => c[0]), lat = pts.map(c => c[1]);
  const cam = M.map.cameraForBounds([[Math.min(...lng), Math.min(...lat)], [Math.max(...lng), Math.max(...lat)]], { padding: { top: 70, bottom: 50, left: 45, right: 45 }, maxZoom: 16.5 });
  if (cam) M.map.easeTo({ center: cam.center, zoom: cam.zoom, bearing: 0, pitch: M.pitch ? 45 : 0, duration: 900 });
}
/* "Portami in hotel": seleziona l'hotel, chiede la posizione se manca e inquadra il tragitto. Usato anche dal SOS. */
export function goHotel() {
  sel = 'hotel'; sfx('tick');
  if (S.tab !== 'luoghi') emit('open', 'luoghi'); else { drawBody(); refreshPl(); drawRoute(); }
  fitSel(); window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!inBcn() && !M.tracking) { toast('Cerco la tua posizione…'); geoOn(); }
}

/* ---- pagina ---- */
function build() {
  $('#pLuoghi').innerHTML = header('Distanze dall\'hotel', 'Luoghi', { gear: true, extra: '<button class="ibtn" id="lLoc" aria-label="Dove sono">' + ICONS.locate + '</button>' }) +
    '<div class="map"><div id="lCanvas"></div><div class="mapui"><button id="lPitch" class="on">3D</button><button id="lHome" aria-label="Portami in hotel">' + ICONS.stay + '</button></div>' +
    '<div class="mapoff" id="lOff" hidden><b>Serve la rete per la mappa</b><span>Elenco, stime e indicazioni funzionano lo stesso.</span></div></div>' +
    '<div class="legend">' + Object.keys(ZONES).map(z => '<span><i style="--c:' + ZONES[z].c + '"></i>' + ZONES[z].n + '</span>').join('') + '<span><i style="--c:#4DB6E8;width:7px;height:7px"></i>Fontanelle</span></div>' +
    '<div id="lBody"></div><div class="about">Mappa OpenFreeMap · rilievo AWS Terrain Tiles · percorsi a piedi OSRM · orari indicativi, verifica prima</div>';
  $('#lLoc').onclick = () => { sfx('tick'); M.tracking ? luoghiPause() : geoOn(); };
  $('#lPitch').onclick = () => { M.pitch = !M.pitch; sfx('tick'); $('#lPitch').classList.toggle('on', M.pitch); if (M.map) M.map.easeTo({ pitch: M.pitch ? 55 : 0, duration: 600 }); };
  $('#lHome').onclick = goHotel;
  window.addEventListener('online', offline); window.addEventListener('offline', offline);
  initMap(); offline();
}
function eyebrow() {
  const el = $('#pLuoghi .ph .eyebrow'); if (!el) return;
  el.textContent = inBcn() ? 'Dalla tua posizione · ±' + Math.round(YOU.acc) + ' m' : (YOU.err || (YOU.pos ? 'Non sei a Barcellona: distanze dall\'hotel' : 'Distanze dall\'hotel'));
}
function detail(p) {
  const r = route(p), from = r.you ? (p.id === 'hotel' ? 'dalla tua posizione all\'hotel' : 'dalla tua posizione') : 'dall\'hotel';
  let main, alt = '', ico = ICONS.road;
  if (p.id === 'hotel' && r.you && r.dist < .08) main = '<b>Sei in hotel.</b>';
  else if (p.id === 'hotel' && !r.you) main = '<b>Il punto di partenza.</b> Quando sei a Barcellona, da qui ti riporto indietro.';
  else if (r.best === 'walk') { main = '<b>A piedi, ' + r.walk + ' min</b> ' + from + ', ' + fmtKm(r.dist) + (r.real ? ', sul percorso disegnato.' : '.'); if (r.metro && r.walk > 15) alt = 'In metro circa ' + r.metro.tot + ' min: ' + metroTxt(r.metro) + '.'; }
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
    '<div class="acts"><a class="btn' + (r.best === 'walk' ? ' tealb' : '') + '" href="' + gm('walking') + '" target="_blank" rel="noopener">' + ICONS.road + 'A piedi</a><a class="btn' + (r.best === 'walk' ? '' : ' tealb') + '" href="' + gm('transit') + '" target="_blank" rel="noopener">' + ICONS.rail + 'Con i mezzi</a></div></div>';
}
function row(p) {
  const r = route(p), on = sel === p.id;
  const how = r.best === 'walk' ? r.walk + ' min a piedi' : r.best === 'metro' ? (r.metro.l || 'Metro') + ' · ' + r.metro.tot + ' min' : fmtKm(r.dist);
  return '<button class="prow' + (on ? ' on' : '') + (S.pl.done[p.id] ? ' done' : '') + '" data-id="' + p.id + '" style="--c:' + ZONES[p.z].c + '"><i class="zdot"></i><span class="pb"><b>' + p.n + (S.pl.want[p.id] ? '<em class="wm">' + ICONS.star + '</em>' : '') + '</b><span>' + (p.a || '') + '</span></span><span class="pht tnum">' + how + '</span></button>';
}
function drawBody() {
  const o = origin(), p = sel && byId(sel);
  const det = (p ? detail(p) : '<div class="hint">Tocca un pallino sulla mappa o un posto nell\'elenco: ti dico come arrivarci. Due dita per ruotare e inclinare la mappa.</div>') +
    (sel === 'hotel' ? '' : '<button class="btn tealb gohome" id="lGoHome">' + ICONS.stay + 'Portami in hotel</button>');
  const groups = [['I tuoi posti', PLACES.filter(x => x.z === 'mine')], ['A piedi dall\'hotel', PLACES.filter(x => x.z !== 'mine' && x.near)], ['In città, in metro', PLACES.filter(x => x.z !== 'mine' && !x.near)]];
  const chips = '<div class="chips lfil">' + [['all', 'Tutti'], ['want', ICONS.star + 'Da vedere'], ['done', ICONS.check + 'Fatti']].map(f => '<button class="chip' + (filter === f[0] ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>';
  const list = groups.map(g => {
    let its = g[1]; if (filter === 'want') its = its.filter(x => S.pl.want[x.id]); if (filter === 'done') its = its.filter(x => S.pl.done[x.id]); if (!its.length) return '';
    its = its.slice().sort((a, b) => hav(o, a.p) - hav(o, b.p));
    return '<div class="sec"><div class="sh"><span class="eyebrow">' + g[0] + '</span><small>' + its.length + '</small></div>' + its.map(row).join('') + '</div>';
  }).join('') || '<div class="hint">Niente qui: segna i posti con la stella o con la spunta.</div>';
  $('#lBody').innerHTML = det + chips + list;

  $$('#lBody .prow').forEach(b => b.onclick = () => select(b.dataset.id, true));
  const gh = $('#lGoHome'); if (gh) gh.onclick = goHotel;
  $$('#lBody .lfil .chip').forEach(b => b.onclick = () => { filter = b.dataset.f; sfx('tick'); drawBody(); });
  const w = $('#lWant'); if (w) w.onclick = () => { if (S.pl.want[sel]) delete S.pl.want[sel]; else S.pl.want[sel] = true; save(); sfx(S.pl.want[sel] ? 'check' : 'uncheck'); drawBody(); refreshPl(); };
  const d = $('#lDone'); if (d) d.onclick = () => { if (S.pl.done[sel]) delete S.pl.done[sel]; else S.pl.done[sel] = true; save(); sfx(S.pl.done[sel] ? 'check' : 'uncheck'); drawBody(); refreshPl(); };
  /* percorso a piedi reale: quando arriva, scheda e linea si aggiornano */
  if (p && p.id !== 'hotel' || (p && p.id === 'hotel' && inBcn())) {
    if (!walkOf(o, p) && navigator.onLine) fetchWalk(o, p).then(() => { if (sel === p.id) { drawBody(); drawRoute(); } }).catch(() => {});
  }
}
function select(id, fromList) {
  const same = sel === id; sel = same && !fromList ? null : id; sfx('tick');
  drawBody(); refreshPl(); drawRoute();
  if (fromList) { window.scrollTo({ top: 0, behavior: 'smooth' }); fitSel(); }
}

export function drawLuoghi() {
  if (!M.map) build();
  else if (M.theme !== S.theme) { M.theme = S.theme; M.ready = false; M.map.setTerrain(null); M.map.setStyle(STYLE[S.theme]); }
  eyebrow(); drawBody(); refreshPl(); drawRoute();
}
/* il GPS resta acceso solo mentre guardi i Luoghi */
export function luoghiPause() { if (M.geo && M.tracking) { try { M.geo.trigger(); } catch (e) {} } }
const geoOn = () => { if (!M.geo) return; try { M.ready ? M.geo.trigger() : M.map.once('load', () => M.geo.trigger()); } catch (e) {} };

/* chiamata quando si apre la scheda */
export function luoghiShow() {
  /* ?tab=luoghi&luogo=sagrada apre direttamente un luogo (comodo per i test) */
  if (sel === null) { const q = new URLSearchParams(location.search).get('luogo'); if (q && byId(q)) sel = q; }
  drawLuoghi(); if (M.map) setTimeout(() => M.map.resize(), 50); offline(); if (!M.tracking) geoOn();
}
