export const TAGS = {
  INNOV: { name: '혁신제품', desc: '혁신제품 지정 · 구매제도' },
  SME: { name: '중소기업', desc: '중소기업자간 경쟁제품' },
  ECO: { name: '친환경', desc: '녹색제품 구매촉진' },
  SOCIAL: { name: '사회적경제', desc: '사회적경제기업 우선구매' },
  DISABLED: { name: '장애인기업', desc: '장애인기업 제품 우선구매' },
  LOCAL: { name: '지역업체', desc: '지역제한 경쟁 · 지역업체 우선' },
};

export const CARDS = {
  c1: { type: 'cost', name: '공정 자동화', val: 6 },
  c2: { type: 'cost', name: '원자재 대량구매', val: 8 },
  c3: { type: 'cost', name: '물류 최적화', val: 7 },
  c4: { type: 'cost', name: 'AI 원가분석', val: 9 },
  c5: { type: 'cost', name: '디지털 트윈 설계', val: 12 },
  c6: { type: 'cost', name: '스마트 팩토리', val: 14 },
  c7: { type: 'cost', name: 'AI 공정 최적화', val: 16 },
  q1: { type: 'quality', name: '정밀 검사', val: 10 },
  q2: { type: 'quality', name: '품질경영 시스템', val: 12 },
  q3: { type: 'quality', name: '내구성 강화', val: 11 },
  q4: { type: 'quality', name: '성능 튜닝', val: 14 },
  q5: { type: 'quality', name: '국제 품질인증', val: 18 },
  q6: { type: 'quality', name: '무결점 생산라인', val: 22 },
  q7: { type: 'quality', name: '명장 장인 정신', val: 26 },
  tINNOV: { type: 'cert', tag: 'INNOV', name: '혁신제품 지정서', val: 6 },
  tSME: { type: 'cert', tag: 'SME', name: '중소기업 확인서', val: 4 },
  tECO: { type: 'cert', tag: 'ECO', name: '친환경 인증서', val: 4 },
  tLOCAL: { type: 'cert', tag: 'LOCAL', name: '지역업체 등록증', val: 4 },
  tSOCIAL: { type: 'cert', tag: 'SOCIAL', name: '사회적기업 인증서', val: 6 },
  tDISABLED: { type: 'cert', tag: 'DISABLED', name: '장애인기업 확인서', val: 6 },
  sANALYZE: { type: 'special', name: 'AI 경쟁분석', desc: '경쟁사 입찰가를 모두 공개' },
  sREPORT: { type: 'special', name: '담합 제보', desc: '최고 경쟁사 입찰을 무효화' },
  sPLUS: { type: 'special', name: '추가 제출권', desc: '이번 라운드 제출 +1' },
};

export const COST_NAMES = { c1: '공정 자동화', c2: '원자재 대량구매', c3: '물류 최적화', c4: 'AI 원가분석', c5: '디지털 트윈 설계', c6: '스마트 팩토리', c7: 'AI 공정 최적화' };

export const ROUNDS = [
  { org: '서울초등학교', item: '스마트 칠판 납품', req: ['SME'], bonus: ['ECO', 'LOCAL'], budget: 900, pw: 0.6, qw: 0.4 },
  { org: '중앙소방서', item: '인명구조 드론', req: ['INNOV'], bonus: ['SME'], budget: 1400, pw: 0.5, qw: 0.5 },
  { org: '국립대학병원', item: '친환경 의료 소모품', req: ['ECO'], bonus: ['SOCIAL'], budget: 1100, pw: 0.7, qw: 0.3 },
  { org: '국가연구소', item: 'AI 연구 서버', req: ['INNOV', 'SME'], bonus: ['ECO'], budget: 2000, pw: 0.5, qw: 0.5 },
  { org: '광역시청', item: '사회적경제 급식 식자재', req: ['SOCIAL'], bonus: ['ECO', 'LOCAL'], budget: 1000, pw: 0.6, qw: 0.4 },
  { org: '종합복지관', item: '장애인 보조기기', req: ['DISABLED'], bonus: ['SME'], budget: 1200, pw: 0.5, qw: 0.5 },
  { org: '육군 보급창', item: '지역 보급 물품', req: ['LOCAL', 'SME'], bonus: ['ECO'], budget: 1600, pw: 0.6, qw: 0.4 },
  { org: '조달청', item: '차세대 나라장터 AI 모듈', req: ['INNOV', 'ECO'], bonus: ['SME', 'SOCIAL'], budget: 3000, pw: 0.4, qw: 0.6 },
];

export const RIVALS = [
  { name: '한빛테크', color: 0x5b8cff },
  { name: '미래산업', color: 0xff6b9d },
  { name: '태양ENG', color: 0x3ddc97 },
];

export const START_DECK = ['c1', 'c2', 'c3', 'c4', 'q1', 'q2', 'q3', 'q4', 'tINNOV', 'tSME', 'tECO', 'tLOCAL', 'sANALYZE', 'sPLUS'];

export const REWARD_POOL = ['c5', 'c6', 'c7', 'q5', 'q6', 'q7', 'tSOCIAL', 'tDISABLED', 'tINNOV', 'tECO', 'sREPORT', 'sPLUS', 'sANALYZE'];

export const FLOOR_RATIO = 0.8;
export const HAND_SIZE = 6;
export const PLAYS_PER_ROUND = 4;
export const DISCARDS_PER_ROUND = 2;
export const MAX_LIVES = 3;
export const HINTS_PER_GAME = 3;

export function cardDesc(id) {
  const c = CARDS[id];
  if (c.type === 'cost') return `입찰가 -${c.val}%`;
  if (c.type === 'quality') return `품질 +${c.val}`;
  if (c.type === 'cert') return `${TAGS[c.tag].name} 태그 · 품질 +${c.val}`;
  return c.desc;
}

export function cardTypeLabel(id) {
  const t = CARDS[id].type;
  return { cost: '원가', quality: '품질', cert: '인증', special: '특수' }[t];
}