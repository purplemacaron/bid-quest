import { CARDS, TAGS, ROUNDS, RIVALS, START_DECK, REWARD_POOL, FLOOR_RATIO, HAND_SIZE, PLAYS_PER_ROUND, DISCARDS_PER_ROUND, MAX_LIVES, HINTS_PER_GAME } from './data.js';

const listeners = {};
export const bus = {
  on(ev, fn) { (listeners[ev] ||= []).push(fn); },
  emit(ev, data) { (listeners[ev] || []).forEach((fn) => fn(data)); },
};

const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

export const G = {
  phase: 'title',
  round: 0,
  lives: MAX_LIVES,
  savings: 0,
  wins: 0,
  hintsLeft: HINTS_PER_GAME,
  deck: [],
  hand: [],
  pile: [],
  selected: [],
  playsLeft: PLAYS_PER_ROUND,
  discardsLeft: DISCARDS_PER_ROUND,
  bid: null,
  rivals: [],
  rewardOptions: [],
  lastVerdict: null,
  analyzed: false,
};

export const ann = () => ROUNDS[G.round];
export const floorPrice = () => Math.round(ann().budget * FLOOR_RATIO);

function newBid() {
  return { price: ann().budget, quality: 50 + G.round * 2, tags: [], played: [] };
}

export function priceScore(bid = G.bid) {
  const a = ann();
  return Math.min(100, ((a.budget - bid.price) / a.budget) / (1 - FLOOR_RATIO) * 100);
}

export function policyBonus(bid = G.bid) {
  const a = ann();
  const req = a.req.filter((t) => bid.tags.includes(t)).length * 6;
  const extra = bid.tags.filter((t) => a.bonus.includes(t)).length;
  return req + 8 * (extra * (extra + 1)) / 2;
}

export function totalScore(bid = G.bid) {
  const a = ann();
  return Math.round(priceScore(bid) * a.pw + Math.min(100, bid.quality) * a.qw + policyBonus(bid));
}

export function eligibility(bid = G.bid) {
  const a = ann();
  return [
    { ok: a.req.every((t) => bid.tags.includes(t)), label: '적격 태그 충족' },
    { ok: bid.price <= a.budget, label: '예산 이내' },
    { ok: bid.price >= floorPrice(), label: `낙찰하한율 ${Math.round(FLOOR_RATIO * 100)}% 이상` },
  ];
}

export const eligible = () => eligibility().every((e) => e.ok);

function draw(n) {
  for (let i = 0; i < n; i++) {
    if (!G.deck.length) {
      if (!G.pile.length) break;
      G.deck = shuffle(G.pile);
      G.pile = [];
    }
    G.hand.push(G.deck.pop());
  }
}

export function newGame() {
  G.round = 0; G.lives = MAX_LIVES; G.savings = 0; G.wins = 0; G.hintsLeft = HINTS_PER_GAME;
  G.deck = shuffle(START_DECK); G.pile = []; G.hand = [];
  startRound();
}

function ensureInHand(pred, fallback) {
  if (G.hand.some(pred)) return;
  let src = G.deck.findIndex(pred);
  let from = G.deck;
  if (src < 0) { src = G.pile.findIndex(pred); from = G.pile; }
  const id = src >= 0 ? from.splice(src, 1)[0] : fallback;
  if (!id) return;
  G.hand.push(id);
  if (G.hand.length > HAND_SIZE) {
    let drop = G.hand.findIndex((x) => CARDS[x].type === 'special');
    if (drop < 0) drop = G.hand.findIndex((x) => CARDS[x].type === 'cert' && !ann().req.includes(CARDS[x].tag));
    if (drop < 0) drop = G.hand.findIndex((x) => CARDS[x].type === 'cost' || CARDS[x].type === 'quality');
    if (drop >= 0 && drop !== G.hand.length - 1) G.pile.push(G.hand.splice(drop, 1)[0]);
  }
}

export function startRound() {
  G.phase = 'intro';
  G.bid = newBid();
  G.selected = [];
  G.playsLeft = PLAYS_PER_ROUND;
  G.discardsLeft = DISCARDS_PER_ROUND;
  G.analyzed = false;
  G.pile.push(...G.hand);
  G.hand = [];
  draw(HAND_SIZE);
  for (const t of ann().req) ensureInHand((id) => CARDS[id].tag === t, 't' + t);
  ensureInHand((id) => CARDS[id].type === 'cost', null);
  const base = 48 + G.round * 4.2;
  G.rivals = RIVALS.map((r, i) => ({
    ...r,
    score: Math.round(base + (i === 0 ? 4 : 0) + (Math.random() * 10 - 5)),
    revealed: false,
    removed: false,
  }));
  bus.emit('roundStart', { round: G.round });
  bus.emit('state');
}

export function enterPlay() {
  G.phase = 'play';
  bus.emit('state');
}

export function toggleSelect(i) {
  if (G.phase !== 'play') return;
  const at = G.selected.indexOf(i);
  if (at >= 0) G.selected.splice(at, 1);
  else G.selected.push(i);
  bus.emit('select');
  bus.emit('state');
}

