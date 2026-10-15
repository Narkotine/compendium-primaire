/**
 * Proportionnalité (CM1–CM2) — programme : SANS tableau, SANS coefficient, SANS produit en croix.
 * Raisonnements en langage naturel fondés sur la linéarité : « 3 fois plus de pains, donc 3 fois plus cher » ; « 5 + 3 cahiers, donc 10 € + 6 € ».
 */
import { rng } from '../engine/rng';
import type { Rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../engine/types';
import { sentence } from '../ui/sentence';
import { pickCards } from '../ui/pick';
import { names } from './pb/engine';

/* ---------- contextes (grandeurs) ---------- */
interface Ctx { a: string; b: string; s: (x: number) => string; t: (y: number) => string; pa: [number, number]; pb: [number, number] }
const CTX: Ctx[] = [
  { a: 'pains aux raisins', b: '€', s: (x) => `${fmt(x)} pains aux raisins`, t: (y) => `${fmt(y)}\u00a0€`, pa: [2, 6], pb: [3, 9] },
  { a: 'gâteaux', b: 'œufs', s: (x) => `Pour ${fmt(x)} gâteaux`, t: (y) => `${fmt(y)}\u00a0œufs`, pa: [2, 5], pb: [2, 6] },
  { a: 'feuilles', b: 'mm', s: (x) => `Une pile de ${fmt(x)} feuilles`, t: (y) => `${fmt(y)}\u00a0mm d’épaisseur`, pa: [100, 500], pb: [10, 50] },
  { a: 'paquets', b: 'g', s: (x) => `${fmt(x)} paquets de pâtes pareils`, t: (y) => `${fmt(y)}\u00a0g`, pa: [2, 6], pb: [250, 750] },
  { a: 'minutes', b: 'km', s: (x) => `En ${fmt(x)} minutes, à vitesse constante, le vélo`, t: (y) => `${fmt(y)}\u00a0km`, pa: [10, 30], pb: [3, 9] },
];
const verb = (c: Ctx) => (c.b === '€' ? 'coûtent' : c.b === 'œufs' ? 'il faut' : c.b === 'mm' ? 'mesure' : c.b === 'g' ? 'pèsent' : 'parcourt');
const say = (c: Ctx, x: number, y: number | string) => (c.b === 'œufs' ? `${c.s(x)}, il faut ${typeof y === 'number' ? c.t(y) : `${y} œufs`}.` : `${c.s(x)} ${verb(c)} ${typeof y === 'number' ? c.t(y) : `${y} ${c.b === 'mm' ? 'mm' : c.b}`}.`);

/* ---------- linéarité multiplicative ---------- */
export interface LmData { lv: Level; p: Palier; ci: number; x: number; y: number; k: number; dir: 'plus' | 'moins' }
export const linmul: ExoType<LmData, (number | null)[]> = {
  id: 'linmul', title: 'Fois plus, fois moins', notion: 'Linéarité multiplicative', levels: ['CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const ci = r.int(0, CTX.length - 1), c = CTX[ci];
    const k = r.int(2, p === 1 ? 4 : lv === 'CM1' ? 6 : 10);
    const x = r.int(...c.pa), y = r.int(...c.pb);
    const dir = p === 3 && r.next() < 0.5 ? 'moins' : 'plus';
    return dir === 'moins' ? { lv, p, ci, x: x * k, y: y * k, k, dir } : { lv, p, ci, x, y, k, dir };
  },
  solution: (d) => [d.k, d.dir === 'plus' ? d.y * d.k : d.y / d.k],
  check(d, [k, z]) {
    const good = d.dir === 'plus' ? d.y * d.k : d.y / d.k;
    const x2 = d.dir === 'plus' ? d.x * d.k : d.x / d.k;
    if (k === d.k && z === good) return { ok: true };
    if (z !== null && z === d.y + (x2 - d.x)) return { ok: false, bad: [1], msg: `Tu as ajouté (ou enlevé) le même nombre des deux côtés. Ici, ce n’est pas « autant de plus » : c’est « ${d.k} fois ${d.dir} ».` };
    if (k !== d.k) return { ok: false, bad: [0], msg: d.dir === 'plus' ? `Combien de fois ${fmt(d.x)} dans ${fmt(x2)} ? ${fmt(d.x)} × ? = ${fmt(x2)}.` : `${fmt(d.x)}, c’est combien de fois ${fmt(x2)} ? ${fmt(x2)} × ? = ${fmt(d.x)}.` };
    if (d.dir === 'moins' && z === d.y * d.k) return { ok: false, bad: [1], msg: `Il y en a ${d.k} fois MOINS : le résultat est plus petit. On divise par ${d.k}.` };
    return { ok: false, bad: [1], msg: `${d.k} fois ${d.dir} : ${fmt(d.y)} ${d.dir === 'plus' ? '×' : '÷'} ${d.k} = ?` };
  },
  hint: (d) => `Compare d’abord les ${CTX[d.ci].a} : combien de fois ${d.dir === 'plus' ? 'plus' : 'moins'} ? L’autre grandeur change de la même façon.`,
  correction: (d) => { const x2 = d.dir === 'plus' ? d.x * d.k : d.x / d.k, z = d.dir === 'plus' ? d.y * d.k : d.y / d.k; return `<p>${fmt(x2)}, c’est <b>${d.k} fois ${d.dir}</b> que ${fmt(d.x)}. Donc ${d.k} fois ${d.dir} : ${fmt(d.y)} ${d.dir === 'plus' ? '×' : '÷'} ${d.k} = <b>${fmt(z)}</b>.</p>`; },
  mount(el, d) {
    const c = CTX[d.ci]; const x2 = d.dir === 'plus' ? d.x * d.k : d.x / d.k;
    el.innerHTML = `<p class="pb-text">${say(c, d.x, d.y)}</p><p class="q"><b>Et ${c.s(x2).replace(/^Pour |^Une pile de |^En /, (m) => m.toLowerCase())} ?</b></p><div class="w-st"></div>`;
    const S = sentence(el.querySelector('.w-st')!, [`${fmt(x2)} ${c.a}, c’est {0} fois ${d.dir} que ${fmt(d.x)} ${c.a}.`, `Donc, autant de fois ${d.dir} de l’autre côté : {1}\u00a0${c.b}.`], 2);
    return { answer: () => S.values(), ready: () => (S.values().some((v) => v === null) ? 'Remplis les deux cases.' : null), lock: () => S.lock(), showBad: (b) => S.showBad(b) };
  },
};

/* ---------- linéarité additive ---------- */
export interface LaData { lv: Level; p: Palier; ci: number; x1: number; y1: number; x2: number; y2: number; op: '+' | '−' }
export const linadd: ExoType<LaData, (number | null)[]> = {
  id: 'linadd', title: 'Ajouter deux achats', notion: 'Linéarité additive', levels: ['CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const ci = r.pick([0, 1, 3]), c = CTX[ci];
    for (;;) {
      const u = r.int(c.pb[0], c.pb[1]) ; const x1 = r.int(3, 9), x2 = r.int(2, 8);
      if (x1 === x2) continue;
      const op = p === 3 && r.next() < 0.5 && x1 > x2 ? '−' : '+';
      // le prix unitaire n'est pas un entier « visible » : u / q
      const q = r.pick([2, 3, 4]);
      if ((u * x1) % q || (u * x2) % q) continue;
      return { lv, p, ci, x1, y1: (u * x1) / q, x2, y2: (u * x2) / q, op };
    }
  },
  solution: (d) => [d.op === '+' ? d.y1 + d.y2 : d.y1 - d.y2],
  check(d, [z]) {
    const g = d.op === '+' ? d.y1 + d.y2 : d.y1 - d.y2;
    if (z === g) return { ok: true };
    if (z === (d.op === '+' ? d.y1 - d.y2 : d.y1 + d.y2)) return { ok: false, bad: [0], msg: d.op === '+' ? `On réunit les deux : on ajoute.` : `On en a moins : on enlève.` };
    return { ok: false, bad: [0], msg: `${fmt(d.op === '+' ? d.x1 + d.x2 : d.x1 - d.x2)} = ${fmt(d.x1)} ${d.op} ${fmt(d.x2)}. Donc on fait pareil de l’autre côté : ${fmt(d.y1)} ${d.op} ${fmt(d.y2)}.` };
  },
  hint: (d) => `${fmt(d.op === '+' ? d.x1 + d.x2 : d.x1 - d.x2)} ${CTX[d.ci].a}, c’est ${fmt(d.x1)} ${d.op === '+' ? 'et' : 'moins'} ${fmt(d.x2)}.`,
  correction: (d) => `<p>${fmt(d.op === '+' ? d.x1 + d.x2 : d.x1 - d.x2)} = ${fmt(d.x1)} ${d.op} ${fmt(d.x2)}, donc <b>${fmt(d.y1)} ${d.op} ${fmt(d.y2)} = ${fmt(d.op === '+' ? d.y1 + d.y2 : d.y1 - d.y2)}</b>.</p>`,
  mount(el, d) {
    const c = CTX[d.ci]; const X = d.op === '+' ? d.x1 + d.x2 : d.x1 - d.x2;
    el.innerHTML = `<p class="pb-text">${say(c, d.x1, d.y1)}<br>${say(c, d.x2, d.y2)}</p><p class="q"><b>Et pour ${fmt(X)} ${c.a} ?</b></p><div class="w-st"></div>`;
    const S = sentence(el.querySelector('.w-st')!, [`${fmt(X)} ${c.a}, c’est ${fmt(d.x1)} ${d.op === '+' ? '+' : '−'} ${fmt(d.x2)}.`, `Donc : ${fmt(d.y1)} ${d.op} ${fmt(d.y2)} = {0}\u00a0${c.b}.`], 1);
    return { answer: () => S.values(), ready: () => (S.values()[0] === null ? 'Écris le résultat.' : null), lock: () => S.lock(), showBad: (b) => S.showBad(b) };
  },
};

/* ---------- proportionnel ou pas ? ---------- */
interface Sit { t: string; ok: boolean; why: string }
function sits(r: Rng): Sit[] {
  const [P] = names(r, 1); const a = r.int(2, 9), p = r.int(2, 9), e = r.int(3, 8);
  return [
    { t: `Des tee-shirts coûtent ${p * 3} € chacun. Le prix dépend du nombre de tee-shirts.`, ok: true, why: '' },
    { t: `Pour ${a} gâteaux, il faut ${a * 2} œufs. Le nombre d’œufs dépend du nombre de gâteaux.`, ok: true, why: '' },
    { t: `L’épaisseur d’une pile de feuilles toutes pareilles dépend du nombre de feuilles.`, ok: true, why: '' },
    { t: `Un vélo roule toujours à la même vitesse. La distance dépend de la durée.`, ok: true, why: '' },
    { t: `La masse de paquets de riz identiques dépend du nombre de paquets.`, ok: true, why: '' },
    { t: `À ${a} ans, ${P} mesurait ${90 + a * 6} cm. Sa taille dépend de son âge.`, ok: false, why: `À ${2 * a} ans, on ne mesure pas 2 fois plus qu’à ${a} ans.` },
    { t: `À la fête foraine, on paie ${e} € d’entrée, puis ${p} € par tour de manège. Le prix dépend du nombre de tours.`, ok: false, why: `L’entrée se paie une seule fois : 2 fois plus de tours ne coûtent pas 2 fois plus cher.` },
    { t: `Au marché : «\u00a03 melons pour le prix de 2\u00a0!\u00a0». Le prix dépend du nombre de melons.`, ok: false, why: `Avec la promotion, 3 melons ne coûtent pas 3 fois le prix d’un melon.` },
    { t: `Le temps de cuisson d’un œuf dur dépend du nombre d’œufs dans la casserole.`, ok: false, why: `2 fois plus d’œufs ne cuisent pas 2 fois plus longtemps.` },
    { t: `Le taxi coûte ${e} € de prise en charge, puis ${p} € par kilomètre. Le prix dépend de la distance.`, ok: false, why: `La prise en charge se paie une seule fois.` },
  ];
}
export interface PpData { lv: Level; p: Palier; list: Sit[] }
export const propoupas: ExoType<PpData, number[]> = {
  id: 'propoupas', title: 'Proportionnel ou pas ?', notion: 'Reconnaître la proportionnalité', levels: ['CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const all = sits(r);
    for (;;) {
      const list = r.shuffle([...all]).slice(0, 4);
      const n = list.filter((s) => s.ok).length;
      if (n >= 1 && n <= 3) return { lv, p, list };
    }
  },
  solution: (d) => d.list.map((s, i) => (s.ok ? i : -1)).filter((i) => i >= 0),
  check(d, a) {
    const g = propoupas.solution(d), s = new Set(a);
    const bad = d.list.map((_, i) => (s.has(i) !== g.includes(i) ? i : -1)).filter((i) => i >= 0);
    if (!bad.length) return { ok: true };
    const w = a.find((i) => !g.includes(i));
    if (w !== undefined) return { ok: false, bad, msg: `Une situation n’est pas proportionnelle : ${d.list[w].why}` };
    return { ok: false, bad, msg: `Il en manque. Pose-toi la question : si l’un est 2 fois plus grand, l’autre est-il aussi 2 fois plus grand ?` };
  },
  hint: () => `Pour chaque situation : si je prends 2 fois plus (ou 3 fois plus), est-ce que l’autre est aussi 2 fois plus (3 fois plus) ?`,
  correction: (d) => `<ul>${d.list.map((s) => `<li>${s.ok ? '✔ proportionnel' : `✘ pas proportionnel — ${s.why}`}</li>`).join('')}</ul>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Touche les situations où il y a <b>proportionnalité</b>.</p><div class="w-pk w-sit"></div>`;
    const P = pickCards(el.querySelector('.w-pk')!, d.list.map((s) => `<span class="sit">${s.t}</span>`));
    return { answer: () => P.chosen(), ready: () => (P.chosen().length ? null : 'Touche au moins une situation.'), lock: () => P.lock(), showBad: (b) => P.showBad(b) };
  },
};
