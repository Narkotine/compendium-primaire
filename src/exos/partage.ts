/** « Partager équitablement » : distribuer les jetons en k parts égales (CE1–CE2). Palier 3 : il peut rester des jetons (moins que k). */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier } from '../engine/types';
import { share } from '../ui/share';

export interface ParData { lv: Level; p: Palier; n: number; k: number; who: string }
export interface ParAns { counts: number[]; left: number }
export const partage: ExoType<ParData, ParAns> = {
  id: 'partage', title: 'Partager équitablement', notion: 'Partager et grouper', levels: ['CE1', 'CE2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const k = r.int(2, p === 1 ? 3 : lv === 'CE1' ? 4 : 6);
    const per = r.int(2, lv === 'CE1' ? (p === 1 ? 5 : 7) : 9);
    const rest = p === 3 ? r.int(1, k - 1) : 0;
    return { lv, p, n: k * per + rest, k, who: r.pick(['Enfant', 'Boîte', 'Équipe']) };
  },
  solution: (d) => ({ counts: Array(d.k).fill(Math.floor(d.n / d.k)), left: d.n % d.k }),
  check(d, a) {
    const q = Math.floor(d.n / d.k);
    const mn = Math.min(...a.counts), mx = Math.max(...a.counts);
    if (mn !== mx) return { ok: false, bad: a.counts.map((v, i) => (v !== mn ? i : -1)).filter((i) => i >= 0), msg: `Les parts ne sont pas égales : de ${mn} à ${mx}. Dans un partage équitable, chacun a autant.` };
    if (a.left >= d.k) return { ok: false, msg: `Il reste ${a.left} jetons : c’est assez pour donner encore 1 jeton à chacun des ${d.k}.` };
    if (mn === q) return { ok: true };
    return { ok: false, msg: 'Continue à distribuer.' };
  },
  hint: () => `Distribue un jeton à chacun, puis encore un à chacun… jusqu’à ce qu’il n’en reste plus assez pour tout le monde.`,
  correction: (d) => `<p>${d.n} jetons en ${d.k} parts : <b>${Math.floor(d.n / d.k)} chacun</b>${d.n % d.k ? `, et il en reste ${d.n % d.k}` : ''}.</p><p class="small">${d.k} × ${Math.floor(d.n / d.k)}${d.n % d.k ? ` + ${d.n % d.k}` : ''} = ${d.n}</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Partage les <b>${d.n}</b> jetons en <b>${d.k}</b> parts égales.${d.p === 3 ? ' S’il en reste, garde-les dans le tas.' : ''}</p><div class="w-sh"></div>`;
    const S = share(el.querySelector('.w-sh')!, d.n, d.k, d.who);
    return {
      answer: () => ({ counts: S.counts(), left: S.left() }),
      ready: () => (S.counts().every((v) => v === 0) ? 'Commence par distribuer les jetons.' : null),
      lock: () => S.lock(), showBad: (b) => S.showBad(b),
    };
  },
};
