/* Stato condiviso dell'app, salvato in localStorage. */
import { STEPS, CAT_MIGRATE } from './data/steps.js';

const KEY = 'viaggio';

export const S = {
  i: 0, tab: 'step', checks: {}, theme: 'dark', notified: {},
  exp: [], budget: 3500, budgetSet: false, cat: 0,
  seeded: false, seedV2: false, seedV3: false, snd: true, music: true,
  bag: { mode: 'out', checks: {}, custom: [], hidden: [] },   // valigia: andata/ritorno, spunte, oggetti aggiunti, predefiniti tolti
  pl: { want: {}, done: {}, zoom: 'near' },                      // luoghi: da vedere, fatti, zoom della mappa
  med: { meds: [] },                                             // scheda medica: solo su questo telefono
};

export function save() {
  const { i, checks, theme, notified, exp, budget, budgetSet, seeded, seedV2, seedV3, snd, music, bag, pl, med } = S;
  try { localStorage.setItem(KEY, JSON.stringify({ i, checks, snd, music, theme, notified, exp, budget, budgetSet, seeded, seedV2, seedV3, bag, pl, med })); } catch (e) {}
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
      if (d.theme === 'dark' || d.theme === 'light') S.theme = d.theme;
      if (d.notified) S.notified = d.notified;
      if (Array.isArray(d.exp)) S.exp = d.exp;
      if (typeof d.budget === 'number') {
        S.budget = d.budget; S.budgetSet = !!d.budgetSet;
        if ((S.budget === 1200 || S.budget === 2500) && !S.budgetSet) S.budget = 3500;
      }
      S.seeded = !!d.seeded; S.seedV2 = !!d.seedV2; S.seedV3 = !!d.seedV3;
      if (d.bag && typeof d.bag === 'object') S.bag = { mode: d.bag.mode === 'back' ? 'back' : 'out', checks: d.bag.checks || {}, custom: Array.isArray(d.bag.custom) ? d.bag.custom : [], hidden: Array.isArray(d.bag.hidden) ? d.bag.hidden : [] };
      if (d.med && typeof d.med === 'object') S.med = { ...d.med, meds: Array.isArray(d.med.meds) ? d.med.meds : [] };
      if (d.pl && typeof d.pl === 'object') S.pl = { want: d.pl.want || {}, done: d.pl.done || {}, zoom: d.pl.zoom === 'city' ? 'city' : 'near' };
    }
  } catch (e) {}
  /* spese già note, inserite una volta sola. Voli e treni erano qui (id 1 e 2): già pagati, fuori dal budget del viaggio. */
  if (!S.seeded) { S.exp = []; S.seeded = true; }
  if (!S.seedV2) {
    S.exp.push(
      { id: 3, amt: 805.03, cat: 2, note: 'Abba Sants, 4 notti (si paga il 15)', ts: Date.parse('2026-09-02T05:23') },
      { id: 4, amt: 105.00, cat: 2, note: 'Hotel Riviera con colazione (si paga il 20)', ts: Date.parse('2026-09-02T09:42') },
    );
    S.seedV2 = true;
  }
  /* settembre 2026: via voli e treni, categorie nuove, tassa di soggiorno, budget 4000 */
  if (!S.seedV3) {
    S.exp = S.exp.filter(x => x.id !== 1 && x.id !== 2).map(x => ({ ...x, cat: CAT_MIGRATE[x.cat] ?? 5 }));
    S.exp.push({ id: 5, amt: 40, cat: 2, note: 'Tassa di soggiorno Abba, 4 notti, stima', ts: Date.parse('2026-09-08T12:00') });
    S.budget = 4000; S.budgetSet = true; S.seedV3 = true;
    save();   // la migrazione va scritta subito, non alla prossima modifica
  }
}
