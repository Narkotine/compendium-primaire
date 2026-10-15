/** Problèmes dont la réponse est une fraction (CE1–CM2) : complément au tout, parts mises ensemble, différence, qui en a le plus. */
import { rng } from '../../engine/rng';
import type { ExoType, Level, Palier } from '../../engine/types';
import { F, fracWords } from '../../engine/frac';
import { fracInput } from '../../ui/fracin';
import { names, il, uOK } from '../pb/engine';
import { type Frac, eqF } from './common';

type HKind = 'compl' | 'somme' | 'diff';
export interface HisData { lv: Level; p: Palier; kind: HKind; b: number; a: number; c: number; P: string; Q: string; extra: string }
const ans = (d: HisData): Frac => ({ n: d.kind === 'compl' ? d.b - d.a : d.kind === 'somme' ? d.a + d.c : d.a - d.c, d: d.b });
export const fracpb: ExoType<HisData, Frac> = {
  id: 'fracpb', title: 'Problèmes de fractions', notion: 'Problèmes', levels: ['CE1', 'CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const kind: HKind = r.pick(p === 1 ? ['somme', 'compl'] : ['somme', 'compl', 'diff']);
    const b = r.pick(lv === 'CE1' ? [4, 5, 6, 8, 10] : [5, 6, 8, 10, 12]);
    for (;;) {
      const a = r.int(1, b - 1), c = r.int(1, b - 1);
      if (kind === 'somme' && a + c > b) continue;
      if (kind === 'diff' && a <= c) continue;
      const [P, Q] = names(r, 2);
      const extra = uOK(lv, p) ? r.pick([`${P} a ${r.int(7, 11)} ans. `, `Il est ${r.int(2, 6)} heures. `, `La pizza coûte ${r.int(8, 15)} €. `]) : '';
      return { lv, p, kind, b, a, c, P, Q, extra };
    }
  },
  solution: ans,
  check(d, f) {
    const g = ans(d);
    if (f.d > 0 && eqF(f, g)) return { ok: true };
    if (f.d === 2 * d.b) return { ok: false, bad: [2], msg: `On ne ${d.kind === 'somme' ? 'additionne' : 'soustrait'} pas les dénominateurs : ce sont toujours des ${fracWords(2, d.b).split(' ')[1]}.` };
    if (d.kind === 'compl' && f.n === d.a) return { ok: false, bad: [1], msg: `${F(d.a, d.b)}, c’est la part de ${d.P}. On demande LE RESTE : le tout, c’est ${F(d.b, d.b)}.` };
    if (d.kind === 'diff' && f.n === d.a + d.c) return { ok: false, bad: [1], msg: `On cherche combien ${d.P} a mangé DE PLUS que ${d.Q} : c’est un écart, on soustrait.` };
    if (d.kind === 'somme' && f.n === d.a - d.c) return { ok: false, bad: [1], msg: `Ils ont mangé ENSEMBLE : on additionne les parts.` };
    if (f.d !== d.b) return { ok: false, bad: [2], msg: `La pizza est partagée en ${d.b} : le dénominateur est ${d.b}.` };
    return { ok: false, bad: [1], msg: `Compte les parts : ${d.kind === 'compl' ? `de ${d.a} jusqu’à ${d.b}` : d.kind === 'somme' ? `${d.a} + ${d.c}` : `${d.a} − ${d.c}`}.` };
  },
  hint: (d) => (d.kind === 'compl' ? `La pizza entière, c’est ${F(d.b, d.b)}. Combien de parts manque-t-il ?` : `Ce sont des ${fracWords(2, d.b).split(' ')[1]} de la même pizza : compte les parts.`),
  correction: (d) => { const g = ans(d); return `<p><b>${d.kind === 'compl' ? `${F(d.b, d.b)} − ${F(d.a, d.b)}` : `${F(d.a, d.b)} ${d.kind === 'somme' ? '+' : '−'} ${F(d.c, d.b)}`} = ${F(g.n, g.d)}</b></p>`; },
  mount(el, d) {
    const A = `${fracWords(d.a, d.b)} (${F(d.a, d.b)})`, C = `${fracWords(d.c, d.b)} (${F(d.c, d.b)})`;
    const t = d.kind === 'compl' ? `${d.P} mange ${A} d’une pizza. ${d.extra}${d.Q} mange tout le reste.` : `${d.P} mange ${A} d’une pizza. ${d.extra}${d.Q} mange ${C} de la même pizza.`;
    const q = d.kind === 'compl' ? `Quelle fraction de la pizza ${d.Q} mange-t-${il(d.Q)} ?` : d.kind === 'somme' ? `Quelle fraction de la pizza ont-ils mangée à eux deux ?` : `Quelle fraction de pizza ${d.P} a-t-${il(d.P)} mangée de plus que ${d.Q} ?`;
    el.innerHTML = `<p class="pb-text">${t}</p><p class="q"><b>${q}</b></p><div class="w-fi"></div>`;
    const I = fracInput(el.querySelector('.w-fi')!);
    return { answer: () => I.value(), lock: () => I.lock(), showBad: (b) => I.showBad(b) };
  },
};
