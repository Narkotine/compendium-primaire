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
  { slug: 'division', dir: '04-division', n: 4 },
  { slug: 'fractions', dir: '05-fractions', n: 5 },
  { slug: 'decimaux', dir: '06-decimaux', n: 6 },
  { slug: 'proportionnalite', dir: '07-proportionnalite', n: 7 },
  { slug: 'mesures', dir: '08-mesures', n: 8 },
  { slug: 'geometrie', dir: '09-geometrie', n: 9 },
];
const out = [];
for (const c of chapters) {
  let md = fs.readFileSync(path.join(SRC, c.dir, 'cours.md'), 'utf8');
  md = md.replace(/<br>$/gm, '<br>').replace(/`(CE1|CE2|CM1|CM2|6e)`/g, '<span class="lv lv-$1">$1</span>');
  // cours « écrans » : une écriture mathématique (3 × 2/5 = 6/5) ne se coupe pas en fin de ligne
  if (md.includes('<!-- format: ecrans -->')) {
    const tok = String.raw`\d+(?:[,/]\d+)?`, op = String.raw`(?:=|\+|−|×|÷|&lt;|&gt;|≠|≈)`;
    const run = new RegExp(String.raw`(?<![\w/,])${tok}(?: ${op} ${tok})+(?![\w/])`, 'g');
    md = md.split('\n').map((l) => (/^(!\[|<!--|\[\[|#)/.test(l) ? l : l.replace(run, (m) => `<span class="nw">${m}</span>`))).join('\n');
  }
  // fractions écrites a/b dans le texte → écriture empilée (hors liens et chemins)
  md = md.split('\n').map((l) => (l.startsWith('![') ? l : l.replace(/(?<![\w/.])(\d{1,3})\/(\d{1,3})(?![\w/])/g, '<span class="fr"><span class="fr-n">$1</span><span class="fr-d">$2</span></span>'))).join('\n');
  let html = marked.parse(md, { async: false });
  html = html.replace(/src="figures\//g, `src="figures/${c.slug}/`);
  html = html.replace(/<hr>/g, '');
  html = html.replace(/<h1>.*?<\/h1>/, '');
  // [[exo id1 id2]] → bouton(s) vers l'exercice, remplis par l'appli (titre, niveaux, étoiles)
  html = html.replace(/<p>\[\[exo ([a-z0-9 ]+)\]\]<\/p>/g, (_, ids) => `<div class="go-exo" data-exos="${ids.trim()}"></div>`);
  // Format « écrans » (cours court) : chaque partie h2 devient une carte <section class="ecran">
  if (md.includes('<!-- format: ecrans -->')) {
    html = html.replace(/<!-- format: ecrans -->\s*/, '');
    const src = html.match(/<p><em>Sources[\s\S]*$/)?.[0] ?? '';
    const body = src ? html.slice(0, -src.length) : html;
    const parts = body.split(/(?=<h2[ >])/);
    html = parts.map((x) => (x.startsWith('<h2') ? `<section class="ecran">${x.trim()}</section>` : x)).join('') + src;
  }
  const figDir = path.join(SRC, c.dir, 'figures');
  const dst = path.join(ROOT, 'public', 'figures', c.slug); fs.mkdirSync(dst, { recursive: true });
  const figs = fs.readdirSync(figDir);
  for (const f of fs.readdirSync(dst)) if (!figs.includes(f)) fs.rmSync(path.join(dst, f)); // figures retirées du cours
  for (const f of figs) fs.copyFileSync(path.join(figDir, f), path.join(dst, f));
  out.push({ slug: c.slug, n: c.n, html });
}
fs.writeFileSync(path.join(ROOT, 'src/content/cours.ts'), `// Généré par scripts/build-content.mjs — ne pas modifier\nexport const COURS: Record<string, string> = ${JSON.stringify(Object.fromEntries(out.map((o) => [o.slug, o.html])), null, 0)};\n`);
console.log('cours :', out.map((o) => o.slug).join(', '));
