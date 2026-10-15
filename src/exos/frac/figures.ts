/** Partie 1 : parts égales. « partsegales » (reconnaître), « colorier » (représenter), « lirefrac » (écrire la fraction d'une figure, ou des mots). */
import { rng } from '../../engine/rng';
import type { ExoType, Level, Palier } from '../../engine/types';
import { F, fracWords, partName } from '../../engine/frac';
import { fracFig, type Shape } from '../../ui/fracfig';
import { pickCards } from '../../ui/pick';
import { fracInput } from '../../ui/fracin';
import { easyDen, SHAPES, type Frac, eqF } from './common';

/* ---------- reconnaître ---------- */
type FigKind = 'ok' | 'inegal' | 'compte' | 'den';
interface Fig { kind: FigKind; shape: Shape; b: number; shade: number[]; cuts?: number[] }
export interface PegData { lv: Level; p: Palier; a: number; b: number; figs: Fig[] }
const shadeFirst = (k: number) => Array.from({ length: k }, (_, i) => i);
function unequal(r: ReturnType<typeof rng>, b: number) {
  for (;;) { const w = Array.from({ length: b }, () => r.int(4, 14)); const s = w.reduce((x, y) => x + y, 0); const c = [0]; w.forEach((x) => c.push(c[c.length - 1] + x / s)); if (Math.max(...w) >= 2 * Math.min(...w)) return c; }
}
export const partsegales: ExoType<PegData, number[]> = {
  id: 'partsegales', title: 'Est-ce bien la bonne fraction ?', notion: 'Parts égales', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const b = r.pick(p === 1 ? [2, 3, 4] : easyDen(lv, p).filter((x) => x <= 8));
    const a = lv === 'CE1' && p < 3 ? 1 : r.int(1, b - 1);
    for (;;) {
      const kinds: FigKind[] = Array.from({ length: 4 }, () => r.pick(p === 1 ? ['ok', 'inegal'] : ['ok', 'inegal', 'compte', 'den']));
      const nOk = kinds.filter((k) => k === 'ok').length;
      if (nOk < 1 || nOk > 3) continue;
      const figs: Fig[] = kinds.map((kind) => {
        const shape: Shape = r.pick(b > 6 ? ['bande', 'rect'] : [...SHAPES]);
        if (kind === 'inegal') { const sh: Shape = r.pick(['bande', 'disque']); return { kind, shape: sh, b, shade: shadeFirst(a), cuts: unequal(r, b) }; }
        if (kind === 'compte') return { kind, shape, b, shade: shadeFirst(a + 1 <= b - 1 || a === 1 ? a + 1 : a - 1) };
        if (kind === 'den') { const b2 = b + (b > 2 && r.next() < 0.5 ? -1 : 1); return { kind, shape: shape === 'rect' ? 'bande' : shape, b: b2, shade: shadeFirst(Math.min(a, b2 - 1)) }; }
        const sh = r.shuffle([...Array(b).keys()]).slice(0, a); // les parts grisées ne sont pas forcément côte à côte
        return { kind, shape, b, shade: p >= 2 ? sh : shadeFirst(a) };
      });
      if (figs.some((f) => f.kind === 'compte' && f.shade.length === a)) continue;
      return { lv, p, a, b, figs };
    }
  },
  solution: (d) => d.figs.map((f, i) => (f.kind === 'ok' ? i : -1)).filter((i) => i >= 0),
  check(d, a) {
    const good = partsegales.solution(d), s = new Set(a);
    const bad = d.figs.map((_, i) => (s.has(i) !== good.includes(i) ? i : -1)).filter((i) => i >= 0);
    if (!bad.length) return { ok: true };
    const w = a.find((i) => !good.includes(i));
    const name = fracWords(d.a, d.b);
    if (w !== undefined) {
      const f = d.figs[w];
      if (f.kind === 'inegal') return { ok: false, bad, msg: `Une figure a des parts qui ne sont pas égales. Ce n’est pas ${name} : pour une fraction, il faut des parts ÉGALES.` };
      if (f.kind === 'compte') return { ok: false, bad, msg: `Une figure a ${f.shade.length} parts grisées : ce n’est pas ${name}.` };
      return { ok: false, bad, msg: `Une figure est partagée en ${f.b} parts, pas en ${d.b}. Ce ne sont pas des ${partName(d.b)}${d.b === 3 ? '' : 's'}.` };
    }
    return { ok: false, bad, msg: `Il en manque. Une même fraction peut avoir plusieurs dessins : les parts grisées ne sont pas forcément côte à côte.` };
  },
  hint: (d) => `Pour chaque figure : les ${d.b} parts sont-elles égales ? Y en a-t-il bien ${d.b} ? ${d.a} sont-elles grisées ?`,
  correction: (d) => `<p>${fracWords(d.a, d.b)} (${F(d.a, d.b)}) : la figure est partagée en <b>${d.b} parts égales</b>, et <b>${d.a}</b> ${d.a > 1 ? 'sont grisées' : 'est grisée'}.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Touche les figures dont la partie grisée est <b>${fracWords(d.a, d.b)}</b> (${F(d.a, d.b)}).</p><div class="w-pk w-figs"></div>`;
    const P = pickCards(el.querySelector('.w-pk')!, d.figs.map((f) => fracFig(f.shape, f.b, f.shade, { cuts: f.cuts, w: 150 })));
    return { answer: () => P.chosen(), ready: () => (P.chosen().length ? null : 'Touche au moins une figure.'), lock: () => P.lock(), showBad: (b) => P.showBad(b) };
  },
};

