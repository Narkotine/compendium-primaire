#!/usr/bin/env -S npx tsx
/** Captures téléphone du pilote → captures/pilote/. Prérequis : build + preview. */
import puppeteer from 'puppeteer-core';
import { tableau } from '../src/exos/tableau';
const BASE = 'http://localhost:4174/compendium-primaire/';
const OUT = 'captures/pilote/';
const W = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
async function shot(name: string, w: number, h: number, theme: 'light' | 'dark', hash: string, act?: (p: import('puppeteer-core').Page) => Promise<void>) {
  const p = await (await b.createBrowserContext()).newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument((t) => localStorage.setItem('compendium-primaire.settings', JSON.stringify({ theme: t })), theme);
  await p.goto(BASE + hash, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('.toast').forEach((x) => x.remove()));
  if (act) await act(p);
  await W(300);
  await p.evaluate(() => document.querySelectorAll('.toast').forEach((x) => x.remove()));
  await p.screenshot({ path: `${OUT}${name}.png` });
  console.log(name);
}
await shot('01-accueil-390x844-clair', 390, 844, 'light', '');
await shot('02-cours-360x640-sombre', 360, 640, 'dark', '#/cours/numeration', async (p) => { await p.evaluate(() => document.querySelectorAll('.prose h2')[1].scrollIntoView()); });
await shot('03-echanger-390x844-sombre', 390, 844, 'dark', '#/exo/echanger/CE1/3/5', async (p) => { await p.click('.mat-u [data-g]'); await W(100); await p.evaluate(() => scrollTo(0, 120)); });
const d = tableau.generate('CE1', 2, 4);
await shot('04-tableau-erreur-360x640-clair', 360, 640, 'light', '#/exo/tableau/CE1/2/4', async (p) => {
  const typed = d.order.map((k) => d.digits[k]); // recopié dans l'ordre de l'énoncé
  const used = new Set<number>();
  for (let j = 0; j < 3; j++) { const i = d.pool.findIndex((x, q) => x === typed[j] && !used.has(q)); used.add(i); await p.click(`.nt-pool .tok[data-tok="${i}"]`); await p.click(`.nt-cell[data-col="${2 - j}"]`); }
  await p.click('#check'); await W(100); await p.evaluate(() => document.querySelector('.fb')!.scrollIntoView({ block: 'end' }));
});
await shot('05-ranger-360x640-sombre', 360, 640, 'dark', '#/exo/ranger/CE2/3/8');
await shot('06-droite-390x844-clair', 390, 844, 'light', '#/exo/droite/CE1/2/4', async (p) => {
  const r = await p.$eval('.nl-svg', (x) => { const b = x.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  await p.mouse.click(r.x + ((20 + 5 * 30) * r.w) / 340, r.y + r.h / 2);
});
await shot('07-dizaines-erreur-390x844-sombre', 390, 844, 'dark', '#/exo/dizaines/CE2/2/3', async (p) => {
  const { dizaines } = await import('../src/exos/dizaines');
  const z = dizaines.generate('CE2', 2, 3);
  for (const ch of String(Math.floor(z.n / 10 ** z.unit) % 10)) await p.click(`.kp-k[data-k="${ch}"]`);
  await p.click('#check'); await p.click('#check');
});
await b.close();
