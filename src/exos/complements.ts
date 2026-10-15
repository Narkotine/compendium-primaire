/**
 * « Égalités à trou » (programme CE1 : 4 + … = 12 ; 10 = 7 + … ; compléments à 10, à la dizaine supérieure, à 100).
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier } from '../engine/types';
import { keypad } from '../ui/keypad';

export interface ComData { lv: Level; p: Palier; a: number; c: number; kind: 'table' | 'dizaine' | 'cent' | 'mille'; form: 0 | 1 | 2 }
const KINDS: Record<Level, ComData['kind'][][]> = {
  CE1: [['table'], ['table', 'dizaine'], ['dizaine', 'cent']],
  CE2: [['table', 'dizaine'], ['dizaine', 'cent'], ['cent', 'mille']],
  CM1: [['dizaine', 'cent'], ['cent', 'mille'], ['cent', 'mille']],
  CM2: [['cent', 'mille'], ['cent', 'mille'], ['mille']],
  '6e': [['mille'], ['mille'], ['mille']],
};
export const comText = (d: ComData) => {
  const b = d.c - d.a;
  void b;
  return d.form === 0 ? `${d.a} + … = ${d.c}` : d.form === 1 ? `… + ${d.a} = ${d.c}` : `${d.c} = ${d.a} + …`;
};
export const complements: ExoType<ComData, number> = {
  id: 'complements',
  title: 'Égalités à trou',
  notion: 'Faits numériques et compléments',
  levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const kind = r.pick(KINDS[lv][p - 1]);
    let a: number, c: number;
    if (kind === 'table') { c = r.int(11, 20); a = r.int(c - 10 < 2 ? 2 : c - 9, 9); }
    else if (kind === 'dizaine') { a = r.int(11, lv === 'CE1' ? 99 : 999); if (a % 10 === 0) a++; c = Math.ceil(a / 10) * 10; }
    else if (kind === 'cent') { a = r.int(1, 99); if (a % 10 === 0) a += r.int(1, 9); c = 100; }
    else { a = r.int(101, 999); if (a % 100 === 0) a += 7; c = 1000; }
    return { lv, p, a, c, kind, form: p === 1 ? 0 : (r.int(0, 2) as 0 | 1 | 2) };
  },
  solution: (d) => d.c - d.a,
  check(d, x) {
    const g = d.c - d.a;
    if (x === g) return { ok: true };
    if (x === d.c + d.a) return { ok: false, msg: `Tu as ajouté les deux nombres. On cherche ce qui MANQUE pour aller de ${d.a} à ${d.c}.` };
    if (d.kind === 'cent' && x === g + 10) return { ok: false, msg: `Vérifie : ${d.a} + ${x} = ${d.a + x}, pas 100. Attention aux dizaines : les unités font déjà une dizaine de plus.` };
    if (d.kind === 'mille' && (x === g + 100 || x === g + 110 || x === g + 10)) return { ok: false, msg: `Vérifie : ${d.a} + ${x} = ${d.a + x}, pas 1 000. Pense aux échanges : 10 unités font une dizaine.` };
    if (Math.abs(x - g) === 1) return { ok: false, msg: `Presque ! Vérifie en ajoutant : ${d.a} + ${x} = ${d.a + x}.` };
    return { ok: false, msg: `Vérifie en ajoutant : ${d.a} + ${x} = ${d.a + x}. Est-ce bien ${d.c} ?` };
  },
  hint(d) {
    if (d.kind === 'table') return `Va d’abord jusqu’à 10 : ${d.a} + ${10 - d.a} = 10. Puis de 10 à ${d.c}, il faut encore ${d.c - 10}.`;
    if (d.kind === 'dizaine') return `Regarde seulement les unités : ${d.a % 10}. Combien faut-il pour faire 10 ?`;
    if (d.kind === 'cent') return `D’abord la dizaine juste au-dessus : ${d.a} + ${10 - (d.a % 10)} = ${Math.ceil(d.a / 10) * 10}. Puis jusqu’à 100.`;
    return `D’abord la centaine juste au-dessus : ${Math.ceil(d.a / 100) * 100}. Puis jusqu’à 1 000.`;
  },
  correction: (d) => `<p>${d.a} + <b>${d.c - d.a}</b> = ${d.c}</p><p class="small">On vérifie toujours en ajoutant.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Complète :</p><p class="eq">${comText(d).replace('…', '<span class="hole">?</span>')}</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le nombre qui manque', 4);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
