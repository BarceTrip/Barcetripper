/* Pagina "Impostazioni" e tema. */
import { ICONS } from '../icons.js';
import { S } from '../state.js';
import { $, header } from './dom.js';
import { musicOn } from '../audio/music.js';

const THEME_COLOR = { dark: '#28353D', light: '#F4EFE8' };

export function applyTheme() {
  document.documentElement.setAttribute('data-theme', S.theme);
  const ico = $('#icoTheme'); if (ico) ico.innerHTML = S.theme === 'light' ? ICONS.moon : ICONS.sun;
  const lbl = $('#themeLbl'); if (lbl) lbl.textContent = S.theme === 'light' ? 'Tema chiaro' : 'Tema scuro';
  document.querySelector('meta[name=theme-color]').setAttribute('content', THEME_COLOR[S.theme]);
}
export function syncSwitches() {
  $('#swSnd').classList.toggle('on', S.snd);
  $('#swMus').classList.toggle('on', S.music || musicOn());
  $('#swTheme').classList.toggle('on', S.theme === 'light');
}
const row = (id, ico, t, sub, sw) => '<button class="srow" id="' + id + '">' + ico + '<div class="st">' + t + (sub ? '<small' + (sub[0] ? ' id="' + sub[0] + '"' : '') + '>' + sub[1] + '</small>' : '') + '</div>' + (sw ? '<span class="sw" id="' + sw + '"></span>' : '') + '</button>';

/* Disegnata una volta sola: notify.js e main.js si agganciano agli id. */
export function drawSettings() {
  $('#pSettings').innerHTML = header('Preferenze', 'Impostazioni', { back: 'bSetBack' }) +
    row('sNow', ICONS.clock, "Vai all'ora attuale", [null, 'Salta alla tappa giusta per adesso']) +
    row('sNotif', ICONS.bell, 'Avvisi 30 minuti prima', ['notifSub', 'Non attivi'], 'swNotif') +
    row('sIcs', ICONS.cal, 'Salva nel calendario', [null, '22 eventi con avviso, funziona ad app chiusa']) +
    '<div class="sec"><div class="sh"><span class="eyebrow">Aspetto e suoni</span></div>' +
    row('sTheme', ICONS.sunI, '<span id="themeLbl">Tema scuro</span>', null, 'swTheme') +
    row('sSnd', ICONS.sound, 'Suoni', null, 'swSnd') +
    row('sMus', ICONS.music, 'Rumba catalana', [null, 'Parte al primo tocco sullo schermo'], 'swMus') + '</div>' +
    '<div class="about">BarceTrip · 15–20 settembre 2026</div>';
}
