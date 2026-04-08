const gameView = document.getElementById('game-view');
const statsList = document.getElementById('stats-list');
const titleEl = document.getElementById('game-title');
const restartBtn = document.getElementById('restart-btn');

let data;
let state;

const statOrder = ['beardBone', 'rougeFace', 'favor', 'mask', 'feminine'];
const statAlias = {
  beardBone: '锋芒',
  rougeFace: '妍姿',
  favor: '圣眷',
  mask: '伪面',
  feminine: '钗影'
};

const conditionOk = (condition) => {
  if (!condition) return true;
  const value = state[condition.stat] ?? 0;
  if (typeof condition.gte === 'number' && value < condition.gte) return false;
  if (typeof condition.gt === 'number' && value <= condition.gt) return false;
  if (typeof condition.lte === 'number' && value > condition.lte) return false;
  if (typeof condition.lt === 'number' && value >= condition.lt) return false;
  if (typeof condition.eq === 'number' && value !== condition.eq) return false;
  return true;
};

const applyEffects = (effects = {}) => {
  Object.entries(effects).forEach(([key, value]) => {
    state[key] = (state[key] ?? 0) + value;
  });
};

const findNode = (id) => data.nodes.find((node) => node.id === id);

const formatStats = () => {
  statsList.innerHTML = '';

  statOrder.forEach((key) => {
    const value = state[key] ?? 0;
    const width = Math.min(100, Math.max(0, value * 4));

    const li = document.createElement('li');
    li.className = 'rounded-lg border border-stage-accent/20 bg-black/20 px-3 py-2';
    li.innerHTML = `
      <div class="mb-1 flex items-center justify-between">
        <span>${statAlias[key]}</span>
        <span class="text-stage-accent">${value}</span>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-black/40">
        <div class="h-full rounded-full bg-stage-accent/70" style="width:${width}%"></div>
      </div>
    `;
    statsList.appendChild(li);
  });
};

const renderNode = () => {
  const node = findNode(state.currentNode);
  const choices = (node.choices || []).filter((choice) => conditionOk(choice.visibleIf));
  const lines = node.lines.map((line) => `<p class="leading-8 text-stage-ink/90">${line}</p>`).join('');

  gameView.innerHTML = `
    <article class="enter-fade space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-2 border-b border-stage-accent/20 pb-3">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-stage-accent/80">${node.act}</p>
          <h2 class="text-xl font-semibold text-stage-ink">${node.title}</h2>
        </div>
      </div>
      <div class="space-y-3 text-[15px]">${lines}</div>
      <div class="grid gap-2 pt-2">
        ${choices
          .map((choice) => {
            return `<button data-choice-id="${choice.id}" class="choice-btn rounded-xl border border-stage-accent/40 bg-stage-panel/70 px-4 py-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-stage-accent hover:bg-stage-accent/10">${choice.text}</button>`;
          })
          .join('')}
      </div>
    </article>
  `;

  [...document.querySelectorAll('.choice-btn')].forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = choices.find((item) => item.id === btn.dataset.choiceId);
      if (!choice) return;

      if (choice.reset) {
        resetGame();
        return;
      }

      applyEffects(choice.effects);
      enterNode(choice.next);
    });
  });
};

const render = () => {
  formatStats();
  renderNode();
};

const enterNode = (id) => {
  const node = findNode(id);
  if (!node) {
    throw new Error(`Node not found: ${id}`);
  }

  state.currentNode = id;
  if (node.enterEffects) {
    applyEffects(node.enterEffects);
  }

  if (node.autoNext?.length) {
    const rule = node.autoNext.find((item) => conditionOk(item.if));
    if (rule?.next) {
      enterNode(rule.next);
      return;
    }
  }

  render();
};

const resetGame = () => {
  state = structuredClone(data.initialState);
  enterNode(state.currentNode);
};

const init = async () => {
  const res = await fetch('/api/story');
  data = await res.json();
  titleEl.textContent = data.title;
  resetGame();
};

restartBtn.addEventListener('click', () => {
  resetGame();
});

init();
