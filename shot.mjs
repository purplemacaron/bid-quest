import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://localhost:5173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1'],
});

const errors = [];
async function newPage(w, h) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(400);
  return page;
}

const click = (page, s) => page.evaluate((sel) => document.querySelector(sel)?.click(), s);

async function playRound(page, { pauseAtStamp = false } = {}) {
  await page.evaluate(() => {
    const B = window.__BQ, g = B.G;
    if (g.phase === 'intro') document.querySelector('[data-action="enterPlay"]')?.click();
    for (let i = 0; i < 3; i++) document.querySelector('[data-action="tutNext"]')?.click();
  });
  await sleep(150);
  await page.evaluate(async () => {
    const B = window.__BQ, g = B.G;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let k = 0; k < 5 && g.playsLeft > 0 && g.phase === 'play'; k++) {
      const missing = B.ann().req.filter((t) => !g.bid.tags.includes(t));
      let idx = -1;
      if (missing.length) idx = g.hand.findIndex((id) => B.CARDS[id].type === 'cert' && missing.includes(B.CARDS[id].tag));
      if (idx < 0) idx = B.bestMove();
      if (idx < 0) break;
      B.toggleSelect(idx); B.playSelected();
      await sleep(100);
    }
    if (B.eligible() && g.bid.played.length) B.submitBid();
  });
  if (pauseAtStamp) {
    await sleep(4800);
    return;
  }
  await sleep(6400);
  await click(page, '[data-action="reward"]');
  await sleep(200);
}

const page = await newPage(1280, 800);
await page.screenshot({ path: 'shots/01-title.png' });
await click(page, '[data-action="start"]');
await sleep(200);
await page.screenshot({ path: 'shots/02-intro.png' });
await playRound(page, { pauseAtStamp: true });
await page.screenshot({ path: 'shots/03-play-or-stamp.png' });
await sleep(1600);
await page.screenshot({ path: 'shots/04-reward.png' });
await click(page, '[data-action="reward"]');
await sleep(200);
for (let r = 2; r <= 8; r++) {
  await playRound(page);
  const phase = await page.evaluate(() => window.__BQ.G.phase);
  if (phase === 'end' || phase === 'over') break;
}
await sleep(300);
await page.screenshot({ path: 'shots/05-end.png' });
const stats = await page.evaluate(() => ({ wins: window.__BQ.G.wins, savings: window.__BQ.G.savings, lives: window.__BQ.G.lives, phase: window.__BQ.G.phase }));
await page.close();

const mob = await newPage(400, 820);
await click(mob, '[data-action="start"]');
await playRound(mob, { pauseAtStamp: false });
await mob.evaluate(() => {
  const g = window.__BQ.G;
  if (g.phase === 'intro') document.querySelector('[data-action="enterPlay"]')?.click();
});
await sleep(200);
await mob.screenshot({ path: 'shots/06-mobile.png' });
await mob.close();

const tut = await newPage(1280, 800);
await click(tut, '[data-action="start"]');
await sleep(200);
await click(tut, '[data-action="enterPlay"]');
await sleep(300);
await tut.screenshot({ path: 'shots/07-tutorial.png' });
await tut.evaluate(() => {
  const B = window.__BQ, g = B.G;
  for (let i = 0; i < 3; i++) document.querySelector('[data-action="tutNext"]')?.click();
  const idx = g.hand.findIndex((id) => B.CARDS[id].type === 'quality');
  B.toggleSelect(idx); B.playSelected();
  B.submitBid();
});
await sleep(4800);
await tut.screenshot({ path: 'shots/08-lose.png' });
await tut.close();

await browser.close();
console.log('stats', stats);
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console/page errors');