/** « Multiples » : choisir les multiples d'un nombre parmi des cartes (CE1 : nombres pairs = multiples de 2). Piège : un diviseur n'est pas un multiple. */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../engine/types';
import { pickCards } from '../ui/pick';

export interface MulsData { lv: Level; p: Palier; k: number; cards: number[] }
const KS: Record<Level, number[][]> = { CE1: [[2], [2, 5, 10], [2, 5, 10]], CE2: [[2, 5, 10], [3, 4, 5], [3, 4, 6, 25]], CM1: [[3, 4, 6], [6, 7, 8, 9], [7, 8, 9, 25]], CM2: [[3, 4, 6], [6, 7, 8, 9], [7, 8, 9, 25]], '6e': [[6, 7, 8, 9], [7, 8, 9, 25], [8, 9, 25, 50]] };
const isM = (d: MulsData, n: number) => n % d.k === 0;
const good = (d: MulsData) => d.cards.map((n, i) => (isM(d, n) ? i : -1)).filter((i) => i >= 0);
export const multiples: ExoType<MulsData, number[]> = {
  id: 'multiples', title: 'Trouver les multiples', notion: 'Multiples', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const k = r.pick(KS[lv][p - 1]);
    const top = lv === 'CE1' ? 100 : lv === 'CE2' ? 200 : 1000;
    for (;;) {
      const set = new Set<number>();
      const nm = r.int(2, 4);
      while (set.size < nm) set.add(k * r.int(2, Math.floor(top / k)));
      if (p === 3 && k > 3) { const dv = [2, 3, 5].find((x) => k % x === 0 && x !== k); if (dv) set.add(dv); }
      let g = 0;
      while (set.size < 6 && g++ < 100) { const n = r.int(10, top); if (n % k) set.add(p >= 2 && r.next() < 0.5 ? k * r.int(2, Math.floor(top / k)) + r.int(1, k - 1) : n); }
      if (set.size !== 6) continue;
      const cards = r.shuffle([...set]);
      return { lv, p, k, cards };
    }
  },
  solution: good,
  check(d, a) {
    const g = good(d);
    const s = new Set(a);
    const bad = d.cards.map((_, i) => ((s.has(i) !== g.includes(i)) ? i : -1)).filter((i) => i >= 0);
    if (!bad.length) return { ok: true };
    const wrong = a.filter((i) => !g.includes(i));
    if (wrong.length) {
      const n = d.cards[wrong[0]];
      if (d.k % n === 0) return { ok: false, bad, msg: `${n} est dans ${d.k} (${d.k} = ${n} × ${d.k / n}), mais ce n’est pas un multiple de ${d.k}. Les multiples de ${d.k} sont ${d.k}, ${2 * d.k}, ${3 * d.k}… : ils sont plus grands.` };
      if (d.k === 2) return { ok: false, bad, msg: `${fmt(n)} se termine par ${n % 10} : il est impair. Les nombres pairs se terminent par 0, 2, 4, 6 ou 8.` };
      return { ok: false, bad, msg: `${fmt(n)} n’est pas dans la table de ${d.k} : ${fmt(Math.floor(n / d.k))} × ${d.k} = ${fmt(Math.floor(n / d.k) * d.k)}, il reste ${n % d.k}.` };
    }
    return { ok: false, bad, msg: `Il manque ${g.length - a.length === 1 ? 'un multiple' : 'des multiples'}. Vérifie chaque carte.` };
  },
  hint: (d) => (d.k === 2 ? 'Un nombre pair se termine par 0, 2, 4, 6 ou 8.' : d.k === 5 ? 'Les multiples de 5 se terminent par 0 ou 5.' : d.k === 10 ? 'Les multiples de 10 se terminent par 0.' : d.k === 25 ? 'Les multiples de 25 se terminent par 00, 25, 50 ou 75.' : `Pour chaque carte, cherche dans la table de ${d.k} : tombe-t-on juste ?`),
  correction: (d) => `<p>Multiples de ${d.k} : <b>${good(d).map((i) => fmt(d.cards[i])).join(', ')}</b></p><p class="small">${good(d).map((i) => `${fmt(d.cards[i])} = ${d.k} × ${fmt(d.cards[i] / d.k)}`).join(' ; ')}</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Touche tous les ${d.k === 2 ? '<b>nombres pairs</b> (multiples de 2)' : `<b>multiples de ${d.k}</b>`}.</p><div class="w-pk"></div>`;
    const P = pickCards(el.querySelector('.w-pk')!, d.cards.map(fmt));
    return { answer: () => P.chosen(), ready: () => (P.chosen().length ? null : 'Touche au moins une carte.'), lock: () => P.lock(), showBad: (b) => P.showBad(b) };
  },
};
