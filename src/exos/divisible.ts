/** Critères de divisibilité (programme cycle 3 : seulement par 2, 5 et 10). */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../engine/types';
import { pickCards } from '../ui/pick';

export interface DivisData { lv: Level; p: Palier; k: number; cards: number[] }
const good = (d: DivisData) => d.cards.map((n, i) => (n % d.k === 0 ? i : -1)).filter((i) => i >= 0);
const RULE: Record<number, string> = { 2: 'son chiffre des unités est 0, 2, 4, 6 ou 8', 5: 'son chiffre des unités est 0 ou 5', 10: 'son chiffre des unités est 0' };
export const divisible: ExoType<DivisData, number[]> = {
  id: 'divisible', title: 'Divisible par 2, 5 ou 10 ?', notion: 'Critères de divisibilité', levels: ['CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const k = r.pick([2, 5, 10]);
    const top = lv === 'CM1' ? 99999 : 999999;
    for (;;) {
      const set = new Set<number>();
      const ng = r.int(2, 4);
      while (set.size < ng) set.add(r.int(10, Math.floor(top / k)) * k);
      while (set.size < 6) {
        let n = r.int(100, top);
        if (p >= 2) n = n - (n % 10) + (k === 10 ? 5 : k === 5 ? r.pick([2, 4, 6, 8]) : r.pick([1, 3, 5, 7, 9])); // piège : « presque »
        if (p === 3 && k === 2) n = Number(String(r.int(2, 8) * 2) + String(r.int(100, 999)) + r.pick(['1', '3', '7'])); // commence par un chiffre pair
        if (n % k) set.add(n);
      }
      return { lv, p, k, cards: r.shuffle([...set]) };
    }
  },
  solution: good,
  check(d, a) {
    const g = good(d), s = new Set(a);
    const bad = d.cards.map((_, i) => (s.has(i) !== g.includes(i) ? i : -1)).filter((i) => i >= 0);
    if (!bad.length) return { ok: true };
    const w = a.find((i) => !g.includes(i));
    if (w !== undefined) { const n = d.cards[w]; return { ok: false, bad, msg: `${fmt(n)} se termine par ${n % 10}. Un nombre est divisible par ${d.k} si ${RULE[d.k]}. On ne regarde que le DERNIER chiffre.` }; }
    return { ok: false, bad, msg: `Il en manque. Regarde le dernier chiffre de chaque carte.` };
  },
  hint: (d) => `Un nombre est divisible par ${d.k} si ${RULE[d.k]}.`,
  correction: (d) => `<p>Divisibles par ${d.k} : <b>${good(d).map((i) => fmt(d.cards[i])).join(', ')}</b></p><p class="small">Règle : ${RULE[d.k]}.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Touche les nombres <b>divisibles par ${d.k}</b>.</p><div class="w-pk"></div>`;
    const P = pickCards(el.querySelector('.w-pk')!, d.cards.map(fmt));
    return { answer: () => P.chosen(), ready: () => (P.chosen().length ? null : 'Touche au moins une carte.'), lock: () => P.lock(), showBad: (b) => P.showBad(b) };
  },
};
