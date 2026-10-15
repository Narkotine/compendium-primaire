#!/usr/bin/env -S npx tsx
/** Gestes de bout en bout (Chrome headless) : glisser au doigt (CDP touch) et à la souris, toucher-toucher, clavier. Prérequis : build + preview. */
import puppeteer, { type Page } from 'puppeteer-core';
import { echanger } from '../src/exos/echanger';
import { tableau } from '../src/exos/tableau';
import { ranger } from '../src/exos/ranger';
import { droite } from '../src/exos/droite';
import { dizaines } from '../src/exos/dizaines';
import { grands } from '../src/exos/grands';
import { suites, term } from '../src/exos/suites';

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

console.log('Échanger palier 1 : échanges d’abord');
{
  const e1 = echanger.generate('CE1', 1, 21);
  await open('#/exo/echanger/CE1/1/21');
  await typeNumber(e1.n); await p.click('#check'); await W(60);
  t((await p.$eval('.fb', (x) => x.textContent || '')).includes('échanges'), 'palier 1 : rappel de faire les échanges, sans pénalité');
  await p.click('.mat-u [data-g]'); await W(60);
  await p.click('#check'); await W(60);
  t((await p.$eval('.fb', (x) => x.textContent || '')).includes('Bravo'), 'après l’échange : juste au 1er essai');
  t((await p.$$eval('.dots i.on', (x) => x.length)) === 1, 'la série monte (le rappel n’a pas compté comme erreur)');
}
console.log('Ranger (CE1, palier 2, graine 3)');
{
  const r = ranger.generate('CE1', 2, 3);
  const sol = ranger.solution(r);
  await open('#/exo/ranger/CE1/2/3');
  const cur = () => p.$$eval('.ord-it', (xs) => xs.map((x) => Number((x as HTMLElement).dataset.item)));
  for (let k = 0; k < sol.length; k++) {
    const o = await cur();
    const from = o.indexOf(sol[k]);
    if (from === k) continue;
    if (k % 3 === 0) await touchDrag(await center('.ord-card', from), await center('.ord-it', k));
    else if (k % 3 === 1) await mouseDrag(await center('.ord-card', from), await center('.ord-it', k));
    else for (let j = from; j > k; j--) { await p.click(`[data-up="${j}"]`); await W(40); }
  }
  t((await cur()).join() === sol.join(), 'doigt, souris et flèches : cartes rangées', await cur());
  await p.click('#check'); await W(60);
  t((await p.$eval('.fb', (x) => x.textContent || '')).includes('Bravo'), 'rangement accepté');
}
console.log('Demi-droite (CE1, palier 2) : placer');
{
  let s = 1, g = droite.generate('CE1', 2, s);
  while (g.k < 3 || g.k > 8) g = droite.generate('CE1', 2, ++s);
  await open(`#/exo/droite/CE1/2/${s}`);
  const tickX = (k: number) => p.evaluate((k) => { const sv = document.querySelector('.nl-svg')!; sv.scrollIntoView({ block: 'center' }); const r = sv.getBoundingClientRect(); return { x: r.left + ((20 + k * 30) * r.width) / 340, y: r.top + (50 * r.height) / 110 }; }, k);
  const pos = () => p.$eval('.nl-svg', (x) => Number(x.getAttribute('aria-valuenow')));
  // doigt : toucher près de la graduation k-1 (un peu à côté : aimantation)
  const a = await tickX(g.k - 1);
  await touchDrag({ x: a.x + 6, y: a.y }, { x: a.x + 8, y: a.y });
  t((await pos()) === g.k - 1, 'doigt : toucher la droite place la flèche (aimantée)', await pos());
  // souris : glisser jusqu'à k+1
  await mouseDrag(await tickX(g.k - 1), await tickX(g.k + 1));
  t((await pos()) === g.k + 1, 'souris : glisser la flèche', await pos());
  // vérification fausse (décalage d'un) puis clavier ←
  await p.click('#check'); await W(60);
  t((await p.$eval('.fb', (x) => x.textContent || '')).includes('espaces'), 'message ciblé : compter les espaces');
  await p.$eval('.nl-svg', (x) => (x as unknown as HTMLElement).focus()); await p.keyboard.press('ArrowLeft'); await W(40);
  t((await pos()) === g.k, 'clavier : flèche gauche', await pos());
  await p.click('#check'); await W(60);
  t((await p.$eval('.fb', (x) => x.textContent || '')).includes('Bravo'), 'placement juste accepté au 2e essai');
  t((await p.$eval('#next', (x) => x.textContent || '')).includes('jumeau'), '2e essai : on propose un exercice jumeau');
}
console.log('Demi-droite palier 3 (lire) et dizaines');
{
  const g = droite.generate('CE2', 3, 5);
  await open('#/exo/droite/CE2/3/5');
  await typeNumber(droite.solution(g)); await p.click('#check'); await W(60);
  t((await p.$eval('.fb', (x) => x.textContent || '')).includes('Bravo'), 'lire un point : réponse au pavé');
  const z = dizaines.generate('CE1', 2, 9);
  await open('#/exo/dizaines/CE1/2/9');
  await typeNumber(Math.floor(z.n / 10) % 10); await p.click('#check'); await W(60);
  t((await p.$eval('.fb', (x) => x.textContent || '')).includes('colonnes de gauche'), 'dizaines : message ciblé (chiffre au lieu du nombre)');
}
console.log('Grands nombres (CM2) et suites (CE1)');
{
  const g = grands.generate('CM2', 3, 2);
  await open('#/exo/grands/CM2/3/2');
  await typeNumber(Number(String(g.n).replace(/0/g, ''))); await p.click('#check'); await W(60);
  t((await p.$eval('.fb', (x) => x.textContent || '')).includes('zéros'), 'grands : message ciblé sur les zéros');
  for (let i = 0; i < 10; i++) await p.click('.kp-del');
  await typeNumber(g.n); await p.click('#check'); await W(60);
  t((await p.$eval('.fb', (x) => x.textContent || '')).includes('Bravo'), 'grands : 9 chiffres au pavé');
  t((await p.$eval('.kp-v', (x) => x.textContent || '')).split('\u202f').length >= 3, 'pavé : chiffres groupés par classes');
  const d = suites.generate('CE1', 3, 4);
  await open('#/exo/suites/CE1/3/4');
  await typeNumber(term(d, d.hole)); await p.click('#check'); await W(60);
  t((await p.$eval('.fb', (x) => x.textContent || '')).includes('Bravo'), 'suites : bonne réponse');
}
console.log('Réglages : chronomètre désactivé par défaut');
{
  await open('#/exo/dizaines/CE1/1/1');
  t(!(await p.$('.chrono')), 'pas de chrono par défaut');
  await open('#/reglages'); await p.click('#chrono'); await W(50);
  await open('#/exo/dizaines/CE1/1/1');
  t(!!(await p.$('.chrono')), 'chrono affiché après activation');
  await open('#/reglages'); await p.click('#chrono'); await W(50);
}
// cibles ≥ 44 px
for (const h of ['', '#/reglages', '#/exo/echanger/CE2/2/1', '#/exo/tableau/CE2/3/1', '#/exo/ranger/CE2/3/1', '#/exo/droite/CE1/2/1', '#/exo/droite/CE2/3/1', '#/exo/dizaines/CE2/3/1', '#/exo/droite/CM2/1/3', '#/exo/grands/CM2/3/1', '#/exo/suites/CE2/3/1', '#/exo/ranger/CM2/3/2', '#/cours/numeration']) {
  for (const w of [360, 390]) {
    await p.setViewport({ width: w, height: 740, isMobile: true, hasTouch: true });
    await open(h);
    const small = await p.$$eval('button, a, input', (els) => els.filter((e) => { const r = (e.closest('label') ?? e).getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).map((e) => e.className || e.tagName));
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    t(small.length === 0 && !overflow, `cibles ≥ 44 px, pas de débordement : ${h || 'accueil'} à ${w} px`, { small, overflow });
  }
}
t(errors.length === 0, 'aucune erreur JS', errors);
await b.close();
console.log(`${pass} réussis, ${fail} échecs`);
process.exit(fail ? 1 : 0);
