import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const publicDir = path.join(root, 'public');
const dataDir = path.join(root, 'data');
const outDir = path.join(root, 'dist-pages');
const outDataDir = path.join(outDir, 'data');

await rm(outDir, { recursive: true, force: true });
await cp(publicDir, outDir, { recursive: true });
await mkdir(outDataDir, { recursive: true });
await cp(path.join(dataDir, 'shenlong-pack.json'), path.join(outDataDir, 'shenlong-pack.json'));
await cp(path.join(dataDir, 'manual-line-cues.json'), path.join(outDataDir, 'manual-line-cues.json'));
await writeFile(path.join(outDir, '.nojekyll'), '', 'utf8');

console.log(`Prepared GitHub Pages artifact at ${outDir}`);
