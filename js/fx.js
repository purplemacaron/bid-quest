let canvas, ctx, W, H;
const parts = [];
let shakeMag = 0;
const ui = () => document.getElementById('ui');

export function initFX(el) {
  canvas = el;
  ctx = canvas.getContext('2d');
  const resize = () => {
    W = canvas.width = innerWidth * devicePixelRatio;
    H = canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  };
  resize();
  addEventListener('resize', resize);
  (function loop() {
    const dt = 1 / 60;
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.rect) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    shakeMag = Math.max(0, shakeMag - dt * 2.2);
    const u = ui();
    if (u) u.style.transform = shakeMag > 0.01 ? `translate(${(Math.random() - 0.5) * shakeMag * 22}px, ${(Math.random() - 0.5) * shakeMag * 22}px)` : '';
    requestAnimationFrame(loop);
  })();
}

const dpr = () => devicePixelRatio;

export function burst(x, y, color, n = 24, speed = 320) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.35 + Math.random() * 0.85);
    parts.push({
      x: x * dpr(), y: y * dpr(),
      vx: Math.cos(a) * s * dpr(), vy: (Math.sin(a) * s - 140) * dpr(),
      g: 620 * dpr(), life: 0.6 + Math.random() * 0.6,
      s: (3 + Math.random() * 5) * dpr(), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10,
      color, rect: Math.random() < 0.5,
    });
  }
}

export function confetti() {
  const colors = ['#2563eb', '#f59e0b', '#10b981', '#ec4899', '#0aa2c0'];
  for (let k = 0; k < 5; k++) {
    burst(innerWidth * (0.15 + Math.random() * 0.7), innerHeight * (0.2 + Math.random() * 0.25), colors[k], 26, 380);
  }
}

export function shake(m) { shakeMag = Math.max(shakeMag, m); }

export function burstAtEl(el, color, n = 18) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, color, n);
}