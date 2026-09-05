/* Meteo previsto per ogni tappa, nel luogo e all'ora della tappa.
   Fonte: Open-Meteo (open-meteo.com), che combina i modelli dei servizi meteo nazionali
   (ECMWF, DWD ICON, Météo-France AROME, ...). Gratuito, senza chiave, licenza CC BY 4.0. */
import { STEPS } from './data/steps.js';

const API = 'https://api.open-meteo.com/v1/forecast';
const KEY = 'wx';
const TTL = 60 * 60 * 1000;   // un'ora
const keyOf = p => p[0].toFixed(3) + ',' + p[1].toFixed(3);

/* luogo di riferimento della tappa: dove si arriva, o dove si sta */
export const stepPos = s => s.geo && (s.geo.to || s.geo.p);

let inflight = null;
function locations() {
  const seen = new Map();
  STEPS.forEach(s => { const p = stepPos(s); if (p) seen.set(keyOf(p), p); });
  return [...seen.values()];
}
function readCache() { try { const c = JSON.parse(localStorage.getItem(KEY)); return c && c.data ? c : null; } catch (e) { return null; } }
async function fetchAll() {
  const locs = locations();
  const u = API + '?latitude=' + locs.map(p => p[0]).join(',') + '&longitude=' + locs.map(p => p[1]).join(',') +
    '&hourly=weather_code,temperature_2m,is_day,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=16';
  const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status);
  let j = await r.json(); if (!Array.isArray(j)) j = [j];
  const data = {}; j.forEach((d, k) => { data[keyOf(locs[k])] = { hourly: d.hourly, daily: d.daily }; });
  const c = { ts: Date.now(), data }; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
  return c;
}
/* Ritorna la cache se fresca, altrimenti scarica; se la rete manca usa la cache anche vecchia. */
export async function getForecast() {
  const c = readCache();
  if (c && Date.now() - c.ts < TTL) return c;
  if (!inflight) inflight = fetchAll().catch(e => { if (c) return c; throw e; }).finally(() => { inflight = null; });
  return inflight;
}

/* WMO weather code -> etichetta e icona */
const WMO = [
  [[0], 'Sereno', 'clear'], [[1], 'Poco nuvoloso', 'partly'], [[2], 'Nuvoloso', 'partly'], [[3], 'Coperto', 'cloud'],
  [[45, 48], 'Nebbia', 'fog'], [[51, 53, 55, 56, 57], 'Pioggerella', 'drizzle'], [[61, 63, 65, 66, 67], 'Pioggia', 'rain'],
  [[71, 73, 75, 77, 85, 86], 'Neve', 'snow'], [[80, 81, 82], 'Rovesci', 'showers'], [[95, 96, 99], 'Temporale', 'storm'],
];
export function describe(code, isDay = 1) {
  const m = WMO.find(w => w[0].includes(code)) || [null, 'Variabile', 'cloud'];
  let ico = m[2]; if (!isDay && (ico === 'clear' || ico === 'partly')) ico += 'N';
  return { label: m[1], ico };
}
const dayIdx = (d, date) => d.time.indexOf(date);

/* Previsione per una tappa: {label, ico, tmax, tmin, temp, pop} oppure null se fuori orizzonte.
   Per le tappe senza orario (giorni liberi) ritorna {days:[{date, ...}]}. */
export async function weatherFor(s) {
  const p = stepPos(s); if (!p) return null;
  const c = await getForecast(); const d = c.data[keyOf(p)]; if (!d) return null;
  if (!s.at) {
    if (!s.days) return null;
    const days = s.days.map(date => { const k = dayIdx(d.daily, date); if (k < 0) return null;
      return { date, ...describe(d.daily.weather_code[k]), tmax: d.daily.temperature_2m_max[k], tmin: d.daily.temperature_2m_min[k], pop: d.daily.precipitation_probability_max[k] }; });
    return days.every(x => !x) ? null : { days, ts: c.ts };
  }
  const date = s.at.slice(0, 10), hour = s.at.slice(0, 13) + ':00';
  const k = dayIdx(d.daily, date); if (k < 0) return null;
  const h = d.hourly.time.indexOf(hour);
  const code = h >= 0 ? d.hourly.weather_code[h] : d.daily.weather_code[k];
  const isDay = h >= 0 ? d.hourly.is_day[h] : 1;
  return { ...describe(code, isDay), tmax: d.daily.temperature_2m_max[k], tmin: d.daily.temperature_2m_min[k],
    temp: h >= 0 ? d.hourly.temperature_2m[h] : null, pop: h >= 0 ? d.hourly.precipitation_probability[h] : d.daily.precipitation_probability_max[k], ts: c.ts };
}

