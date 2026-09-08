/* Pagina "Salute": numeri sanitari, dove andare a Barcellona e la scheda medica personale.
   La scheda resta solo su questo telefono, come i Documenti: non passa da nessun server. */
import { SALUTE_NUM, SALUTE_LUOGHI, FARMACIE_TURNO, MED_CAMPI } from '../data/salute.js';
import { G } from '../data/places.js';
import { ICONS } from '../icons.js';
import { S, save } from '../state.js';
import { $, $$, toast, header, emit } from './dom.js';
import { sfx } from '../audio/sfx.js';
import { showBig } from './sos.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nav = p => G + p[0].toFixed(5) + ',' + p[1].toFixed(5) + '&travelmode=walking';

/* la scheda in due lingue, a tutto schermo, da mostrare al medico */
function schedaGrande() {
  const m = S.med, righe = [];
  MED_CAMPI.forEach(([k, it, es]) => { if (m[k] && m[k].trim()) righe.push('<b>' + esc(es) + '</b><small>' + esc(it) + '</small><span>' + esc(m[k]) + '</span>'); });
  if (m.meds && m.meds.length) {
    righe.push('<b>Medicación / principio activo</b><small>Farmaci e principio attivo</small><span>' +
      m.meds.map(x => esc([x.n, x.pa, x.d].filter(Boolean).join(' · '))).join('<br>') + '</span>');
  }
  if (m.emerN || m.emerT) righe.push('<b>Contacto de emergencia</b><small>Contatto di emergenza</small><span>' + esc([m.emerN, m.emerT].filter(Boolean).join(' · ')) + '</span>');
  righe.push('<b>Soy italiano, tengo tarjeta sanitaria europea</b><small>Sono italiano, ho la tessera sanitaria europea</small><span></span>');
  if (righe.length <= 1) { toast('Compila prima la scheda'); return; }
  showBig('<div class="medbig">' + righe.map(r => '<div class="medrow">' + r + '</div>').join('') + '</div>');
}

