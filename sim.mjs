import * as g from './js/game.js';
import { REWARD_POOL, CARDS } from './js/data.js';

const games = 300;
let totalWins = 0, totalSavings = 0, earlyLoss = 0;
const winDist = {};
for (let n = 0; n < games; n++) {
  g.newGame();
  let wins = 0;
  for (let r = 0; r < 8; r++) {
    g.enterPlay();
    for (let k = 0; k < 4 && g.G.playsLeft > 0; k++) {
      const missing = g.ann().req.filter((t) => !g.G.bid.tags.includes(t));
      let idx = -1;
      if (missing.length) idx = g.G.hand.findIndex((id) => CARDS[id].type === 'cert' && missing.includes(CARDS[id].tag));
      if (idx < 0) idx = g.bestMove();
      if (idx < 0) break;
      g.toggleSelect(idx);
      g.playSelected();
    }
    if (g.eligible() && g.G.bid.played.length) {
      const my = g.totalScore();
      const best = Math.max(...g.G.rivals.filter((x) => !x.removed).map((x) => x.score));
      if (my > best) { wins++; g.G.savings += g.ann().budget - g.G.bid.price; }
      else g.G.lives--;
    } else g.G.lives--;
    if (g.G.lives <= 0) { earlyLoss++; break; }
    g.G.round++;
    g.G.pile.push(REWARD_POOL[Math.floor(Math.random() * REWARD_POOL.length)]);
    if (r < 7) g.startRound();
  }
  totalWins += wins;
  totalSavings += g.G.savings;
  winDist[wins] = (winDist[wins] || 0) + 1;
}
console.log('avg wins', (totalWins / games).toFixed(2), '/8');
console.log('avg savings', Math.round(totalSavings / games));
console.log('early gameover %', ((earlyLoss / games) * 100).toFixed(1));
console.log('win distribution', winDist);