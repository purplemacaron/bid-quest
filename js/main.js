import { initFX, burstAtEl, confetti, shake } from './fx.js';
import { unlock, sfx } from './audio.js';
import * as game from './game.js';
import * as data from './data.js';
import { initUI, render, stamp, toast, countUp } from './ui.js';

const { G, ann, bus, totalScore, floorPrice } = game;
window.__BQ = { ...game, ...data };

initFX(document.getElementById('fx'));
initUI();
render();

document.addEventListener('pointerdown', () => unlock(), { once: true });

const TYPE_COLORS = { cost: '#f59e0b', quality: '#10b981', cert: '#0aa2c0', special: '#ec4899' };

function mascot(id, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('jump', 'nod', 'slump');
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 950);
}

bus.on('select', () => sfx.select());
bus.on('discard', () => sfx.discard());

bus.on('cardPlayed', ({ id, card }) => {
  sfx.play();
  mascot('mascotTiger', 'nod');
  const panel = document.getElementById('bidpanel');
  panel.classList.remove('slam');
  void panel.offsetWidth;
  panel.classList.add('slam');
  burstAtEl(panel, TYPE_COLORS[card.type], 16);
  if (card.type === 'cost' && G.bid.price === floorPrice()) toast('낙찰하한율 도달 — 추가 인하 불가');
  if (card.type === 'cert' && ann().bonus.includes(card.tag) && G.bid.played.filter((x) => x === id).length === 1) {
    toast('정책가점 콤보!');
    sfx.combo();
  }
});

bus.on('revealStep', (s) => {
  if (s.kind === 'rival') {
    sfx.reveal();
  } else {
    mascot('mascotBird', 'nod');
    setTimeout(() => countUp(totalScore()), 0);
  }
});

bus.on('verdict', ({ win }) => {
  stamp(win);
  if (win) {
    sfx.win();
    mascot('mascotBird', 'jump');
    mascot('mascotTiger', 'jump');
    confetti();
    shake(0.5);
  } else {
    sfx.lose();
    mascot('mascotTiger', 'slump');
    shake(0.3);
  }
});

bus.on('hint', () => {
  sfx.hint();
  mascot('mascotTiger', 'nod');
});