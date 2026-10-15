/** « Le rectangle » : sens de la multiplication. Un quadrillage de r rangées de c carreaux : écrire le calcul, puis le résultat. */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier } from '../engine/types';
import { exprBuilder } from '../ui/expr';
import { keypad } from '../ui/keypad';
import { gridSvg } from '../ui/grid';

export interface RectData { lv: Level; p: Palier; r: number; c: number; extra: number }
export interface RectAns { nums: number[]; ops: string[]; result: number | null }
export const rectangle: ExoType<RectData, RectAns> = {
  id: 'rectangle', title: 'Le rectangle : combien de carreaux ?', notion: 'Sens de la multiplication', levels: ['CE1', 'CE2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const R = p === 1 ? [2, 5] : [3, 9], C = p === 1 ? [2, 6] : p === 2 ? [4, 9] : [6, 10];
    for (;;) {
      const a = r.int(R[0], R[1]), b = r.int(C[0], C[1]);
      if (a === b) continue;
      const extra = a + b; // étiquette piège : la somme
      return { lv, p, r: a, c: b, extra };
    }
  },
  solution: (d) => ({ nums: [d.r, d.c], ops: ['×'], result: d.r * d.c }),
  check(d, a) {
    const [x, y] = a.nums;
    if (a.ops[0] === '+') return { ok: false, msg: `Tu as ajouté ${x} et ${y}. Ici, on a ${d.r} rangées de ${d.c} carreaux : c’est ${d.r} fois ${d.c}.` };
    if (a.nums.includes(d.extra) && d.extra !== d.r && d.extra !== d.c) return { ok: false, msg: `${d.extra}, c’est ${d.r} + ${d.c}. On ne cherche pas cela : compte les rangées et les carreaux d’une rangée.` };
    if (!((x === d.r && y === d.c) || (x === d.c && y === d.r))) return { ok: false, msg: `Compte bien : combien de rangées ? Combien de carreaux dans une rangée ?` };
    if (a.result === null) return { ok: false, msg: 'Le calcul est juste ! Calcule maintenant le nombre de carreaux.' };
    if (a.result === d.r * d.c) return { ok: true };
    if (a.result === d.r + d.c) return { ok: false, msg: `${d.r} + ${d.c} = ${d.r + d.c}, mais ${d.r} × ${d.c}, c’est ${d.c} ajouté ${d.r} fois.` };
    return { ok: false, msg: `Le calcul est bon, mais pas le résultat. Ajoute ${d.c} rangée par rangée : ${d.c}, ${2 * d.c}, ${3 * d.c}…` };
  },
  hint: (d) => `Une rangée a ${d.c} carreaux. Il y a ${d.r} rangées. Donc ${d.r} fois ${d.c}.`,
  correction: (d) => `<p><b>${d.r} × ${d.c} = ${d.r * d.c}</b> (ou ${d.c} × ${d.r} : on peut tourner le rectangle).</p><p class="small">${Array(d.r).fill(d.c).join(' + ')} = ${d.r * d.c}</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Combien de carreaux ? Écris le calcul, puis le résultat.</p>${gridSvg(d.r, d.c)}<div class="w-ex"></div><div class="w-kp"></div>`;
    const nums = [d.r, d.c, d.extra].filter((v, i, s) => s.indexOf(v) === i);
    const ex = exprBuilder(el.querySelector('.w-ex')!, nums, ['+', '×'], 2, String);
    const k = keypad(el.querySelector('.w-kp')!, 'Le nombre de carreaux', 3);
    return {
      answer: () => { const v = ex.value(); return v ? { ...v, result: k.value() } : null; },
      ready: () => (!ex.value() ? 'Écris d’abord le calcul avec les étiquettes.' : k.value() === null ? 'Écris aussi le nombre de carreaux.' : null),
      lock: () => { ex.lock(); k.lock(); },
    };
  },
};
