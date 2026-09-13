/* Pagina "Valigia": tessere spuntabili, andata e ritorno.
   Gli oggetti predefiniti stanno in data/valigia.js; quelli aggiunti a mano, quelli tolti e le spunte in S.bag. */
import { BAG_CATS, BAG_ITEMS, BAG_BACK_CAT } from '../data/valigia.js';
import { ICONS } from '../icons.js';
import { S, save } from '../state.js';
import { $, $$, toast, header, emit, tileTxt } from './dom.js';
import { sfx } from '../audio/sfx.js';
import { tilePop, bagDone } from './celebra.js';

let edit = false;   // modalità "togli oggetti"
let addCat = 0;     // categoria scelta per l'oggetto nuovo

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isBack = () => S.bag.mode === 'back';

/* oggetti visibili adesso: predefiniti non tolti, filtrati per andata/ritorno, più quelli aggiunti a mano */
export function bagItems() {
  const back = isBack();
  return BAG_ITEMS.filter(x => !S.bag.hidden.includes(x.id) && (!x.back || back) && (!x.out || !back)).concat(S.bag.custom);
}
export function bagCount() {
  const it = bagItems(), done = it.filter(x => S.bag.checks[x.id]).length;
  return { tot: it.length, done, todo: it.length - done };
}

/* anello di avanzamento nel colore corrente */
export function ring(frac, size, sw) {
  const r = (size - sw) / 2, C = 2 * Math.PI * r, c = size / 2;
  return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' +
    '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="' + sw + '"/>' +
    (frac > 0 ? '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) +
      '" stroke-dashoffset="' + (C * (1 - Math.min(1, frac))).toFixed(1) + '" transform="rotate(-90 ' + c + ' ' + c + ')"/>' : '') + '</svg>';
}

/* la borsa con le misure dell'oggetto personale */
const BAG_SVG = '<svg viewBox="0 0 134 134" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M28 34l14-12h54l-14 12z" fill="currentColor" fill-opacity=".12"/>' +
  '<path d="M82 34l14-12v72l-14 12z" fill="currentColor" fill-opacity=".07"/>' +
  '<rect x="28" y="34" width="54" height="72" rx="7" fill="currentColor" fill-opacity=".2"/>' +
  '<path d="M46 34v-5a9 9 0 0 1 18 0v5"/><path d="M36 52h38"/><rect x="40" y="66" width="30" height="24" rx="4"/>' +
  '<path d="M28 116h54M28 112v8M82 112v8"/><path d="M108 34v72M104 34h8M104 106h8"/><path d="M22 28l14-12"/>' +
  '<g font-size="11" font-weight="800" fill="currentColor" stroke="none" text-anchor="middle"><text x="55" y="129">30 cm</text><text x="122" y="74">40</text><text x="22" y="13">20</text></g></svg>';

const tile = (x, ok) => '<button class="tile' + (ok ? ' ok' : '') + (edit ? ' rm' : '') + '" data-id="' + x.id + '"><span class="ti">' + (edit ? ICONS.x : ICONS.check) + '</span><span class="tt">' + tileTxt(x.t) + '</span></button>';

/* cambio andata/ritorno: le spunte si azzerano, gli oggetti (anche quelli aggiunti) restano */
function switchMode(mode) {
  if (!confirm(mode === 'back' ? 'Preparo la valigia del ritorno? Le spunte si azzerano, gli oggetti restano.' : "Torno alla valigia dell'andata? Le spunte si azzerano.")) return false;
  S.bag.mode = mode; S.bag.checks = {}; save(); sfx('free');
  toast(mode === 'back' ? 'Ritorno: rimetti tutto in valigia' : "Valigia dell'andata"); return true;
}

/* striscia in cima alla pagina Oggi. kind: "out" alla partenza, "back" ai check-out */
export function bagStrip(kind) {
  const { tot, done, todo } = bagCount(), back = isBack();
  let t, sub;
  if (kind === 'back' && !back) { t = 'Valigia del ritorno'; sub = 'Tocca per prepararla: le spunte si azzerano'; }
  else if (!todo) { t = 'Valigia pronta'; sub = tot + ' oggetti' + (back ? ', non hai dimenticato nulla' : ', si può partire'); }
  else { t = back ? 'Valigia del ritorno' : 'Valigia'; sub = todo + ' da mettere · ' + done + ' di ' + tot + ' già dentro'; }
  return '<button class="bagstrip" id="bBag" data-kind="' + kind + '"><span class="bring">' + ring(tot ? done / tot : 0, 36, 4) + '<i>' + ICONS.bag + '</i></span>' +
    '<span class="bt"><b>' + t + '</b><span>' + sub + '</span></span>' + ICONS.chevR + '</button>';
}
export function bagStripBind() {
  const b = $('#bBag'); if (!b) return;
  b.onclick = () => { sfx('tick'); if (b.dataset.kind === 'back' && !isBack() && !switchMode('back')) return; emit('open', 'valigia'); };
}

