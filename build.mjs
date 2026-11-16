import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
await build({
  entryPoints: ['js/main.js'],
  bundle: true,
  format: 'iife',
  outfile: 'dist/bundle.js',
  target: 'es2020',
});
cpSync('css', 'dist/css', { recursive: true });
cpSync('assets', 'dist/assets', { recursive: true });
const html = readFileSync('index.html', 'utf8')
  .replace('<script type="module" src="js/main.js"></script>', '<script src="bundle.js"></script>');
writeFileSync('dist/index.html', html);
writeFileSync('dist/실행안내.txt', `BID QUEST — 나라장터 입찰 배틀
2026 조달청 AI 게임·콘텐츠 공모전 AI 게임 부문 출품작

[실행 방법]
1. 압축을 해제합니다.
2. index.html 을 더블클릭합니다. (Chrome / Edge 권장, 설치·인터넷 불필요)
3. 소리는 첫 클릭 후 켜집니다. 우측 상단 '사운드' 버튼으로 끄기 가능.

[조작]
- 카드 클릭: 선택/해제
- 선택 카드 사용: 선택한 카드를 입찰서에 반영 (라운드당 4회)
- 교체: 선택 카드 최대 2장을 버리고 새로 뽑기 (라운드당 2회)
- 입찰 제출: 경쟁사 점수 공개, 낙찰 판정
- AI 힌트: 게임당 3회, 최적 카드 추천

[목표]
8개 조달 공고에서 경쟁사보다 높은 점수로 낙찰하세요.
라이프 3개를 모두 잃으면 게임 종료. 낙찰할 때마다 예산 절감액이 쌓입니다.
적격 조건: 필수 태그 충족 / 예산 이내 / 낙찰하한율(예산의 80%) 이상.
`);
console.log('dist/ ready (offline double-click build)');