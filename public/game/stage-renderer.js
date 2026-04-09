const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const stripNumericEffectText = (text) => {
  return text
    .replace(/（[^）]*[+＋-－]\s*\d+[^）]*）/g, '')
    .replace(/\([^)]*[+\-]\s*\d+[^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getChoiceOmens = (choice, statTheme) => {
  const effects = Object.entries(choice.effects || {}).filter(([, delta]) => delta !== 0);
  return effects
    .map(([key, delta]) => {
      const meta = statTheme[key];
      if (!meta) return null;
      return {
        key,
        color: meta.color,
        text: delta > 0 ? meta.hintUp : meta.hintDown
      };
    })
    .filter(Boolean);
};

const createChoiceButton = (choice, statTheme) => {
  const cleanedText = stripNumericEffectText(choice.text);
  const omens = getChoiceOmens(choice, statTheme);
  const omenHtml = omens.length
    ? `<div class="mt-2 flex flex-wrap gap-1.5">${omens
        .map((omen) => {
          return `<span class="choice-omen rounded-full border px-2 py-0.5 text-[11px] tracking-wide" style="border-color:${omen.color}66;color:${omen.color};background:${omen.color}16;">${escapeHtml(omen.text)}</span>`;
        })
        .join('')}</div>`
    : '';

  return `
    <button data-choice-id="${choice.id}" class="choice-btn rounded-xl border border-stage-accent/35 bg-stage-panel/70 px-4 py-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-stage-accent hover:bg-stage-accent/10">
      <p class="leading-6 text-stage-ink/95">${escapeHtml(cleanedText)}</p>
      ${omenHtml}
    </button>
  `;
};

const createTransitionChoiceButton = (choice) => {
  return `
    <button data-choice-id="${choice.id}" class="choice-btn rounded-xl border border-stage-accent/45 bg-black/45 px-4 py-3 text-left text-sm text-stage-ink transition hover:border-stage-accent hover:bg-stage-accent/10">
      ${escapeHtml(choice.text)}
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
        <p class="text-[10px] leading-none text-stage-ink/85">${escapeHtml(item.label)}</p>
          <p class="mt-1 text-sm font-semibold leading-none" style="color:${item.color};">${item.value}</p>
        </div>
      `;
    })
    .join('');
};

const normalizeCues = (snapshot) => {
  if (Array.isArray(snapshot.lineCues) && snapshot.lineCues.length) return snapshot.lineCues;
  const lines = Array.isArray(snapshot.node.lines) ? snapshot.node.lines : [];
  return lines.map((text, index) => ({
    id: `${snapshot.node.id}-fallback-${index}`,
    text,
    style: 'narration',
    speaker: null,
    speed: 1,
    portrait: null
  }));
};

const cueClassByStyle = {
  narration: 'story-line--narration',
  dialogue: 'story-line--dialogue',
  verse: 'story-line--verse',
  note: 'story-line--note'
};

const createCueHtml = (cue) => {
  const styleClass = cueClassByStyle[cue.style] || cueClassByStyle.narration;
  const speaker = cue.speaker ? `<p class="story-line-speaker">${escapeHtml(cue.speaker)}</p>` : '';
  return `
    <div class="story-line ${styleClass}">
      ${speaker}
      <p class="story-line-text">${escapeHtml(cue.text)}</p>
    </div>
  `;
};

const createPortraitHtml = (cue) => {
  if (!cue?.portrait && !cue?.speaker) {
    return '<div class="portrait-shell"></div>';
  }

  if (cue.portrait) {
    return `
      <div class="portrait-shell portrait-shell--active">
        <img class="portrait-img" src="${cue.portrait}" alt="${escapeHtml(cue.speaker || '立绘')}" />
        <p class="portrait-name">${escapeHtml(cue.speaker || '角色')}</p>
      </div>
    `;
  }

  return `
    <div class="portrait-shell portrait-shell--active portrait-shell--fallback">
      <div class="portrait-fallback">${escapeHtml(cue.speaker || '角色')}</div>
      <p class="portrait-name">${escapeHtml(cue.speaker || '角色')}</p>
    </div>
  `;
};

const getCueHoldMs = (cue, presentation) => {
  const pacing = presentation?.linePacing || {};
  const map = {
    narration: pacing.narrationMs || 1200,
    dialogue: pacing.dialogueMs || 1650,
    verse: pacing.verseMs || 1850,
    note: pacing.noteMs || 1400
  };
  const base = map[cue.style] || map.narration;
  return Math.round(base * (cue.speed || 1));
};

export const createStageRenderer = ({ gameView, statsList, titleEl, statTheme }) => {
  let onChoose = () => {};
  let playbackToken = 0;
  let activeTimers = [];

  const stopPlayback = () => {
    playbackToken += 1;
    activeTimers.forEach((timer) => clearTimeout(timer));
    activeTimers = [];
  };

  const setTimer = (fn, ms) => {
    const timer = setTimeout(fn, ms);
    activeTimers.push(timer);
  };

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
              <span class="text-stage-ink/90">${escapeHtml(item.label)}</span>
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
        <div>${rows}</div>
      </div>
    `;
  };

  const playCues = (snapshot, showChoices) => {
    const token = playbackToken;
    const cues = normalizeCues(snapshot);
    const lineHost = gameView.querySelector('[data-line-host]');
    const portraitHost = gameView.querySelector('[data-portrait-host]');
    if (!lineHost || !portraitHost) return;

    if (!cues.length) {
      showChoices();
      return;
    }

    const fadeMs = snapshot.presentation?.linePacing?.fadeMs || 260;

    const runCue = (index) => {
      if (token !== playbackToken) return;
      const cue = cues[index];
      if (!cue) {
        showChoices();
        return;
      }

      lineHost.innerHTML = createCueHtml(cue);
      portraitHost.innerHTML = createPortraitHtml(cue);

      const lineEl = lineHost.querySelector('.story-line');
      const portraitEl = portraitHost.querySelector('.portrait-shell--active');

      requestAnimationFrame(() => {
        if (lineEl) lineEl.classList.add('is-in');
        if (portraitEl) portraitEl.classList.add('is-in');
      });

      const holdMs = getCueHoldMs(cue, snapshot.presentation);
      const hasNext = index < cues.length - 1;

      if (!hasNext) {
        setTimer(() => {
          if (token !== playbackToken) return;
          showChoices();
        }, holdMs);
        return;
      }

      setTimer(() => {
        if (token !== playbackToken) return;
        if (lineEl) lineEl.classList.add('is-out');
        if (portraitEl) portraitEl.classList.add('is-out');
      }, holdMs);

      setTimer(() => {
        if (token !== playbackToken) return;
        runCue(index + 1);
      }, holdMs + fadeMs);
    };

    runCue(0);
  };

  const renderNode = (snapshot) => {
    const node = snapshot.node;
    stopPlayback();

    const choices = snapshot.choices
      .map((choice) => {
        if (node.kind === 'ending_transition') return createTransitionChoiceButton(choice);
        return createChoiceButton(choice, statTheme);
      })
      .join('');

    const openingVisual =
      node.kind === 'ending_transition'
        ? `
          <div class="overflow-hidden rounded-2xl border border-stage-accent/25 bg-black/60 p-4">
            <div class="ending-fpv-stage relative h-64 rounded-xl border border-stage-accent/20 bg-black/70">
              <div class="ending-fpv-silhouette ending-fpv-s1"></div>
              <div class="ending-fpv-silhouette ending-fpv-s2"></div>
              <div class="ending-fpv-silhouette ending-fpv-s3"></div>
              <div class="ending-fpv-zoom absolute inset-0 flex items-center justify-center">
                <div class="ending-fpv-platform rounded-xl border border-stage-accent/45 bg-stage-panel/70 px-6 py-3 text-center shadow-ember">
                  <p class="text-[11px] tracking-[0.22em] text-stage-accent/85">${escapeHtml(node.act)}</p>
                  <p class="mt-1 text-lg font-semibold text-stage-ink">${escapeHtml(node.title)}</p>
                </div>
              </div>
            </div>
          </div>
        `
        : '';

    gameView.innerHTML = `
      <article class="enter-fade space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-2 border-b border-stage-accent/20 pb-3">
          <div>
            <p class="text-xs uppercase tracking-[0.25em] text-stage-accent/80">${escapeHtml(node.act)}</p>
            <h2 class="text-xl font-semibold text-stage-ink">${escapeHtml(node.title)}</h2>
          </div>
        </div>
        ${openingVisual}
        <div class="story-stage-panel grid gap-3 rounded-xl border border-stage-accent/15 bg-black/20 p-3 lg:grid-cols-[1fr_220px]">
          <div data-line-host class="story-line-host min-h-[120px]"></div>
          <div data-portrait-host class="portrait-host min-h-[120px]"></div>
        </div>
        <div data-choices class="grid gap-2 pt-2 opacity-0 pointer-events-none transition duration-300">${choices}</div>
      </article>
    `;

    const choiceBlock = gameView.querySelector('[data-choices]');
    const showChoices = () => {
      if (!choiceBlock) return;
      choiceBlock.classList.remove('opacity-0', 'pointer-events-none');
      choiceBlock.classList.add('opacity-100');
    };

    playCues(snapshot, showChoices);
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
