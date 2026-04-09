import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'node:fs/promises';
import { shenlongPack } from './data/shenlong-pack.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manualCuesPath = path.join(__dirname, 'data', 'manual-line-cues.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const readManualCues = async () => {
  try {
    const content = await readFile(manualCuesPath, 'utf8');
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
};

const writeManualCues = async (cues) => {
  await writeFile(manualCuesPath, `${JSON.stringify(cues, null, 2)}\n`, 'utf8');
};

const withManualCues = async () => {
  const manualLineCues = await readManualCues();
  const pack = structuredClone(shenlongPack);
  pack.presentation = {
    ...(pack.presentation || {}),
    manualLineCues
  };
  return pack;
};

app.get('/api/story', async (_req, res, next) => {
  try {
    res.json(await withManualCues());
  } catch (error) {
    next(error);
  }
});

app.get('/api/manual-cues', async (_req, res, next) => {
  try {
    res.json(await readManualCues());
  } catch (error) {
    next(error);
  }
});

app.put('/api/manual-cues', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'manual cues must be an object' });
    }
    await writeManualCues(body);
    return res.json({ ok: true, count: Object.keys(body).length });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'internal_server_error' });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'api_not_found' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shenlong game server running at http://localhost:${PORT}`);
});
