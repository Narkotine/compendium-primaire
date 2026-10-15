/** « Ranger » : 4 ou 5 nombres à mettre dans l'ordre (programme : jusqu'à cinq nombres, ex. 234, 243, 239, 300, 229). */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../engine/types';
import { orderList } from '../ui/order';

export interface RanData { lv: Level; p: Palier; nums: number[]; dir: 'asc' | 'desc' }
const sorted = (d: RanData) => d.nums.map((_, i) => i).sort((a, b) => (d.dir === 'asc' ? 1 : -1) * (d.nums[a] - d.nums[b]));

export const ranger: ExoType<RanData, number[]> = {
  id: 'ranger',
  title: 'Ranger des nombres',
  notion: 'Comparer et ranger',
  levels: ['CE1', 'CE2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const big = lv === 'CE2';
    const k = p === 1 ? 4 : 5;
    for (;;) {
      const set = new Set<number>();
      if (p === 1) { // ordres de grandeur différents
        const heads = r.shuffle(big ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, k);
        for (const h of heads) set.add(big ? h * 1000 + r.int(0, 999) : h * 100 + r.int(0, 99));
      } else { // même début, chiffres permutés : 234, 243, 239…
        const base = big ? r.int(1, 9) * 1000 + r.int(0, 9) * 100 : r.int(1, 9) * 100;
        const ds = [r.int(0, 9), r.int(0, 9), r.int(0, 9)];
        set.add(base + ds[0] * 10 + ds[1]); set.add(base + ds[1] * 10 + ds[0]);
        while (set.size < k - (p === 3 ? 1 : 0)) set.add(base + r.int(0, 99));
        if (p === 3) { // un nombre avec moins de chiffres, mais de « gros » chiffres : 99 < 100, 999 < 1 009
          set.add(big ? r.int(900, 999) : r.int(90, 99));
        }
      }
      const nums = r.shuffle([...set]);
      if (nums.length !== k) continue;
      const d: RanData = { lv, p, nums, dir: r.next() < 0.5 ? 'asc' : 'desc' };
      if (sorted(d).every((x, i) => x === i)) continue; // pas déjà rangé
      return d;
    }
  },
  solution: (d) => sorted(d),
  check(d, a) {
    const good = sorted(d);
    const vals = a.map((i) => d.nums[i]);
    const bad = a.map((x, k) => (x !== good[k] ? k : -1)).filter((k) => k >= 0);
    if (!bad.length) return { ok: true };
    if (a.every((x, k) => x === good[good.length - 1 - k])) return { ok: false, bad, msg: `Tu as rangé dans l'autre sens. On demande du ${d.dir === 'asc' ? 'plus petit au plus grand' : 'plus grand au plus petit'}.` };
    // première paire mal rangée
    for (let k = 0; k < vals.length - 1; k++) {
      const [x, y] = [vals[k], vals[k + 1]];
      if ((d.dir === 'asc' && x > y) || (d.dir === 'desc' && x < y)) {
        const [sm, bg] = x < y ? [x, y] : [y, x];
        if (String(sm).length < String(bg).length) return { ok: false, bad: [k, k + 1], msg: `${fmt(bg)} a plus de chiffres que ${fmt(sm)} : il est plus grand, même si ses chiffres ont l'air petits.` };
        return { ok: false, bad: [k, k + 1], msg: `Regarde ${fmt(x)} et ${fmt(y)} : compare les chiffres de gauche à droite. Le premier chiffre différent décide.` };
      }
    }
    return { ok: false, bad, msg: 'Ce n’est pas encore rangé.' };
  },
  hint: (d) => `Cherche d'abord le ${d.dir === 'asc' ? 'plus petit' : 'plus grand'} nombre : compte les chiffres, puis compare de gauche à droite.`,
  correction(d) {
    const s = sorted(d).map((i) => fmt(d.nums[i]));
    return `<p><b>${s.join(d.dir === 'asc' ? ' < ' : ' > ')}</b></p><p>On compare d'abord le nombre de chiffres, puis les chiffres de gauche à droite.</p>`;
  },
  mount(el, d) {
    el.innerHTML = `<p class="q">Range ces nombres du <b>${d.dir === 'asc' ? 'plus petit au plus grand' : 'plus grand au plus petit'}</b>.</p><p class="tip">Glisse une carte à sa place, ou utilise les flèches.</p><div class="w-ord"></div>`;
    const o = orderList(el.querySelector('.w-ord')!, d.nums.map(fmt), d.dir === 'asc' ? '▲ le plus petit' : '▲ le plus grand', d.dir === 'asc' ? '▼ le plus grand' : '▼ le plus petit');
    return { answer: () => o.order(), lock: () => o.lock(), showBad: (b) => o.showBad(b) };
  },
};
