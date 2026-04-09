const stripNumericEffectText = (text) => {
  return text
    .replace(/（[^）]*[+＋-－]\s*\d+[^）]*）/g, '')
    .replace(/\([^)]*[+\-]\s*\d+[^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getChoiceOmens = (choice, statTheme) => {
  const effects = Object.entries(choice.effects || {}).filter(([, delta]) => delta !== 0);
  return effects.map(([key, delta]) => {
    const meta = statTheme[key];
    if (!meta) return null;
    return {
      key,
      color: meta.color,
      text: delta > 0 ? meta.hintUp : meta.hintDown
    };
  }).filter(Boolean);
};

const createChoiceButton = (choice, statTheme) => {
  const cleanedText = stripNumericEffectText(choice.text);
  const omens = getChoiceOmens(choice, statTheme);
  const omenHtml = omens.length
    ? `<div class="mt-2 flex flex-wrap gap-1.5">${omens
        .map((omen) => {
          return `<span class="choice-omen rounded-full border px-2 py-0.5 text-[11px] tracking-wide" style="border-color:${omen.color}66;color:${omen.color};background:${omen.color}16;">${omen.text}</span>`;
        })
        .join('')}</div>`
    : '';

  return `
    <button data-choice-id="${choice.id}" class="choice-btn rounded-xl border border-stage-accent/35 bg-stage-panel/70 px-4 py-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-stage-accent hover:bg-stage-accent/10">
      <p class="leading-6 text-stage-ink/95">${cleanedText}</p>
      ${omenHtml}
    </button>
  `;
};

const buildConicGradient = (items) => {
  const weighted = items.map((item) => ({
    ...item,
    weight: Math.max(1, item.value + 2)
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);

  let cursor = 0;
  return weighted
    .map((item) => {
      const start = cursor;
      const delta = (item.weight / total) * 100;
      cursor += delta;
      return `${item.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    })
    .join(', ');
};

const createOrbitalNodes = (items) => {
  return items
    .map((item, index) => {
      const angle = -90 + (360 / items.length) * index;
      const rad = (angle * Math.PI) / 180;
      const x = 50 + Math.cos(rad) * 37;
      const y = 50 + Math.sin(rad) * 37;

      return `
        <div class="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border px-2 py-1 text-center backdrop-blur-sm"
          style="left:${x}%;top:${y}%;border-color:${item.color}77;background:${item.color}1f;box-shadow:0 0 22px ${item.color}30;">
          <p class="text-[10px] leading-none text-stage-ink/85">${item.label}</p>
          <p class="mt-1 text-sm font-semibold leading-none" style="color:${item.color};">${item.value}</p>
        </div>
      `;
    })
    .join('');
};

export const createStageRenderer = ({ gameView, statsList, titleEl, statTheme }) => {
  let onChoose = () => {};

  gameView.addEventListener('click', (event) => {
    const target = event.target.closest('[data-choice-id]');
    if (!target) return;
    onChoose(target.dataset.choiceId);
  });

  const renderStats = (snapshot) => {
    const items = snapshot.statOrder.map((key) => {
      const meta = statTheme[key] || {};
      return {
        key,
        label: meta.label || snapshot.stats[key] || key,
        color: meta.color || '#e1b16a',
        value: snapshot.state[key] ?? 0
      };
    });

    const maxValue = Math.max(12, ...items.map((item) => item.value));
    const ringGradient = buildConicGradient(items);

    const rows = items
      .map((item) => {
        const width = Math.min(100, Math.max(0, (item.value / maxValue) * 100));
        return `
          <div class="rounded-lg border border-stage-accent/10 bg-black/20 px-3 py-2">
            <div class="mb-1 flex items-center justify-between text-[13px]">
              <span class="text-stage-ink/90">${item.label}</span>
              <span class="font-semibold" style="color:${item.color};">${item.value}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-black/40">
              <div class="h-full rounded-full" style="width:${width}%;background:linear-gradient(90deg, ${item.color}, ${item.color}88);"></div>
            </div>
          </div>
        `;
      })
      .join('');

    statsList.innerHTML = `
      <div class="space-y-4">
        <div class="relative mx-auto h-64 w-64">
          <div class="mingpan-rotor absolute inset-2 rounded-full opacity-45 blur-xl" style="background:conic-gradient(${ringGradient});"></div>
          <div class="absolute inset-4 rounded-full border border-stage-accent/20 bg-black/45"></div>
          <div class="absolute inset-7 rounded-full border border-stage-accent/15" style="background:conic-gradient(${ringGradient});opacity:0.7;"></div>
          <div class="absolute inset-12 rounded-full border border-stage-accent/40 bg-black/75 shadow-ember">
            <div class="flex h-full items-center justify-center text-center">
              <div>
                <p class="text-xs tracking-[0.25em] text-stage-accent/80">命盘</p>
                <p class="mt-1 text-sm text-stage-ink/90">五曜流转</p>
              </div>
            </div>
          </div>
          ${createOrbitalNodes(items)}
        </div>
        <div class="space-y-2">${rows}</div>
      </div>
    `;
  };

  const renderNode = (snapshot) => {
    const node = snapshot.node;
    const lines = node.lines.map((line) => `<p class="leading-8 text-stage-ink/90">${line}</p>`).join('');
    const choices = snapshot.choices.map((choice) => createChoiceButton(choice, statTheme)).join('');

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
