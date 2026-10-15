/** Partie 2 : la fraction est un nombre. Demi-droite (placer / lire), fractions égales, comparer, entier + fraction. */
import { rng } from '../../engine/rng';
import type { ExoType, Level, Palier } from '../../engine/types';
import { F, fracWords, gcd } from '../../engine/frac';
import { numberLine } from '../../ui/numberline';
import { fracInput } from '../../ui/fracin';
import { lineFields } from '../../ui/lines';
import { pickCards } from '../../ui/pick';
import { DEN, type Frac, eqF, fv } from './common';

/* ---------- demi-droite ---------- */
export interface FdData { lv: Level; p: Palier; b: number; U: number; k: number; mode: 'placer' | 'lire' }
const LINE_DEN: Record<Level, number[]> = { CE1: [2, 4], CE2: [2, 4, 10], CM1: [2, 3, 4, 5, 6, 8, 10], CM2: [2, 3, 4, 5, 6, 8, 10] };
function genFd(lv: Level, p: Palier, seed: number, mode: 'placer' | 'lire'): FdData {
  const r = rng(seed);
  for (;;) {
    const b = r.pick(p === 1 ? LINE_DEN[lv].slice(0, 2) : LINE_DEN[lv]);
    const U = lv === 'CE1' || lv === 'CE2' ? 1 : p === 1 ? 1 : r.int(2, 3);
    if (U * b > 24) continue;
    const k = r.int(1, U * b - 1);
    if (k % b === 0) continue; // pas un entier
    return { lv, p, b, U, k, mode };
  }
}
const fdLabels = (d: FdData) => Object.fromEntries(Array.from({ length: d.U + 1 }, (_, u) => [u * d.b, String(u)]));
const mixed = (k: number, b: number) => (k > b ? ` (= ${Math.floor(k / b)} + ${F(k % b, b)})` : '');
function fdCheckPos(d: FdData, x: number) {
  if (x === d.k) return { ok: true };
  if (Math.abs(x - d.k) === 1) return { ok: false, msg: `Juste à côté. Compte les espaces (les intervalles) depuis 0, pas les traits.` };
  if (x === d.k % d.b) return { ok: false, msg: `${F(d.k, d.b)}, c’est plus que 1 : ${d.b} ${fracWords(2, d.b).split(" ")[1]} font déjà 1. Continue après 1.` };
  return { ok: false, msg: `Entre 0 et 1, il y a ${d.b} intervalles : chacun vaut ${F(1, d.b)}. Avance de ${d.k} intervalles depuis 0.` };
}
export const fracdroite: ExoType<FdData, number> = {
  id: 'fracdroite', title: 'Placer une fraction sur la droite', notion: 'Fractions sur la demi-droite', levels: ['CE2', 'CM1', 'CM2'],
  generate: (lv, p, seed) => genFd(lv, p, seed, 'placer'),
  solution: (d) => d.k,
  check: (d, x) => fdCheckPos(d, x),
  hint: (d) => `L’unité (de 0 à 1) est partagée en ${d.b} intervalles égaux. ${F(d.k, d.b)} : avance de ${d.k} intervalles depuis 0.`,
  correction: (d) => `<p>${F(d.k, d.b)}${mixed(d.k, d.b)} : <b>${d.k} intervalles</b> de ${F(1, d.b)} depuis 0.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Place <span class="eq">${F(d.k, d.b)}</span> sur la demi-droite.</p><div class="w-nl"></div>`;
    const nl = numberLine(el.querySelector('.w-nl')!, { ticks: d.U * d.b, labels: fdLabels(d) });
    return { answer: () => nl.pos(), lock: () => nl.lock() };
  },
};
export const fraclire: ExoType<FdData, Frac> = {
  id: 'fraclire', title: 'Lire une fraction sur la droite', notion: 'Fractions sur la demi-droite', levels: ['CE2', 'CM1', 'CM2'],
  generate: (lv, p, seed) => genFd(lv, p, seed, 'lire'),
  solution: (d) => ({ n: d.k, d: d.b }),
  check(d, f) {
    if (f.d > 0 && eqF(f, { n: d.k, d: d.b })) return { ok: true };
    if (f.n === d.k && f.d === d.U * d.b && d.U > 1) return { ok: false, bad: [2], msg: `En bas, c’est le nombre d’intervalles dans UNE unité (de 0 à 1) : ${d.b}, pas sur toute la droite.` };
    if (f.d !== d.b && !eqF(f, { n: d.k, d: d.b })) {
      if (f.n === d.k) return { ok: false, bad: [2], msg: `Compte les intervalles entre 0 et 1 : c’est le dénominateur.` };
    }
    if (f.d === d.b && Math.abs(f.n - d.k) === 1) return { ok: false, bad: [1], msg: `Presque : compte les intervalles depuis 0, pas les traits.` };
    return { ok: false, bad: [1, 2], msg: `Combien d’intervalles entre 0 et 1 ? C’est le nombre du bas. Combien d’intervalles de 0 jusqu’au point ? C’est le nombre du haut.` };
  },
  hint: (d) => `Entre 0 et 1, il y a ${d.b} intervalles : chacun vaut ${F(1, d.b)}.`,
  correction: (d) => `<p>Le point est à <b>${F(d.k, d.b)}</b>${mixed(d.k, d.b)}.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Quelle fraction est au point <b>?</b></p><div class="w-nl"></div><div class="w-fi"></div>`;
    const nl = numberLine(el.querySelector('.w-nl')!, { ticks: d.U * d.b, labels: fdLabels(d), marked: d.k });
    el.querySelector('.nl-btns')?.remove(); nl.lock(); el.querySelector('.nl-svg')?.removeAttribute('role'); el.querySelector('.nl-svg')?.setAttribute('tabindex', '-1');
    const I = fracInput(el.querySelector('.w-fi')!);
    return { answer: () => I.value(), lock: () => I.lock(), showBad: (b) => I.showBad(b) };
  },
};

