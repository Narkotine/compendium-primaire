#!/usr/bin/env -S npx tsx
/** Gestes de bout en bout (Chrome headless) : glisser au doigt (CDP touch) et à la souris, toucher-toucher, clavier. Prérequis : build + preview. */
import puppeteer, { type Page } from 'puppeteer-core';
import { echanger } from '../src/exos/echanger';
import { tableau } from '../src/exos/tableau';
import { ranger } from '../src/exos/ranger';
import { droite, lire } from '../src/exos/droite';
import { dizaines } from '../src/exos/dizaines';
import { grands } from '../src/exos/grands';
import { suites, term } from '../src/exos/suites';
import { addpose, subpose } from '../src/exos/pose';
import { probadd } from '../src/exos/probadd';
import { evalExpr } from '../src/ui/expr';
import { mulpose, partials } from '../src/exos/mulpose';
import { multiples } from '../src/exos/multiples';
import { rectangle } from '../src/exos/rectangle';
import { partage } from '../src/exos/partage';
import { colorier, lirefrac, partsegales } from '../src/exos/frac/figures';
import { fracdroite, fraccomp } from '../src/exos/frac/nombres';
import { fracsomme } from '../src/exos/frac/calculs';
import { linmul, propoupas } from '../src/exos/prop';
import { divpose, steps } from '../src/exos/divpose';
import { deccomp } from '../src/exos/dec/comparer';
import { decpose, decfois } from '../src/exos/dec/calculs';
import { decdiv } from '../src/exos/dec/divdec';
import { fracvirgule } from '../src/exos/dec/ecriture';
import { fmtDec } from '../src/engine/dec';
import { uniteok, convertir } from '../src/exos/mes/base';
import { perimetre, aire } from '../src/exos/mes/suite';
import { figures, solides } from '../src/exos/geo/base';

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
async function open(h: string) { if (p.url() === BASE + h) await p.goto('about:blank'); await p.goto(BASE + h, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.querySelectorAll('.toast').forEach((x) => x.remove())); await W(150); }
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
  const g = lire.generate('CE2', 3, 5);
  await open('#/exo/lire/CE2/3/5');
  await typeNumber(lire.solution(g)); await p.click('#check'); await W(60);
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
console.log('Chapitre 2 : opérations posées et problèmes');
{
  const fb = () => p.$eval('.fb', (x) => x.textContent || '');
  const typeRes = async (n: number) => { for (const ch of [...String(n)].reverse()) await p.click(`.co-kp [data-key="${ch}"]`); };
  const a = addpose.generate('CE2', 2, 5); const sum = a.rows.reduce((x: number, y: number) => x + y, 0);
  await open('#/exo/addpose/CE2/2/5');
  await p.click('.co-small[data-k="1"]'); await p.click('.co-kp [data-key="1"]');
  await p.click('.co-big[data-k="0"]'); await typeRes(sum - (sum % 10) + ((sum % 10) + 1) % 10); await p.click('#check'); await W(60);
  t((await p.$$('.co-big.bad')).length === 1, 'addpose : seule la case fausse est en rouge', await p.$$eval('.co-big.bad', (x) => x.length));
  await p.click('.co-big[data-k="0"]'); await typeRes(sum); await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'addpose : résultat saisi de droite à gauche, retenue facultative non notée');
  for (const m of ['cassage', 'compensation']) {
    const s2 = subpose.generate('CE2', 3, 8); const diff = s2.rows[0] - s2.rows[1];
    await open('#/exo/subpose/CE2/3/8');
    await p.click(`[data-m="${m}"]`); await W(30);
    t(((await p.$$('[data-row="aux2"]')).length > 0) === (m === 'compensation'), `subpose : méthode ${m} affichée`);
    await p.click('.co-big[data-k="0"]'); await typeRes(diff); await p.click('#check'); await W(60);
    t((await fb()).includes('Bravo'), `subpose : méthode ${m} acceptée`);
  }
  const lv = 'CE2', P = 3; let seed = 1, d = probadd.generate(lv, P, seed);
  while (!d.inst.useless.length || d.inst.slots !== 2) d = probadd.generate(lv, P, ++seed);
  await open(`#/exo/probadd/${lv}/${P}/${seed}`);
  await p.click('#check'); await W(60);
  t((await fb()).includes('Écris d’abord'), 'probadd : vérification bloquée sans pénalité tant que le calcul est vide');
  t((await p.$$eval('.dot.ko, .ko-dot', (x) => x.length)) === 0, 'probadd : aucun point perdu');
  const tok = async (label: string) => p.evaluate((l) => [...document.querySelectorAll<HTMLElement>('.ex-pool .tok')].findIndex((x) => x.textContent === l && !x.hidden), label);
  const fmtN = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  // calcul avec la donnée inutile, posé au doigt
  const iu = await tok(fmtN(d.inst.useless[0]));
  await touchDrag(await center('.ex-pool .tok', iu), await center('.ex-slot', 0)); await W(80);
  t((await p.$eval('.ex-slot[data-s="0"]', (x) => x.textContent)) === fmtN(d.inst.useless[0]), 'probadd : glisser au doigt une étiquette dans une case');
  const sol = probadd.solution(d);
  // remplacer par la souris puis au toucher-toucher
  await mouseDrag(await center('.ex-pool .tok', await tok(fmtN(sol.nums[1]))), await center('.ex-slot', 2)); await W(80);
  await p.click(`.ex-pool .tok:nth-child(${(await tok(sol.ops[0])) + 1})`); await p.click('.ex-slot[data-s="1"]'); await W(50);
  await typeNumber(1); await p.click('#check'); await W(60);
  t((await fb()).includes('ne sert pas'), 'probadd : message ciblé sur la donnée inutile', await fb());
  await open(`#/exo/probadd/${lv}/${P}/${seed}`);
  for (const [s, v] of [[0, fmtN(sol.nums[0])], [1, sol.ops[0]], [2, fmtN(sol.nums[1])]] as [number, string][]) { await p.click(`.ex-pool .tok:nth-child(${(await tok(v)) + 1})`); await p.click(`.ex-slot[data-s="${s}"]`); await W(40); }
  await typeNumber(evalExpr(sol.nums, sol.ops)); await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'probadd : bon calcul et bon résultat', await fb());
}
console.log('Chapitre 3 : multiplication');
{
  const fb = () => p.$eval('.fb', (x) => x.textContent || '');
  const d = mulpose.generate('CM1', 3, 4); const ps = partials(d); const sol = mulpose.solution(d);
  await open('#/exo/mulpose/CM1/3/4');
  await p.click('#check'); await W(60);
  t((await fb()).includes('Remplis'), 'mulpose : vérification bloquée tant que des lignes sont vides');
  const typeLine = async (i: number, n: number) => { await p.click(`.ln-f[data-i="${i}"]`); for (const ch of String(n)) await p.click(`.co-kp [data-key="${ch}"]`); };
  const sh = ps.findIndex((x) => x.k > 0);
  for (let i = 0; i < sol.length; i++) await typeLine(i, i === sh ? d.a * ps[sh].c : sol[i]);
  await p.click('#check'); await W(60);
  t((await fb()).includes('décale') && (await p.$$('.ln-f.bad')).length >= 1, 'mulpose : décalage oublié → message ciblé et ligne en rouge', await fb());
  await p.click(`.ln-f[data-i="${sh}"]`); for (let k = 0; k < 8; k++) await p.click('.co-kp [data-key="del"]');
  for (const ch of String(sol[sh])) await p.click(`.co-kp [data-key="${ch}"]`);
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'mulpose : correction acceptée au 2e essai', await fb());
  const m = multiples.generate('CE2', 2, 6);
  await open('#/exo/multiples/CE2/2/6');
  for (const i of multiples.solution(m)) await p.click(`.pk-c[data-i="${i}"]`);
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'multiples : cartes choisies au toucher');
  const r = rectangle.generate('CE1', 2, 3);
  await open('#/exo/rectangle/CE1/2/3');
  t(await p.$$eval('.gr rect', (x) => x.length) === r.r * r.c, 'rectangle : le quadrillage a r × c carreaux');
  const tok = (l: string) => p.evaluate((l) => [...document.querySelectorAll<HTMLElement>('.ex-pool .tok')].findIndex((x) => x.textContent === l && !x.hidden), l);
  for (const [sl, v] of [[0, String(r.r)], [1, '+'], [2, String(r.c)]] as [number, string][]) { await p.click(`.ex-pool .tok:nth-child(${(await tok(v)) + 1})`); await p.click(`.ex-slot[data-s="${sl}"]`); await W(40); }
  await typeNumber(r.r + r.c); await p.click('#check'); await W(60);
  t((await fb()).includes('Tu as ajouté'), 'rectangle : addition au lieu de multiplication → message ciblé', await fb());
}
console.log('Chapitre 4 : division');
{
  const fb = () => p.$eval('.fb', (x) => x.textContent || '');
  const d = partage.generate('CE1', 1, 2);
  await open('#/exo/partage/CE1/1/2');
  await p.click('.sh-p [data-i="0"][data-d="1"]'); await p.click('.sh-p [data-i="0"][data-d="1"]');
  await p.click('#check'); await W(60);
  t((await fb()).includes('pas égales') && (await p.$$('.sh-p.bad')).length >= 1, 'partage : parts inégales → message et parts en rouge', await fb());
  await p.click('.sh-p [data-i="0"][data-d="-1"]'); await p.click('.sh-p [data-i="0"][data-d="-1"]');
  for (let i = 0; i < d.n / d.k; i++) await p.click('.sh-all');
  t(await p.$eval('.sh-n', (x) => x.textContent) === '0', 'partage : « Un à chacun » distribue tout');
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'partage : partage équitable accepté au 2e essai');
  const v = divpose.generate('CM1', 3, 1); const st = steps(v); const sol = divpose.solution(v);
  await open('#/exo/divpose/CM1/3/1');
  const z = st.findIndex((x, i) => i > 0 && x.q === 0);
  for (let i = 0; i < sol.length; i++) { await p.click(`.ln-f[data-i="${i}"]`); for (const ch of String(i === 2 * z ? 1 : sol[i])) await p.click(`.co-kp [data-key="${ch}"]`); }
  await p.click('#check'); await W(60);
  t((await fb()).includes('mets 0'), 'divpose : 0 oublié au quotient → message ciblé', await fb());
  await p.click(`.ln-f[data-i="${2 * z}"]`); await p.click('.co-kp [data-key="del"]'); await p.click('.co-kp [data-key="0"]');
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'divpose : étapes justes acceptées');
}
console.log('Chapitre 5 : fractions');
{
  const fb = () => p.$eval('.fb', (x) => x.textContent || '');
  const typeFrac = async (n: number, d: number) => { await p.click('.fi-b[data-k="n"]'); for (const ch of String(n)) await p.click(`.co-kp [data-key="${ch}"]`); await p.click('.fi-b[data-k="d"]'); for (const ch of String(d)) await p.click(`.co-kp [data-key="${ch}"]`); };
  const c = colorier.generate('CE2', 2, 3);
  await open('#/exo/colorier/CE2/2/3');
  for (let i = 0; i < c.b - c.a; i++) await p.click(`.cpart[data-k="${i}"]`);
  await p.click('#check'); await W(60);
  t(c.b - c.a === c.a || (await fb()).includes('numérateur'), 'colorier : complément colorié → message ciblé', await fb());
  for (let i = 0; i < c.b - c.a; i++) await p.click(`.cpart[data-k="${i}"]`);
  for (let i = 0; i < c.a; i++) await p.click(`.cpart[data-k="${i}"]`);
  t((await p.$$('.cpart.on')).length === c.a, 'colorier : toucher colorie et efface');
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'colorier : bon coloriage accepté');
  const l = lirefrac.generate('CE1', 2, 5);
  await open('#/exo/lirefrac/CE1/2/5');
  await typeFrac(l.b, l.a); await p.click('#check'); await W(60);
  t((await fb()).includes('inversé') && (await p.$$('.fi-b.bad')).length === 2, 'lirefrac : inversion → message, cases en rouge', await fb());
  const fd = fracdroite.generate('CM1', 3, 2);
  await open('#/exo/fracdroite/CM1/3/2');
  for (let i = 0; i <= fd.k; i++) await p.click('.nl-btns [data-d="1"]'); // le 1er appui pose la flèche sur 0
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'fracdroite : placer avec les flèches (fraction > 1)', await fb());
  const fc = fraccomp.generate('CE1', 2, 4);
  await open('#/exo/fraccomp/CE1/2/4');
  await p.click(`.cmp [data-s="${fraccomp.solution(fc)}"]`); await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'fraccomp : signe choisi');
  let s = 1; let fs = fracsomme.generate('CE1', 1, s); while (fs.x.d !== fs.y.d || fs.kind !== 'add') fs = fracsomme.generate('CE1', 1, ++s);
  await open(`#/exo/fracsomme/CE1/1/${s}`);
  await typeFrac(fs.x.n + fs.y.n, 2 * fs.x.d); await p.click('#check'); await W(60);
  t((await fb()).includes('dénominateurs'), 'fracsomme : dénominateurs additionnés → message', await fb());
  const pe = partsegales.generate('CE2', 2, 1);
  await open('#/exo/partsegales/CE2/2/1');
  for (const i of partsegales.solution(pe)) await p.click(`.pk-c[data-i="${i}"]`);
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'partsegales : figures choisies');
}
console.log('Chapitre 7 : proportionnalité');
{
  const fb = () => p.$eval('.fb', (x) => x.textContent || '');
  const d = linmul.generate('CM1', 1, 3); const x2 = d.x * d.k;
  await open('#/exo/linmul/CM1/1/3');
  const typeH = async (i: number, n: number) => { await p.click(`.st-h[data-i="${i}"]`); for (let k = 0; k < 6; k++) await p.click('.co-kp [data-key="del"]'); for (const ch of String(n)) await p.click(`.co-kp [data-key="${ch}"]`); };
  await typeH(0, d.k); await typeH(1, d.y + x2 - d.x); await p.click('#check'); await W(60);
  t((await fb()).includes('ajouté') && (await p.$$('.st-h.bad')).length === 1, 'linmul : modèle additif → message ciblé, case en rouge', await fb());
  await typeH(1, d.y * d.k); await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'linmul : raisonnement juste accepté');
  const q = propoupas.generate('CM2', 2, 2);
  await open('#/exo/propoupas/CM2/2/2');
  for (const i of propoupas.solution(q)) await p.click(`.pk-c[data-i="${i}"]`);
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'propoupas : situations choisies');
}
console.log('Chapitre 6 : décimaux');
{
  const fb = () => p.$eval('.fb', (x) => x.textContent || '');
  // deccomp : piège 2,15 vs 2,9 style
  let s = 1; let d = deccomp.generate('CM1', 2, s);
  while (!(d.a.s !== d.b.s && Math.trunc(d.a.n / 10 ** d.a.s) === Math.trunc(d.b.n / 10 ** d.b.s)) && s < 80) d = deccomp.generate('CM1', 2, ++s);
  await open(`#/exo/deccomp/CM1/2/${s}`);
  const fa = Math.abs(d.a.n) % 10 ** d.a.s, fb2 = Math.abs(d.b.n) % 10 ** d.b.s;
  const wrong = (fa > fb2 ? '>' : fa < fb2 ? '<' : '=');
  const good = deccomp.solution(d);
  if (wrong !== good) {
    await p.click(`.cmp [data-s="${wrong}"]`); await p.click('#check'); await W(60);
    t(/dixièmes|taille de part/.test(await fb()), 'deccomp : piège « 37 > 5 » → message ciblé', await fb());
  }
  await p.click(`.cmp [data-s="${good}"]`); await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'deccomp : comparaison juste acceptée');
  // decpose : alignement
  s = 1; let dp = decpose.generate('CM1', 2, s);
  while (dp.a.s === dp.b.s && s < 60) dp = decpose.generate('CM1', 2, ++s);
  await open(`#/exo/decpose/CM1/2/${s}`);
  const as = fmtDec(dp.a).replace(',', '').replace(/\u202f/g, '');
  const bs = fmtDec(dp.b).replace(',', '').replace(/\u202f/g, '');
  const trap = String(dp.op === '+' ? Number(as) + Number(bs) : Math.abs(Number(as) - Number(bs)));
  for (const ch of trap) await p.click(`.kp-k[data-k="${ch}"]`);
  await p.click('#check'); await W(60);
  t(/aligne|virgule/i.test(await fb()) || trap === decpose.solution(dp).replace(',', ''), 'decpose : alignement à droite → message', await fb());
  // clear and type good answer
  for (let i = 0; i < 12; i++) await p.click('.kp-k[data-k="del"]');
  for (const ch of decpose.solution(dp)) await p.click(`.kp-k[data-k="${ch === ',' ? ',' : ch}"]`);
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'decpose : résultat juste accepté', await fb());
  // fracvirgule
  const fv = fracvirgule.generate('CM1', 1, 4);
  await open('#/exo/fracvirgule/CM1/1/4');
  if (fv.kind === 'frac→virgule' || fv.kind === 'somme→virgule') {
    for (const ch of fmtDec(fv.d)) await p.click(`.kp-k[data-k="${ch === ',' ? ',' : ch}"]`);
    await p.click('#check'); await W(60);
    t((await fb()).includes('Bravo'), 'fracvirgule : écriture à virgule acceptée', await fb());
  } else {
    t(true, 'fracvirgule : autre forme (sautée en e2e)');
  }
  // decfois piège zéro (CM2)
  s = 1; let df = decfois.generate('CM2', 1, s);
  while (!(df.op === '×' && df.d.s > 0) && s < 40) df = decfois.generate('CM2', 1, ++s);
  await open(`#/exo/decfois/CM2/1/${s}`);
  const fake = fmtDec(df.d).includes(',') ? fmtDec(df.d) + '0' : fmtDec(df.d) + ',0';
  for (const ch of fake) await p.click(`.kp-k[data-k="${ch === ',' ? ',' : ch}"]`);
  await p.click('#check'); await W(60);
  t(/zéro|glissent|rang/i.test(await fb()), 'decfois : « ajouter un zéro » → message', await fb());
  const dd = decdiv.generate('CM2', 1, 4);
  await open('#/exo/decdiv/CM2/1/4');
  const sol = decdiv.solution(dd).replace(/\u202f/g, '');
  const ip = sol.split(',')[0];
  for (const ch of ip) await p.click(`.kp-k[data-k="${ch}"]`);
  await p.click('#check'); await W(60);
  t(/virgule|reste|continue/i.test(await fb()), 'decdiv : arrêt à l’entier → message', await fb());
  for (let i = 0; i < 10; i++) await p.click('.kp-k[data-k="del"]');
  for (const ch of sol) {
    if (ch === ' ') continue;
    await p.click(`.kp-k[data-k="${ch}"]`);
  }
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'decdiv : quotient décimal accepté');
}
console.log('Chapitre 8 : mesures');
{
  const fb = () => p.$eval('.fb', (x) => x.textContent || '');
  const u = uniteok.generate('CE1', 1, 2);
  await open('#/exo/uniteok/CE1/1/2');
  await p.click(`.pk-c[data-i="${u.good}"]`); await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'uniteok : unité plausible choisie');
  const pe = perimetre.generate('CE2', 1, 3);
  await open('#/exo/perimetre/CE2/1/3');
  // aire trap if rect
  if (pe.shape === 'rect') {
    for (const ch of String(pe.sides[0] * pe.sides[1])) await p.click(`.kp-k[data-k="${ch}"]`);
    await p.click('#check'); await W(60);
    t(/aire/.test(await fb()), 'perimetre : aire au lieu du tour → message', await fb());
    for (let i = 0; i < 8; i++) await p.click('.kp-k[data-k="del"]');
  }
  for (const ch of String(perimetre.solution(pe))) await p.click(`.kp-k[data-k="${ch}"]`);
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'perimetre : tour accepté');
  const a = aire.generate('CM1', 1, 2);
  await open('#/exo/aire/CM1/1/2');
  for (const ch of String(2 * (a.L + a.l))) await p.click(`.kp-k[data-k="${ch}"]`);
  await p.click('#check'); await W(60);
  t(/périmètre/.test(await fb()), 'aire : périmètre au lieu de l’aire → message', await fb());
}
console.log('Chapitre 9 : géométrie');
{
  const fb = () => p.$eval('.fb', (x) => x.textContent || '');
  const f = figures.generate('CE1', 2, 5);
  await open('#/exo/figures/CE1/2/5');
  for (const i of figures.solution(f)) await p.click(`.pk-c[data-i="${i}"]`);
  await p.click('#check'); await W(60);
  t((await fb()).includes('Bravo'), 'figures : reconnaissance acceptée');
  const s = solides.generate('CE2', 1, 2);
  await open('#/exo/solides/CE2/1/2');
  if (s.ask !== 'nom') {
    for (const ch of String(s.answer)) await p.click(`.kp-k[data-k="${ch}"]`);
    await p.click('#check'); await W(60);
    t((await fb()).includes('Bravo'), 'solides : comptage accepté');
  } else t(true, 'solides : forme nom (sautée)');
}
console.log('Sommaire');
{
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await open('');
  t(await p.$('a.som-btn[href="#/sommaire"]') !== null, 'accueil : bouton Sommaire');
  for (const h of ['', '#/reglages', '#/cours/fractions', '#/exo/echanger/CE1/1/7', '#/sommaire']) { await open(h); t(await p.$('.bar a[href="#/sommaire"]') !== null, `bouton ☰ dans l’en-tête : ${h || 'accueil'}`); }
  await open('#/sommaire');
  const n = await p.$$eval('.som', (x) => x.length);
  t(n === 9, '9 chapitres au sommaire', n);
  const parts = await p.$$eval('.som', (cs) => cs.map((c) => c.querySelectorAll('.som-a').length));
  t(parts.every((k) => k > 0), 'chaque chapitre liste ses parties', parts);
  const exoLinks = await p.$$eval('.som-x a.btn-lv', (as) => as.map((a) => a.getAttribute('href')!));
  t(exoLinks.length > 50 && exoLinks.every((h) => /^#\/exo\/[a-z0-9]+\/(CE1|CE2|CM1|CM2|6e)$/.test(h)), 'liens exercices avec niveaux', exoLinks.length);
  t(exoLinks.some((h) => h.endsWith('/6e')), 'badges 6e présents');
  await p.evaluate(() => (document.querySelectorAll('#som-fractions .som-a')[2] as HTMLElement).click()); await W(400);
  t(p.url().endsWith('#/cours/fractions/3'), 'clic partie → route cours/fractions/3', p.url());
  const top = await p.evaluate(() => document.getElementById('p3')!.getBoundingClientRect().top);
  t(top >= 0 && top < 200, 'la partie 3 est en haut de l’écran', top);
  await open('#/sommaire');
  await p.evaluate(() => (document.querySelector('#som-division .som-x a.btn-lv') as HTMLElement).click()); await W(300);
  t(/#\/exo\//.test(p.url()) && (await p.$('#check')) !== null, 'clic badge → exercice ouvert', p.url());
}
// cibles ≥ 44 px
for (const h of ['', '#/sommaire', '#/reglages', '#/exo/echanger/CE2/2/1', '#/exo/tableau/CE2/3/1', '#/exo/ranger/CE2/3/1', '#/exo/droite/CE1/2/1', '#/exo/droite/CE2/3/1', '#/exo/dizaines/CE2/3/1', '#/exo/droite/CM2/1/3', '#/exo/grands/CM2/3/1', '#/exo/suites/CE2/3/1', '#/exo/ranger/CM2/3/2', '#/cours/numeration', '#/exo/lire/CE2/2/1', '#/exo/addpose/CM1/3/3', '#/exo/subpose/CM1/3/3', '#/exo/probadd/CM2/3/4', '#/exo/complements/CE2/2/2', '#/exo/mental/CM1/3/2', '#/cours/addition', '#/cours/multiplication', '#/exo/mulpose/CM2/3/1', '#/exo/mulpose/CE2/1/1', '#/exo/multiples/CM1/3/2', '#/exo/rectangle/CE2/3/1', '#/exo/tables/CE2/3/1', '#/exo/fois10/CM2/3/1', '#/exo/doubles/CE1/3/1', '#/exo/probmul/CM2/3/5', '#/cours/division', '#/exo/partage/CE2/2/3', '#/exo/divpose/CM2/3/2', '#/exo/reste/CM1/2/1', '#/exo/famille/CE2/1/1', '#/exo/divisible/CM2/3/1', '#/exo/probdiv/CM1/3/2', '#/cours/fractions', '#/exo/partsegales/CE1/3/2', '#/exo/colorier/CM2/3/1', '#/exo/colorier/CE2/3/7', '#/exo/lirefrac/CE2/2/2', '#/exo/fracdroite/CM2/3/4', '#/exo/fraclire/CM1/3/1', '#/exo/egales/CM2/3/1', '#/exo/egales/CE2/2/1', '#/exo/fraccomp/CM1/3/1', '#/exo/entierfrac/CM1/3/1', '#/exo/entierfrac/CM2/2/2', '#/exo/fracsomme/CM2/3/1', '#/exo/fracquant/CM2/3/1', '#/exo/fracpb/CE2/3/1', '#/exo/probfrac/CM2/3/2', '#/cours/proportionnalite', '#/exo/linmul/CM2/3/2', '#/exo/linadd/CM1/3/1', '#/exo/propoupas/CM1/1/4', '#/exo/probprop/CM2/3/3', '#/exo/probprop/CE2/2/1', '#/cours/decimaux', '#/exo/fracvirgule/CM1/1/4', '#/exo/dectableau/CM1/2/1', '#/exo/deccomp/CM1/2/3', '#/exo/decranger/CM2/3/1', '#/exo/decencadrer/CM1/2/1', '#/exo/decarrondi/CM1/1/2', '#/exo/decdroite/CM1/2/1', '#/exo/declire/CM2/2/1', '#/exo/decpose/CM1/2/2', '#/exo/decfois/CM2/2/1', '#/exo/decmul/CM2/2/1', '#/exo/decdiv/CM2/1/4', '#/exo/symetrie/CM2/3/1', '#/exo/probdec/CM1/2/1', '#/cours/mesures', '#/exo/uniteok/CE1/1/2', '#/exo/convertir/CM1/2/1', '#/exo/monnaie/CE2/2/1', '#/exo/horloge/CE1/1/3', '#/exo/duree/CM1/2/1', '#/exo/perimetre/CE2/1/3', '#/exo/aire/CM1/1/2', '#/exo/probmes/CM2/2/1', '#/cours/geometrie', '#/exo/figures/CE1/2/5', '#/exo/angle/CE2/2/1', '#/exo/symetrie/CM1/2/1', '#/exo/solides/CE2/1/2', '#/exo/repere/CE1/2/1']) {
  for (const w of [360, 390]) {
    await p.setViewport({ width: w, height: 740, isMobile: true, hasTouch: true });
    await open(h);
    const small = await p.$$eval('button, a, input', (els) => els.filter((e) => { const r = (e.closest('label') ?? e).getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).map((e) => e.className || e.tagName));
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || [...document.querySelectorAll('main *')].some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && !e.closest('.table-wrap, .md table, pre'); }));
    t(small.length === 0 && !overflow, `cibles ≥ 44 px, pas de débordement : ${h || 'accueil'} à ${w} px`, { small, overflow });
  }
}
t(errors.length === 0, 'aucune erreur JS', errors);
await b.close();
console.log(`${pass} réussis, ${fail} échecs`);
process.exit(fail ? 1 : 0);
