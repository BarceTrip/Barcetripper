/* Pagina "Emergenza". */
import { ABBA, RIV, curHotel } from '../data/steps.js';
import { sfx } from '../audio/sfx.js';
import { ICONS } from '../icons.js';
import { $, $$ } from './dom.js';
import { header } from './dom.js';
import { copyTxt } from './oggi.js';
import { goHotel } from './luoghi.js';
import { emit } from './dom.js';
import { frasiHtml, frasiBind, frasiOnRedraw } from './frasi.js';

export function showBig(txt) {
  const b = $('#bigtxt'); b.innerHTML = txt + '<small>Tocca per chiudere</small>'; b.classList.add('on'); b.onclick = () => b.classList.remove('on');
}
const call = (num, big, sub, pri) => '<a class="call' + (pri ? ' pri' : '') + '" href="tel:' + num + '"><span class="mi">' + ICONS.phone + '</span><div><b>' + big + '</b><span>' + sub + '</span></div></a>';

frasiOnRedraw(() => drawSos());
export function drawSos() {
  const h = curHotel();
  const codes = [['Hotel Abba', ABBA.ref], ['Hotel Riviera', RIV.ref], ['Vueling', 'ZWV6HN'], ['Wizz Air', 'JPIMFD'], ['Trenitalia', 'SJMTUN'], ['Domus Aurea', 'GPCO54KG2XQNN8NW']]
    .map(c => '<span class="chip copy" data-v="' + c[1] + '" role="button">' + c[0] + ' <b>' + c[1] + '</b>' + ICONS.copy + '</span>').join('');

  $('#pSos').innerHTML = header('Numeri, hotel, codici, frasi', 'Emergenza', { coral: true }) +
    '<div class="calls">' +
    call('112', '112', 'Polizia, ambulanza, vigili del fuoco. Vale in Spagna e in Italia', 1) +
    call('088', '088', "Mossos d'Esquadra, polizia catalana") +
    call('+34930338000', 'Consolato', "Carrer d'Aribau 185 · risponde lun, mer, gio, ven 15-16 e mar 11-12") +
    call('+34659790266', 'Reperibilità', 'Funzionario di turno del Consolato: feriali 18-22, weekend 9-22. Solo emergenze gravi') +
    call(h.tel, 'Hotel', h.name) + '</div>' +
    '<button class="btn tealb wide" id="bSalute">' + ICONS.cross + 'Salute e scheda medica</button>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">Dove alloggi adesso</span></div><div class="card hot"><b>' + h.name + '</b><div class="ad">' + h.addr + '</div><div class="hr">' +
    '<button class="btn tealb" id="bShowAddr">' + ICONS.big + 'Mostra al tassista</button>' + (h === ABBA ? '<button class="btn" id="bGoHotel">' + ICONS.nav + 'Portami in hotel</button>' : '') + '</div></div></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">I tuoi codici</span><small>tocca per copiare</small></div><div class="chips">' + codes + '</div></div>' +
    frasiHtml() +
    '<div class="frsel" id="frSel" hidden><div class="fst"><b class="fsx"></b><span class="fsi"></span></div><div class="fsb"><button class="ibtn" data-act="ripeti" aria-label="Ripeti">' + ICONS.speak + '</button><button class="ibtn" data-act="grande" aria-label="Mostra grande">' + ICONS.big + '</button><button class="ibtn" data-act="chiudi" aria-label="Chiudi">' + ICONS.x + '</button></div></div>' +
    '<div class="sec"><div class="sh"><span class="eyebrow">Se ti rubano qualcosa</span></div><div class="note">Denuncia ai Mossos entro 24 ore: senza, l\'assicurazione non paga.</div><div class="note">Blocca subito la carta dall\'app Revolut e la SIM dal tuo operatore.</div><div class="note">Segna l\'IMEI del telefono: lo trovi sulla scatola o nella fattura salvata sul cloud.</div></div>';

  $('#bShowAddr').onclick = () => showBig(h.name + '<br>' + h.addr);
  $('#bSalute').onclick = () => { sfx('tick'); emit('open', 'salute'); };
  frasiBind();
  const gh = $('#bGoHotel'); if (gh) gh.onclick = goHotel;
  $$('#pSos .chips .chip.copy').forEach(f => f.onclick = () => copyTxt(f.dataset.v));
}