/* ---------- fractions égales ---------- */
export interface EgData { lv: Level; p: Palier; a: number; b: number; k: number; miss: 'n' | 'd' | 'pick'; cards?: Frac[] }
export const egales: ExoType<EgData, number | number[]> = {
  id: 'egales', title: 'Fractions égales', notion: 'Égalités de fractions', levels: ['CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const maxD = lv === 'CE2' ? 12 : lv === 'CM1' ? 20 : 60;
    for (;;) {
      const b = r.int(2, lv === 'CE2' ? 6 : 10), a = r.int(1, lv === 'CE2' ? b - 1 : 2 * b - 1);
      if (gcd(a, b) !== 1) continue;
      const k = r.int(2, Math.floor(maxD / b));
      if (k * b > maxD || k < 2) continue;
      if (p === 3) {
        const set: Frac[] = [{ n: a * k, d: b * k }];
        const k2 = r.int(2, 4); if (b * k2 <= maxD && k2 !== k) set.push({ n: a * k2, d: b * k2 });
        set.push({ n: a + 1, d: b + 1 }, { n: a * k, d: b * k + 1 }, { n: a + k, d: b + k });
        const cards = r.shuffle(set.filter((f, i) => set.findIndex((g) => g.n === f.n && g.d === f.d) === i));
        if (cards.filter((f) => eqF(f, { n: a, d: b })).length < 1) continue;
        return { lv, p, a, b, k, miss: 'pick', cards };
      }
      return { lv, p, a, b, k, miss: p === 1 || r.next() < 0.6 ? 'n' : 'd' };
    }
  },
  solution: (d) => (d.miss === 'pick' ? d.cards!.map((f, i) => (eqF(f, { n: d.a, d: d.b }) ? i : -1)).filter((i) => i >= 0) : d.miss === 'n' ? d.a * d.k : d.b * d.k),
  check(d, x) {
    if (d.miss === 'pick') {
      const g = egales.solution(d) as number[], a = x as number[], s = new Set(a);
      const bad = d.cards!.map((_, i) => (s.has(i) !== g.includes(i) ? i : -1)).filter((i) => i >= 0);
      if (!bad.length) return { ok: true };
      const w = a.find((i) => !g.includes(i));
      if (w !== undefined) { const f = d.cards![w]; if (f.n - d.a === f.d - d.b) return { ok: false, bad, msg: `${F(f.n, f.d)} : on a AJOUTÉ ${f.n - d.a} en haut et en bas. Ça ne marche pas : il faut MULTIPLIER le haut et le bas par le même nombre.` }; return { ok: false, bad, msg: `${F(f.n, f.d)} n’est pas égale à ${F(d.a, d.b)} : le haut et le bas ne sont pas multipliés par le même nombre.` }; }
      return { ok: false, bad, msg: 'Il en manque une. Cherche par combien on a multiplié le bas, puis vérifie le haut.' };
    }
    const v = x as number;
    if (v === egales.solution(d)) return { ok: true };
    if (d.miss === 'n' && v === d.a + (d.b * d.k - d.b)) return { ok: false, msg: `Tu as ajouté ${d.b * d.k - d.b}. Le bas a été MULTIPLIÉ par ${d.k} (${d.b} × ${d.k} = ${d.b * d.k}) : le haut aussi.` };
    if (d.miss === 'd' && v === d.b + (d.a * d.k - d.a)) return { ok: false, msg: `Tu as ajouté ${d.a * d.k - d.a}. Le haut a été MULTIPLIÉ par ${d.k} : le bas aussi.` };
    return { ok: false, msg: d.miss === 'n' ? `Par combien a-t-on multiplié ${d.b} pour avoir ${d.b * d.k} ? Fais pareil en haut.` : `Par combien a-t-on multiplié ${d.a} pour avoir ${d.a * d.k} ? Fais pareil en bas.` };
  },
  hint: (d) => `Des parts ${d.k} fois plus petites, mais ${d.k} fois plus nombreuses : on multiplie le haut ET le bas par ${d.k}.`,
  correction: (d) => `<p><b>${F(d.a, d.b)} = ${F(d.a * d.k, d.b * d.k)}</b> : haut et bas multipliés par ${d.k}.</p>`,
  mount(el, d) {
    const h = '<span class="hole">?</span>';
    if (d.miss === 'pick') {
      el.innerHTML = `<p class="q">Touche les fractions égales à <span class="eq">${F(d.a, d.b)}</span>.</p><div class="w-pk"></div>`;
      const P = pickCards(el.querySelector('.w-pk')!, d.cards!.map((f) => F(f.n, f.d)));
      return { answer: () => P.chosen(), ready: () => (P.chosen().length ? null : 'Touche au moins une carte.'), lock: () => P.lock(), showBad: (b) => P.showBad(b) };
    }
    el.innerHTML = `<p class="q">Complète :</p><p class="eq">${F(d.a, d.b)} = ${d.miss === 'n' ? F(h, d.b * d.k) : F(d.a * d.k, h)}</p><div class="w-kp"></div>`;
    const I = fracInput(el.querySelector('.w-kp')!, d.miss === 'n' ? { fixedDen: d.b * d.k } : { fixedNum: d.a * d.k });
    return { answer: () => { const v = I.value(); return v ? (d.miss === 'n' ? v.n : v.d) : null; }, lock: () => I.lock() };
  },
};

