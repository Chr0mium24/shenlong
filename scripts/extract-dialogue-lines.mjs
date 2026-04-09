import { story } from '../data/story.js';

const candidates = [];

for (const node of story) {
  const lines = Array.isArray(node.lines) ? node.lines : [];
  lines.forEach((line, index) => {
    if (typeof line !== 'string') return;
    const text = line.trim();
    if (!text) return;
    if (/[“”]/.test(text) || /[:：]/.test(text)) {
      candidates.push({
        key: `${node.id}:${index}`,
        nodeId: node.id,
        nodeTitle: node.title,
        index,
        text
      });
    }
  });
}

console.log(JSON.stringify(candidates, null, 2));
