import { ICONS } from "../icons.js";
export const $ = s => document.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

export function toast(m) {
  const t = $('#toast');
  t.textContent = m; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1400);
}

/* piccolo bus eventi per non creare import circolari (es. la mappa che chiede di cambiare tappa) */
export const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
export const on = (name, fn) => document.addEventListener(name, e => fn(e.detail));

/* Intestazione di pagina. opts: {back, gear, coral, extra} */
export function header(eyebrow, title, opts = {}) {
  return '<header class="ph">' +
    (opts.back ? '<button class="ibtn" id="' + opts.back + '" aria-label="Indietro">' + ICONS.chevL + '</button>' : '') +
    '<div class="pt"><div class="eyebrow">' + eyebrow + '</div><h1' + (opts.coral ? ' class="coral"' : '') + '>' + title + '</h1></div>' +
    (opts.extra || '') +
    (opts.gear ? '<button class="ibtn gear" aria-label="Impostazioni">' + ICONS.gear + '</button>' : '') +
    '</header>';
}
