/* Pagina "Luoghi": mappa 3D interattiva (MapLibre GL, mappe OpenFreeMap, rilievo AWS Terrain Tiles) con l'hotel,
   i tuoi posti, le cose da vedere e le fontanelle; per ogni luogo il modo più comodo per arrivarci da dove sei.
   La mappa e il percorso a piedi reale (OSRM) hanno bisogno della rete; elenco e stime funzionano anche senza. */
import { Map as GLMap, NavigationControl, GeolocateControl, Marker, setWorkerUrl } from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { HOTEL, SANTS, ZONES, PLACES, FOUNTAINS, METRO } from '../data/luoghi.js';
import { PAROLE, TIPI, CERCA_SUGG } from '../data/cerca.js';
import { ICONS } from '../icons.js';
import { S, save } from '../state.js';
import { $, $$, toast, header, emit } from './dom.js';
import { sfx } from '../audio/sfx.js';
import { openNav } from './nav.js';
import { FOTO } from '../data/foto.js';

/* il worker di MapLibre viene impacchettato da Vite come modulo separato */
setWorkerUrl(mapWorkerUrl);

const STYLE = { light: 'https://tiles.openfreemap.org/styles/liberty', dark: 'https://tiles.openfreemap.org/styles/fiord' };
const DEM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const OSRM = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/';
const EMPTY = { type: 'FeatureCollection', features: [] };
const YOU = { pos: null, acc: null, err: null, drawn: null };
const M = { map: null, geo: null, theme: null, ready: false, pitch: true };
let sel = null, filter = 'all';
const CERCA = { q: '', res: [] };
/* Civici: le tessere di OpenFreeMap non li contengono, quindi "Numància 33" passa da Photon (OpenStreetMap),
   con Nominatim di riserva. Solo l'area di Barcellona, solo quando nella ricerca c'è un numero. */