export function playSelected() {
  if (G.phase !== 'play' || !G.selected.length || G.playsLeft <= 0) return;
  const idxs = [...G.selected].sort((a, b) => b - a);
  for (const i of idxs) {
    if (G.playsLeft <= 0) break;
    const id = G.hand[i];
    const c = CARDS[id];
    G.hand.splice(i, 1);
    G.pile.push(id);
    G.playsLeft--;
    G.bid.played.push(id);
    if (c.type === 'cost') G.bid.price = Math.max(floorPrice(), G.bid.price - Math.round(ann().budget * c.val / 100));
    if (c.type === 'quality') G.bid.quality += c.val;
    if (c.type === 'cert') {
      if (!G.bid.tags.includes(c.tag)) G.bid.tags.push(c.tag);
      G.bid.quality += c.val;
    }
    if (id === 'sANALYZE') { G.analyzed = true; G.rivals.forEach((r) => (r.revealed = true)); }
    if (id === 'sPLUS') G.playsLeft++;
    if (id === 'sREPORT') {
      const top = G.rivals.filter((r) => !r.removed).sort((a, b) => b.score - a.score)[0];
      if (top) { top.removed = true; top.revealed = true; }
    }
    bus.emit('cardPlayed', { id, card: c });
  }
  G.selected = [];
  bus.emit('state');
}

export function discardSelected() {
  if (G.phase !== 'play' || !G.selected.length || G.discardsLeft <= 0) return;
  const idxs = [...G.selected].sort((a, b) => b - a);
  const n = Math.min(idxs.length, 2);
  for (let k = 0; k < n; k++) {
    const id = G.hand.splice(idxs[k], 1)[0];
    G.pile.push(id);
  }
  G.discardsLeft--;
  draw(n);
  G.selected = [];
  bus.emit('discard');
  bus.emit('state');
}

export function bestMove() {
  let best = -1, bestDelta = -Infinity;
  G.hand.forEach((id, i) => {
    const delta = totalScore(simulatePlay(id)) - totalScore();
    if (delta > bestDelta) { bestDelta = delta; best = i; }
  });
  return best;
}

export function useHint() {
  if (G.phase !== 'play' || G.hintsLeft <= 0 || !G.hand.length) return null;
  const best = bestMove();
  G.hintsLeft--;
  bus.emit('hint', { index: best });
  bus.emit('state');
  return best;
}

function simulatePlay(id) {
  const c = CARDS[id];
  const bid = { ...G.bid, tags: [...G.bid.tags], played: [...G.bid.played] };
  if (c.type === 'cost') bid.price = Math.max(floorPrice(), bid.price - Math.round(ann().budget * c.val / 100));
  if (c.type === 'quality') bid.quality += c.val;
  if (c.type === 'cert') { if (!bid.tags.includes(c.tag)) bid.tags.push(c.tag); bid.quality += c.val; }
  return bid;
}

export function submitBid() {
  if (G.phase !== 'play' || !G.bid.played.length) return;
  G.phase = 'reveal';
  G.selected = [];
  bus.emit('state');
  const steps = G.rivals.map((r, i) => ({ kind: 'rival', i }));
  steps.push({ kind: 'player' });
  let t = 400;
  steps.forEach((s) => {
    setTimeout(() => {
      if (s.kind === 'rival') G.rivals[s.i].revealed = true;
      bus.emit('revealStep', s);
      bus.emit('state');
    }, t);
    t += s.kind === 'rival' ? 650 : 900;
  });
  setTimeout(() => finishRound(), t + 1100);
}

function finishRound() {
  const my = totalScore();
  const best = Math.max(...G.rivals.filter((r) => !r.removed).map((r) => r.score), -1);
  const win = eligible() && my > best;
  if (win) {
    G.wins++;
    G.savings += ann().budget - G.bid.price;
  } else {
    G.lives--;
  }
  G.lastVerdict = { win, my, best };
  bus.emit('verdict', G.lastVerdict);
  setTimeout(() => {
    if (G.lives <= 0) {
      G.phase = 'over';
      bus.emit('gameEnd', { over: true });
    } else if (G.round >= ROUNDS.length - 1) {
      G.phase = 'end';
      bus.emit('gameEnd', { over: false });
    } else {
      G.phase = 'reward';
      G.rewardOptions = shuffle(REWARD_POOL).slice(0, 3);
      bus.emit('reward');
    }
    bus.emit('state');
  }, 1500);
}

export function pickReward(i) {
  if (G.phase !== 'reward') return;
  const id = G.rewardOptions[i];
  if (id) G.pile.push(id);
  G.round++;
  startRound();
}

export function skipReward() {
  if (G.phase !== 'reward') return;
  G.round++;
  startRound();
}

export function rank() {
  if (G.wins >= 7) return '낙찰의 신';
  if (G.wins >= 5) return '조달 마스터';
  if (G.wins >= 3) return '유망 공급업체';
  return '견습 조달인';
}