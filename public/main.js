const gameView = document.getElementById('game-view');
const logView = document.getElementById('log-view');
const statsList = document.getElementById('stats-list');
const titleEl = document.getElementById('game-title');
const restartBtn = document.getElementById('restart-btn');
const tabButtons = [...document.querySelectorAll('.tab-btn')];

let data;
let state;
let history = [];
let activeTab = 'game';

const statOrder = ['beardBone', 'rougeFace', 'favor', 'mask', 'feminine'];

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
  history = [];
  enterNode(state.currentNode);
};

const formatStats = () => {
  statsList.innerHTML = '';

  statOrder.forEach((key) => {
    const li = document.createElement('li');
    li.className = 'rounded-lg border border-stage-accent/20 bg-black/20 px-3 py-2';
    li.innerHTML = `<div class="flex items-center justify-between"><span>${data.stats[key]}</span><strong class="text-stage-accent">${state[key]}</strong></div>`;
    statsList.appendChild(li);
  });
};

const renderLog = () => {
  if (!history.length) {
    logView.innerHTML = '<p class="text-stage-ink/70">暂无记录，先做一个选择。</p>';
    return;
  }

  const blocks = history
    .map((item, index) => {
      return `
        <article class="enter-fade rounded-lg border border-stage-accent/20 bg-black/20 p-3">
          <p class="text-xs tracking-wide text-stage-accent/80">${index + 1}. ${item.nodeTitle}</p>
          <p class="mt-1 text-stage-ink/90">${item.choiceText}</p>
        </article>
      `;
    })
    .join('');

  logView.innerHTML = blocks;
};

const renderNode = () => {
  const node = findNode(state.currentNode);

  const choices = (node.choices || []).filter((choice) => conditionOk(choice.visibleIf));
  const lines = node.lines
    .map((line) => `<p class="leading-8 text-stage-ink/90">${line}</p>`)
    .join('');

  gameView.innerHTML = `
    <article class="enter-fade space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-2 border-b border-stage-accent/20 pb-3">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-stage-accent/80">${node.act}</p>
          <h2 class="text-xl font-semibold text-stage-ink">${node.title}</h2>
        </div>
        ${node.ending ? '<span class="rounded-full border border-stage-blood/60 px-3 py-1 text-xs text-stage-blood">结局节点</span>' : ''}
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
      history.push({
        nodeTitle: `${node.act}·${node.title}`,
        choiceText: choice.text
      });
      renderLog();
      enterNode(choice.next);
    });
  });
};

const renderTab = () => {
  const showGame = activeTab === 'game';
  gameView.classList.toggle('hidden', !showGame);
  logView.classList.toggle('hidden', showGame);
  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === activeTab;
    btn.classList.toggle('border-stage-accent/50', isActive);
    btn.classList.toggle('text-stage-accent', isActive);
    btn.classList.toggle('border-stage-accent/30', !isActive);
    btn.classList.toggle('text-stage-ink/90', !isActive);
  });
};

const render = () => {
  formatStats();
  renderNode();
  renderLog();
  renderTab();
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

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    renderTab();
  });
});

init();
