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
    }
  } catch (e) {}
}
