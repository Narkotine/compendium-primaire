/** Captures 390 px de l'exercice « Problèmes : ajouter ou enlever ? » au CE1 (allègement du 24/10). Usage : tsx scripts/cap-ce1-allege.mts [avant] */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { probadd } from '../src/exos/probadd';
import { evalExpr } from '../src/ui/expr';
const AVANT = process.argv[2] === 'avant';
const BASE = AVANT ? 'https://narkotine.github.io/compendium-primaire/' : 'http://localhost:4174/compendium-primaire/';
const OUT = 'captures/ce1-allege'; fs.mkdirSync(OUT, { recursive: true });
const W = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const open = async (h: string) => { await p.goto('about:blank'); await p.goto(BASE + h, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.querySelectorAll('.toast').forEach((x) => x.remove())); await W(300); };
const fmtN = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
const tok = (l: string) => p.evaluate((l) => [...document.querySelectorAll<HTMLElement>('.ex-pool .tok')].findIndex((x) => x.textContent === l && !x.hidden), l);
if (AVANT) {
  await open('#/exo/probadd/CE1/1/3'); await p.screenshot({ path: `${OUT}/avant-ce1-palier1-390x844.png` });
  await open('#/exo/probadd/CE1/3/12'); await p.screenshot({ path: `${OUT}/avant-ce1-palier3-390x844.png` });
} else {
  await open('#/exo/probadd/CE1/1/3'); await p.screenshot({ path: `${OUT}/apres-ce1-palier1-390x844.png` });
  // palier 1 résolu : calcul avec les étiquettes, résultat au pavé, « Bravo »
  const d = probadd.generate('CE1', 1, 3); const sol = probadd.solution(d);
  for (const [s, v] of [[0, fmtN(sol.nums[0])], [1, sol.ops[0]], [2, fmtN(sol.nums[1])]] as [number, string][]) { await p.click(`.ex-pool .tok:nth-child(${(await tok(v)) + 1})`); await p.click(`.ex-slot[data-s="${s}"]`); await W(60); }
  for (const ch of String(evalExpr(sol.nums, sol.ops))) await p.click(`.kp-k[data-k="${ch}"]`);
  await p.click('#check'); await W(400);
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await W(300);
  await p.screenshot({ path: `${OUT}/apres-ce1-palier1-resolu-390x844.png` });
  await open('#/exo/probadd/CE1/3/12'); await p.screenshot({ path: `${OUT}/apres-ce1-palier3-390x844.png` });
}
await b.close();
console.log('ok', AVANT ? 'avant' : 'après');
