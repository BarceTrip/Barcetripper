/* Effetti sonori sintetizzati con WebAudio. */
import { S } from '../state.js';

let ctx = null;
export function actx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export const getCtx = () => ctx;

export function tone(f, t, dur, type, vol, slide, dest) {
  const c = actx(); const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .1, t + .012);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(dest || c.destination); o.start(t); o.stop(t + dur + .03);
}
export function noise(c, t, dur, vol, fq, q, dest) {
  const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate); const d = b.getChannelData(0);
  for (let k = 0; k < d.length; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / d.length, 2.2);
  const s = c.createBufferSource(); s.buffer = b;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fq; f.Q.value = q;
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(dest || c.destination); s.start(t);
}

export function sfx(kind) {
  if (!S.snd) return;
  try {
    const c = actx(), t = c.currentTime;
    switch (kind) {
      case 'tick': tone(880, t, .06, 'sine', .06, 660); break;
      case 'rail': noise(c, t, .03, .25, 2200, 1.2); noise(c, t + .06, .03, .18, 2200, 1.2); noise(c, t + .12, .03, .12, 2200, 1.2); break;
      case 'air': tone(523, t, .16, 'triangle', .07); tone(784, t + .12, .26, 'triangle', .07); break;
      case 'stay': tone(659, t, .4, 'sine', .06); tone(523, t + .16, .5, 'sine', .05); tone(392, t + .32, .7, 'sine', .05); break;
      case 'free': tone(659, t, .1, 'sine', .05); tone(880, t + .09, .16, 'sine', .05); break;
      case 'check': tone(1300, t, .05, 'sine', .05, 950); break;
      case 'uncheck': tone(700, t, .05, 'sine', .04, 500); break;
      case 'back': tone(440, t, .06, 'sine', .05, 330); break;
      case 'copy': tone(1046, t, .05, 'sine', .05); tone(1568, t + .05, .08, 'sine', .04); break;
      case 'coin': tone(1318, t, .07, 'square', .03); tone(1760, t + .06, .12, 'square', .03); break;
      case 'alarm': [880, 1100, 880, 1100].forEach((f, k) => tone(f, t + k * .16, .14, 'triangle', .08)); break;
      case 'sos': tone(660, t, .1, 'square', .05); tone(520, t + .12, .16, 'square', .05); break;
      case 'done': [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, t + k * .09, .45, 'triangle', .06)); break;
      /* ---- celebrazioni ---- */
      case 'pop': tone(1400, t, .07, 'sine', .07, 2000); tone(2400, t + .05, .1, 'sine', .04); break;
      case 'allset': [784, 988, 1175, 1568].forEach((f, k) => tone(f, t + k * .07, .32, 'triangle', .06)); tone(2093, t + .3, .55, 'sine', .04); tone(2637, t + .36, .5, 'sine', .03); break;
      case 'stamp': tone(140, t, .14, 'sine', .22, 55); noise(c, t, .05, .35, 700, .9); break;
      case 'whistle': /* fischio a due note e sbuffi che accelerano */
        [0, .5].forEach(o => { tone(880, t + o, o ? .55 : .3, 'square', .045, o ? 880 : 940); tone(1108, t + o, o ? .55 : .3, 'square', .035, o ? 1108 : 1180); tone(1320, t + o, o ? .5 : .28, 'sine', .03); });
        [0, .22, .42, .6, .76, .9, 1.02, 1.13].forEach((o, k) => noise(c, t + 1.05 + o, .05, .28 - k * .02, 1400 + k * 120, 1.1));
        break;
      case 'takeoff': /* soffio che sale e carillon d'arrivo */
        [0, .12, .24, .36, .48, .6, .72].forEach((o, k) => noise(c, t + o, .16, .06 + k * .03, 500 + k * 260, .6));
        tone(220, t, .9, 'sawtooth', .02, 660);
        [784, 988, 1319, 1568].forEach((f, k) => tone(f, t + .95 + k * .08, .5, 'triangle', .05));
        break;
      case 'bell': /* campanello della reception, due colpi */
        [0, .38].forEach(o => { tone(2637, t + o, 1.1, 'sine', .07); tone(3951, t + o, .7, 'sine', .03); tone(1319, t + o + .01, 1.2, 'sine', .04); noise(c, t + o, .02, .2, 4000, 2); });
        break;
      case 'keys': /* tintinnio di chiavi */
        [0, .07, .12, .2, .26, .35, .41, .52].forEach((o, k) => { tone(3200 + ((k * 7919) % 1800), t + o, .09, 'triangle', .035); noise(c, t + o, .02, .12, 5000, 3); });
        break;
      case 'party': /* tre accordi di rumba e tamburello */
        [[220, 277, 330, 440], [196, 247, 294, 392], [174, 220, 262, 349], [165, 208, 247, 330]].forEach((ch, k) => ch.forEach((f, j) => tone(f, t + k * .19 + j * .012, .26, 'sawtooth', .022)));
        [0, .19, .38, .57, .76].forEach((o, k) => noise(c, t + o, .06, .16, 6000 + (k % 2) * 800, 2.2));
        [523, 659, 784].forEach((f, k) => tone(f, t + .8 + k * .07, .4, 'triangle', .05));
        break;
      case 'fanfare': /* squilli di tromba e accordo finale */
        [[523, 0], [523, .14], [659, .28], [784, .42], [1047, .62]].forEach(([f, o]) => tone(f, t + o, .22, 'square', .045));
        [1047, 1319, 1568, 2093].forEach((f, k) => tone(f, t + .95, 1.3, 'triangle', .05 - k * .005));
        [0, .16, .32, .48].forEach(o => noise(c, t + .95 + o, .05, .1, 7000, 2.5));
        break;
      case 'firework': tone(400, t, .35, 'sine', .04, 1400); noise(c, t + .38, .25, .3, 900, .5); [0, .05, .11, .16, .24, .3].forEach(o => noise(c, t + .4 + o, .03, .12, 3000 + Math.random() * 3000, 2)); break;
      case 'whoosh': [0, .06, .12, .18, .24].forEach((o, k) => noise(c, t + o, .1, .12, 2400 - k * 380, .7)); break;
      case 'box': tone(660, t, .08, 'square', .04); tone(880, t + .1, .08, 'square', .04); tone(1320, t + .2, .3, 'square', .035); noise(c, t + .32, .04, .2, 1200, 1); break;
      case 'road': [0, .25, .5].forEach((o, k) => { noise(c, t + o, .12, .1, 900 + k * 300, .5); }); tone(330, t, .8, 'sawtooth', .02, 520); tone(1047, t + .85, .3, 'triangle', .05); tone(1319, t + .95, .4, 'triangle', .05); break;
    }
  } catch (e) {}
}