/* ---- icone vettoriali, tratto 2.4, colore corrente ---- */
const W = (inner) => '<svg class="wxi" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
const CLOUD = 'M15 36h19a7.5 7.5 0 0 0 .9-14.9A10 10 0 0 0 15.6 23.3 6.4 6.4 0 0 0 15 36z';
const CLOUD_HI = 'M17 32h17a6.5 6.5 0 0 0 .8-12.9A8.8 8.8 0 0 0 17.5 21.2 5.5 5.5 0 0 0 17 32z';
const sun = (cx, cy, r) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="currentColor" fill-opacity=".22"/>' +
  [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const t = a * Math.PI / 180, r1 = r + 4, r2 = r + 8.5;
    return '<path d="M' + (cx + r1 * Math.cos(t)).toFixed(1) + ' ' + (cy + r1 * Math.sin(t)).toFixed(1) + 'L' + (cx + r2 * Math.cos(t)).toFixed(1) + ' ' + (cy + r2 * Math.sin(t)).toFixed(1) + '"/>'; }).join('');
const moon = (cx, cy, r) => '<g transform="translate(' + (cx - r) + ' ' + (cy - r) + ') scale(' + (r / 10) + ')"><path d="M12.5 1.5a10 10 0 1 0 6.5 17.6A8 8 0 1 1 12.5 1.5z" fill="currentColor" fill-opacity=".22" vector-effect="non-scaling-stroke"/></g>';
const drops = (xs, y) => xs.map(x => '<path d="M' + x + ' ' + y + 'l-2 5"/>').join('');
export const WX_ICONS = {
  clear:   W(sun(24, 24, 8.5)),
  clearN:  W(moon(24, 24, 10)),
  partly:  W(sun(17, 17, 6) + '<path d="' + CLOUD_HI.replace('M17 32h17', 'M19 36h17').replace('17.5 21.2', '19.5 25.2').replace('17 32z', '19 36z') + '" fill="var(--wx-bg,transparent)"/>'),
  partlyN: W(moon(17, 16, 7) + '<path d="' + CLOUD_HI.replace('M17 32h17', 'M19 36h17').replace('17.5 21.2', '19.5 25.2').replace('17 32z', '19 36z') + '" fill="var(--wx-bg,transparent)"/>'),
  cloud:   W('<path d="' + CLOUD + '"/>'),
  fog:     W('<path d="' + CLOUD_HI + '"/><path d="M14 38h20M18 43h14"/>'),
  drizzle: W('<path d="' + CLOUD_HI + '"/><circle cx="18" cy="39" r="1.3" fill="currentColor"/><circle cx="25" cy="41" r="1.3" fill="currentColor"/><circle cx="32" cy="39" r="1.3" fill="currentColor"/>'),
  rain:    W('<path d="' + CLOUD_HI + '"/>' + drops([19, 26, 33], 37)),
  showers: W(sun(15, 14, 5) + '<path d="' + CLOUD_HI + '" fill="var(--wx-bg,transparent)"/>' + drops([20, 27, 34], 37)),
  snow:    W('<path d="' + CLOUD_HI + '"/>' + [19, 30].map(x => '<path d="M' + x + ' 35.5v9M' + (x - 3.9) + ' 37.75l7.8 4.5M' + (x + 3.9) + ' 37.75l-7.8 4.5"/>').join('')),
  storm:   W('<path d="' + CLOUD_HI + '"/><path d="M27.5 31l-6 8.5h4.5L23.5 46l7.5-9.5h-4.5l3-5.5z" fill="currentColor" stroke-width="1.6"/>'),
};
export const deg = t => Math.round(t) + '°';
