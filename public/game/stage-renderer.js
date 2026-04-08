const createChoiceButton = (choice) => {
  return `<button data-choice-id="${choice.id}" class="choice-btn rounded-xl border border-stage-accent/40 bg-stage-panel/70 px-4 py-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-stage-accent hover:bg-stage-accent/10">${choice.text}</button>`;
};

export const createStageRenderer = ({ gameView, statsList, titleEl, statAlias }) => {
  let onChoose = () => {};

  gameView.addEventListener('click', (event) => {
    const target = event.target.closest('[data-choice-id]');
    if (!target) return;
    onChoose(target.dataset.choiceId);
  });

  const renderStats = (snapshot) => {
    statsList.innerHTML = '';
    snapshot.statOrder.forEach((key) => {
      const value = snapshot.state[key] ?? 0;
      const width = Math.min(100, Math.max(0, value * 4));
      const label = statAlias[key] || snapshot.stats[key] || key;

      const li = document.createElement('li');
      li.className = 'rounded-lg border border-stage-accent/20 bg-black/20 px-3 py-2';
      li.innerHTML = `
        <div class="mb-1 flex items-center justify-between">
          <span>${label}</span>
          <span class="text-stage-accent">${value}</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-black/40">
          <div class="h-full rounded-full bg-stage-accent/70" style="width:${width}%"></div>
        </div>
      `;
      statsList.appendChild(li);
    });
  };

  const renderNode = (snapshot) => {
    const node = snapshot.node;
    const lines = node.lines.map((line) => `<p class="leading-8 text-stage-ink/90">${line}</p>`).join('');
    const choices = snapshot.choices.map(createChoiceButton).join('');

    gameView.innerHTML = `
      <article class="enter-fade space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-2 border-b border-stage-accent/20 pb-3">
          <div>
            <p class="text-xs uppercase tracking-[0.25em] text-stage-accent/80">${node.act}</p>
            <h2 class="text-xl font-semibold text-stage-ink">${node.title}</h2>
          </div>
        </div>
        <div class="space-y-3 text-[15px]">${lines}</div>
        <div class="grid gap-2 pt-2">${choices}</div>
      </article>
    `;
  };

  return {
    render(snapshot) {
      titleEl.textContent = snapshot.title;
      renderStats(snapshot);
      renderNode(snapshot);
    },
    onChoose(handler) {
      onChoose = handler;
    }
  };
};
