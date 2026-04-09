const STORAGE_KEY = 'shenlong_manual_cues_draft_v1';

const rowsEl = document.getElementById('rows');
const statusEl = document.getElementById('status-text');
const saveServerBtn = document.getElementById('save-server-btn');
const reloadBtn = document.getElementById('reload-btn');
const clearDraftBtn = document.getElementById('clear-draft-btn');

const state = {
  rows: [],
  serverCues: {}
};

let saveTimer = null;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const setStatus = (text) => {
  statusEl.textContent = text;
};

const readJsonResponse = async (response, label) => {
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      detail = '';
    }
    throw new Error(`${label}失败（${response.status}）${detail ? `: ${detail.slice(0, 120)}` : ''}`);
  }
  if (!contentType.includes('application/json')) {
    const body = await response.text();
    throw new Error(`${label}返回非 JSON（content-type=${contentType || 'unknown'}）: ${body.slice(0, 120)}`);
  }
  return response.json();
};

const collectCandidates = (nodes) => {
  const result = [];
  (nodes || []).forEach((node) => {
    (node.lines || []).forEach((line, index) => {
      if (typeof line !== 'string') return;
      const text = line.trim();
      if (!text) return;
      if (/[“”]/.test(text) || /[:：]/.test(text)) {
        result.push({
          key: `${node.id}:${index}`,
          nodeId: node.id,
          nodeTitle: node.title,
          index,
          source: text
        });
      }
    });
  });
  return result;
};

const getDraft = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.rows) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveDraftNow = () => {
  const rows = {};
  state.rows.forEach((row) => {
    rows[row.key] = {
      enabled: row.enabled,
      style: row.style,
      speaker: row.speaker,
      text: row.text,
      speed: row.speed,
      portrait: row.portrait
    };
  });
  const payload = {
    updatedAt: new Date().toISOString(),
    rows
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  setStatus(`本地草稿已保存 ${payload.updatedAt}`);
};

const scheduleDraftSave = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraftNow, 350);
};

const buildRows = ({ candidates, cues, draft }) => {
  const draftRows = draft?.rows || {};
  return candidates.map((item) => {
    const cue = cues[item.key] || {};
    const fromDraft = draftRows[item.key] || null;
    return {
      ...item,
      enabled: fromDraft ? Boolean(fromDraft.enabled) : Boolean(cues[item.key]),
      style: fromDraft?.style ?? cue.style ?? 'narration',
      speaker: fromDraft?.speaker ?? cue.speaker ?? '',
      text: fromDraft?.text ?? cue.text ?? '',
      speed: fromDraft?.speed ?? cue.speed ?? '',
      portrait: fromDraft?.portrait ?? cue.portrait ?? ''
    };
  });
};

const rowHtml = (row) => {
  const disabled = row.enabled ? '' : 'is-disabled';
  const disabledAttrs = row.enabled ? '' : 'disabled';
  const source = escapeHtml(row.source);
  const speaker = escapeHtml(row.speaker);
  const text = escapeHtml(row.text);
  const portrait = escapeHtml(row.portrait);
  const nodeTitle = escapeHtml(row.nodeTitle);
  const key = escapeHtml(row.key);
  return `
    <article class="row ${disabled}" data-key="${key}">
      <div class="row-head">
        <span class="row-title">${nodeTitle} · 第${row.index + 1}行</span>
        <span class="row-key">${key}</span>
      </div>
      <p class="source">${source}</p>
      <div class="fields">
        <label class="field-enable">
          <input type="checkbox" data-field="enabled" ${row.enabled ? 'checked' : ''} />
          启用
        </label>

        <label class="field">
          <span>样式</span>
          <select data-field="style" ${disabledAttrs}>
            <option value="narration" ${row.style === 'narration' ? 'selected' : ''}>narration</option>
            <option value="dialogue" ${row.style === 'dialogue' ? 'selected' : ''}>dialogue</option>
            <option value="verse" ${row.style === 'verse' ? 'selected' : ''}>verse</option>
            <option value="note" ${row.style === 'note' ? 'selected' : ''}>note</option>
          </select>
        </label>

        <label class="field">
          <span>说话人</span>
          <input data-field="speaker" value="${speaker}" ${disabledAttrs} />
        </label>

        <label class="field">
          <span>速度</span>
          <input type="number" step="0.05" min="0.1" data-field="speed" value="${row.speed}" ${disabledAttrs} />
        </label>

        <label class="field">
          <span>覆盖文本</span>
          <textarea data-field="text" ${disabledAttrs}>${text}</textarea>
        </label>

        <label class="field">
          <span>立绘路径</span>
          <input data-field="portrait" value="${portrait}" ${disabledAttrs} />
        </label>
      </div>
    </article>
  `;
};

