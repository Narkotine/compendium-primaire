#!/usr/bin/env -S npx tsx
/** Captures du cours court (390 px, Chrome headless). Prérequis : build + preview (port 4174).
 *  tsx scripts/cap-cours-court.mts <slug> <dossier> haut            : haut d'écran 390×844 + page entière
 *  tsx scripts/cap-cours-court.mts <slug> <dossier> parties         : une image par partie
 *  tsx scripts/cap-cours-court.mts <slug> <dossier> avant|apres <n> : la partie n seule
 *  Thème : variable THEME=dark (défaut clair). */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const BASE = 'http://localhost:4174/compendium-primaire/';
const [slug, dir, mode = 'haut', nArg = '1'] = process.argv.slice(2);
const theme = process.env.THEME === 'dark' ? 'dark' : 'light', sfx = theme === 'dark' ? '-sombre' : '';
const OUT = `captures/${dir}/`; fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p = await (await b.createBrowserContext()).newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument((t) => localStorage.setItem('compendium-primaire.settings', JSON.stringify({ theme: t })), theme);
await p.goto(BASE + '#/cours/' + slug, { waitUntil: 'networkidle0' });
await p.evaluate(() => document.querySelectorAll('.toast').forEach((x) => x.remove()));
await new Promise((r) => setTimeout(r, 300));
const clipOf = (n: number) => p.evaluate((n) => {
  const hs = [...document.querySelectorAll('.prose h2')] as HTMLElement[];
  const h = hs[n - 1]; const sec = h.closest('section.ecran') as HTMLElement | null;
  const top = (sec ?? h).getBoundingClientRect().top + scrollY - 8;
  const endEl = hs[n] ?? document.querySelector('.prose > p:last-child') ?? document.getElementById('exos');
  const bottom = sec ? sec.getBoundingClientRect().bottom + scrollY + 8 : endEl!.getBoundingClientRect().top + scrollY - 4;
  return { x: 0, y: top, width: innerWidth, height: bottom - top, count: hs.length };
}, n);
if (mode === 'haut') {
  await p.screenshot({ path: `${OUT}ecran-haut-390x844${sfx}.png` });
  await p.screenshot({ path: `${OUT}page-entiere-390${sfx}.png`, fullPage: true });
  console.log(slug, 'haut + page entière', await p.evaluate(() => document.documentElement.scrollHeight), 'px');
} else if (mode === 'parties') {
  const { count } = await clipOf(1);
  for (let n = 1; n <= count; n++) { const c = await clipOf(n); await p.screenshot({ path: `${OUT}partie-${n}-390${sfx}.png`, clip: { x: c.x, y: c.y, width: c.width, height: c.height }, captureBeyondViewport: true }); }
  console.log(slug, count, 'parties');
} else {
  const c = await clipOf(Number(nArg));
  await p.screenshot({ path: `${OUT}${mode}-partie-${nArg}-390${sfx}.png`, clip: { x: c.x, y: c.y, width: c.width, height: c.height }, captureBeyondViewport: true });
  console.log(slug, mode, nArg, Math.round(c.height), 'px');
}
await b.close();
