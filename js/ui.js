import { G, ann, bus, eligible, eligibility, totalScore, floorPrice, toggleSelect, playSelected, discardSelected, submitBid, useHint, enterPlay, newGame, pickReward, skipReward, rank } from './game.js';
import { CARDS, TAGS, ROUNDS, cardDesc, cardTypeLabel } from './data.js';
import { toggleMute, isMuted, sfx } from './audio.js';

const $ = (id) => document.getElementById(id);
let hintIdx = -1;
let tut = { active: false, step: 0 };
let stampTimer = null;

const TUT_STEPS = [
  '<b>공고</b>를 확인하세요. 왼쪽 패널의 <b>적격 태그</b>를 반드시 충족해야 입찰이 유효합니다. 예산과 가격·품질 가중치도 확인!',
  '카드를 탭해 선택한 뒤 <b>선택 카드 사용</b>으로 입찰서를 구성하세요. 원가 카드는 가격을 낮추고, 인증 카드는 정책 태그를 붙입니다. <b>가점 태그</b>를 겹칠수록 콤보 보너스!',
  '적격 조건을 모두 통과하면 <b>입찰 제출</b>! 경쟁사보다 높은 점수를 받으면 낙찰입니다. 단, 낙찰하한율(예산의 80%) 미만은 실격. 호비 <b>AI 힌트</b>도 써보세요.',
];

export function setHint(i) { hintIdx = i; }

export function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 1400);
}

export function stamp(win) {
  const el = $('stamp');
  el.textContent = win ? '낙찰!' : '유찰';
  el.className = win ? 'win' : 'lose';
  clearTimeout(stampTimer);
  stampTimer = setTimeout(() => el.classList.add('hidden'), 1500);
}

