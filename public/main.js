import { StoryEngine } from './engine/story-engine.js';
import { createStageRenderer } from './game/stage-renderer.js';
import { statTheme } from './game/shenlong-theme.js';

const gameView = document.getElementById('game-view');
const statsList = document.getElementById('stats-list');
const titleEl = document.getElementById('game-title');
const restartBtn = document.getElementById('restart-btn');

const fetchJson = async (url, label) => {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    throw new Error(`${label}失败（${response.status}）`);
  }
  if (!contentType.includes('application/json')) {
    throw new Error(`${label}返回非JSON`);
  }
  return response.json();
};

const loadPack = async () => {
  const [pack, manualLineCues] = await Promise.all([
    fetchJson('data/shenlong-pack.json', '加载静态故事'),
    fetchJson('data/manual-line-cues.json', '加载静态台词配置')
  ]);
  return {
    ...pack,
    presentation: {
      ...(pack.presentation || {}),
      manualLineCues
    }
  };
};

const init = async () => {
  const pack = await loadPack();

  const engine = new StoryEngine(pack);
  const renderer = createStageRenderer({
    gameView,
    statsList,
    titleEl,
    statTheme
  });

  renderer.onChoose((choiceId) => {
    engine.choose(choiceId);
  });

  engine.subscribe((snapshot) => {
    renderer.render(snapshot);
  });

  restartBtn.addEventListener('click', () => {
    engine.reset();
  });
};

init();