/* ---------- colorier ---------- */
export interface ColData { lv: Level; p: Palier; a: number; b: number; units: number; disc: boolean }
export const colorier: ExoType<ColData, number> = {
  id: 'colorier', title: 'Colorier une fraction', notion: 'Représenter une fraction', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const b = r.pick(easyDen(lv, p));
    const big = (lv === 'CM1' || lv === 'CM2') && p === 3;
    const a = big ? r.int(b + 1, 2 * b - 1) : lv === 'CE1' && p === 1 ? 1 : r.int(1, b - 1);
    return { lv, p, a, b, units: big ? 2 : 1, disc: false };
  },
  solution: (d) => d.a,
  check(d, x) {
    if (x === d.a) return { ok: true };
    if (x === d.units * d.b - d.a) return { ok: false, msg: `Tu as colorié ${x} parts. On en veut ${d.a} : le numérateur (en haut) dit combien de parts on colorie.` };
    if (x === d.b && d.a !== d.b) return { ok: false, msg: `Tu as colorié ${d.b} parts : c’est le dénominateur. Le dénominateur dit en combien de parts on partage ; le numérateur, combien on en colorie.` };
    return { ok: false, msg: `Tu as colorié ${x} part${x > 1 ? 's' : ''}. Regarde le numérateur : il en faut ${d.a > x ? 'plus' : 'moins'}.` };
  },
  hint: (d) => `${F(d.a, d.b)} : chaque unité est partagée en ${d.b} parts égales. Colorie ${d.a} parts${d.units > 1 ? ` (une unité entière, c’est ${d.b} parts)` : ''}.`,
  correction: (d) => `<p>${F(d.a, d.b)} : chaque unité est partagée en ${d.b} parts égales, on en colorie <b>${d.a}</b>.</p>`,
  mount(el, d) {
    const on = Array(d.units * d.b).fill(false);
    let locked = false;
    const cols = d.b <= 6 ? d.b : Math.ceil(d.b / 2);
    const render = () => {
      el.innerHTML = `<p class="q">Colorie ${F(d.a, d.b)} ${d.units > 1 ? 'de l’unité (il y a deux unités pareilles)' : 'de la bande'}.</p>${Array.from({ length: d.units }, (_, u) => `<div class="cparts" style="--c:${cols}" aria-label="Unité ${u + 1}">${Array.from({ length: d.b }, (_, i) => { const k = u * d.b + i; return `<button type="button" class="cpart ${on[k] ? 'on' : ''}" data-k="${k}" aria-pressed="${on[k]}" aria-label="Part ${i + 1}${d.units > 1 ? ` de l’unité ${u + 1}` : ''}"></button>`; }).join('')}</div>`).join('')}<p class="tip">Touche une part pour la colorier, touche-la encore pour l’effacer.</p>`;
      el.querySelectorAll<HTMLButtonElement>('.cpart').forEach((b) => b.addEventListener('click', () => { if (locked) return; const k = Number(b.dataset.k); on[k] = !on[k]; render(); el.querySelector<HTMLElement>(`[data-k="${k}"]`)?.focus(); }));
      if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
    };
    render();
    const count = () => on.filter(Boolean).length;
    return { answer: () => count(), ready: () => (count() ? null : 'Colorie au moins une part.'), lock: () => { locked = true; render(); } };
  },
};