export function countUp(target) {
  const el = $('scoreBig');
  if (!el) return;
  const t0 = performance.now();
  const dur = 900;
  let last = -1;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const v = Math.round(target * (1 - Math.pow(1 - k, 3)));
    if (v !== last) { el.textContent = v; if (v % 7 === 0) sfx.tick(v / 7); last = v; }
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function cardHTML(id, i, extra = '') {
  const c = CARDS[id];
  const sel = G.selected.includes(i) ? ' sel' : '';
  const hint = i === hintIdx ? ' hinted' : '';
  return `<div class="card ${c.type}${sel}${hint} ${extra}" data-i="${i}">
    <div class="stripe"></div>
    <div class="ctype">${cardTypeLabel(id)}</div>
    <div class="cname">${c.name}</div>
    <div class="cdesc">${cardDesc(id)}</div>
  </div>`;
}

function chipsHTML() {
  const a = ann();
  const req = a.req.map((t) => `<span class="chip req${G.bid.tags.includes(t) ? ' ok' : ''}">필수 ${TAGS[t].name}</span>`).join('');
  const bon = a.bonus.map((t) => `<span class="chip bonus${G.bid.tags.includes(t) ? ' ok' : ''}">가점 ${TAGS[t].name}</span>`).join('');
  return req + bon;
}

function renderHUD() {
  $('roundLabel').textContent = `R${G.round + 1}/${ROUNDS.length}`;
  $('lives').innerHTML = Array.from({ length: 3 }, (_, i) => `<span class="life${i < G.lives ? '' : ' off'}"></span>`).join('');
  $('savings').textContent = `절감 ${G.savings}만원`;
  $('btnHint').textContent = `AI 힌트 ${G.hintsLeft}`;
  $('btnHint').disabled = G.hintsLeft <= 0 || G.phase !== 'play';
  $('btnMute').classList.toggle('off', isMuted());
}

function renderAnnounce() {
  const a = ann();
  $('announce').innerHTML = `
    <h3>조달 공고</h3>
    <div class="org">${a.org}</div>
    <div class="item">${a.item}</div>
    <div class="chips">${chipsHTML()}</div>
    <div class="budget">예산 ${a.budget}만원</div>
    <div class="weights"><div class="pw" style="width:${a.pw * 100}%"></div><div class="qw" style="width:${a.qw * 100}%"></div></div>
    <div class="weight-label">가격 ${Math.round(a.pw * 100)}% · 품질 ${Math.round(a.qw * 100)}% · 하한 ${floorPrice()}만원</div>`;
}

function renderBid() {
  const a = ann();
  const elig = eligibility();
  const rivals = G.rivals.map((r, i) => `
    <div class="rival${r.removed ? ' removed' : ''}">
      <span><span class="dot" style="background:#${r.color.toString(16).padStart(6, '0')}"></span>${r.name}</span>
      ${r.removed ? '<span class="flag">담합 적발</span>' : `<span class="rs">${r.revealed ? r.score : '???'}</span>`}
    </div>`).join('');
  $('bidpanel').innerHTML = `
    <h3>내 입찰서</h3>
    <div class="bidrow"><span>입찰가</span><b class="price">${G.bid.price}만원</b></div>
    <div class="bidrow"><span>품질</span><b class="qual">${G.bid.quality}</b></div>
    <div class="chips">${G.bid.tags.map((t) => `<span class="chip bonus ok">${TAGS[t].name}</span>`).join('') || '<span class="chip">태그 없음</span>'}</div>
    <div class="score-big" id="scoreBig">${G.phase === 'reveal' ? 0 : totalScore()}</div>
    <ul class="elig">${elig.map((e) => `<li class="${e.ok ? 'ok' : 'no'}">${e.ok ? '✓' : '✕'} ${e.label}</li>`).join('')}</ul>
    <div class="rivals">${rivals}</div>`;
}

function renderHand() {
  $('hand').innerHTML = G.hand.map((id, i) => cardHTML(id, i)).join('');
  $('counters').textContent = `제출 ${G.playsLeft} · 교체 ${G.discardsLeft}`;
  $('btnPlay').disabled = !G.selected.length || G.playsLeft <= 0;
  $('btnDiscard').disabled = !G.selected.length || G.discardsLeft <= 0;
  $('btnSubmit').disabled = G.phase !== 'play' || !G.bid.played.length;
}

function renderOverlay() {
  const ov = $('overlay');
  if (tut.active) {
    ov.classList.remove('hidden');
    ov.innerHTML = `<div class="modal">
      <h2>튜토리얼 ${tut.step + 1}/3</h2>
      <p class="tut-step">${TUT_STEPS[tut.step]}</p>
      <button class="big-btn" data-action="tutNext">${tut.step < 2 ? '다음' : '시작!'}</button>
    </div>`;
    return;
  }
  const show = ['title', 'intro', 'reward', 'end', 'over'].includes(G.phase);
  ov.classList.toggle('hidden', !show);
  if (!show) return;

  if (G.phase === 'title') {
    ov.innerHTML = `<div class="modal">
      <div class="logo">BID<br>QUEST</div>
      <div class="sub">나라장터 입찰 배틀</div>
      <p class="desc">당신은 공급업체의 입찰 책임자.<br>나라장터 공고에 맞서 입찰서를 구성하고<br>경쟁사를 눌러 낙찰을 쟁취하세요.<br>혁신제품 · 중소기업 · 친환경 — 정책이 곧 점수입니다.</p>
      <button class="big-btn" data-action="start">게임 시작</button>
      <p class="credit">2026 조달청 AI 게임·콘텐츠 공모전 출품작<br>생성형 AI로 기획·제작된 웹 게임 · PC/모바일 지원</p>
    </div>`;
  } else if (G.phase === 'intro') {
    const a = ann();
    ov.innerHTML = `<div class="modal">
      <h2>ROUND ${G.round + 1}</h2>
      <div class="round-org">${a.org}</div>
      <div class="round-item">${a.item}</div>
      <div class="chips">${a.req.map((t) => `<span class="chip req">필수 ${TAGS[t].name}</span>`).join('')}${a.bonus.map((t) => `<span class="chip bonus">가점 ${TAGS[t].name}</span>`).join('')}</div>
      <div class="budget">예산 ${a.budget}만원</div>
      <p class="desc">경쟁사: ${G.rivals.map((r) => r.name).join(' · ')}</p>
      <button class="big-btn" data-action="enterPlay">입찰 개시</button>
    </div>`;
  } else if (G.phase === 'reward') {
    ov.innerHTML = `<div class="modal">
      <h2>${G.lastVerdict.win ? '낙찰 보상' : '긴급 지원'}</h2>
      <p class="desc">${G.lastVerdict.win ? '다음 라운드에 사용할 카드 1장을 선택하세요.' : '패배했지만 지원 카드 1장을 선택할 수 있습니다.'}</p>
      <div class="reward-row">${G.rewardOptions.map((id, i) => `<div class="card ${CARDS[id].type}" data-action="reward" data-i="${i}"><div class="stripe"></div><div class="ctype">${cardTypeLabel(id)}</div><div class="cname">${CARDS[id].name}</div><div class="cdesc">${cardDesc(id)}</div></div>`).join('')}</div>
      <button class="ghost-btn" data-action="skipReward">건너뛰기</button>
    </div>`;
  } else {
    const over = G.phase === 'over';
    ov.innerHTML = `<div class="modal">
      <h2>${over ? '보증금 소진' : '시즌 종료'}</h2>
      <div class="rank">${rank()}</div>
      <div class="stat-grid">
        <div class="stat"><div class="v">${G.wins}/${ROUNDS.length}</div><div class="k">낙찰</div></div>
        <div class="stat"><div class="v">${G.savings}</div><div class="k">예산 절감(만원)</div></div>
      </div>
      <p class="desc">${over ? '입찰 보증금을 모두 잃었습니다. 다시 도전하세요!' : '나라장터의 전설이 탄생했습니다. 다시 도전하세요!'}</p>
      <button class="big-btn" data-action="restart">다시 도전</button>
    </div>`;
  }
}

export function render() {
  const inGame = !['title'].includes(G.phase);
  if (G.phase === 'intro') $('ui').scrollTop = 0;
  $('hud').classList.toggle('hidden', !inGame);
  const panels = ['play', 'reveal'].includes(G.phase) && !tut.active;
  $('announce').classList.toggle('hidden', !panels);
  $('bidpanel').classList.toggle('hidden', !panels);
  $('handbar').classList.toggle('hidden', !panels);
  if (inGame) renderHUD();
  if (panels) { renderAnnounce(); renderBid(); renderHand(); }
  renderOverlay();
}

export function startTutorial() { tut = { active: true, step: 0 }; }

export function initUI() {
  $('btnPlay').onclick = () => playSelected();
  $('btnDiscard').onclick = () => discardSelected();
  $('btnSubmit').onclick = () => submitBid();
  $('btnHint').onclick = () => useHint();
  $('btnMute').onclick = () => { toggleMute(); renderHUD(); };
  $('hand').addEventListener('click', (e) => {
    const c = e.target.closest('.card');
    if (c) { toggleSelect(+c.dataset.i); }
  });
  $('overlay').addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    if (a === 'start' || a === 'restart') { newGame(); render(); }
    if (a === 'enterPlay') {
      enterPlay();
      if (G.round === 0 && !tut.done) startTutorial();
      render();
    }
    if (a === 'tutNext') {
      tut.step++;
      if (tut.step > 2) { tut.active = false; tut.done = true; }
      render();
    }
    if (a === 'reward') pickReward(+el.dataset.i);
    if (a === 'skipReward') skipReward();
  });
  bus.on('state', () => { hintIdx = -1; render(); });
  bus.on('hint', ({ index }) => { hintIdx = index; render(); });
}