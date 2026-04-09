const STORAGE_KEY = 'shenlong_manual_cues_draft_v1';
const DEFAULT_PACK_URL = 'data/shenlong-pack.json';
const DEFAULT_CUES_URL = 'data/manual-line-cues.json';

const rowsEl = document.getElementById('rows');
const statusEl = document.getElementById('status-text');
const uploadPackBtn = document.getElementById('upload-pack-btn');
const uploadCuesBtn = document.getElementById('upload-cues-btn');
const downloadCuesBtn = document.getElementById('download-cues-btn');
const clearDraftBtn = document.getElementById('clear-draft-btn');
const uploadPackInput = document.getElementById('upload-pack-input');
const uploadCuesInput = document.getElementById('upload-cues-input');

const state = {
  rows: [],
  pack: null,
  cues: {}
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

const parseJsonText = (text, label) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label}不是合法 JSON：${error.message}`);
  }
};

const fetchJson = async (url, label) => {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`${label}失败（${response.status}）${detail ? `: ${detail.slice(0, 120)}` : ''}`);
  }

  if (!contentType.includes('application/json')) {
    const body = await response.text();
    throw new Error(`${label}返回非 JSON（content-type=${contentType || 'unknown'}）: ${body.slice(0, 120)}`);
  }

  return response.json();
};

const readFileAsJson = async (file, label) => {
  const text = await file.text();
  return parseJsonText(text, label);
};

const collectEditableRows = (nodes) => {
  const result = [];
  (nodes || []).forEach((node) => {
    (node.lines || []).forEach((line, index) => {
      const key = `${node.id}:${index}`;
      if (typeof line === 'string') {
        const source = line.trim();
        if (!source) return;
        let style = 'narration';
        if (/^【.+】$/.test(source) || /^「.+」$/.test(source)) style = 'verse';
        else if (/^\[.+\]/.test(source)) style = 'note';

        result.push({
          key,
          nodeId: node.id,
          nodeTitle: node.title,
          index,
          source,
          defaultStyle: style,
          defaultText: line,
          defaultSpeaker: '',
          defaultSpeed: style === 'verse' ? 1.2 : style === 'note' ? 1.1 : 1,
          defaultPortrait: ''
        });
        return;
      }

      if (!line || typeof line !== 'object') return;
      const source = (line.text || '').trim();
      if (!source) return;
      result.push({
        key,
        nodeId: node.id,
        nodeTitle: node.title,
        index,
        source,
        defaultStyle: line.style || 'narration',
        defaultText: line.text || '',
        defaultSpeaker: line.speaker || '',
        defaultSpeed: typeof line.speed === 'number' ? line.speed : 1,
        defaultPortrait: line.portrait || ''
      });
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
      enabled: fromDraft ? Boolean(fromDraft.enabled) : true,
      style: fromDraft?.style ?? cue.style ?? item.defaultStyle,
      speaker: fromDraft?.speaker ?? cue.speaker ?? item.defaultSpeaker,
      text: fromDraft?.text ?? cue.text ?? item.defaultText,
      speed: fromDraft?.speed ?? cue.speed ?? item.defaultSpeed,
      portrait: fromDraft?.portrait ?? cue.portrait ?? item.defaultPortrait
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

const downloadJson = (filename, data) => {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const rebuildRows = ({ pack, cues, useDraft = false, sourceLabel }) => {
  if (!pack || !Array.isArray(pack.nodes)) {
    throw new Error('剧情 JSON 缺少 nodes 数组');
  }
  const draft = useDraft ? getDraft() : null;
  const candidates = collectEditableRows(pack.nodes);

  state.pack = pack;
  state.cues = cues && typeof cues === 'object' ? cues : {};
  state.rows = buildRows({
    candidates,
    cues: state.cues,
    draft
  });

  render();

  if (draft && useDraft) {
    setStatus(`已载入${sourceLabel}，并应用本地草稿（${draft.updatedAt || '未知时间'}）。共 ${state.rows.length} 条`);
    return;
  }

  setStatus(`已载入${sourceLabel}，共 ${state.rows.length} 条文本行`);
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

const loadStaticSources = async () => {
  const [pack, cues] = await Promise.all([
    fetchJson(DEFAULT_PACK_URL, '加载剧情'),
    fetchJson(DEFAULT_CUES_URL, '加载配置')
  ]);
  rebuildRows({ pack, cues, useDraft: true, sourceLabel: '静态文件' });
};

rowsEl.addEventListener('input', (event) => applyInteractiveUpdate(event.target));
rowsEl.addEventListener('change', (event) => applyInteractiveUpdate(event.target));

uploadPackBtn.addEventListener('click', () => {
  uploadPackInput.value = '';
  uploadPackInput.click();
});

uploadCuesBtn.addEventListener('click', () => {
  uploadCuesInput.value = '';
  uploadCuesInput.click();
});

uploadPackInput.addEventListener('change', async () => {
  const file = uploadPackInput.files?.[0];
  if (!file) return;

  try {
    setStatus('正在导入剧情 JSON...');
    const pack = await readFileAsJson(file, '剧情 JSON');
    const cues = toPayload();
    localStorage.removeItem(STORAGE_KEY);
    rebuildRows({ pack, cues, useDraft: false, sourceLabel: `导入剧情 ${file.name}` });
  } catch (error) {
    setStatus(`导入失败：${error.message}`);
  }
});

uploadCuesInput.addEventListener('change', async () => {
  const file = uploadCuesInput.files?.[0];
  if (!file) return;

  try {
    setStatus('正在导入配置 JSON...');
    const cues = await readFileAsJson(file, '配置 JSON');
    if (!state.pack) {
      throw new Error('请先加载剧情 JSON');
    }
    localStorage.removeItem(STORAGE_KEY);
    rebuildRows({ pack: state.pack, cues, useDraft: false, sourceLabel: `导入配置 ${file.name}` });
  } catch (error) {
    setStatus(`导入失败：${error.message}`);
  }
});

downloadCuesBtn.addEventListener('click', () => {
  try {
    const payload = toPayload();
    downloadJson('manual-line-cues.json', payload);
    setStatus(`已下载配置 JSON，共 ${Object.keys(payload).length} 条。`);
  } catch (error) {
    setStatus(`下载失败：${error.message}`);
  }
});

clearDraftBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  setStatus('本地草稿已清空。');
});

window.addEventListener('beforeunload', () => {
  saveDraftNow();
});

loadStaticSources().catch((error) => {
  setStatus(`初始化失败：${error.message}`);
});