const render = () => {
  rowsEl.innerHTML = state.rows.map(rowHtml).join('');
};

const toPayload = () => {
  const payload = {};
  state.rows.forEach((row) => {
    if (!row.enabled) return;
    const cue = { style: row.style || 'narration' };
    const speaker = row.speaker.trim();
    const text = row.text.trim();
    const portrait = row.portrait.trim();
    const speedNum = Number(row.speed);

    if (speaker) cue.speaker = speaker;
    if (text) cue.text = text;
    if (portrait) cue.portrait = portrait;
    if (Number.isFinite(speedNum) && speedNum > 0) cue.speed = speedNum;

    payload[row.key] = cue;
  });
  return payload;
};

const applyInteractiveUpdate = (target) => {
  const rowEl = target.closest('[data-key]');
  if (!rowEl) return;
  const key = rowEl.dataset.key;
  const row = state.rows.find((item) => item.key === key);
  if (!row) return;

  const field = target.dataset.field;
  if (!field) return;

  if (field === 'enabled') {
    row.enabled = target.checked;
    rowEl.classList.toggle('is-disabled', !row.enabled);
    rowEl.querySelectorAll('[data-field]').forEach((el) => {
      if (el.dataset.field === 'enabled') return;
      el.disabled = !row.enabled;
    });
  } else if (field === 'style') {
    row.style = target.value;
  } else if (field === 'speaker') {
    row.speaker = target.value;
  } else if (field === 'text') {
    row.text = target.value;
  } else if (field === 'speed') {
    row.speed = target.value;
  } else if (field === 'portrait') {
    row.portrait = target.value;
  }

  scheduleDraftSave();
};

const loadFromServer = async () => {
  const [packRes, cueRes] = await Promise.all([fetch('/api/story'), fetch('/api/manual-cues')]);
  const pack = await readJsonResponse(packRes, '加载故事');
  const cues = await readJsonResponse(cueRes, '加载配置');
  const candidates = collectCandidates(pack.nodes);
  const draft = getDraft();

  state.serverCues = cues;
  state.rows = buildRows({ candidates, cues, draft });
  render();

  if (draft) {
    setStatus(`已载入本地草稿（${draft.updatedAt || '未知时间'}）`);
  } else {
    setStatus(`已载入服务器配置，共 ${state.rows.length} 条候选台词`);
  }
};

const saveToServer = async () => {
  const payload = toPayload();
  const res = await fetch('/api/manual-cues', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await readJsonResponse(res, '保存配置');
  setStatus(`服务器保存成功，共 ${result.count} 条。`);
};

rowsEl.addEventListener('input', (event) => applyInteractiveUpdate(event.target));
rowsEl.addEventListener('change', (event) => applyInteractiveUpdate(event.target));

saveServerBtn.addEventListener('click', async () => {
  try {
    setStatus('正在保存到服务器...');
    await saveToServer();
  } catch (error) {
    setStatus(`保存失败：${error.message}`);
  }
});

reloadBtn.addEventListener('click', async () => {
  try {
    setStatus('正在从服务器重载...');
    localStorage.removeItem(STORAGE_KEY);
    await loadFromServer();
  } catch (error) {
    setStatus(`重载失败：${error.message}`);
  }
});

clearDraftBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  setStatus('本地草稿已清空。');
});

window.addEventListener('beforeunload', () => {
  saveDraftNow();
});

loadFromServer().catch((error) => {
  setStatus(`初始化失败：${error.message}`);
});
