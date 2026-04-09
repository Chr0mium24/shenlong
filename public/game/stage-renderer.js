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

const buildMingpanSlices = (items) => {
  const weighted = items.map((item) => ({
    ...item,
    weight: Math.max(1, item.value + 2)
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);

  let cursor = 0;
  return weighted.map((item) => {
    const start = cursor;
    const delta = (item.weight / total) * 100;
    cursor += delta;
    return {
      ...item,
      startPercent: start,
      endPercent: cursor,
      midPercent: start + delta / 2
    };
  });
};

const buildConicGradient = (items) => {
  const slices = buildMingpanSlices(items);
  return slices
    .map((item) => {
      return `${item.color} ${item.startPercent.toFixed(2)}% ${item.endPercent.toFixed(2)}%`;
    })
    .join(', ');
};

const normalizeDegree = (degree) => {
  let value = degree % 360;
  if (value < 0) value += 360;
  return value;
};

const shortestDegreeDelta = (target, current) => {
  let delta = target - current;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
};

const resolveNodeLayout = (items) => {
  if (!items.length) return [];
  const slices = buildMingpanSlices(items);
  const base = slices.map((slice) => normalizeDegree(-90 + slice.midPercent * 3.6));
  const points = base.map((angle, index) => ({ angle, index }));
  const minGap = 24;

  for (let iter = 0; iter < 14; iter += 1) {
    points.sort((a, b) => a.angle - b.angle);
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const curr = points[i];
      const diff = curr.angle - prev.angle;
      if (diff < minGap) {
        const push = (minGap - diff) / 2;
        prev.angle -= push;
        curr.angle += push;
      }
    }

    const first = points[0];
    const last = points[points.length - 1];
    const wrapDiff = first.angle + 360 - last.angle;
    if (wrapDiff < minGap) {
      const push = (minGap - wrapDiff) / 2;
      first.angle += push;
      last.angle -= push;
    }

    points.forEach((point) => {
      const target = base[point.index];
      point.angle += shortestDegreeDelta(target, point.angle) * 0.16;
      point.angle = normalizeDegree(point.angle);
    });
  }

  points.sort((a, b) => a.angle - b.angle);
  const lookup = new Map(points.map((point, orderIndex) => [point.index, { ...point, orderIndex }]));

  return items.map((_, index) => {
    const current = lookup.get(index);
    const prev = points[(current.orderIndex - 1 + points.length) % points.length];
    const next = points[(current.orderIndex + 1) % points.length];
    const prevGap = normalizeDegree(current.angle - prev.angle);
    const nextGap = normalizeDegree(next.angle - current.angle);
    const nearGap = Math.min(prevGap, nextGap);
    const crowded = nearGap < minGap * 1.18;
    const lane = current.orderIndex % 2 === 0 ? 1 : -1;
    const radius = crowded ? 37 + lane * 4 : 37;
    return {
      angle: current.angle,
      radius
    };
  });
};

const createOrbitalNodes = (items) => {
  const nodes = resolveNodeLayout(items);
  return items
    .map((item, index) => {
      const angle = nodes[index]?.angle ?? 0;
      const radius = nodes[index]?.radius ?? 37;
      const rad = (angle * Math.PI) / 180;
      const x = 50 + Math.cos(rad) * radius;
      const y = 50 + Math.sin(rad) * radius;

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

const removeSpeakerPrefix = (text, speaker) => {
  if (!speaker || !text) return text;
  const escaped = speaker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`^${escaped}\\s*[：:]\\s*`), '');
};

const createCueHtml = (cue) => {
  const styleClass = cueClassByStyle[cue.style] || cueClassByStyle.narration;
  const speaker = cue.speaker ? `<p class="story-line-speaker">${escapeHtml(cue.speaker)}</p>` : '';
  const text = removeSpeakerPrefix(cue.text, cue.speaker);
  return `
    <div class="story-line ${styleClass}">
      ${speaker}
      <p class="story-line-text">${escapeHtml(text)}</p>
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
      <div class="portrait-fallback">立绘待补</div>
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

const createEndingCinematicHtml = (snapshot, statTheme) => {
  const items = snapshot.statOrder.map((key) => ({
    color: statTheme[key]?.color || '#e1b16a',
    value: snapshot.state[key] ?? 0
  }));
  const mingpanGradient = buildConicGradient(items);
  const crowd = Array.from({ length: 22 }, (_, i) => {
    const x = ((i * 17) % 100) + (i % 3) * 0.5;
    const h = 24 + ((i * 11) % 28);
    const delay = (i % 7) * 90;
    return `<span class="ending-cinematic-crowd-item" style="left:${x}%;height:${h}px;animation-delay:${delay}ms;"></span>`;
  }).join('');

  return `
    <div class="ending-cinematic fixed inset-0 z-[80]">
      <div class="ending-cinematic-world">
        <div class="ending-cinematic-mingpan-wrap">
          <div class="ending-cinematic-mingpan-glow" style="background:conic-gradient(${mingpanGradient});"></div>
          <div class="ending-cinematic-mingpan" style="background:conic-gradient(${mingpanGradient});"></div>
        </div>
        <div class="ending-cinematic-stage">
          <div class="ending-cinematic-paper ending-cinematic-paper--left"></div>
          <div class="ending-cinematic-paper ending-cinematic-paper--center"></div>
          <div class="ending-cinematic-paper ending-cinematic-paper--right"></div>
        </div>
        <div class="ending-cinematic-crowd">${crowd}</div>
      </div>
    </div>
  `;
};

export const createStageRenderer = ({ gameView, statsList, titleEl, statTheme }) => {
  let onChoose = () => {};
  let playbackToken = 0;
  let activeTimers = [];
  let activeAct = null;

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
    const choiceBlock = gameView.querySelector('[data-choices]');
    if (choiceBlock) {
      choiceBlock.classList.add('hidden', 'pointer-events-none');
    }
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

    const ringGradient = buildConicGradient(items);
    const ranking = [...items].sort((a, b) => b.value - a.value);
    const dominant = ranking[0];
    const support = ranking[1];
    const omenText =
      dominant.value >= 15
        ? `今夜由${dominant.label}执灯领路。`
        : dominant.value >= 8
          ? `${dominant.label}渐盛，宫闱风声已偏。`
          : '诸曜尚浅，局势仍可翻覆。';
    const historyRows = snapshot.history.slice(-2).reverse();
    const historyHtml = historyRows.length
      ? historyRows
          .map((entry) => {
            return `
              <li class="mingpan-history-item">
                <span class="mingpan-history-act">${escapeHtml(entry.nodeTitle)}</span>
                <span class="mingpan-history-choice">${escapeHtml(stripNumericEffectText(entry.choiceText || ''))}</span>
              </li>
            `;
          })
          .join('')
      : '<li class="mingpan-history-empty">尚未落子</li>';
    const beadHtml = items
      .map((item) => {
        return `
          <span class="mingpan-bead" style="--bead:${item.color};">
            <span class="mingpan-bead-label">${escapeHtml(item.label)}</span>
            <span class="mingpan-bead-value">${item.value}</span>
          </span>
        `;
      })
      .join('');

    statsList.innerHTML = `
      <div class="space-y-3">
        <div class="relative mx-auto h-56 w-56">
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
        <div class="mingpan-brief">
          <p class="mingpan-brief-title">命理笺</p>
          <p class="mingpan-brief-text">主曜：<span style="color:${dominant.color};">${escapeHtml(dominant.label)} ${dominant.value}</span></p>
          <p class="mingpan-brief-text">副曜：<span style="color:${support.color};">${escapeHtml(support.label)} ${support.value}</span></p>
          <p class="mingpan-brief-omen">${escapeHtml(omenText)}</p>
          <div class="mingpan-bead-wrap">${beadHtml}</div>
        </div>
        <div class="mingpan-history">
          <p class="mingpan-history-title">近二步</p>
          <ol class="mingpan-history-list">${historyHtml}</ol>
        </div>
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

    const fadeMs = Math.max(80, Math.round((snapshot.presentation?.linePacing?.fadeMs || 260) / 2));

    const runCue = (index) => {
      if (token !== playbackToken) return;
      const cue = cues[index];
      if (!cue) {
        showChoices();
        return;
      }

      const cueWrapper = document.createElement('div');
      cueWrapper.innerHTML = createCueHtml(cue);
      const lineEl = cueWrapper.firstElementChild;
      if (lineEl) {
        lineHost.appendChild(lineEl);
      }

      if (cue.portrait || cue.speaker) {
        portraitHost.innerHTML = createPortraitHtml(cue);
      }
      const portraitEl = portraitHost.querySelector('.portrait-shell--active');

      requestAnimationFrame(() => {
        if (lineEl) lineEl.classList.add('is-in');
        if (portraitEl) portraitEl.classList.add('is-in');
        lineHost.scrollTop = lineHost.scrollHeight;
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
        runCue(index + 1);
      }, holdMs + fadeMs);
    };

    runCue(0);
  };

  const renderNode = (snapshot) => {
    const node = snapshot.node;
    stopPlayback();

    if (node.kind === 'ending_transition') {
      const token = playbackToken;
      const duration = node.durationMs || snapshot.presentation?.endingTransition?.durationMs || 3600;
      const continueChoice = snapshot.choices[0];
      activeAct = null;
      document.body.classList.add('ending-cinematic-mode');
      gameView.innerHTML = createEndingCinematicHtml(snapshot, statTheme);

      setTimer(() => {
        if (token !== playbackToken) return;
        document.body.classList.remove('ending-cinematic-mode');
        if (continueChoice?.id) {
          onChoose(continueChoice.id);
        }
      }, duration);
      return;
    }

    document.body.classList.remove('ending-cinematic-mode');

    const shouldRebuildScene =
      activeAct !== node.act || !gameView.querySelector('[data-line-host]') || !gameView.querySelector('[data-choices]');

    if (shouldRebuildScene) {
      gameView.innerHTML = `
        <article class="enter-fade flex h-full min-h-0 flex-col gap-4 overflow-hidden">
          <div class="flex flex-wrap items-end justify-between gap-2 border-b border-stage-accent/20 pb-3">
            <div>
              <p data-act-label class="text-xs uppercase tracking-[0.25em] text-stage-accent/80">${escapeHtml(node.act)}</p>
              <h2 data-node-title class="text-xl font-semibold text-stage-ink">${escapeHtml(node.title)}</h2>
            </div>
          </div>
          <div class="story-stage-panel grid min-h-0 flex-1 gap-3 overflow-hidden p-1 lg:grid-cols-[1fr_190px]">
            <div data-line-host class="story-line-host no-scrollbar h-full min-h-0 overflow-y-auto pr-1"></div>
            <div data-portrait-host class="portrait-host min-h-0"></div>
          </div>
          <div data-choices class="grid min-h-[156px] shrink-0 gap-2 pt-2 hidden pointer-events-none"></div>
        </article>
      `;
      activeAct = node.act;
    } else {
      const actLabel = gameView.querySelector('[data-act-label]');
      const nodeTitle = gameView.querySelector('[data-node-title]');
      if (actLabel) actLabel.textContent = node.act;
      if (nodeTitle) nodeTitle.textContent = node.title;
    }

    const choiceBlock = gameView.querySelector('[data-choices]');
    const choices = snapshot.choices.map((choice) => createChoiceButton(choice, statTheme)).join('');
    if (choiceBlock) {
      choiceBlock.innerHTML = choices;
      choiceBlock.classList.add('hidden', 'pointer-events-none');
    }

    const showChoices = () => {
      if (!choiceBlock) return;
      choiceBlock.classList.remove('hidden', 'pointer-events-none');
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
