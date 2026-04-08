import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { story } from './data/story.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/story', (_req, res) => {
  res.json({
    title: '男皇后：戏台浮梦',
    stats: {
      beardBone: '须眉骨',
      rougeFace: '红粉相',
      favor: '大王好感度',
      mask: '面具值',
      feminine: '女妆值'
    },
    initialState: {
      currentNode: 'start',
      beardBone: 0,
      rougeFace: 0,
      favor: 0,
      mask: 0,
      feminine: 0
    },
    nodes: story
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shenlong game server running at http://localhost:${PORT}`);
});