/* ---------- comparer ---------- */
type CmpKind = 'memeD' | 'unit' | 'memeN' | 'multiple' | 'un' | 'egal';
export interface CmpData { lv: Level; p: Palier; x: Frac; y: Frac; kind: CmpKind }
const KINDS: Record<Level, CmpKind[][]> = {
  CE1: [['memeD'], ['memeD', 'unit'], ['memeD', 'unit']],
  CE2: [['memeD', 'unit'], ['memeN', 'unit', 'memeD'], ['multiple', 'memeN', 'egal']],
  CM1: [['memeD', 'memeN'], ['multiple', 'un', 'egal'], ['multiple', 'un', 'egal', 'memeN']],
  CM2: [['memeD', 'memeN', 'un'], ['multiple', 'un', 'egal'], ['multiple', 'un', 'egal']],
};
const sign = (d: CmpData) => (fv(d.x) < fv(d.y) ? '<' : fv(d.x) > fv(d.y) ? '>' : '=');
export const fraccomp: ExoType<CmpData, string> = {
  id: 'fraccomp', title: 'Comparer des fractions', notion: 'Comparer des fractions', levels: ['CE1', 'CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const kind = r.pick(KINDS[lv][p - 1]);
    const Ds = DEN[lv].filter((x) => x <= 12);
    for (;;) {
      let x: Frac, y: Frac;
      const b = r.pick(Ds);
      if (kind === 'memeD') { const big = lv.startsWith('CM'); x = { n: r.int(1, big ? 2 * b : b - 1), d: b }; y = { n: r.int(1, big ? 2 * b : b - 1), d: b }; }
      else if (kind === 'unit') { x = { n: 1, d: b }; y = { n: 1, d: r.pick(Ds) }; }
      else if (kind === 'memeN') { const n = r.int(2, 7); x = { n, d: r.pick(Ds) }; y = { n, d: r.pick(Ds) }; if (lv === 'CE2' && (n >= x.d || n >= y.d)) continue; }
      else if (kind === 'multiple') { const k = r.pick([2, 3]); const d2 = b * k; if (d2 > (lv === 'CE2' ? 12 : 20)) continue; x = { n: r.int(1, b - 1), d: b }; y = { n: r.int(1, d2 - 1), d: d2 }; }
      else if (kind === 'egal') { const k = r.int(2, 3); const n = r.int(1, b - 1); x = { n, d: b }; y = { n: n * k, d: b * k }; if (y.d > (lv === 'CE2' ? 12 : 20)) continue; }
      else { x = { n: r.int(b + 1, 2 * b - 1), d: b }; const d2 = r.pick(Ds); y = { n: r.int(1, d2 - 1), d: d2 }; }
      if (x.n === y.n && x.d === y.d) continue;
      if (kind !== 'egal' && fv(x) === fv(y)) continue;
      if (r.next() < 0.5) [x, y] = [y, x];
      return { lv, p, x, y, kind };
    }
  },
  solution: sign,
  check(d, s) {
    if (s === sign(d)) return { ok: true };
    const { x, y } = d;
    if (d.kind === 'unit') return { ok: false, msg: `Plus on partage, plus les parts sont PETITES. Un ${fracWords(1, Math.max(x.d, y.d)).split(' ')[1]} est plus petit qu’un ${fracWords(1, Math.min(x.d, y.d)).split(' ')[1]}.` };
    if (d.kind === 'memeD') return { ok: false, msg: `Même dénominateur : les parts ont la même taille. Celle qui a le plus de parts est la plus grande.` };
    if (d.kind === 'memeN') return { ok: false, msg: `Même nombre de parts (${x.n}). Mais des ${fracWords(2, Math.max(x.d, y.d)).split(' ')[1]} sont plus petits que des ${fracWords(2, Math.min(x.d, y.d)).split(' ')[1]}.` };
    if (d.kind === 'egal') return { ok: false, msg: `Regarde bien : ${F(y.n, y.d)}, c’est ${F(x.n, x.d)} avec le haut et le bas multipliés par le même nombre (ou l’inverse).` };
    if (d.kind === 'un') return { ok: false, msg: `Compare chaque fraction à 1 : le haut est-il plus grand que le bas ?` };
    const [s1, s2] = x.d < y.d ? [x, y] : [y, x]; const k = s2.d / s1.d;
    return { ok: false, msg: `Mets-les en ${fracWords(2, s2.d).split(' ')[1]} : ${F(s1.n, s1.d)} = ${F(s1.n * k, s2.d)}. Puis compare les numérateurs.` };
  },
  hint: (d) => ({ memeD: 'Même dénominateur : compare les numérateurs.', unit: 'Imagine le même gâteau partagé en plus ou moins de parts.', memeN: 'Même numérateur : plus on partage, plus chaque part est petite.', multiple: 'Transforme une des fractions pour avoir le même dénominateur.', un: 'Une fraction plus grande que 1 a un numérateur plus grand que son dénominateur.', egal: 'Peut-être sont-elles égales ? Multiplie le haut et le bas de la plus simple.' }[d.kind]),
  correction: (d) => `<p><b>${F(d.x.n, d.x.d)} ${sign(d) === '<' ? '&lt;' : sign(d) === '>' ? '&gt;' : '='} ${F(d.y.n, d.y.d)}</b></p>`,
  mount(el, d) {
    let pick: string | null = null, locked = false;
    const render = () => {
      el.innerHTML = `<p class="q">Choisis le bon signe.</p><p class="eq">${F(d.x.n, d.x.d)} <span class="hole">${pick ?? '?'}</span> ${F(d.y.n, d.y.d)}</p><div class="cmp">${['<', '=', '>'].map((s) => `<button type="button" class="tok ${pick === s ? 'sel' : ''}" data-s="${s}" aria-pressed="${pick === s}" aria-label="${s === '<' ? 'plus petit que' : s === '>' ? 'plus grand que' : 'égal à'}">${s === '<' ? '&lt;' : s === '>' ? '&gt;' : '='}</button>`).join('')}</div>`;
      el.querySelectorAll<HTMLButtonElement>('[data-s]').forEach((b) => b.addEventListener('click', () => { if (!locked) { pick = b.dataset.s!; render(); } }));
      if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
    };
    render();
    return { answer: () => pick, lock: () => { locked = true; render(); } };
  },
};

