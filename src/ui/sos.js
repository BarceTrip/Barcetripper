/* Schermata di emergenza. */
import { PHRASES, ABBA, RIV, curHotel } from '../data/steps.js';
import { ICONS } from '../icons.js';
import { $, $$ } from './dom.js';
import { sfx } from '../audio/sfx.js';
import { copyTxt } from './step.js';

export function showBig(txt) {
  const b = $('#bigtxt'); b.innerHTML = txt + '<small>Tocca per chiudere</small>'; b.classList.add('on'); b.onclick = () => b.classList.remove('on');
}
const call = (num, big, sub, pri) => '<a class="g big' + (pri ? ' pri' : '') + '" href="tel:' + num + '"><span class="mi" style="--mode:' + (pri ? '#fff' : 'var(--danger)') + '">' + ICONS.phone + '</span><div><b>' + big + '</b><span>' + sub + '</span></div></a>';

export function drawSos() {
  const h = curHotel();
  const codes = [['Hotel Abba', ABBA.ref], ['Hotel Riviera', RIV.ref], ['Vueling', 'ZWV6HN'], ['Wizz Air', 'JPIMFD'], ['Trenitalia', 'SJMTUN']]
    .map(c => '<span class="chip copy" data-v="' + c[1] + '" role="button">' + c[0] + ' <b>' + c[1] + '</b>' + ICONS.copy + '</span>').join('');
  const ph = PHRASES.map(p => {
    const t = p.replace('{ADDR}', h.addr); const q = t.replace(/"/g, '&quot;');
    return '<div class="g ph"><span>' + t + '</span><button class="g round" data-copy="' + q + '" aria-label="Copia">' + ICONS.copy + '</button><button class="g round" data-big="' + q + '" aria-label="Mostra grande">' + ICONS.big + '</button></div>';
  }).join('');

  $('#sosIn').innerHTML = '<div class="ov-h"><h1>Emergenza</h1><button class="g round" id="sosClose" aria-label="Chiudi">' + ICONS.x + '</button></div>' +
    call('112', '112', 'Polizia, ambulanza, vigili del fuoco — Spagna e Italia', 1) +
    call('088', '088', "Mossos d'Esquadra, polizia catalana") +
    call('+34930338000', "Consolato d'Italia", "Barcellona, Carrer d'Aribau 185") +
    call('+34659790266', 'Reperibilità consolare', 'Solo emergenze gravi fuori orario') +
    '<div class="sec"><div class="eyebrow">Dove alloggi adesso</div><div class="g hot"><b>' + h.name + '</b><div class="ad">' + h.addr + '</div><div class="hr">' +
    '<a class="g pill tint" href="tel:' + h.tel + '" style="--mode:var(--stay)">' + ICONS.phone + h.telTxt + '</a><button class="g pill" id="bShowAddr">' + ICONS.big + 'Mostra al tassista</button></div></div></div>' +
    '<div class="sec"><div class="eyebrow">I tuoi codici — tocca per copiare</div><div class="chips" style="margin-top:0">' + codes + '</div></div>' +
    '<div class="sec"><div class="eyebrow">Frasi pronte</div>' + ph + '</div>' +
    '<div class="sec"><div class="eyebrow">Se ti rubano qualcosa</div><div class="g note">Denuncia ai Mossos entro 24 ore: senza, l\'assicurazione non paga.</div><div class="g note">Blocca subito la carta dall\'app Revolut e la SIM dal tuo operatore.</div><div class="g note">Segna l\'IMEI del telefono: lo trovi sulla scatola o nella fattura salvata sul cloud.</div></div>';

  $('#sosClose').onclick = () => { $('#sos').classList.remove('on'); sfx('back'); };
  $('#bShowAddr').onclick = () => showBig(h.name + '<br>' + h.addr);
  $$('#sosIn .chip.copy').forEach(f => f.onclick = () => copyTxt(f.dataset.v));
  $$('#sosIn [data-copy]').forEach(b => b.onclick = () => copyTxt(b.dataset.copy));
  $$('#sosIn [data-big]').forEach(b => b.onclick = () => showBig(b.dataset.big));
}
export function openSos() { drawSos(); $('#sos').classList.add('on'); sfx('sos'); window.scrollTo(0, 0); }
