#!/usr/bin/env node
/** Cours (Markdown, /workspace/compendium-primaire) → HTML pré-rendu dans src/content/, figures copiées dans public/figures. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.COURS_DIR || '/workspace/compendium-primaire';
const chapters = [
  { slug: 'numeration', dir: '01-numeration', n: 1 },
  { slug: 'addition', dir: '02-addition', n: 2 },
  { slug: 'multiplication', dir: '03-multiplication', n: 3 },
];
const out = [];
for (const c of chapters) {
  let md = fs.readFileSync(path.join(SRC, c.dir, 'cours.md'), 'utf8');
  md = md.replace(/<br>$/gm, '<br>').replace(/`(CE1|CE2|CM1|CM2)`/g, '<span class="lv lv-$1">$1</span>');
  let html = marked.parse(md, { async: false });
  html = html.replace(/src="figures\//g, 'src="figures/');
  html = html.replace(/<hr>/g, '');
  html = html.replace(/<h1>.*?<\/h1>/, '');
  const figDir = path.join(SRC, c.dir, 'figures');
  for (const f of fs.readdirSync(figDir)) fs.copyFileSync(path.join(figDir, f), path.join(ROOT, 'public', 'figures', f));
  out.push({ slug: c.slug, n: c.n, html });
}
fs.writeFileSync(path.join(ROOT, 'src/content/cours.ts'), `// Généré par scripts/build-content.mjs — ne pas modifier\nexport const COURS: Record<string, string> = ${JSON.stringify(Object.fromEntries(out.map((o) => [o.slug, o.html])), null, 0)};\n`);
console.log('cours :', out.map((o) => o.slug).join(', '));
