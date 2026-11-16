import puppeteer from 'puppeteer-core';
import { spawnSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { writeFileSync, mkdirSync, rmSync } from 'fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://localhost:5173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

rmSync('video/frames', { recursive: true, force: true });
mkdirSync('video/frames', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1', '--window-size=1920,1080'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(URL, { waitUntil: 'networkidle0' });

await page.evaluate(() => {
  const d = document.createElement('div');
  d.id = 'cap';
  d.style.cssText = 'position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:99;background:rgba(255,255,255,.92);border:1px solid #e2e8f6;border-radius:999px;padding:12px 26px;font-size:21px;font-weight:800;color:#16223c;box-shadow:0 8px 24px rgba(22,34,60,.12);white-space:nowrap;pointer-events:none;';
  document.body.appendChild(d);
  window.__T0 = Date.now();
  window.__EV = [];
  const B = window.__BQ;
  const push = (type) => window.__EV.push({ t: (Date.now() - window.__T0) / 1000, type });
  B.bus.on('select', () => push('select'));
  B.bus.on('discard', () => push('discard'));
  B.bus.on('cardPlayed', () => push('play'));
  B.bus.on('revealStep', (s) => { if (s.kind === 'rival') push('reveal'); });
  B.bus.on('verdict', (v) => { push('stamp'); push(v.win ? 'win' : 'lose'); });
  B.bus.on('hint', () => push('hint'));
});
const cap = (text) => page.evaluate((t) => { document.getElementById('cap').textContent = t; }, text);
const click = (s) => page.evaluate((sel) => document.querySelector(sel)?.click(), s);
const playSel = () => page.evaluate(() => window.__BQ.playSelected());
const rig = () => page.evaluate(() => { const B = window.__BQ; const my = B.totalScore(); B.G.rivals.forEach((r, i) => { r.score = Math.max(5, my - 8 - i * 7); }); });
const selectBest = () => page.evaluate(() => {
  const B = window.__BQ, g = B.G;
  const missing = B.ann().req.filter((t) => !g.bid.tags.includes(t));
  let idx = -1;
  if (missing.length) idx = g.hand.findIndex((id) => B.CARDS[id].type === 'cert' && missing.includes(B.CARDS[id].tag));
  if (idx < 0) idx = B.bestMove();
  if (idx >= 0) B.toggleSelect(idx);
});

const frames = [];
const cdp = await page.createCDPSession();
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const n = frames.length;
  writeFileSync(`video/frames/f${String(n).padStart(5, '0')}.jpg`, Buffer.from(data, 'base64'));
  frames.push(Date.now() / 1000);
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 82, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
const wall0 = Date.now() / 1000;

await cap('나라장터에 공고가 떴다. 나는 공급업체의 입찰 책임자.');
await sleep(2200);
await click('[data-action="start"]');
await cap('필수 태그 · 예산 이내 · 낙찰하한율 80% — 적격 심사를 통과해야 입찰할 수 있다.');
await sleep(2200);
await click('[data-action="enterPlay"]');
await cap('카드를 선택해 입찰서를 작성한다. 제출 4회 · 교체 2회.');
await sleep(1700);
await click('[data-action="tutNext"]');
await cap('원가 카드는 입찰가를 낮춘다. 단, 낙찰하한율 아래로는 못 내린다.');
await sleep(1700);
await click('[data-action="tutNext"]');
await cap('혁신제품 · 중소기업 · 친환경… 정책 인증 태그가 곧 가점이다.');
await sleep(1700);
await click('[data-action="tutNext"]');
await cap('입찰서 완성! 경쟁사보다 높은 점수를 받으면 낙찰.');
for (let k = 0; k < 4; k++) { await selectBest(); await sleep(650); await playSel(); await sleep(950); }
await rig();
await click('#btnSubmit');
await cap('경쟁사 입찰 점수 공개…');
await sleep(4400);
await cap('낙찰! 예산 절감액이 쌓인다.');
await sleep(2200);
await cap('라운드마다 카드 보상 드래프트. 내 덱이 자란다.');
await sleep(2000);
await click('[data-action="reward"]');
await sleep(1800);
await click('[data-action="enterPlay"]');
await cap('두 번째 공고. 가격과 품질, 정책의 균형.');
for (let k = 0; k < 4; k++) { await selectBest(); await sleep(450); await playSel(); await sleep(650); }
await rig();
await click('#btnSubmit');
await sleep(4400);
await cap('연속 낙찰! 라이프는 3개뿐이다.');
await sleep(2000);
await click('[data-action="reward"]');
await sleep(1600);
await click('[data-action="enterPlay"]');
for (let k = 0; k < 2; k++) { await selectBest(); await sleep(400); await playSel(); await sleep(600); }
await rig();
await click('#btnSubmit');
await sleep(4400);
await sleep(1700);
await click('[data-action="reward"]');
await sleep(1200);
await page.evaluate(() => { const B = window.__BQ; B.G.round = 7; B.G.wins = 6; B.startRound(); });
await cap('마지막 공고 — 조달청 본청. 혁신제품 + 친환경 필수.');
await sleep(1700);
await click('[data-action="enterPlay"]');
for (let k = 0; k < 4; k++) { await selectBest(); await sleep(400); await playSel(); await sleep(600); }
await rig();
await click('#btnSubmit');
await sleep(4400);
await cap('8개 공고의 승부. 당신은 낙찰의 신이 될 수 있는가?');
await sleep(3400);
await cap('BID QUEST — 지금 플레이: purplemacaron.github.io/bid-quest');
await sleep(2600);

await cdp.send('Page.stopScreencast');
const DUR = Date.now() / 1000 - wall0 + 0.3;
const events = await page.evaluate(() => window.__EV);

const wavB64 = await page.evaluate(async (dur, evs) => {
  const sr = 44100;
  const c = new OfflineAudioContext(2, Math.ceil(sr * dur), sr);
  const master = c.createGain(); master.gain.value = 0.5; master.connect(c.destination);
  const musicGain = c.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
  const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  const tone = (freq, { type = 'sine', dur = 0.15, peak = 0.3, at = 0, slide = 0, dest } = {}) => {
    const t = at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    env(g, t, 0.005, peak, dur); o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.05);
  };
  const noise = ({ dur = 0.2, peak = 0.25, at = 0, freq = 1200, q = 1, type = 'bandpass', slide = 0 } = {}) => {
    const t = at, len = Math.max(1, Math.floor(sr * dur));
    const buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq + slide), t + dur);
    const g = c.createGain(); env(g, t, 0.005, peak, dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t); src.stop(t + dur + 0.05);
  };
  const CHORDS = [[110, 220, 261.6, 329.6], [87.3, 174.6, 220, 261.6], [98, 196, 246.9, 293.7], [82.4, 164.8, 207.7, 246.9]];
  const step = 0.24; let next = 0.1, beat = 0, bar = 0;
  while (next < dur - 0.4) {
    const chord = CHORDS[bar % 4], b = beat % 16;
    if (b === 0) {
      chord.slice(1).forEach((f) => tone(f, { type: 'sawtooth', dur: step * 14, peak: 0.05, at: next, dest: musicGain }));
      tone(chord[0], { type: 'triangle', dur: step * 14, peak: 0.12, at: next, dest: musicGain });
    }
    tone(chord[1 + (b % 3)] * 2, { type: 'square', dur: 0.1, peak: b % 4 === 0 ? 0.06 : 0.035, at: next, dest: musicGain });
    if (b % 4 === 2) noise({ dur: 0.03, peak: 0.04, freq: 6000, type: 'highpass', at: next });
    next += step; beat++;
    if (beat % 16 === 0) bar++;
  }
  const S = {
    select: (t) => tone(660, { type: 'square', dur: 0.06, peak: 0.12, at: t }),
    play: (t) => { noise({ dur: 0.12, peak: 0.3, freq: 300, type: 'lowpass', at: t }); tone(140, { type: 'sine', dur: 0.18, peak: 0.4, slide: -60, at: t }); },
    discard: (t) => noise({ dur: 0.25, peak: 0.2, freq: 2400, slide: -1600, at: t }),
    reveal: (t) => { tone(220, { type: 'triangle', dur: 0.2, peak: 0.3, at: t }); noise({ dur: 0.1, peak: 0.15, freq: 900, at: t }); },
    win: (t) => { [523, 659, 784, 1047].forEach((f, i) => tone(f, { type: 'square', dur: 0.16, peak: 0.16, at: t + i * 0.09 })); tone(1568, { type: 'square', dur: 0.4, peak: 0.12, at: t + 0.36 }); },
    lose: (t) => [330, 262, 196].forEach((f, i) => tone(f, { type: 'sawtooth', dur: 0.22, peak: 0.14, at: t + i * 0.14 })),
    hint: (t) => { tone(980, { type: 'sine', dur: 0.12, peak: 0.15, at: t }); tone(1470, { type: 'sine', dur: 0.15, peak: 0.12, at: t + 0.08 }); },
    stamp: (t) => { noise({ dur: 0.15, peak: 0.4, freq: 200, type: 'lowpass', at: t }); tone(90, { type: 'sine', dur: 0.25, peak: 0.5, slide: -40, at: t }); },
  };
  evs.forEach((e) => S[e.type]?.(e.t));
  const buf = await c.startRendering();
  const n = buf.length, ch = buf.numberOfChannels;
  const bytes = 44 + n * ch * 2;
  const ab = new ArrayBuffer(bytes), v = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, bytes - 8, true); ws(8, 'WAVE'); ws(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, n * ch * 2, true);
  const chans = []; for (let k = 0; k < ch; k++) chans.push(buf.getChannelData(k));
  let o = 44;
  for (let i = 0; i < n; i++) for (let k = 0; k < ch; k++) { const s = Math.max(-1, Math.min(1, chans[k][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  let bin = ''; const u8 = new Uint8Array(ab);
  for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
  return btoa(bin);
}, DUR, events);
writeFileSync('video/bgm.wav', Buffer.from(wavB64, 'base64'));
await browser.close();


let list = '';
for (let i = 0; i < frames.length; i++) {
  const d = i + 1 < frames.length ? frames[i + 1] - frames[i] : DUR - (frames[i] - wall0);
  list += `file 'frames/f${String(i).padStart(5, '0')}.jpg'\nduration ${Math.max(0.01, d).toFixed(4)}\n`;
}
list += `file 'frames/f${String(frames.length - 1).padStart(5, '0')}.jpg'\n`;
writeFileSync('video/frames.txt', list);

const enc = spawnSync(ffmpegPath, ['-y', '-f', 'concat', '-safe', '0', '-i', 'video/frames.txt', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', 'video/silent.mp4'], { stdio: 'inherit' });
if (enc.status !== 0) process.exit(1);
const mux = spawnSync(ffmpegPath, ['-y', '-i', 'video/silent.mp4', '-i', 'video/bgm.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '../submission/AI게임_시연영상_BIDQUEST_성명.mp4'], { stdio: 'inherit' });
if (mux.status !== 0) process.exit(1);
console.log('video done', { frames: frames.length, dur: DUR.toFixed(1), events: events.length });