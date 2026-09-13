/* Particelle sul canvas #confetti: coriandoli, scoppi, scintille, fuochi. Un solo ciclo di disegno per tutto. */
import { sfx } from '../audio/sfx.js';

const COLS = ['#FF5A5A', '#FFCD3C', '#2ED3C0', '#C58CFF', '#3B6BFF', '#FF9F43'];
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const P = []; let raf = 0, ctx = null, cv = null;

function start() {
  if (raf) return;
  cv = document.querySelector('#confetti'); if (!cv) return; ctx = cv.getContext('2d');
  const dpr = devicePixelRatio || 1; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  let last = performance.now();
  raf = requestAnimationFrame(function f(now) {
    const dt = Math.min(2.5, (now - last) / 16.7); last = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let k = P.length - 1; k >= 0; k--) {
      const p = P[k]; p.t += dt * 16.7;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= Math.pow(p.d, dt); p.vy *= Math.pow(p.d, dt); p.r += p.vr * dt;
      const a = Math.max(0, 1 - p.t / p.life); if (a <= 0 || p.y > innerHeight + 30) { P.splice(k, 1); continue; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.globalAlpha = a;
      if (p.k === 'rect') ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6);
      else if (p.k === 'star') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? p.s * .45 : p.s, an = i * Math.PI / 5; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (P.length) raf = requestAnimationFrame(f); else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  });
}
const add = p => { P.push(Object.assign({ t: 0, life: 1800, g: .04, d: .995, r: 0, vr: 0, k: 'dot' }, p)); };

/* pioggia di coriandoli dall'alto */
export function confetti(n = 110) {
  if (RM) return;
  for (let k = 0; k < n; k++) add({ k: 'rect', x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .4, vx: (Math.random() - .5) * 1.8, vy: 2 + Math.random() * 2.8, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .2, s: 5 + Math.random() * 6, c: COLS[k % COLS.length], g: .025, d: 1, life: 3000 });
  start();
}
/* scoppio radiale da un punto. o: {n, cols, speed, size, star} */
export function burst(x, y, o = {}) {
  if (RM) return;
  const n = o.n || 26, cols = o.cols || COLS, sp = o.speed || 5;
  for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, v = sp * (.4 + Math.random()); add({ k: o.star ? 'star' : 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: (o.size || 6) * (.6 + Math.random() * .8), c: cols[k % cols.length], g: .06, d: .96, vr: (Math.random() - .5) * .3, life: 900 + Math.random() * 500 }); }
  start();
}
/* scintille dentro il rettangolo di un elemento (es. una tessera appena spuntata) */
export function sparkles(rect, cols) {
  if (RM || !rect) return;
  for (let k = 0; k < 14; k++) add({ k: 'star', x: rect.left + Math.random() * rect.width, y: rect.top + Math.random() * rect.height, vx: (Math.random() - .5) * 1.6, vy: -1.2 - Math.random() * 1.8, s: 3 + Math.random() * 4, c: (cols || ['#fff', '#FFCD3C', '#2ED3C0'])[k % 3], g: .03, d: .985, vr: .2, life: 700 + Math.random() * 500 });
  start();
}
/* fuochi d'artificio: n scoppi in sequenza, con il suono */
export function fireworks(n = 4) {
  if (RM) return;
  for (let k = 0; k < n; k++) setTimeout(() => {
    burst(innerWidth * (.15 + Math.random() * .7), innerHeight * (.15 + Math.random() * .4), { n: 46, speed: 6.5, size: 5, star: k % 2 === 1, cols: [COLS[k % COLS.length], '#fff', COLS[(k + 2) % COLS.length]] });
    sfx('firework');
  }, k * 420);
}
