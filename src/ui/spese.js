/* Pagina "Spese". */
import { CATS } from '../data/steps.js';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const C = k => CATS[k] || CATS[CATS.length - 1];
import { ICONS } from '../icons.js';
import { S, save } from '../state.js';
import { $, $$, toast, header } from './dom.js';
import { sfx } from '../audio/sfx.js';

export const eur = n => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export function drawSpese() {
  const tot = S.exp.reduce((a, x) => a + x.amt, 0), rem = S.budget - tot, pct = Math.min(100, tot / S.budget * 100);
  const byCat = {}; S.exp.forEach(x => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amt; });
  const sum = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]).map(k => '<span class="chip">' + C(k).i + ' ' + C(k).n + ' <b>' + eur(byCat[k]) + '</b></span>').join('');
  const list = S.exp.slice().sort((a, b) => b.ts - a.ts).map(x =>
    '<div class="xi"><span class="xk">' + C(x.cat).i + '</span><div class="xt"><b>' + esc(x.note || C(x.cat).n) + '</b><span>' +
    new Date(x.ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + '</span></div><span class="xa tnum">' + eur(x.amt) + '</span><button class="xd" data-id="' + x.id + '" aria-label="Elimina">' + ICONS.x + '</button></div>').join('');

  $('#pSpese').innerHTML = header(S.exp.length + ' movimenti', 'Spese', { gear: true }) +
    '<div class="card bud"><div class="lbl"><span class="eyebrow">Restano</span><button id="bBud">Budget ' + eur(S.budget) + '</button></div>' +
    '<div class="num tnum' + (rem < 0 ? ' over' : '') + (eur(rem).length > 13 ? ' xs' : eur(rem).length > 10 ? ' sm' : '') + '">' + eur(rem) + '</div><div class="sub">Impegnati ' + eur(tot) + '</div>' +
    '<div class="bar"><i class="' + (rem < 0 ? 'over' : '') + '" style="width:' + pct + '%"></i></div>' + (sum ? '<div class="chips xsum">' + sum + '</div>' : '') + '</div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">Nuova spesa</span></div><div class="card addx"><div class="fr"><input class="amt tnum" id="xAmt" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" maxlength="12"><input id="xNote" type="text" placeholder="Cos\'è" maxlength="40"></div>' +
    '<div class="cats">' + CATS.map((c, k) => '<button class="cat' + (k === S.cat ? ' on' : '') + '" data-k="' + k + '">' + c.i + ' ' + c.n + '</button>').join('') + '</div>' +
    '<button class="btn tealb" id="xAdd" style="width:100%;margin-top:12px">Aggiungi</button></div></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">Movimenti</span></div>' + list + '</div>';

  $('#bBud').onclick = () => {
    const v = prompt('Budget totale del viaggio (€)', String(S.budget)); const n = parseFloat(String(v).replace(',', '.'));
    if (isNaN(n) || n <= 0) { if (v !== null) toast('Budget non valido'); return; }
    if (n > 1000000) { toast('Budget troppo grande'); return; }
    { S.budget = n; S.budgetSet = true; save(); drawSpese(); sfx('tick'); }
  };
  $$('#pSpese .cat').forEach(b => b.onclick = () => { S.cat = +b.dataset.k; $$('#pSpese .cat').forEach(x => x.classList.toggle('on', +x.dataset.k === S.cat)); sfx('tick'); });
  const add = () => {
    /* il campo è di testo: su iPhone la tastiera dà la virgola, un input type=number la scarterebbe */
    const a = parseFloat(String($('#xAmt').value).replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (isNaN(a) || a <= 0) { toast('Inserisci un importo'); return; }
    if (a > 100000) { toast('Importo troppo grande'); return; }
    S.exp.push({ id: Date.now() * 1000 + Math.floor(Math.random() * 1000), amt: Math.round(a * 100) / 100, cat: S.cat, note: $('#xNote').value.trim().slice(0, 40), ts: Date.now() });
    save(); sfx('coin'); drawSpese();
  };
  $('#xAdd').onclick = add; $('#xAmt').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  $$('#pSpese .xd').forEach(b => b.onclick = () => { S.exp = S.exp.filter(x => x.id !== +b.dataset.id); save(); sfx('uncheck'); drawSpese(); });
}
