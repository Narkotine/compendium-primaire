/** Quotient et reste : n = d × q + r avec r < d. Erreur typique : reste ≥ diviseur. */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../engine/types';
import { lineFields } from '../ui/lines';

export interface ResData { lv: Level; p: Palier; n: number; d: number }
export const reste: ExoType<ResData, (number | null)[]> = {
  id: 'reste', title: 'Quotient et reste', notion: 'Le reste', levels: ['CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const d = r.int(p === 1 ? 2 : 3, 9);
    const q = r.int(2, lv === 'CE2' || p === 1 ? 10 : p === 2 ? 30 : 120);
    return { lv, p, n: d * q + r.int(p === 1 ? 0 : 1, d - 1), d };
  },
  solution: (x) => [Math.floor(x.n / x.d), x.n % x.d],
  check(x, [q, r]) {
    if (q === null || r === null) return { ok: false, msg: 'Écris le quotient et le reste.' };
    const Q = Math.floor(x.n / x.d), R = x.n % x.d;
    if (q === Q && r === R) return { ok: true };
    if (r >= x.d && x.d * q + r === x.n) return { ok: false, bad: [0, 1], msg: `Ton reste ${r} est plus grand que ${x.d} (ou égal) : tu peux encore faire un groupe de ${x.d}.` };
    if (x.d * q > x.n) return { ok: false, bad: [0], msg: `${x.d} × ${fmt(q)} = ${fmt(x.d * q)} : c’est plus que ${fmt(x.n)}. Ton quotient est trop grand.` };
    if (q === Q) return { ok: false, bad: [1], msg: `Le quotient est juste. Pour le reste : ${fmt(x.n)} − ${x.d} × ${fmt(Q)} = ?` };
    return { ok: false, bad: [0, 1], msg: `Vérifie : ${x.d} × quotient + reste doit faire ${fmt(x.n)}, et le reste doit être plus petit que ${x.d}.` };
  },
  hint: (x) => `Cherche le plus grand nombre de fois ${x.d} qui ne dépasse pas ${fmt(x.n)}. Puis ce qui reste.`,
  correction: (x) => { const Q = Math.floor(x.n / x.d), R = x.n % x.d; return `<p><b>${fmt(x.n)} = ${x.d} × ${fmt(Q)} + ${R}</b></p><p>Quotient ${fmt(Q)}, reste ${R} (et ${R} &lt; ${x.d}).</p>`; },
  mount(el, x) {
    el.innerHTML = `<p class="q">Divise <b>${fmt(x.n)}</b> par <b>${x.d}</b>.</p><p class="eq small">${fmt(x.n)} = ${x.d} × <span class="hole">quotient</span> + <span class="hole">reste</span></p><div class="w-ln"></div>`;
    const L = lineFields(el.querySelector('.w-ln')!, [{ label: 'Quotient', aria: 'Quotient' }, { label: 'Reste', aria: 'Reste' }], '', 4);
    el.querySelector('.ln-bar')?.remove();
    return { answer: () => L.values(), ready: () => (L.values().some((v) => v === null) ? 'Écris le quotient et le reste.' : null), lock: () => L.lock(), showBad: (b) => L.showBad(b) };
  },
};