export function drawValigia() {
  const back = isBack(), items = bagItems(), { tot, done, todo } = bagCount();
  const frac = tot ? done / tot : 0, all = tot > 0 && !todo;
  if (addCat === BAG_BACK_CAT && !back) addCat = 0;

  const hero = '<div class="bhero"><div class="bring">' + ring(frac, 84, 8) + '<b>' + Math.round(frac * 100) + '%</b></div><div class="bh">' +
    '<span class="eyebrow">' + (back ? 'Ritorno' : 'Andata') + '</span><b>' + (all ? 'Tutto in valigia' : todo + ' da mettere') + '</b>' +
    '<span class="bsub">' + (all ? tot + ' oggetti' + (back ? ', non hai dimenticato nulla' : ', si può partire') : done + ' di ' + tot + ' già dentro') + '</span></div></div>' +
    '<div class="bacts"><div class="seg"><button data-m="out"' + (back ? '' : ' class="on"') + '>Andata</button><button data-m="back"' + (back ? ' class="on"' : '') + '>Ritorno</button></div>' +
    '<button class="btn ghost" id="bgReset"' + (done ? '' : ' disabled') + '>Azzera</button></div>';

  const limit = '<div class="card bagcard">' + BAG_SVG + '<div><b>Solo l\'oggetto personale sotto il sedile</b><span>40 × 30 × 20 cm, su Vueling e su Wizz Air. Wizz lo misura davvero: se non entra nella sagoma si paga al gate.</span></div></div>';

  const cats = BAG_CATS.map((c, k) => {
    const its = items.filter(x => x.c === k); if (!its.length) return '';
    const td = its.filter(x => !S.bag.checks[x.id]);
    if (!td.length && !edit) return '';   // categoria completa: le sue tessere sono sotto, in "In valigia"
    return '<div class="sec"><div class="sh"><span class="eyebrow">' + c[0] + ' ' + c[1] + '</span><small>' + (td.length ? td.length + ' da mettere' : 'tutto dentro') + '</small></div>' +
      '<div class="grid">' + (edit ? its : td).map(x => tile(x, S.bag.checks[x.id])).join('') + '</div></div>';
  }).join('');

  const nh = S.bag.hidden.length;
  const restore = edit && nh ? '<div class="sec"><button class="btn ghost" id="bgRestore" style="width:100%">Rimetti ' + (nh === 1 ? "l'oggetto tolto" : 'i ' + nh + ' oggetti tolti') + '</button></div>' : '';

  const add = '<div class="sec"><div class="sh"><span class="eyebrow">Aggiungi un oggetto</span></div><div class="card addx"><div class="fr"><input id="bgTxt" type="text" placeholder="Cosa vuoi portare" maxlength="40" autocomplete="off"></div>' +
    '<div class="cats">' + BAG_CATS.map((c, k) => k === BAG_BACK_CAT && !back ? '' : '<button class="cat' + (k === addCat ? ' on' : '') + '" data-k="' + k + '">' + c[0] + ' ' + c[1] + '</button>').join('') + '</div>' +
    '<button class="btn tealb" id="bgAdd" style="width:100%;margin-top:12px">Aggiungi</button></div></div>';

  const dn = items.filter(x => S.bag.checks[x.id]);
  const inBag = dn.length && !edit ? '<div class="sec done"><div class="sh"><span class="eyebrow">In valigia</span><small>tocca per tirare fuori</small></div><div class="grid">' + dn.map(x => tile(x, true)).join('') + '</div></div>' : '';

  const chip = '<button class="chipbtn' + (edit ? ' on' : '') + '" id="bgEdit">' + (edit ? 'Fine' : 'Togli oggetti') + '</button>';
  $('#pValigia').innerHTML = header((back ? 'Ritorno' : 'Andata') + ' · ' + tot + ' oggetti', 'Valigia', { back: 'bBagBack', extra: chip }) + hero + limit + cats + restore + add + inBag +
    '<div class="about">' + (edit ? 'Tocca un oggetto per toglierlo dall\'elenco' : 'Spunte e oggetti restano salvati sul telefono') + '</div>';

  $('#bBagBack').onclick = () => { sfx('back'); emit('open', 'back'); };
  $('#bgEdit').onclick = () => { edit = !edit; sfx('tick'); drawValigia(); };
  $$('#pValigia .seg button').forEach(b => b.onclick = () => { if (b.dataset.m !== S.bag.mode && switchMode(b.dataset.m)) drawValigia(); });
  $('#bgReset').onclick = () => { if (!confirm('Azzero tutte le spunte?')) return; S.bag.checks = {}; save(); sfx('uncheck'); drawValigia(); };
  const rs = $('#bgRestore'); if (rs) rs.onclick = () => { S.bag.hidden = []; save(); sfx('check'); drawValigia(); };
  $$('#pValigia .cat').forEach(b => b.onclick = () => { addCat = +b.dataset.k; $$('#pValigia .cat').forEach(x => x.classList.toggle('on', +x.dataset.k === addCat)); sfx('tick'); });
  const addItem = () => {
    const t = $('#bgTxt').value.trim(); if (!t) { toast('Scrivi cosa vuoi portare'); return; }
    S.bag.custom.push({ id: 'u' + Date.now(), t, c: addCat }); save(); sfx('check'); toast('Aggiunto: ' + t); drawValigia();
  };
  $('#bgAdd').onclick = addItem; $('#bgTxt').addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
  $$('#pValigia .tile').forEach(b => b.onclick = () => {
    const id = b.dataset.id;
    if (edit) {
      const it = items.find(x => x.id === id);
      if (id[0] === 'u') S.bag.custom = S.bag.custom.filter(x => x.id !== id); else S.bag.hidden.push(id);
      delete S.bag.checks[id]; save(); sfx('uncheck'); toast('Tolto: ' + (it ? it.t : '')); drawValigia(); return;
    }
    if (S.bag.checks[id]) delete S.bag.checks[id]; else S.bag.checks[id] = true;
    save();
    const ok = !!S.bag.checks[id], all = ok && !bagCount().todo;
    if (!all) sfx(ok ? 'pop' : 'uncheck');
    drawValigia();
    tilePop($('#pValigia .tile[data-id="' + id + '"]'), ok);
    if (all) setTimeout(() => bagDone(isBack()), 200);
  });
}