export function drawSalute() {
  const m = S.med;
  const call = (num, big, sub, pri) => '<a class="call' + (pri ? ' pri' : '') + '" href="tel:' + num + '"><span class="mi">' + ICONS.phone + '</span><div><b>' + big + '</b><span>' + sub + '</span></div></a>';
  const numeri = '<div class="calls one">' + SALUTE_NUM.map(x => call(x.n, x.n, x.t + ' · ' + x.d, x.pri)).join('') + '</div>';

  const luoghi = SALUTE_LUOGHI.map(l => '<div class="card sal"><div class="salh"><span class="mi">' + (ICONS[l.ico] || ICONS.cross) + '</span>' +
    '<div class="pt"><b>' + l.n + '</b><span>' + l.t + ' · ' + l.a + '</span></div></div><p>' + l.d + '</p>' +
    '<div class="chips"><span class="chip">' + ICONS.clock + l.h + '</span></div>' +
    '<div class="acts">' + (l.tel ? '<a class="btn" href="tel:' + l.tel + '">' + ICONS.phone + 'Chiama</a>' : '') +
    '<a class="btn tealb" href="' + nav(l.p) + '" target="_blank" rel="noopener">' + ICONS.nav + 'Portami lì</a></div></div>').join('');

  const campi = MED_CAMPI.map(([k, it, es, ph, tipo]) => '<label class="medf"><span>' + it + '<i>' + es + '</i></span>' +
    (tipo === 'area' ? '<textarea id="md_' + k + '" rows="2" placeholder="' + esc(ph) + '">' + esc(m[k] || '') + '</textarea>'
      : '<input id="md_' + k + '" type="text" placeholder="' + esc(ph) + '" value="' + esc(m[k] || '') + '">') + '</label>').join('');

  const meds = (m.meds || []).map((x, i) => '<div class="medi"><div class="medt"><b>' + esc(x.n || 'Farmaco') + '</b><span>' + esc([x.pa, x.d].filter(Boolean).join(' · ') || 'principio attivo non indicato') + '</span></div><button class="ibtn" data-del="' + i + '" aria-label="Elimina">' + ICONS.x + '</button></div>').join('');

  $('#pSalute').innerHTML = header('Numeri, dove andare, scheda medica', 'Salute', { back: 'bSalBack' }) +
    numeri +
    '<div class="sec"><div class="sh"><span class="eyebrow">Farmacia di turno</span></div><div class="card"><p style="font-size:15px;line-height:1.5">Di notte e nei festivi le farmacie fanno i turni. L\'elenco aggiornato di quelle aperte adesso è sul sito del Collegio dei farmacisti.</p><div class="acts"><a class="btn tealb" href="' + FARMACIE_TURNO + '" target="_blank" rel="noopener">' + ICONS.nav + 'Farmacie aperte adesso</a></div></div></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">Dove andare</span><small>dal più vicino</small></div>' + luoghi + '</div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">La tua scheda medica</span><small>solo su questo telefono</small></div>' +
    '<div class="card"><p class="salnote">Compilala una volta. Serve se stai male e non riesci a spiegarti: il tasto qui sotto la mostra a tutto schermo in spagnolo e in italiano.</p>' + campi +
    '<div class="acts" style="margin-top:12px"><button class="btn tealb" id="mdShow">' + ICONS.big + 'Mostra al medico</button><button class="btn ghost" id="mdSave">Salva</button></div></div></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">I tuoi farmaci</span><small>scrivi il principio attivo</small></div>' +
    '<div class="card"><p class="salnote">In Spagna i nomi commerciali sono diversi: il principio attivo è quello che il farmacista riconosce. Lo trovi sulla scatola, sotto il nome.</p>' +
    '<div class="medadd"><input id="mdN" type="text" placeholder="Nome del farmaco" maxlength="40"><input id="mdPa" type="text" placeholder="Principio attivo" maxlength="40"><input id="mdD" type="text" placeholder="Dose e orario" maxlength="30"></div>' +
    '<button class="btn tealb" id="mdAdd" style="width:100%;margin-top:10px">Aggiungi farmaco</button></div>' + (meds ? '<div style="margin-top:8px">' + meds + '</div>' : '') + '</div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">Chi chiamare</span></div><div class="card"><div class="medadd two"><input id="mdEN" type="text" placeholder="Nome" maxlength="30" value="' + esc(m.emerN || '') + '"><input id="mdET" type="tel" placeholder="Numero con +39" maxlength="20" value="' + esc(m.emerT || '') + '"></div>' +
    '<div class="acts" style="margin-top:10px">' + (m.emerT ? '<a class="btn tealb" href="tel:' + esc(m.emerT) + '">' + ICONS.phone + 'Chiama ' + esc(m.emerN || 'il contatto') + '</a>' : '') + '<button class="btn ghost" id="mdSave2">Salva</button></div></div></div>' +
    '<div class="about">La scheda e i farmaci restano su questo telefono, non passano da internet.</div>';

  const leggi = () => {
    MED_CAMPI.forEach(([k]) => { const el = $('#md_' + k); if (el) S.med[k] = el.value.trim(); });
    const en = $('#mdEN'), et = $('#mdET'); if (en) S.med.emerN = en.value.trim(); if (et) S.med.emerT = et.value.trim();
  };
  const salva = () => { leggi(); save(); sfx('check'); toast('Scheda salvata'); drawSalute(); };
  $('#bSalBack').onclick = () => { leggi(); save(); sfx('back'); emit('open', 'back'); };
  $('#mdSave').onclick = salva; $('#mdSave2').onclick = salva;
  $('#mdShow').onclick = () => { leggi(); save(); sfx('tick'); schedaGrande(); };
  $('#mdAdd').onclick = () => {
    const n = $('#mdN').value.trim(), pa = $('#mdPa').value.trim(), d = $('#mdD').value.trim();
    if (!n && !pa) { toast('Scrivi almeno il nome o il principio attivo'); return; }
    leggi(); S.med.meds = (S.med.meds || []).concat([{ n, pa, d }]); save(); sfx('check'); drawSalute();
  };
  $$('#pSalute [data-del]').forEach(b => b.onclick = () => { leggi(); S.med.meds.splice(+b.dataset.del, 1); save(); sfx('uncheck'); drawSalute(); });
}
