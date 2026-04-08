import { StoryEngine } from './engine/story-engine.js';
import { createStageRenderer } from './game/stage-renderer.js';
import { statAlias } from './game/shenlong-theme.js';

const gameView = document.getElementById('game-view');
const statsList = document.getElementById('stats-list');
const titleEl = document.getElementById('game-title');
const restartBtn = document.getElementById('restart-btn');

const init = async () => {
  const response = await fetch('/api/story');
  const pack = await response.json();

  const engine = new StoryEngine(pack);
  const renderer = createStageRenderer({
    gameView,
    statsList,
    titleEl,
    statAlias
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
