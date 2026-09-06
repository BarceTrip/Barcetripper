/* Pagina "Documenti": biglietti, carte d'imbarco, verbali. I file restano nel telefono (IndexedDB),
   non passano da nessun server e si aprono anche senza rete, a tutto schermo.
   I PDF vengono convertiti in immagini delle pagine quando li aggiungi (PDF.js, dentro l'app):
   così su iPhone si adattano allo schermo e si ingrandiscono, e il QR resta nitido. */
import { ICONS } from '../icons.js';
import { $, $$, toast, header, emit } from './dom.js';
import { sfx } from '../audio/sfx.js';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

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
let docs = null;

/* PDF -> immagini delle pagine, 1600 px di larghezza (basta per leggere e per far scansionare un QR) */
async function pdfPages(blob) {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  const pages = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
    const page = await pdf.getPage(i), v0 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 1600 / v0.width });
    const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    await page.render({ canvas: cv, canvasContext: ctx, viewport: vp }).promise;
    pages.push(await new Promise(r => cv.toBlob(r, 'image/jpeg', .9)));
    cv.width = cv.height = 0;
  }
  return pages;
}
/* le pagine si preparano quando aggiungi il file; per i PDF salvati prima, la prima volta che li apri */
async function ensurePages(d) {
  if (d.pages || !isPdf(d)) return d;
  toast('Preparo le pagine…');
  try { d.pages = await pdfPages(d.blob); await put(d); } catch (e) { d.pages = null; }
  return d;
}

/* ---- visualizzazione a tutto schermo, con zoom ---- */
let zoom = 1, urls = [];
const setZoom = z => { zoom = Math.max(1, Math.min(4, z)); const p = $('#dvPages'); if (p) p.style.width = Math.round(zoom * 100) + '%'; $$('#docview [data-z]').forEach(b => b.disabled = b.dataset.z === '-' ? zoom <= 1 : zoom >= 4); };
function closeView() { const v = $('#docview'); v.classList.remove('on'); v.innerHTML = ''; urls.forEach(u => URL.revokeObjectURL(u)); urls = []; }
async function view(d) {
  await ensurePages(d);
  const v = $('#docview'); zoom = 1;
  const pages = d.pages && d.pages.length ? d.pages : d.type && d.type.startsWith('image/') ? [d.blob] : null;
  const src = b => { const u = URL.createObjectURL(b); urls.push(u); return u; };
  v.innerHTML = '<div class="dv-top"><b>' + esc(d.name) + '</b>' + (pages ? '<span class="dz"><button data-z="-" aria-label="Riduci">−</button><button data-z="+" aria-label="Ingrandisci">+</button></span>' : '') +
    '<button class="ibtn" id="dvClose" aria-label="Chiudi">' + ICONS.x + '</button></div>' +
    '<div class="dv-scroll" id="dvScroll">' + (pages ? '<div class="dv-pages" id="dvPages">' + pages.map(b => '<img src="' + src(b) + '" alt="">').join('') + '</div>' : '<iframe src="' + src(d.blob) + '" title="' + esc(d.name) + '"></iframe>') + '</div>';
  v.classList.add('on');
  $('#dvClose').onclick = () => { closeView(); sfx('back'); };
  $$('#docview [data-z]').forEach(b => b.onclick = () => { sfx('tick'); setZoom(zoom + (b.dataset.z === '+' ? .5 : -.5)); });
  $('#dvScroll').addEventListener('dblclick', () => setZoom(zoom > 1 ? 1 : 2));
  setZoom(1);
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
  const list = docs.length ? docs.map(d => '<div class="doc" data-id="' + d.id + '"><span class="dk">' + (isPdf(d) ? 'PDF' : 'IMG') + '</span><div class="dt"><b>' + esc(d.name) + '</b><span>' + fmtSize(d.size) + (d.pages ? ' · ' + d.pages.length + (d.pages.length === 1 ? ' pagina' : ' pagine') : '') + ' · ' + new Date(d.ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + '</span></div>' +
    '<button class="ibtn" data-open aria-label="Apri">' + ICONS.big + '</button><button class="ibtn" data-share aria-label="Condividi">' + ICONS.share + '</button><button class="ibtn" data-del aria-label="Elimina">' + ICONS.x + '</button></div>').join('') :
    '<div class="hint">Nessun documento ancora. Tocca Aggiungi e scegli dal telefono: biglietto della Domus Aurea, verbale 104 in versione omissis, carte d\'imbarco, conferme degli hotel.</div>';
  $('#pDocumenti').innerHTML = header(docs.length ? docs.length + (docs.length === 1 ? ' documento' : ' documenti') : 'Solo sul telefono', 'Documenti', { back: 'bDocBack', extra: add }) +
    '<div class="card docinfo"><b>Restano nel telefono.</b><span>Non passano da internet e si aprono anche senza rete. Per averli sempre, tieni l\'app sulla schermata Home. Tocca il nome per rinominare; nel visualizzatore, doppio tocco o + e − per ingrandire.</span></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">Da avere</span></div><div class="chips"><span class="chip">Biglietto Domus Aurea</span><span class="chip">Verbale 104 (omissis)</span><span class="chip">Carte d\'imbarco</span><span class="chip">Conferme hotel</span><span class="chip">Documento d\'identità</span></div></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">I tuoi file</span></div>' + list + '</div>';

  $('#bDocBack').onclick = () => { sfx('back'); emit('open', 'back'); };
  $('#dAdd').onclick = () => { sfx('tick'); $('#dFile').click(); };
  $('#dFile').onchange = async e => {
    const files = [...e.target.files]; if (!files.length) return;
    for (const f of files) {
      if (f.size > 25e6) { toast('Troppo grande: ' + f.name); continue; }
      const d = { id: 'd' + Date.now() + Math.random().toString(36).slice(2, 6), name: f.name, type: f.type, size: f.size, ts: Date.now(), blob: f };
      if (isPdf(d)) { toast('Preparo le pagine di ' + f.name + '…'); try { d.pages = await pdfPages(f); } catch (err) { d.pages = null; } }
      try { await put(d); } catch (err) { toast('Non riesco a salvare ' + f.name); }
    }
    sfx('check'); toast(files.length === 1 ? 'Salvato' : 'Salvati ' + files.length + ' file'); drawDocumenti();
  };
  $$('#pDocumenti .doc').forEach(el => {
    const d = docs.find(x => x.id === el.dataset.id);
    el.querySelector('[data-open]').onclick = () => { sfx('tick'); view(d); };
    el.querySelector('[data-share]').onclick = () => { sfx('tick'); share(d); };
    el.querySelector('[data-del]').onclick = async () => { if (!confirm('Elimino "' + d.name + '" dal telefono?')) return; await del(d.id); sfx('uncheck'); drawDocumenti(); };
    el.querySelector('.dt b').onclick = async () => { const n = prompt('Nome del documento', d.name); if (n && n.trim() && n.trim() !== d.name) { d.name = n.trim(); await put(d); drawDocumenti(); } };
  });
}
