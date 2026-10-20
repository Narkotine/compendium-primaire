#!/usr/bin/env -S npx tsx
/** Captures du cours court ch.1 → captures/ch01-cours-court/. Prérequis : build + preview.
 *  tsx scripts/cap-ch01-court.mts parties   : un écran par partie (390 px, clair) + page entière
 *  tsx scripts/cap-ch01-court.mts avant|apres <n> [dark] : la partie n seule (pour avant/après)
 *  (pour « parties » en sombre : tsx scripts/cap-ch01-court.mts parties 0 dark) */
import puppeteer from 'puppeteer-core';
const BASE = 'http://localhost:4174/compendium-primaire/';
const OUT = 'captures/ch01-cours-court/';
const [mode = 'parties', nArg = '2', theme = 'light'] = process.argv.slice(2);
const W = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p = await (await b.createBrowserContext()).newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument((t) => localStorage.setItem('compendium-primaire.settings', JSON.stringify({ theme: t })), theme);
await p.goto(BASE + '#/cours/numeration', { waitUntil: 'networkidle0' });
await p.evaluate(() => document.querySelectorAll('.toast').forEach((x) => x.remove()));
await W(300);
/** Rectangle (page) de la partie n : du h2 n au h2 n+1 (ou à la fin du cours). */
const clipOf = (n: number) => p.evaluate((n) => {
  const hs = [...document.querySelectorAll('.prose h2')] as HTMLElement[];
  const h = hs[n - 1]; const sec = h.closest('section.ecran') as HTMLElement | null;
  const top = (sec ?? h).getBoundingClientRect().top + scrollY - 8;
  const endEl = sec ? null : hs[n] ?? document.getElementById('exos');
  const bottom = sec ? sec.getBoundingClientRect().bottom + scrollY + 8 : endEl!.getBoundingClientRect().top + scrollY - 4;
  return { x: 0, y: top, width: innerWidth, height: bottom - top, count: hs.length };
}, n);
const suffix = theme === 'dark' ? '-sombre' : '';
if (mode === 'parties') {
  const { count } = await clipOf(1);
  for (let n = 1; n <= count; n++) {
    const c = await clipOf(n);
    await p.screenshot({ path: `${OUT}partie-${n}-390${suffix}.png`, clip: { x: c.x, y: c.y, width: c.width, height: c.height }, captureBeyondViewport: true });
    console.log('partie', n, Math.round(c.height), 'px');
  }
  // écran d'arrivée (haut de page) + page entière
  await p.screenshot({ path: `${OUT}ecran-haut-390x844${suffix}.png` });
  await p.screenshot({ path: `${OUT}page-entiere-390${suffix}.png`, fullPage: true });
} else {
  const c = await clipOf(Number(nArg));
  await p.screenshot({ path: `${OUT}${mode}-partie-${nArg}-390${suffix}.png`, clip: { x: c.x, y: c.y, width: c.width, height: c.height }, captureBeyondViewport: true });
  console.log(mode, nArg, Math.round(c.height), 'px');
  const full = await p.evaluate(() => document.documentElement.scrollHeight);
  console.log('hauteur page', full);
}
await b.close();
