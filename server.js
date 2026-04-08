import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { shenlongPack } from './data/shenlong-pack.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/story', (_req, res) => {
  res.json(shenlongPack);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shenlong game server running at http://localhost:${PORT}`);
});