/* ---------- entier + fraction ---------- */
export interface EnData { lv: Level; p: Palier; n: number; b: number; kind: 'decomp' | 'unique' | 'encadrer' }
export const entierfrac: ExoType<EnData, (number | null)[]> = {
  id: 'entierfrac', title: 'Fractions plus grandes que 1', notion: 'Fractions supérieures à 1', levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const b = r.pick(lv === 'CM1' ? [2, 3, 4, 5, 6, 8, 10] : [3, 4, 5, 6, 8, 10, 12, 15, 20]);
    const w = r.int(1, p === 1 ? 2 : 5);
    const n = w * b + r.int(1, b - 1);
    return { lv, p, n, b, kind: p === 1 ? 'decomp' : r.pick(['decomp', 'unique', 'encadrer']) };
  },
  solution: (d) => (d.kind === 'decomp' ? [Math.floor(d.n / d.b), d.n % d.b] : d.kind === 'unique' ? [d.n] : [Math.floor(d.n / d.b), Math.floor(d.n / d.b) + 1]),
  check(d, a) {
    const w = Math.floor(d.n / d.b), rr = d.n % d.b;
    if (a.every((v, i) => v === entierfrac.solution(d)[i])) return { ok: true };
    if (d.kind === 'decomp') {
      if (a[0] === w - 1 && a[1] === rr + d.b) return { ok: false, bad: [0, 1], msg: `${F(rr + d.b, d.b)}, c’est encore plus que 1 : ${d.b} ${fracWords(2, d.b).split(' ')[1]} font 1. Sors encore une unité.` };
      if (a[0] !== null && a[0] * d.b + (a[1] ?? 0) === d.n) return { ok: false, bad: [1], msg: `La fraction qui reste doit être plus petite que 1.` };
      return { ok: false, bad: [0, 1], msg: `${d.b} ${fracWords(2, d.b).split(' ')[1]} font 1 unité. Combien de fois ${d.b} dans ${d.n} ? Ce qui reste, ce sont les ${fracWords(2, d.b).split(' ')[1]} en plus.` };
    }
    if (d.kind === 'unique') {
      if (a[0] === w + rr) return { ok: false, bad: [0], msg: `${w}, ce n’est pas ${w} ${fracWords(2, d.b).split(' ')[1]} : 1 unité = ${F(d.b, d.b)}. Donc ${w} = ${F(w * d.b, d.b)}.` };
      return { ok: false, bad: [0], msg: `Écris d’abord ${w} en ${fracWords(2, d.b).split(' ')[1]} : ${w} × ${d.b} = ?` };
    }
    return { ok: false, bad: [0, 1], msg: `${F(d.n, d.b)} : combien d’unités entières ? (${d.b} ${fracWords(2, d.b).split(' ')[1]} = 1.) La fraction est entre cet entier et le suivant.` };
  },
  hint: (d) => `Rappel : ${F(d.b, d.b)} = 1. Donc ${F(2 * d.b, d.b)} = 2, ${F(3 * d.b, d.b)} = 3…`,
  correction: (d) => { const w = Math.floor(d.n / d.b), rr = d.n % d.b; return `<p><b>${F(d.n, d.b)} = ${w} + ${F(rr, d.b)}</b>, car ${w} = ${F(w * d.b, d.b)}. Donc ${w} &lt; ${F(d.n, d.b)} &lt; ${w + 1}.</p>`; },
  mount(el, d) {
    const w = Math.floor(d.n / d.b), rr = d.n % d.b;
    if (d.kind === 'encadrer') {
      el.innerHTML = `<p class="q">Entre quels entiers qui se suivent est <span class="eq">${F(d.n, d.b)}</span> ?</p><div class="w-ln"></div>`;
      const L = lineFields(el.querySelector('.w-ln')!, [{ label: 'Plus petit entier', aria: 'Entier juste avant' }, { label: 'Entier suivant', aria: 'Entier juste après' }], '', 2);
      el.querySelector('.ln-bar')?.remove();
      return { answer: () => L.values(), ready: () => (L.values().some((v) => v === null) ? 'Écris les deux entiers.' : null), lock: () => L.lock(), showBad: (b) => L.showBad(b) };
    }
    if (d.kind === 'unique') {
      el.innerHTML = `<p class="q">Écris avec une seule fraction :</p><p class="eq">${w} + ${F(rr, d.b)} = ${F('?', d.b)}</p><div class="w-fi"></div>`;
      const I = fracInput(el.querySelector('.w-fi')!, { fixedDen: d.b });
      return { answer: () => { const v = I.value(); return v ? [v.n] : null; }, lock: () => I.lock(), showBad: () => I.showBad([1]) };
    }
    el.innerHTML = `<p class="q">Écris comme un entier plus une fraction plus petite que 1 :</p><p class="eq">${F(d.n, d.b)} = ? + ${F('?', d.b)}</p><div class="w-fi"></div>`;
    const I = fracInput(el.querySelector('.w-fi')!, { whole: true, fixedDen: d.b });
    return { answer: () => { const v = I.value(); return v ? [v.w, v.n] : null; }, lock: () => I.lock(), showBad: (b) => I.showBad(b.map((i) => (i === 0 ? 0 : 1))) };
  },
};
