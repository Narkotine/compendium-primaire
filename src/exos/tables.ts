/**
 * Tables de multiplication « dans les deux sens » (programme : A × B = C ou C = A × B, A et B de 0 à 10, un nombre manquant).
 * Erreurs ciblées (fait voisin, addition au lieu de multiplication) ; l'aide reconstruit le fait à partir d'un fait connu.
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier } from '../engine/types';
import { keypad } from '../ui/keypad';

type Kind = 'prod' | 'fact' | 'gauche';
export interface TabData { lv: Level; p: Palier; a: number; b: number; kind: Kind }
const TABS: Record<Level, number[][]> = {
  CE1: [[2, 5, 10], [2, 3, 4, 5, 10], [2, 3, 4, 5, 6, 7, 8, 9, 10]],
  CE2: [[2, 3, 4, 5, 10], [2, 3, 4, 5, 6, 7, 8, 9], [6, 7, 8, 9]],
  CM1: [[2, 3, 4, 5, 6, 7, 8, 9], [6, 7, 8, 9], [6, 7, 8, 9]],
  CM2: [[2, 3, 4, 5, 6, 7, 8, 9], [6, 7, 8, 9], [6, 7, 8, 9]],
  '6e': [[2, 3, 4, 5, 6, 7, 8, 9], [6, 7, 8, 9], [6, 7, 8, 9]],
};
const ans = (d: TabData) => (d.kind === 'prod' ? d.a * d.b : d.b);
export function rebuild(a: number, b: number) {
  const [x, y] = b >= a ? [a, b] : [b, a]; // y = la plus grande table
  const t = y;
  if (t === 4) return `${x} × 4, c’est le double du double : ${x} × 2 = ${2 * x}, puis ${2 * x} × 2 = ${4 * x}.`;
  if (t === 9) return `${x} × 9, c’est ${x} × 10 moins ${x} : ${10 * x} − ${x} = ${9 * x}.`;
  if (t === 5) return `${x} × 5, c’est la moitié de ${x} × 10 : la moitié de ${10 * x} = ${5 * x}.`;
  if (t === 8) return `${x} × 8, c’est le double de ${x} × 4 : ${4 * x} × 2 = ${8 * x}.`;
  if (t === 6) return `${x} × 6, c’est ${x} × 5 et encore ${x} : ${5 * x} + ${x} = ${6 * x}.`;
  if (t === 7) return `${x} × 7, c’est ${x} × 5 et ${x} × 2 : ${5 * x} + ${2 * x} = ${7 * x}.`;
  if (t === 3) return `${x} × 3, c’est ${x} × 2 et encore ${x} : ${2 * x} + ${x} = ${3 * x}.`;
  if (t === 10) return `× 10 : les unités deviennent des dizaines. ${x} × 10 = ${10 * x}.`;
  return `${x} × 2, c’est le double de ${x} : ${x} + ${x} = ${2 * x}.`;
}
export const tables: ExoType<TabData, number> = {
  id: 'tables', title: 'Tables de multiplication', notion: 'Les tables', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const kinds: Kind[] = p === 1 ? ['prod'] : p === 2 ? ['prod', 'fact'] : ['prod', 'fact', 'gauche'];
    const t = r.pick(TABS[lv][p - 1]);
    const x = r.int(p === 3 ? 0 : 2, 10);
    const [a, b] = r.next() < 0.5 ? [t, x] : [x, t];
    let kind = r.pick(kinds);
    if (kind !== 'prod' && a === 0) kind = 'prod'; // 0 × ? = 0 : infinité de réponses
    return { lv, p, a, b, kind };
  },
  solution: ans,
  check(d, x) {
    const g = ans(d);
    if (x === g) return { ok: true };
    if (d.kind === 'prod') {
      if (x === d.a + d.b) return { ok: false, msg: `Tu as ajouté. ${d.a} × ${d.b}, c’est ${d.b} pris ${d.a} fois.` };
      if (d.a && (x === d.a * (d.b + 1) || x === d.a * (d.b - 1))) return { ok: false, msg: `${x}, c’est ${d.a} × ${x / d.a}. Tu es dans la bonne table, une case à côté.` };
      if (d.b && (x === d.b * (d.a + 1) || x === d.b * (d.a - 1))) return { ok: false, msg: `${x}, c’est ${x / d.b} × ${d.b}. Tu es dans la bonne table, une case à côté.` };
      if (d.a === 0 || d.b === 0) return { ok: false, msg: `Zéro fois un nombre, c’est 0 : il n’y a rien.` };
      return { ok: false, msg: `Ce n’est pas ça. Reconstruis le résultat à partir d’un résultat que tu connais.` };
    }
    if (d.a * x === d.a * d.b + d.a || d.a * x === d.a * d.b - d.a) return { ok: false, msg: `${d.a} × ${x} = ${d.a * x}, pas ${d.a * d.b}. Tu es juste à côté.` };
    if (x === d.a * d.b - d.a || x === d.a * d.b) return { ok: false, msg: `On cherche combien de fois ${d.a} il faut pour faire ${d.a * d.b}. Vérifie : ${d.a} × ${x} = ${d.a * x}.` };
    return { ok: false, msg: `Vérifie en multipliant : ${d.a} × ${x} = ${d.a * x}. Est-ce ${d.a * d.b} ?` };
  },
  hint: (d) => (d.kind === 'prod' ? rebuild(d.a, d.b) : `Récite la table de ${d.a} jusqu’à ${d.a * d.b} : ${[1, 2, 3].map((k) => d.a * k).join(', ')}…`),
  correction: (d) => `<p><b>${d.a} × ${d.b} = ${d.a * d.b}</b></p><p class="small">${rebuild(d.a, d.b)}</p>`,
  mount(el, d) {
    const c = d.a * d.b, h = '<span class="hole">?</span>';
    const eq = d.kind === 'prod' ? `${d.a} × ${d.b} = ${h}` : d.kind === 'fact' ? `${d.a} × ${h} = ${c}` : `${c} = ${d.a} × ${h}`;
    el.innerHTML = `<p class="q">Complète :</p><p class="eq">${eq}</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le nombre qui manque', 3);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