const GEO = { q: '', res: [], timer: null, ctl: null, stato: '', cache: new Map() };
const BCN = { w: 1.95, s: 41.25, e: 2.35, n: 41.55 };
const haCivico = q => /\d/.test(q);
const ZT = { n: 'Trovati', c: '#F2994A' };   // colore dei risultati di ricerca
const zona = p => ZONES[p.z] || ZT;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const escq = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const walks = new Map();   // percorso a piedi reale per luogo: { o, km, min, geo }
const NEAR = 0.15;         // km: sotto questa distanza il percorso salvato vale ancora
const HP = { id: 'hotel', n: 'Abba Sants', z: 'sants', p: HOTEL, a: 'Carrer de Numància 32', d: 'Il tuo hotel: metro Sants Estació a 300 m, reception 24 ore, deposito bagagli gratuito.', near: true, big: true };
const byId = id => id === 'hotel' ? HP : (PLACES.find(p => p.id === id) || CERCA.res.find(p => p.id === id));

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
    properties: { id: p.id, s: p.s || p.n, color: zona(p).c, prio: p.z === 'mine' ? 0 : p.big ? 1 : 2, want: S.pl.want[p.id] ? 1 : 0, done: S.pl.done[p.id] ? 1 : 0, sel: sel === p.id ? 1 : 0 } })) };
}
function initMap() {
  M.theme = S.theme;
  const map = M.map = new GLMap({ container: 'lCanvas', style: STYLE[S.theme], center: lngLat(HOTEL), zoom: 14.3, pitch: 55, bearing: -20, maxPitch: 72, attributionControl: { compact: true }, preserveDrawingBuffer: new URLSearchParams(location.search).has('shot') });   // ?shot serve solo agli screenshot di test
  if (new URLSearchParams(location.search).has('shot')) window.__map = map;   // solo per i test: la mappa non è esposta altrimenti
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
  /* i crediti stanno nella riga sotto la mappa e dietro la ⓘ: il riquadro bianco non deve coprire la mappa all'apertura */
  map.once('load', () => { const a = $('#lCanvas .maplibregl-ctrl-attrib'); if (a) a.classList.remove('maplibregl-compact-show'); });
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
  map.addSource('find', { type: 'geojson', data: EMPTY });
  map.addLayer({ id: 'find-halo', type: 'circle', source: 'find', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 9, 17, 18], 'circle-color': '#F2994A', 'circle-opacity': .28 } });
  map.addLayer({ id: 'find', type: 'circle', source: 'find', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 4.5, 17, 8], 'circle-color': '#F2994A', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
  map.addLayer({ id: 'find-lab', type: 'symbol', source: 'find', minzoom: 14.5, layout: { 'text-field': ['get', 's'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-variable-anchor': ['top', 'left', 'right', 'bottom'], 'text-radial-offset': 0.9, 'text-justify': 'auto' }, paint: { 'text-color': dark ? '#F3F6F7' : '#26333A', 'text-halo-color': dark ? '#1F2A31' : '#ffffff', 'text-halo-width': 1.6 } });
  if (!M.findClicks) {
    M.findClicks = true;
    map.on('click', 'find', e => { const f = e.features && e.features[0]; if (f) select(f.properties.id, false); });
    map.on('dblclick', 'find', e => { e.preventDefault(); const f = e.features && e.features[0]; if (!f) return; const p = byId(f.properties.id); if (p) { sfx('tick'); apriMaps(p); } });
  }
  M.ready = true; drawRoute(); refreshFind(); offline(); if (sel === 'hotel') fitSel();
}
const refreshPl = () => { if (M.ready) M.map.getSource('pl').setData(placesGeo()); };
const refreshFind = () => { if (M.ready && M.map.getSource('find')) M.map.getSource('find').setData(trovatiGeo()); };
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
    '<div class="lcerca"><span class="lci">' + ICONS.search + '</span><input id="lQ" type="search" inputmode="search" autocomplete="off" enterkeyhint="search" placeholder="Cerca: bar, farmacia, Numància 33…" maxlength="30"><button class="lcx" id="lQx" hidden aria-label="Cancella">' + ICONS.x + '</button></div>' +
    '<div class="lsugg">' + CERCA_SUGG.map(s => '<button class="chip" data-s="' + s + '">' + s + '</button>').join('') + '</div>' +
    '<div class="map"><div id="lCanvas"></div><div class="mapui"><button id="lPitch" class="on">3D</button><button id="lHome" aria-label="Portami in hotel">' + ICONS.stay + '</button></div>' +
    '<div class="mapoff" id="lOff" hidden><b>Serve la rete per la mappa</b><span>Elenco, stime e indicazioni funzionano lo stesso.</span></div></div>' +
    '<div class="legend">' + Object.keys(ZONES).map(z => '<span><i style="--c:' + ZONES[z].c + '"></i>' + ZONES[z].n + '</span>').join('') + '<span><i style="--c:#4DB6E8;width:7px;height:7px"></i>Fontanelle</span></div>' +
    '<div id="lBody"></div><div class="about">Mappa OpenFreeMap · rilievo AWS Terrain Tiles · percorsi a piedi OSRM · orari indicativi, verifica prima</div>';
  $('#lLoc').onclick = () => { sfx('tick'); M.tracking ? luoghiPause() : geoOn(); };
  const q = $('#lQ'), qx = $('#lQx');
  let tq = null;
  const aggiorna = (avvicina) => { qx.hidden = !q.value.trim(); clearTimeout(tq); tq = setTimeout(() => eseguiCerca(q.value.trim(), avvicina), avvicina ? 0 : 220); };
  q.addEventListener('input', () => aggiorna(false));
  q.addEventListener('change', () => aggiorna(true));
  q.addEventListener('keydown', e => { if (e.key === 'Enter') { q.blur(); aggiorna(true); } });
  qx.onclick = () => { q.value = ''; qx.hidden = true; sfx('back'); eseguiCerca('', false); };
  $$('.lsugg .chip').forEach(b => b.onclick = () => { q.value = b.dataset.s; qx.hidden = false; sfx('tick'); eseguiCerca(b.dataset.s, true); });
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
  const chips = (p.h ? '<span class="chip">' + ICONS.clock + p.h + '</span>' : '') + (p.book ? '<span class="chip warn">Prenota prima</span>' : '') + (p.sun ? '<span class="chip">Bello al tramonto</span>' : '');
  const hotel = p.id === 'hotel';
  const ph = FOTO.has(p.id);   // foto del luogo in trasparenza, solo per i posti segnalati
  return '<div class="card pdet' + (ph ? ' pfoto' : '') + '" style="--c:' + zona(p).c + (ph ? ";--ph:url('/img/luoghi/" + p.id + ".webp')" : '') + '"><div class="pdh"><i class="zdot"></i><div class="pt"><b>' + escq(p.n) + '</b><span>' + escq(p.a || zona(p).n) + '</span></div>' +
    (hotel || p.poi ? '' : '<button class="ibtn' + (S.pl.want[p.id] ? ' on' : '') + '" id="lWant" aria-label="Da vedere">' + ICONS.star + '</button><button class="ibtn' + (S.pl.done[p.id] ? ' ok' : '') + '" id="lDone" aria-label="Fatto">' + ICONS.check + '</button>') + '</div>' +
    (p.d ? '<p>' + escq(p.d) + '</p>' : '') + (chips ? '<div class="chips">' + chips + '</div>' : '') +
    '<div class="rte"><span class="mi">' + ico + '</span><div>' + main + (alt ? '<small>' + alt + '</small>' : '') + '</div></div>' +
    '<div class="acts"><button class="btn' + (r.best === 'walk' ? ' tealb' : '') + '" data-nav="walking">' + ICONS.road + 'A piedi</button><button class="btn' + (r.best === 'walk' ? '' : ' tealb') + '" data-nav="transit">' + ICONS.rail + 'Con i mezzi</button></div></div>';
}
function row(p) {
  const r = route(p), on = sel === p.id;
  const how = r.best === 'walk' ? r.walk + ' min a piedi' : r.best === 'metro' ? (r.metro.l || 'Metro') + ' · ' + r.metro.tot + ' min' : fmtKm(r.dist);
  return '<button class="prow' + (on ? ' on' : '') + (S.pl.done[p.id] ? ' done' : '') + '" data-id="' + p.id + '" style="--c:' + zona(p).c + '"><i class="zdot"></i><span class="pb"><b>' + escq(p.n) + (S.pl.want[p.id] ? '<em class="wm">' + ICONS.star + '</em>' : '') + '</b><span>' + escq(p.a || '') + '</span></span><span class="pht tnum">' + how + '</span></button>';
}

/* ---- ricerca: i punti di interesse sono già dentro le mappe scaricate, quindi funziona anche offline ---- */
function cercaPoi(q) {
  if (!M.ready) return [];
  const style = M.map.getStyle(), vec = Object.keys(style.sources).find(k => style.sources[k].type === 'vector');
  if (!vec) return [];
  let feats = [];
  try { feats = M.map.querySourceFeatures(vec, { sourceLayer: 'poi' }); } catch (e) { return []; }
  const nq = norm(q);
  const voce = PAROLE.find(v => v.q.some(w => nq === w || (nq.length > 2 && w.startsWith(nq)) || (w.length > 3 && nq.startsWith(w))));
  const classi = voce ? voce.c : [];
  const visti = new Set(), out = [];
  feats.forEach(f => {
    const g = f.geometry; if (!g || g.type !== 'Point') return;
    const pr = f.properties || {}, nome = pr['name:it'] || pr.name || pr['name:es'] || '';
    const cls = pr.class || '', sub = pr.subclass || '';
    if (cls === 'entrance' || sub === 'entrance' || sub === 'waste_basket') return;
    const perClasse = classi.length && (classi.includes(cls) || classi.includes(sub));
    /* col dizionario il nome vale solo come parola intera, così "bar" non pesca "Bargés" */
    const nn = norm(nome);
    const perNome = classi.length ? new RegExp('(^|[^a-z0-9])' + nq + '([^a-z0-9]|$)').test(nn) : (nq.length > 2 && nn.includes(nq));
    if (!perClasse && !perNome) return;
    const pos = [g.coordinates[1], g.coordinates[0]];
    const k = norm(nome) + '@' + pos[0].toFixed(4) + ',' + pos[1].toFixed(4);
    if (visti.has(k)) return; visti.add(k);
    out.push({ id: 'q' + visti.size, n: nome || TIPI[sub] || TIPI[cls] || 'Punto', a: TIPI[sub] || TIPI[cls] || cls, z: 'trovato', p: pos, poi: true });
  });
  return out;
}
function cerca(q) {
  CERCA.q = q; const nq = norm(q);
  if (!nq) { CERCA.res = []; return; }
  const dentro = p => norm(p.n).includes(nq) || norm(p.a).includes(nq) || norm(p.d).includes(nq) || norm(p.s).includes(nq);
  const o = origin();
  CERCA.res = [HP].concat(PLACES).filter(dentro).concat(cercaPoi(q)).concat(GEO.q === nq ? GEO.res : []).sort((a, b) => hav(o, a.p) - hav(o, b.p)).slice(0, 40);
}
async function photon(q, o, signal) {
  const r = await fetch('https://photon.komoot.io/api/?q=' + encodeURIComponent(q) + '&limit=6&lat=' + o[0] + '&lon=' + o[1] + '&bbox=' + [BCN.w, BCN.s, BCN.e, BCN.n].join(','), { signal });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return ((await r.json()).features || []).map(f => {
    const p = f.properties || {}, c = f.geometry.coordinates;
    return { via: p.street || '', hn: p.housenumber || '', nome: p.osm_key === 'building' ? '' : (p.name || ''), a: [p.district || p.locality, p.city].filter(Boolean).join(', '), p: [c[1], c[0]] };
  });
}
async function nominatim(q, signal) {
  const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&bounded=1&viewbox=' + [BCN.w, BCN.n, BCN.e, BCN.s].join(',') + '&q=' + encodeURIComponent(q), { signal });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return (await r.json()).map(x => {
    const a = x.address || {};
    return { via: a.road || '', hn: a.house_number || '', nome: x.category === 'building' ? '' : (x.name || ''), a: [a.suburb || a.neighbourhood, a.city || a.town].filter(Boolean).join(', '), p: [+x.lat, +x.lon] };
  });
}
/* una riga per civico: il punto è quello del palazzo, le attività trovate a quel numero vanno nel sottotitolo */
function perCivico(res) {
  const g = new Map();
  for (const x of res) {
    if (!x.hn) continue;   // senza numero è un tratto di via o un quartiere: non è quello che cerchi
    const k = norm(x.via + ' ' + x.hn), e = g.get(k) || { n: [x.via, x.hn].filter(Boolean).join(' '), nomi: [], p: null, a: x.a };
    if (!x.nome || !e.p) e.p = x.p;
    if (x.nome && e.nomi.length < 3 && !e.nomi.includes(x.nome)) e.nomi.push(x.nome);
    g.set(k, e);
  }
  return [...g.values()].map((e, i) => ({ id: 'g' + i, n: e.n, s: e.n, a: 'Civico · ' + (e.nomi.length ? e.nomi.join(', ') : e.a), z: 'trovato', p: e.p, poi: true }));
}
/* parte solo se c'è un numero; aspetta mezzo secondo che tu finisca di scrivere; una richiesta alla volta */
function cercaCivico(q) {
  clearTimeout(GEO.timer);
  const nq = norm(q);
  if (!haCivico(nq)) { if (GEO.ctl) GEO.ctl.abort(); GEO.q = ''; GEO.res = []; GEO.stato = ''; return; }
  if (GEO.cache.has(nq)) { GEO.q = nq; GEO.res = GEO.cache.get(nq); GEO.stato = 'ok'; return; }
  if (navigator.onLine === false) { GEO.q = nq; GEO.res = []; GEO.stato = 'offline'; return; }
  GEO.stato = 'cerco';
  GEO.timer = setTimeout(async () => {
    if (GEO.ctl) GEO.ctl.abort();
    const ctl = GEO.ctl = new AbortController();
    let res = [], stato = 'ok';
    const chiedi = async s => { try { return await photon(s, origin(), ctl.signal); } catch (e) { if (ctl.signal.aborted) throw e; return await nominatim(s + ', Barcelona', ctl.signal); } };
    const via = nq.replace(/\s*\d.*$/, ''), suVia = r => r.some(x => x.hn && norm(x.via).includes(via));
    try {
      res = await chiedi(q);
      /* "42b": la lettera confonde i geocoder, che il 42 lo trovano subito. Si riprova se nessun civico sta sulla via scritta */
      const senza = q.replace(/(\d+)\s*[a-zA-Z]\b/, '$1');
      if (senza !== q && !suVia(res)) { const r2 = await chiedi(senza); if (suVia(r2)) res = r2.concat(res); }
    } catch (e) { if (ctl.signal.aborted) return; stato = 'errore'; }
    if (ctl !== GEO.ctl) return;
    const out = perCivico(res);   // la lista poi ordina per distanza, come tutto il resto
    GEO.q = nq; GEO.res = out; GEO.stato = stato; if (stato === 'ok') GEO.cache.set(nq, out);
    const inp = $('#lQ'); if (!inp || norm(inp.value) !== nq) return;   // intanto hai scritto altro
    cerca(q); refreshFind(); drawBody(); if (CERCA.res.length) fitTrovati();
  }, 450);
}
const trovatiGeo = () => ({ type: 'FeatureCollection', features: CERCA.res.map(p => ({ type: 'Feature', geometry: { type: 'Point', coordinates: lngLat(p.p) }, properties: { id: p.id, s: p.n } })) });
/* chiede con quale app aprire il percorso; se non sei a Barcellona la partenza è l'hotel */
function apriMaps(p, mode) { const r = route(p); openNav({ p: p.p, name: p.n, mode: mode || 'walking', from: r.you ? null : HOTEL }); }
/* la ricerca guarda solo i dintorni caricati: se sei lontano, la mappa si avvicina da sola */
function eseguiCerca(q, avvicina) {
  cercaCivico(q); cerca(q); refreshFind(); drawBody();
  if (!q) return;
  if (avvicina && M.ready && !CERCA.res.length && M.map.getZoom() < 15.2 && !haCivico(q)) {
    M.map.easeTo({ zoom: 15.6, duration: 700 });
    M.map.once('idle', () => { cerca(q); refreshFind(); drawBody(); if (CERCA.res.length) fitTrovati(); });
  } else if (CERCA.res.length) fitTrovati();
}
function fitTrovati() {
  if (!M.ready || !CERCA.res.length) return;
  const pts = CERCA.res.slice(0, 12).map(p => lngLat(p.p)); pts.push(lngLat(origin()));
  const lng = pts.map(c => c[0]), lat = pts.map(c => c[1]);
  const cam = M.map.cameraForBounds([[Math.min(...lng), Math.min(...lat)], [Math.max(...lng), Math.max(...lat)]], { padding: { top: 60, bottom: 50, left: 45, right: 45 }, maxZoom: 16.5 });
  if (cam) M.map.easeTo({ center: cam.center, zoom: cam.zoom, duration: 800 });
}
function drawBody() {
  const o = origin(), p = sel && byId(sel);
  const det = (p ? detail(p) : '<div class="hint">Tocca un pallino sulla mappa o un posto nell\'elenco: ti dico come arrivarci. Due dita per ruotare e inclinare la mappa.</div>') +
    (sel === 'hotel' ? '' : '<button class="btn tealb gohome" id="lGoHome">' + ICONS.stay + 'Portami in hotel</button>');
  if (CERCA.q) {
    const n = CERCA.res.length;
    const testa = '<div class="sec"><div class="sh"><span class="eyebrow">' + (n ? n + (n === 1 ? ' risultato' : ' risultati') : 'Nessun risultato') + ' per “' + escq(CERCA.q) + '”</span>' + (n ? '<small>due tocchi per aprirlo in Maps</small>' : '') + '</div>';
    const corpo = n ? CERCA.res.slice(0, 14).map(row).join('') + (n > 14 ? '<div class="hint">e altri ' + (n - 14) + ', arancioni sulla mappa</div>' : '')
      : '<div class="hint">' + (haCivico(CERCA.q)
        ? (GEO.stato === 'cerco' ? 'Cerco il civico su OpenStreetMap…' : GEO.stato === 'offline' ? 'Per trovare un civico serve la rete: i numeri civici non stanno nelle mappe scaricate.' : GEO.stato === 'errore' ? 'Il servizio degli indirizzi non risponde: riprova tra poco.' : 'Nessun civico trovato: scrivi via e numero, per esempio Numància 33 o Can Bruixa 42.')
        : (M.ready && M.map.getZoom() < 15 ? 'Avvicina la mappa alla zona che ti interessa: i posti compaiono da vicino.' : 'Prova con un\'altra parola: bar, ristorante, farmacia, supermercato, bagno, gelato.')) + '</div>';
    $('#lBody').innerHTML = det + testa + corpo + '</div>';
    legaRighe();
    return;
  }
  const groups = [['I tuoi posti', PLACES.filter(x => x.z === 'mine')], ['A piedi dall\'hotel', PLACES.filter(x => x.z !== 'mine' && x.near)], ['In città, in metro', PLACES.filter(x => x.z !== 'mine' && !x.near)]];
  const chips = '<div class="chips lfil">' + [['all', 'Tutti'], ['want', ICONS.star + 'Da vedere'], ['done', ICONS.check + 'Fatti']].map(f => '<button class="chip' + (filter === f[0] ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>';
  const list = groups.map(g => {
    let its = g[1]; if (filter === 'want') its = its.filter(x => S.pl.want[x.id]); if (filter === 'done') its = its.filter(x => S.pl.done[x.id]); if (!its.length) return '';
    its = its.slice().sort((a, b) => hav(o, a.p) - hav(o, b.p));
    return '<div class="sec"><div class="sh"><span class="eyebrow">' + g[0] + '</span><small>' + its.length + '</small></div>' + its.map(row).join('') + '</div>';
  }).join('') || '<div class="hint">Niente qui: segna i posti con la stella o con la spunta.</div>';
  $('#lBody').innerHTML = det + chips + list;

  legaRighe();
  const gh = $('#lGoHome'); if (gh) gh.onclick = goHotel;
  $$('#lBody .lfil .chip').forEach(b => b.onclick = () => { filter = b.dataset.f; sfx('tick'); drawBody(); });
  const w = $('#lWant'); if (w) w.onclick = () => { if (S.pl.want[sel]) delete S.pl.want[sel]; else S.pl.want[sel] = true; save(); sfx(S.pl.want[sel] ? 'check' : 'uncheck'); drawBody(); refreshPl(); };
  const d = $('#lDone'); if (d) d.onclick = () => { if (S.pl.done[sel]) delete S.pl.done[sel]; else S.pl.done[sel] = true; save(); sfx(S.pl.done[sel] ? 'check' : 'uncheck'); drawBody(); refreshPl(); };
  /* percorso a piedi reale: quando arriva, scheda e linea si aggiornano */
  if (p && p.id !== 'hotel' || (p && p.id === 'hotel' && inBcn())) {
    if (!walkOf(o, p) && navigator.onLine) fetchWalk(o, p).then(() => { if (sel === p.id) { drawBody(); drawRoute(); } }).catch(() => {});
  }
}
/* un tocco apre la scheda, due tocchi ravvicinati aprono Google Maps */
const DUE = { t: 0, id: '' };
function legaRighe() {
  const p = sel && byId(sel);
  $$('#lBody [data-nav]').forEach(b => b.onclick = () => { if (p) apriMaps(p, b.dataset.nav); });
  $$('#lBody .prow').forEach(b => b.onclick = () => {
    const id = b.dataset.id, ora = Date.now();
    if (id === DUE.id && ora - DUE.t < 600) { DUE.t = 0; const p = byId(id); if (p) { sfx('tick'); apriMaps(p); return; } }
    DUE.t = ora; DUE.id = id; select(id, true);
  });
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
