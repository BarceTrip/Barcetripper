/* Avvisi 30 minuti prima (solo ad app aperta, su iPhone) ed export calendario ICS. */
import { STEPS } from './data/steps.js';
import { S, save } from './state.js';
import { $, toast } from './ui/dom.js';
import { sfx } from './audio/sfx.js';

const hasNotif = () => 'Notification' in window;

export function notifInit() {
  const sub = $('#notifSub'), sw = $('#swNotif');
  if (!hasNotif()) { sub.textContent = 'Non supportati su questo dispositivo'; return; }
  if (Notification.permission === 'granted') { sw.classList.add('on'); sub.textContent = 'Attivi'; }
  else if (Notification.permission === 'denied') { sub.textContent = 'Bloccati nelle impostazioni del telefono'; }
  setInterval(notifTick, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) notifTick(); });
  notifTick();
}
export function notifAsk() {
  if (!hasNotif()) { toast('Avvisi non supportati qui'); return; }
  if (Notification.permission === 'granted') { toast('Avvisi già attivi'); return; }
  Notification.requestPermission().then(p => {
    if (p === 'granted') {
      $('#swNotif').classList.add('on'); $('#notifSub').textContent = 'Attivi'; toast('Ti avviso 30 minuti prima di ogni tappa'); sfx('check');
      try { new Notification('Avvisi attivi', { body: 'Ti avviso 30 minuti prima di ogni tappa con orario.' }); } catch (e) {}
    } else toast('Avvisi non attivati');
  });
}
export function notifTick() {
  if (!hasNotif() || Notification.permission !== 'granted') return;
  const now = Date.now();
  STEPS.forEach((s, k) => {
    if (!s.at || S.notified[k]) return;
    const d = new Date(s.at) - now;
    if (d > 0 && d <= 31 * 60000) {
      S.notified[k] = 1; save(); sfx('alarm');
      try { new Notification('Tra ' + Math.max(1, Math.round(d / 60000)) + ' min: ' + s.time + ' ' + s.title + (s.code ? ' ' + s.code : ''), { body: s.det || s.place, tag: 'tappa' + k }); } catch (e) {}
    }
  });
}

/* ---- ICS ---- */
export function buildIcs() {
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Itinerario Barcellona//IT', 'CALSCALE:GREGORIAN'];
  STEPS.forEach((s, k) => {
    if (!s.at) return;
    const st = new Date(s.at), en = new Date(st.getTime() + 30 * 60000);
    out.push('BEGIN:VEVENT', 'UID:tappa-' + k + '@itinerario-barcellona', 'DTSTAMP:' + fmt(new Date()), 'DTSTART:' + fmt(st), 'DTEND:' + fmt(en),
      'SUMMARY:' + esc(s.title + (s.code ? ' ' + s.code : '')), 'DESCRIPTION:' + esc((s.det || '') + (s.notes ? '\n\n' + s.notes.join('\n') : '')), 'LOCATION:' + esc(s.addr || s.place || ''),
      'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc('Tra 30 minuti: ' + s.title), 'END:VALARM', 'END:VEVENT');
  });
  out.push('END:VCALENDAR');
  return out.join('\r\n');
}
export async function icsExport() {
  const file = new File([buildIcs()], 'itinerario-barcellona.ics', { type: 'text/calendar;charset=utf-8' });
  /* Su iPhone in modalità app il download non parte: la condivisione invece apre direttamente Calendario. */
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Itinerario Barcellona' }); sfx('check'); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const u = URL.createObjectURL(file); const a = document.createElement('a');
  a.href = u; a.download = file.name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 2000);
  sfx('check'); toast('Apri il file e conferma in Calendario');
}
