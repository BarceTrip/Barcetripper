export function confetti() {
  const cv = document.querySelector('#confetti'), ctx = cv.getContext('2d');
  cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio);
  const cols = ['#FF5A5A', '#FFCD3C', '#2ED3C0', '#C58CFF', '#3B6BFF']; const P = [];
  for (let k = 0; k < 110; k++) P.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .4, vx: (Math.random() - .5) * 1.8, vy: 2 + Math.random() * 2.8, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .2, s: 5 + Math.random() * 6, c: cols[k % cols.length] });
  const t0 = performance.now();
  (function f(now) {
    const el = now - t0; ctx.clearRect(0, 0, innerWidth, innerHeight);
    P.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vy += .025; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - el / 3000); ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); ctx.restore(); });
    if (el < 3200) requestAnimationFrame(f); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
}
