/* Pagina "Documenti": biglietti, carte d'imbarco, verbali. I file restano nel telefono (IndexedDB),
   non passano da nessun server e si aprono anche senza rete, a tutto schermo. */
import { ICONS } from '../icons.js';
import { $, $$, toast, header, emit } from './dom.js';
import { sfx } from '../audio/sfx.js';

const DB = 'barcetrip', STORE = 'docs';
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
const tx = (mode, fn) => db().then(d => new Promise((res, rej) => { const t = d.transaction(STORE, mode), q = fn(t.objectStore(STORE)); t.oncomplete = () => res(q.result); t.onerror = () => rej(t.error); }));
const all = () => tx('readonly', s => s.getAll());
const put = doc => tx('readwrite', s => s.put(doc));
const del = id => tx('readwrite', s => s.delete(id));

const fmtSize = n => n < 1e6 ? Math.round(n / 1e3) + ' KB' : (n / 1e6).toFixed(1).replace('.', ',') + ' MB';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isPdf = d => d.type === 'application/pdf' || /\.pdf$/i.test(d.name);
let docs = null, urls = {};
const urlOf = d => urls[d.id] || (urls[d.id] = URL.createObjectURL(d.blob));

/* ---- visualizzazione a tutto schermo ---- */
function view(d) {
  const v = $('#docview');
  v.innerHTML = '<div class="dv-top"><b>' + esc(d.name) + '</b><button class="ibtn" id="dvClose" aria-label="Chiudi">' + ICONS.x + '</button></div>' +
    (isPdf(d) ? '<iframe src="' + urlOf(d) + '" title="' + esc(d.name) + '"></iframe>' : '<div class="dv-img"><img src="' + urlOf(d) + '" alt="' + esc(d.name) + '"></div>');
  v.classList.add('on'); $('#dvClose').onclick = () => { v.classList.remove('on'); v.innerHTML = ''; sfx('back'); };
}
async function share(d) {
  const f = new File([d.blob], d.name, { type: d.type || 'application/octet-stream' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: d.name }); } catch (e) {} }
  else toast('Condivisione non disponibile qui');
}

export async function drawDocumenti() {
  if (!('indexedDB' in window)) { $('#pDocumenti').innerHTML = header('Non disponibile', 'Documenti', { back: 'bDocBack' }) + '<div class="note">Questo browser non permette di salvare file.</div>'; $('#bDocBack').onclick = () => emit('open', 'back'); return; }
  try { docs = (await all()).sort((a, b) => b.ts - a.ts); } catch (e) { docs = []; }
  const add = '<button class="chipbtn on" id="dAdd">' + ICONS.plus + 'Aggiungi</button><input type="file" id="dFile" accept="application/pdf,image/*" multiple hidden>';
  const list = docs.length ? docs.map(d => '<div class="doc" data-id="' + d.id + '"><span class="dk">' + (isPdf(d) ? 'PDF' : 'IMG') + '</span><div class="dt"><b>' + esc(d.name) + '</b><span>' + fmtSize(d.size) + ' · ' + new Date(d.ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + '</span></div>' +
    '<button class="ibtn" data-open aria-label="Apri">' + ICONS.big + '</button><button class="ibtn" data-share aria-label="Condividi">' + ICONS.share + '</button><button class="ibtn" data-del aria-label="Elimina">' + ICONS.x + '</button></div>').join('') :
    '<div class="hint">Nessun documento ancora. Tocca Aggiungi e scegli dal telefono: biglietto della Domus Aurea, verbale 104 in versione omissis, carte d\'imbarco, conferme degli hotel.</div>';
  $('#pDocumenti').innerHTML = header(docs.length ? docs.length + (docs.length === 1 ? ' documento' : ' documenti') : 'Solo sul telefono', 'Documenti', { back: 'bDocBack', extra: add }) +
    '<div class="card docinfo"><b>Restano nel telefono.</b><span>Non passano da internet e si aprono anche senza rete. Per averli sempre, tieni l\'app sulla schermata Home. Tocca il nome per rinominare.</span></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">Da avere</span></div><div class="chips"><span class="chip">Biglietto Domus Aurea</span><span class="chip">Verbale 104 (omissis)</span><span class="chip">Carte d\'imbarco</span><span class="chip">Conferme hotel</span><span class="chip">Documento d\'identità</span></div></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">I tuoi file</span></div>' + list + '</div>';

  $('#bDocBack').onclick = () => { sfx('back'); emit('open', 'back'); };
  $('#dAdd').onclick = () => { sfx('tick'); $('#dFile').click(); };
  $('#dFile').onchange = async e => {
    const files = [...e.target.files]; if (!files.length) return;
    for (const f of files) {
      if (f.size > 25e6) { toast('Troppo grande: ' + f.name); continue; }
      try { await put({ id: 'd' + Date.now() + Math.random().toString(36).slice(2, 6), name: f.name, type: f.type, size: f.size, ts: Date.now(), blob: f }); } catch (err) { toast('Non riesco a salvare ' + f.name); }
    }
    sfx('check'); toast(files.length === 1 ? 'Salvato' : 'Salvati ' + files.length + ' file'); drawDocumenti();
  };
  $$('#pDocumenti .doc').forEach(el => {
    const d = docs.find(x => x.id === el.dataset.id);
    el.querySelector('[data-open]').onclick = () => { sfx('tick'); view(d); };
    el.querySelector('[data-share]').onclick = () => { sfx('tick'); share(d); };
    el.querySelector('[data-del]').onclick = async () => { if (!confirm('Elimino "' + d.name + '" dal telefono?')) return; await del(d.id); if (urls[d.id]) { URL.revokeObjectURL(urls[d.id]); delete urls[d.id]; } sfx('uncheck'); drawDocumenti(); };
    el.querySelector('.dt b').onclick = async () => { const n = prompt('Nome del documento', d.name); if (n && n.trim() && n.trim() !== d.name) { d.name = n.trim(); await put(d); drawDocumenti(); } };
  });
}
