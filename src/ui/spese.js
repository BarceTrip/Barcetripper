/* Pagina "Spese". */
import { CATS } from '../data/steps.js';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const C = k => CATS[k] || CATS[CATS.length - 1];
import { ICONS } from '../icons.js';
import { S, save } from '../state.js';
import { $, $$, toast, header } from './dom.js';
import { sfx } from '../audio/sfx.js';
import { coin } from './celebra.js';

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
    '<div class="sec"><div class="sh"><span class="eyebrow">Nuova spesa</span></div><div class="card addx"><div class="fr"><input id="xNote" type="text" placeholder="Cos\'è" maxlength="40"><label class="amtw"><input class="amt tnum" id="xAmt" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" maxlength="10"><span class="cur tnum" id="xCur" hidden>€</span><span class="ghost tnum" id="xGhost" aria-hidden="true"></span></label></div>' +
    '<div class="cats">' + CATS.map((c, k) => '<button class="cat' + (k === S.cat ? ' on' : '') + '" data-k="' + k + '">' + c.i + ' ' + c.n + '</button>').join('') + '</div>' +
    '<button class="btn tealb" id="xAdd" style="width:100%;margin-top:12px">Aggiungi</button></div></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">Movimenti</span></div>' + list + '</div>';

  /* il budget si cambia nella tessera stessa: il tasto diventa un campo con Ok */
  $('#bBud').onclick = () => {
    sfx('tick');
    $('#pSpese .bud .lbl').innerHTML = '<span class="eyebrow">Budget totale</span><span class="budedit"><input class="tnum" id="budIn" type="text" inputmode="decimal" autocomplete="off" maxlength="9" value="' + String(S.budget).replace('.', ',') + '"><i>€</i><button id="budOk">Ok</button></span>';
    const inp = $('#budIn'); inp.focus(); inp.select();
    const ok = () => {
      const n = parseFloat(String(inp.value).replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (isNaN(n) || n <= 0) { toast('Budget non valido'); drawSpese(); return; }
      if (n > 1000000) { toast('Budget troppo grande'); drawSpese(); return; }
      S.budget = Math.round(n * 100) / 100; S.budgetSet = true; save(); sfx('check'); drawSpese();
    };
    $('#budOk').onclick = ok;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); else if (e.key === 'Escape') drawSpese(); });
  };
  $$('#pSpese .cat').forEach(b => b.onclick = () => { S.cat = +b.dataset.k; $$('#pSpese .cat').forEach(x => x.classList.toggle('on', +x.dataset.k === S.cat)); sfx('tick'); });
  const add = () => {
    /* il campo è di testo: su iPhone la tastiera dà la virgola, un input type=number la scarterebbe */
    const a = parseFloat(String($('#xAmt').value).replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (isNaN(a) || a <= 0) { toast('Inserisci un importo'); return; }
    if (a > 100000) { toast('Importo troppo grande'); return; }
    S.exp.push({ id: Date.now() * 1000 + Math.floor(Math.random() * 1000), amt: Math.round(a * 100) / 100, cat: S.cat, note: $('#xNote').value.trim().slice(0, 40), ts: Date.now() });
    coin($('#xAdd')); save(); sfx('coin'); drawSpese();
  };
  $('#xAdd').onclick = add;
  /* il simbolo € sta subito dopo l'ultima cifra: un gemello invisibile misura quanto è largo il numero */
  const amt = $('#xAmt'), cur = $('#xCur'), ghost = $('#xGhost');
  const segui = () => {
    const v = amt.value.replace(/[^0-9.,]/g, '').replace(/[.,]{2,}/g, ',');
    if (v !== amt.value) amt.value = v;
    ghost.textContent = v; cur.hidden = !v;
    if (v) cur.style.left = Math.min(ghost.offsetWidth + 18, amt.clientWidth - 20) + 'px';
  };
  amt.addEventListener('input', segui);
  amt.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  $('#xNote').addEventListener('keydown', e => { if (e.key === 'Enter') amt.focus(); });
  segui();
  /* la × toglie subito, ma per qualche secondo si può annullare */
  $$('#pSpese .xd').forEach(b => b.onclick = () => {
    const x = S.exp.find(y => y.id === +b.dataset.id); if (!x) return;
    S.exp = S.exp.filter(y => y.id !== x.id); save(); sfx('uncheck'); drawSpese();
    toast('Tolta: ' + eur(x.amt), { label: 'Annulla', fn: () => { S.exp.push(x); save(); sfx('coin'); drawSpese(); } });
  });
}
