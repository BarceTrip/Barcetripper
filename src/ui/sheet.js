/* Foglio impostazioni e tema. */
import { ICONS } from '../icons.js';
import { S } from '../state.js';
import { $ } from './dom.js';
import { musicOn } from '../audio/music.js';

export function applyTheme() {
  document.documentElement.setAttribute('data-theme', S.theme);
  $('#icoTheme').innerHTML = S.theme === 'light' ? ICONS.moon : ICONS.sun;
  document.querySelector('meta[name=theme-color]').setAttribute('content', S.theme === 'light' ? '#E6ECF4' : '#07090D');
}
export function syncSwitches() {
  $('#swSnd').classList.toggle('on', S.snd);
  $('#swMus').classList.toggle('on', S.music || musicOn());
  $('#swTheme').classList.toggle('on', S.theme === 'light');
}
export function openSheet() { $('#scrim').classList.add('on'); $('#sheet').classList.add('on'); }
export function closeSheet() { $('#scrim').classList.remove('on'); $('#sheet').classList.remove('on'); }