/* ---------- lire / écrire ---------- */
export interface LirData { lv: Level; p: Palier; a: number; b: number; shape: Shape; shade: number[]; mode: 'fig' | 'mots' }
export const lirefrac: ExoType<LirData, Frac> = {
  id: 'lirefrac', title: 'Écrire la fraction', notion: 'Lire et écrire une fraction', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const b = r.pick(easyDen(lv, p));
    const a = lv === 'CE1' && p === 1 ? 1 : r.int(1, b - 1);
    const shape: Shape = r.pick(b > 6 ? ['bande', 'rect'] : [...SHAPES]);
    const shade = p === 1 ? Array.from({ length: a }, (_, i) => i) : r.shuffle([...Array(b).keys()]).slice(0, a);
    return { lv, p, a, b, shape, shade, mode: p === 3 && r.next() < 0.5 ? 'mots' : 'fig' };
  },
  solution: (d) => ({ n: d.a, d: d.b }),
  check(d, f) {
    if (f.n === d.a && f.d === d.b) return { ok: true };
    if (f.d !== 0 && eqF(f, { n: d.a, d: d.b }) && d.mode === 'fig') return { ok: true };
    if (f.n === d.b && f.d === d.a) return { ok: false, bad: [1, 2], msg: `Tu as inversé. En bas (dénominateur) : en combien de parts on partage, ici ${d.b}. En haut (numérateur) : combien de parts on prend.` };
    if (d.mode === 'fig' && f.n === d.a && f.d === d.b - d.a) return { ok: false, bad: [2], msg: `En bas, on écrit le nombre TOTAL de parts (grisées et blanches), pas seulement les blanches.` };
    if (d.mode === 'fig' && f.n === d.b - d.a && f.d === d.b) return { ok: false, bad: [1], msg: `Tu as compté les parts blanches. On demande la partie GRISÉE.` };
    if (f.d !== d.b) return { ok: false, bad: [2], msg: d.mode === 'fig' ? `Compte toutes les parts de la figure : c’est le dénominateur.` : `« ${partName(d.b)}${d.a > 1 && d.b !== 3 ? 's' : ''} » veut dire qu’on partage en ${d.b}.` };
    return { ok: false, bad: [1], msg: d.mode === 'fig' ? `Compte les parts grisées : c’est le numérateur.` : `« ${fracWords(d.a, d.b)} » : on prend ${d.a} part${d.a > 1 ? 's' : ''}.` };
  },
  hint: (d) => (d.mode === 'fig' ? `Compte d’abord TOUTES les parts (le nombre du bas), puis les parts grisées (le nombre du haut).` : `Le mot « ${partName(d.b)} » donne le nombre du bas.`),
  correction: (d) => `<p><b>${F(d.a, d.b)}</b> se lit « ${fracWords(d.a, d.b)} » : ${d.b} parts égales, on en prend ${d.a}.</p>`,
  mount(el, d) {
    el.innerHTML = d.mode === 'fig'
      ? `<p class="q">Quelle fraction de la figure est grisée ?</p>${fracFig(d.shape, d.b, d.shade)}<div class="w-fi"></div>`
      : `<p class="q">Écris avec des chiffres : <b>${fracWords(d.a, d.b)}</b>.</p><div class="w-fi"></div>`;
    const I = fracInput(el.querySelector('.w-fi')!);
    return { answer: () => I.value(), lock: () => I.lock(), showBad: (b) => I.showBad(b) };
  },
};
