let ctx = null, master = null, musicGain = null, muted = false, musicTimer = null;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlock() { ac(); startMusic(); }
export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}
export const isMuted = () => muted;

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone(freq, { type = 'sine', dur = 0.15, peak = 0.3, at = 0, slide = 0, dest } = {}) {
  const c = ac(), t = c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  env(g, t, 0.005, peak, dur);
  o.connect(g); g.connect(dest || master);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise({ dur = 0.2, peak = 0.25, at = 0, freq = 1200, q = 1, type = 'bandpass', slide = 0 } = {}) {
  const c = ac(), t = c.currentTime + at;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq + slide), t + dur);
  const g = c.createGain(); env(g, t, 0.005, peak, dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t); src.stop(t + dur + 0.05);
}

export const sfx = {
  select() { tone(660, { type: 'square', dur: 0.06, peak: 0.12 }); },
  play() { noise({ dur: 0.12, peak: 0.3, freq: 300, type: 'lowpass' }); tone(140, { type: 'sine', dur: 0.18, peak: 0.4, slide: -60 }); },
  discard() { noise({ dur: 0.25, peak: 0.2, freq: 2400, slide: -1600 }); },
  tick(i) { tone(500 + i * 60, { type: 'square', dur: 0.05, peak: 0.1 }); },
  reveal() { tone(220, { type: 'triangle', dur: 0.2, peak: 0.3 }); noise({ dur: 0.1, peak: 0.15, freq: 900 }); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, { type: 'square', dur: 0.16, peak: 0.16, at: i * 0.09 })); tone(1568, { type: 'square', dur: 0.4, peak: 0.12, at: 0.36 }); },
  lose() { [330, 262, 196].forEach((f, i) => tone(f, { type: 'sawtooth', dur: 0.22, peak: 0.14, at: i * 0.14 })); },
  combo() { tone(880, { type: 'square', dur: 0.08, peak: 0.14 }); tone(1320, { type: 'square', dur: 0.12, peak: 0.12, at: 0.07 }); },
  hint() { tone(980, { type: 'sine', dur: 0.12, peak: 0.15 }); tone(1470, { type: 'sine', dur: 0.15, peak: 0.12, at: 0.08 }); },
  stamp() { noise({ dur: 0.15, peak: 0.4, freq: 200, type: 'lowpass' }); tone(90, { type: 'sine', dur: 0.25, peak: 0.5, slide: -40 }); },
};

const CHORDS = [
  [110, 220, 261.6, 329.6],
  [87.3, 174.6, 220, 261.6],
  [98, 196, 246.9, 293.7],
  [82.4, 164.8, 207.7, 246.9],
];
let bar = 0;

function startMusic() {
  if (musicTimer) return;
  const c = ac();
  const step = 0.24;
  let next = c.currentTime + 0.1;
  let beat = 0;
  musicTimer = setInterval(() => {
    while (next < c.currentTime + 0.3) {
      const chord = CHORDS[bar % 4];
      const b = beat % 16;
      if (b === 0) {
        chord.slice(1).forEach((f) => tone(f, { type: 'sawtooth', dur: step * 14, peak: 0.05, at: next - c.currentTime, dest: musicGain }));
        tone(chord[0], { type: 'triangle', dur: step * 14, peak: 0.12, at: next - c.currentTime, dest: musicGain });
      }
      const arp = chord[1 + (b % 3)];
      tone(arp * 2, { type: 'square', dur: 0.1, peak: b % 4 === 0 ? 0.06 : 0.035, at: next - c.currentTime, dest: musicGain });
      if (b % 4 === 2) noise({ dur: 0.03, peak: 0.04, freq: 6000, type: 'highpass', at: next - c.currentTime });
      next += step;
      beat++;
      if (beat % 16 === 0) bar++;
    }
  }, 120);
}