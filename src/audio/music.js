/* Rumba catalana generativa: cadenza andalusa Am · G · F · E, pattern "ventilador". */
import { S } from '../state.js';
import { actx, getCtx, tone, noise } from './sfx.js';

const MUS = { on: false, timer: null, nextT: 0, step: 0, master: null, bus: null };
const BPM = 116, SPB = 60 / BPM, S16 = SPB / 4;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = [[45,52,57,60,64],[43,50,55,59,62],[41,48,53,57,60],[40,47,52,56,59]];
const ROOT = [45, 43, 41, 40];
const STRUM = ['d',0,'x','u','d',0,'x','u','d',0,'x','u','d',0,'x','u'];
const VEL   = [1,0,.5,.65,.85,0,.5,.65,1,0,.5,.65,.85,0,.5,.7];
/* [battuta 0-7, sedicesimo, midi, durata in sedicesimi] */
const MEL = [[0,0,69,3],[0,4,72,2],[0,6,71,2],[0,8,69,4],[0,12,67,3],
             [1,0,67,3],[1,4,71,2],[1,6,69,2],[1,8,67,6],
             [2,0,65,3],[2,4,69,2],[2,6,67,2],[2,8,65,4],[2,12,64,3],
             [3,0,64,3],[3,4,68,2],[3,6,65,2],[3,8,64,8],
             [4,0,76,3],[4,4,74,2],[4,6,72,2],[4,8,71,4],[4,12,72,3],
             [5,0,74,3],[5,4,72,2],[5,6,71,2],[5,8,69,6],
             [6,0,72,3],[6,4,71,2],[6,6,69,2],[6,8,67,4],[6,12,65,3],
             [7,0,64,3],[7,4,68,2],[7,6,71,2],[7,8,76,8]];

function gtr(c, t, f, vel, dest) {
  const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2600 * vel + 800, t); lp.frequency.exponentialRampToValueAtTime(420, t + .28);
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.055 * vel, t + .004); g.gain.exponentialRampToValueAtTime(.0004, t + .34);
  o.connect(lp).connect(g).connect(dest); o.start(t); o.stop(t + .4);
}
const strum = (c, t, notes, vel, down, dest) => (down ? notes : notes.slice().reverse()).forEach((m, k) => gtr(c, t + k * .011, mtof(m), vel, dest));
function bassN(c, t, m, dest) {
  const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + .32);
  o.connect(lp).connect(g).connect(dest); o.start(t); o.stop(t + .36);
}
function kick(c, t, dest) {
  const o = c.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
  const g = c.createGain(); g.gain.setValueAtTime(.32, t); g.gain.exponentialRampToValueAtTime(.001, t + .2);
  o.connect(g).connect(dest); o.start(t); o.stop(t + .22);
}
const snare  = (c, t, dest) => { noise(c, t, .12, .14, 1800, .7, dest); tone(190, t, .09, 'triangle', .05, 120, dest); };
const shaker = (c, t, v, dest) => noise(c, t, .035, v, 7000, 1.4, dest);
const chick  = (c, t, v, dest) => noise(c, t, .03, .16 * v, 2600, 1.5, dest);
function lead(c, t, f, dur, dest) {
  const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
  const v = c.createOscillator(); v.frequency.value = 5.5; const vg = c.createGain(); vg.gain.value = 4; v.connect(vg).connect(o.detune);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.075, t + .02); g.gain.setValueAtTime(.075, t + dur * .75); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(lp).connect(g).connect(dest); o.start(t); v.start(t); o.stop(t + dur + .02); v.stop(t + dur + .02);
}
function schedStep(n, t) {
  const c = getCtx(), d = MUS.bus; const bar = Math.floor(n / 16), s = n % 16, ch = CHORDS[bar % 4], root = ROOT[bar % 4], loop = Math.floor(bar / 8);
  const st = STRUM[s], v = VEL[s];
  if (st === 'd' || st === 'u') strum(c, t, ch, v, st === 'd', d); else if (st === 'x') chick(c, t, v, d);
  if (s === 0 || s === 8) bassN(c, t, root - 12, d); if (s === 6 || s === 14) bassN(c, t, root - 5, d);
  if (s === 0 || s === 8) kick(c, t, d); if (s === 4 || s === 12) snare(c, t, d); if (s === 10) kick(c, t, d);
  shaker(c, t, (s % 2 ? .05 : .02), d);
  if (loop % 2 === 1 || loop >= 3) MEL.forEach(m => { if (m[0] === bar % 8 && m[1] === s) lead(c, t, mtof(m[2]), m[3] * S16 * .95, d); });
}

export const musicOn = () => MUS.on;
export function musicStart() {
  const c = actx(); if (MUS.on) return;
  if (!MUS.master) {
    MUS.master = c.createGain(); MUS.master.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
    MUS.bus = c.createGain(); MUS.bus.gain.value = .9;
    MUS.bus.connect(lp).connect(comp).connect(MUS.master).connect(c.destination);
  }
  MUS.on = true; MUS.step = 0; MUS.nextT = c.currentTime + .08;
  MUS.master.gain.cancelScheduledValues(c.currentTime); MUS.master.gain.setTargetAtTime(.42, c.currentTime, 1.2);
  MUS.timer = setInterval(() => { const c = getCtx(); while (MUS.nextT < c.currentTime + .15) { schedStep(MUS.step, MUS.nextT); MUS.nextT += S16; MUS.step++; } }, 25);
}
export function musicStop() {
  if (!MUS.on) return; const c = actx(); MUS.on = false; clearInterval(MUS.timer);
  MUS.master.gain.setTargetAtTime(0, c.currentTime, .4);
}
/* iOS non fa partire l'audio senza un gesto: parte al primo tocco. */
let armed = false;
export function armAutoplay() {
  if (armed) return; armed = true;
  const evs = ['pointerdown', 'touchstart', 'keydown'];
  const go = () => { if (S.music && !MUS.on) { try { musicStart(); } catch (e) {} } evs.forEach(ev => document.removeEventListener(ev, go, true)); };
  evs.forEach(ev => document.addEventListener(ev, go, true));
}
