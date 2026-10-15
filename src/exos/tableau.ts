/**
 * « Placer dans le tableau » : un nombre donné en unités de numération (dans le désordre), en somme ou en produits ;
 * l'enfant glisse les étiquettes-chiffres dans le tableau. Pièges : ordre mélangé, colonne absente (= 0).
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, UNITS, unitName, nCols, fmt } from '../engine/types';
import { numtable } from '../ui/numtable';

export type Form = 'unites' | 'somme' | 'produits';
export interface TabData { lv: Level; p: Palier; n: number; digits: number[]; form: Form; order: number[]; pool: number[] }

export const digitsOf = (n: number, cols: number) => String(n).padStart(cols, '0').split('').reverse().map(Number);
export function statement(d: TabData) {
  const parts = d.order.filter((k) => d.digits[k] > 0).map((k) => {
    const x = d.digits[k];
    if (d.form === 'unites') return `${x} ${unitName(k, x)}`;
    if (d.form === 'somme') return fmt(x * UNITS[k].v);
    return `${x} × ${fmt(UNITS[k].v)}`;
  });
  return d.form === 'unites' ? parts.join(', ') : parts.join(' + ');
}

export const tableau: ExoType<TabData, number[]> = {
  id: 'tableau',
  title: 'Placer les chiffres dans le tableau',
  notion: 'La valeur d’un chiffre dépend de sa place',
  levels: ['CE1', 'CE2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const cols = nCols(lv);
    const lo = lv === 'CE1' ? 100 : 1000, hi = lv === 'CE1' ? 999 : 9999;
    for (;;) {
      const n = r.int(lo, hi);
      const digits = digitsOf(n, cols);
      const zeros = digits.filter((x) => x === 0).length;
      if (p === 1 && zeros > 0) continue;
      if (p === 3 && zeros === 0) continue;
      const order = [...Array(cols).keys()].reverse();
      if (p >= 2) {
        r.shuffle(order);
        if (order.every((k, i) => k === cols - 1 - i)) continue; // vraiment dans le désordre
      }
      const form: Form = p === 3 ? r.pick(['unites', 'somme', 'produits'] as const) : p === 2 ? r.pick(['unites', 'unites', 'somme'] as const) : 'unites';
      const pool = [...digits];
      if (!pool.includes(0)) pool.push(0);
      while (pool.length < cols + 2) pool.push(r.int(1, 9));
      r.shuffle(pool);
      return { lv, p, n, digits, form, order, pool };
    }
  },
  solution: (d) => d.digits,
  check(d, a) {
    const bad = d.digits.map((x, k) => (x !== a[k] ? k : -1)).filter((k) => k >= 0);
    if (!bad.length) return { ok: true };
    const cols = d.digits.length;
    // chiffres écrits dans l'ordre de l'énoncé (lecture de gauche à droite), sans tenir compte des unités
    const shown = d.order.filter((k) => d.digits[k] > 0).map((k) => d.digits[k]);
    const typed = [...a].reverse();
    if (d.p >= 2 && shown.length === cols && shown.every((x, i) => x === typed[i]))
      return { ok: false, bad, msg: `Tu as recopié les chiffres dans l'ordre de l'énoncé. Mais il est dans le désordre ! Regarde le nom de chaque unité.` };
    const nz = typed.filter((x) => x !== 0), nzGood = [...d.digits].reverse().filter((x) => x !== 0);
    if (d.digits.includes(0) && nz.length === nzGood.length && nz.every((x, i) => x === nzGood[i]))
      return { ok: false, bad, msg: `Les chiffres sont dans le bon ordre, mais le 0 n'est pas à sa place. Quelle colonne est vide dans l'énoncé ?` };
    if ([...a].reverse().every((x, i) => x === d.digits[i]))
      return { ok: false, bad, msg: `Tu as écrit le nombre à l'envers : les unités sont tout à droite.` };
    return { ok: false, bad, msg: bad.length === 1 ? `Presque ! Regarde la case des ${UNITS[bad[0]].many}.` : `Regarde les cases en rouge : chaque chiffre va dans la colonne de son unité.` };
  },
  hint(d) {
    const z = d.digits.findIndex((x) => x === 0);
    const top = d.digits.length - 1;
    const base = d.form === 'unites' ? `Cherche « ${unitName(top, d.digits[top])} » dans l'énoncé.` : `${fmt(d.digits[top] * UNITS[top].v)} veut dire ${d.digits[top]} ${unitName(top, d.digits[top])}.`;
    return z >= 0 ? `${base} Et s'il n'y a pas de ${UNITS[z].many}, on écrit 0 dans leur case.` : `${base} Mets ce chiffre dans la colonne ${UNITS[top].short}, puis continue avec les autres.`;
  },
  correction(d) {
    return `<ul>${[...d.digits.keys()].reverse().map((k) => `<li>${UNITS[k].many} : <b>${d.digits[k]}</b>${d.digits[k] === 0 ? ' (il n’y en a pas)' : ''}</li>`).join('')}</ul><p>Le nombre est <b>${fmt(d.n)}</b>.</p>`;
  },
  mount(el, d) {
    el.innerHTML = `<p class="q">Range ce nombre dans le tableau :<br><b>${statement(d)}</b></p><p class="tip">Glisse chaque étiquette dans sa case, ou touche l’étiquette puis la case. Il y a des étiquettes en trop.</p><div class="w-nt"></div>`;
    const t = numtable(el.querySelector('.w-nt')!, d.digits.length, d.pool);
    return { answer: () => t.digits(), lock: () => t.lock(), showBad: (b) => t.showBad(b) };
  },
};
