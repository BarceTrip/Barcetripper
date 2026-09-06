/* Stato condiviso dell'app, salvato in localStorage. */
import { STEPS } from './data/steps.js';

const KEY = 'viaggio';

export const S = {
  i: 0, tab: 'step', checks: {}, theme: 'dark', notified: {},
  exp: [], budget: 3500, budgetSet: false, cat: 0,
  seeded: false, seedV2: false, snd: true, music: true,
  bag: { mode: 'out', checks: {}, custom: [], hidden: [] },   // valigia: andata/ritorno, spunte, oggetti aggiunti, predefiniti tolti
  pl: { want: {}, done: {}, zoom: 'near' },                      // luoghi: da vedere, fatti, zoom della mappa
};

export function save() {
  const { i, checks, theme, notified, exp, budget, budgetSet, seeded, seedV2, snd, music, bag, pl } = S;
  try { localStorage.setItem(KEY, JSON.stringify({ i, checks, snd, music, theme, notified, exp, budget, budgetSet, seeded, seedV2, bag, pl })); } catch (e) {}
}

export function load() {
  try {
    const v = localStorage.getItem(KEY);
    if (v) {
      const d = JSON.parse(v);
      if (Number.isInteger(d.i) && d.i >= 0 && d.i < STEPS.length) S.i = d.i;
      if (d.checks) S.checks = d.checks;
      if (d.snd === false) S.snd = false;
      if (d.music === false) S.music = false;
      if (d.theme) S.theme = d.theme;
      if (d.notified) S.notified = d.notified;
      if (Array.isArray(d.exp)) S.exp = d.exp;
      if (typeof d.budget === 'number') {
        S.budget = d.budget; S.budgetSet = !!d.budgetSet;
        if ((S.budget === 1200 || S.budget === 2500) && !S.budgetSet) S.budget = 3500;
      }
      S.seeded = !!d.seeded; S.seedV2 = !!d.seedV2;
      if (d.bag && typeof d.bag === 'object') S.bag = { mode: d.bag.mode === 'back' ? 'back' : 'out', checks: d.bag.checks || {}, custom: Array.isArray(d.bag.custom) ? d.bag.custom : [], hidden: Array.isArray(d.bag.hidden) ? d.bag.hidden : [] };
      if (d.pl && typeof d.pl === 'object') S.pl = { want: d.pl.want || {}, done: d.pl.done || {}, zoom: d.pl.zoom === 'city' ? 'city' : 'near' };
    }
  } catch (e) {}
  /* spese già sostenute, inserite una volta sola */
  if (!S.seeded) {
    S.exp = [
      { id: 1, amt: 82.95, cat: 1, note: 'Voli Vueling + Wizz (lastminute)', ts: Date.parse('2026-09-01T17:51') },
      { id: 2, amt: 109.80, cat: 1, note: 'Frecciarossa A/R Sibari-Roma', ts: Date.parse('2026-09-01T18:00') },
    ];
    S.seeded = true;
  }
  if (!S.seedV2) {
    S.exp.push(
      { id: 3, amt: 805.03, cat: 2, note: 'Abba Sants, 4 notti (si paga il 15)', ts: Date.parse('2026-09-02T05:23') },
      { id: 4, amt: 105.00, cat: 2, note: 'Hotel Riviera con colazione (si paga il 20)', ts: Date.parse('2026-09-02T09:42') },
    );
    S.seedV2 = true;
  }
}
