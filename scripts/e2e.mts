#!/usr/bin/env -S npx tsx
/** Gestes de bout en bout (Chrome headless) : glisser au doigt (CDP touch) et à la souris, toucher-toucher, clavier. Prérequis : build + preview. */
import puppeteer, { type Page } from 'puppeteer-core';
import { echanger } from '../src/exos/echanger';
import { tableau } from '../src/exos/tableau';

const BASE = process.argv[2] || 'http://localhost:4174/compendium-primaire/';
const W = (ms: number) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const t = (c: unknown, m: string, x: unknown = '') => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m, JSON.stringify(x)); } };
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p: Page = await (await b.createBrowserContext()).newPage();
const errors: string[] = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const cdp = await p.createCDPSession();
const center = (sel: string, i = 0) => p.evaluate((s, i) => { const el = document.querySelectorAll(s)[i] as HTMLElement; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel, i);
async function touchDrag(a: { x: number; y: number }, z: { x: number; y: number }) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
  for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + ((z.x - a.x) * k) / 8, y: a.y + ((z.y - a.y) * k) / 8 }] }); await W(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await W(120);
}
async function mouseDrag(a: { x: number; y: number }, z: { x: number; y: number }) {
  await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(z.x, z.y, { steps: 8 }); await p.mouse.up(); await W(120);
}
const counts = () => p.$$eval('.mat-col', (cs) => cs.map((c) => Number(c.querySelector('.mat-n')!.textContent)).reverse());
async function open(h: string) { await p.goto(BASE + h, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.querySelectorAll('.toast').forEach((x) => x.remove())); await W(150); }
async function typeNumber(n: number) { for (const ch of String(n)) await p.click(`.kp-k[data-k="${ch}"]`); }

console.log('Échanger (CE1, palier 1, graine 7)');
const e = echanger.generate('CE1', 1, 7);
await open('#/exo/echanger/CE1/1/7');
t((await counts()).join() === e.counts.join(), 'collection affichée', await counts());
// doigt : glisser un cube sur la colonne des dizaines
await touchDrag(await center('.mat-u .pc'), await center('.mat-d'));
let c = await counts();
t(c[0] === e.counts[0] - 10 && c[1] === e.counts[1] + 1, 'doigt : 10 unités → 1 dizaine', c);
const scroll0 = await p.evaluate(() => scrollY);
// souris : casser une dizaine (glisser une barre vers les unités)
await mouseDrag(await center('.mat-d .pc'), await center('.mat-u'));
c = await counts();
t(c[0] === e.counts[0] && c[1] === e.counts[1], 'souris : 1 dizaine → 10 unités', c);
t(Math.abs((await p.evaluate(() => scrollY)) - scroll0) < 2, 'la page ne défile pas pendant le glisser');
// clavier : bouton Grouper
await p.focus('.mat-u [data-g]'); await p.keyboard.press('Enter'); await W(80);
c = await counts();
t(c[0] === e.counts[0] - 10, 'clavier : bouton « Grouper 10 »', c);
// glisser trop court sur moins de 10 : message
const before = await counts();
if (before[0] < 10) { await touchDrag(await center('.mat-u .pc'), await center('.mat-d')); t((await p.$eval('.w-mat', (x) => x.textContent || '')).includes('Il faut 10'), 'moins de 10 : message « Il faut 10 »'); }
// réponse fausse ciblée puis juste
const concat = Number([...e.counts].reverse().join(''));
if (String(concat).length <= 5) { await typeNumber(concat); await p.click('#check'); await W(80); t((await p.$eval('.fb', (x) => x.textContent || '')).includes('à la suite'), 'message ciblé (nombres à la suite)'); for (let i = 0; i < 5; i++) await p.click('.kp-del'); }
await typeNumber(e.n); await p.click('#check'); await W(80);
t((await p.$eval('.fb', (x) => x.textContent || '')).includes('Bravo'), 'bonne réponse acceptée');
t((await p.$$eval('.dots i.on', (x) => x.length)) === 0, '2e essai : la série ne monte pas (pas de gain facile)');

console.log('Tableau (CE2, palier 2, graine 11)');
const d = tableau.generate('CE2', 2, 11);
await open('#/exo/tableau/CE2/2/11');
const used = new Set<number>();
const tokFor = (digit: number) => { const i = d.pool.findIndex((x, j) => x === digit && !used.has(j)); used.add(i); return i; };
// milliers et centaines au doigt, dizaines à la souris, unités par toucher-toucher
const plan = [3, 2, 1, 0].map((k) => ({ k, i: tokFor(d.digits[k]) }));
for (const { k, i } of plan) {
  const tok = `.nt-pool .tok[data-tok="${i}"]`, cell = `.nt-cell[data-col="${k}"]`;
  if (k >= 2) await touchDrag(await center(tok), await center(cell));
  else if (k === 1) await mouseDrag(await center(tok), await center(cell));
  else { await p.click(tok); await W(50); await p.click(cell); await W(80); }
}
const shown = await p.$$eval('.nt-cell', (cs) => cs.map((c) => c.textContent?.trim()).reverse());
t(shown.join('') === d.digits.join(''), 'doigt, souris et toucher-toucher : chiffres placés', shown);
// toucher une case remplie la vide
await p.click('.nt-cell[data-col="0"] .tok-in'); await W(80);
t((await p.$eval('.nt-cell[data-col="0"]', (x) => x.textContent?.trim())) === '', 'toucher une case la vide');
await p.click('#check'); await W(50);
t((await p.$eval('.fb', (x) => x.textContent || '')).includes('Termine'), 'réponse incomplète refusée sans pénalité');
// clavier : sélection au clavier puis case
await p.focus(`.nt-pool .tok[data-tok="${plan[3].i}"]`); await p.keyboard.press('Enter'); await W(50);
await p.focus('.nt-cell[data-col="0"]'); await p.keyboard.press('Enter'); await W(80);
await p.click('#check'); await W(80);
t((await p.$eval('.fb', (x) => x.textContent || '')).includes('Bravo'), 'clavier + vérification : juste au 1er essai');
t((await p.$$eval('.dots i.on', (x) => x.length)) === 1 || (await p.$eval('.exo-head', (x) => x.textContent || '')).includes('★'), 'série à 1 après une réussite au 1er essai');
// cibles ≥ 44 px
const small = await p.$$eval('button, a', (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).map((e) => e.className));
t(small.length === 0, 'cibles tactiles ≥ 44 px', small);
t(errors.length === 0, 'aucune erreur JS', errors);
await b.close();
console.log(`${pass} réussis, ${fail} échecs`);
process.exit(fail ? 1 : 0);
