/** Demi-droite graduée décimale : placer / lire. */
import { rng } from '../../engine/rng';
import { type ExoType, type Level, type Palier } from '../../engine/types';
import { type Dec, fmtDec, parseDec } from '../../engine/dec';
import { numberLine } from '../../ui/numberline';
import { keypad } from '../../ui/keypad';

const N = 10;
export interface DdData { lv: Level; p: Palier; start: Dec; step: Dec; k: number; labeled: number[]; mode: 'placer' | 'lire' }
const val = (d: DdData, k: number): Dec => {
  const s = Math.max(d.start.s, d.step.s);
  const sn = d.start.n * 10 ** (s - d.start.s);
  const st = d.step.n * 10 ** (s - d.step.s);
  return { n: sn + k * st, s };
};
const base: ExoType<DdData, number | string> = {
  id: 'decdroite', title: 'Placer un décimal sur la droite', notion: 'Droite graduée décimale', levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    // step: 0.1 (CM1 p1), 0.01, or 1 with zoom feel
    const steps: Dec[] = lv === 'CM1'
      ? (p === 1 ? [{ n: 1, s: 1 }] : [{ n: 1, s: 1 }, { n: 1, s: 2 }])
      : (p === 1 ? [{ n: 1, s: 1 }] : [{ n: 1, s: 1 }, { n: 1, s: 2 }, { n: 1, s: 3 }]);
    const step = r.pick(steps);
    const start = { n: r.int(0, 20) * 10 ** step.s + (p === 1 ? 0 : r.int(0, 5) * step.n), s: step.s };
    // normalize start to multiple of step
    const start2 = { n: Math.floor(start.n / step.n) * step.n, s: step.s };
    const a = p === 1 ? 0 : r.int(0, 3);
    const labeled = p === 1 ? [0, 1] : [a, a + r.pick([2, 5])];
    let k = r.int(1, N);
    while (labeled.includes(k)) k = r.int(1, N);
    return { lv, p, start: start2, step, k, labeled, mode: 'placer' };
  },
  solution: (d) => (d.mode === 'placer' ? d.k : fmtDec(val(d, d.k))),
  check(d, a) {
    if (d.mode === 'placer') {
      if (a === d.k) return { ok: true };
      if (typeof a === 'number' && Math.abs(a - d.k) === 1) return { ok: false, msg: `Tu es juste à côté. Compte les espaces entre les traits.` };
      return { ok: false, msg: `Trouve le pas : d’une graduation à la suivante, on avance de ${fmtDec(d.step)}.` };
    }
    const good = val(d, d.k);
    const got = typeof a === 'string' ? parseDec(a) : null;
    if (got) {
      const s = Math.max(got.s, good.s);
      if (got.n * 10 ** (s - got.s) === good.n * 10 ** (s - good.s)) return { ok: true };
    }
    return { ok: false, msg: `Le pas est ${fmtDec(d.step)}. Compte les espaces depuis un nombre écrit.` };
  },
  hint(d) {
    const [a, b] = d.labeled;
    return `De ${fmtDec(val(d, a))} à ${fmtDec(val(d, b))}, il y a ${b - a} espace${b - a > 1 ? 's' : ''}. Un espace = ${fmtDec(d.step)}.`;
  },
  correction(d) {
    return `<p>Le pas est <b>${fmtDec(d.step)}</b>. Le point cherché est <b>${fmtDec(val(d, d.k))}</b>.</p>`;
  },
  mount(el, d) {
    const labels = Object.fromEntries(d.labeled.map((k) => [k, fmtDec(val(d, k))]));
    if (d.mode === 'placer') {
      el.innerHTML = `<p class="q">Place <b class="big">${fmtDec(val(d, d.k))}</b> sur la demi-droite.</p><div class="w-nl"></div>`;
      const nl = numberLine(el.querySelector('.w-nl')!, { ticks: N, labels });
      return { answer: () => nl.pos(), lock: () => nl.lock() };
    }
    el.innerHTML = `<p class="q">Quel nombre est au point <b>?</b></p><div class="w-nl"></div><div class="w-kp"></div>`;
    const nl = numberLine(el.querySelector('.w-nl')!, { ticks: N, labels, marked: d.k });
    el.querySelector('.nl-btns')?.remove(); nl.lock();
    const k = keypad(el.querySelector('.w-kp')!, 'Ta réponse', 3, { comma: true, maxDec: 3 });
    return { answer: () => k.value() as string | null, lock: () => { k.lock(); } };
  },
};
export const decdroite = base;
export const declire: ExoType<DdData, number | string> = {
  ...base, id: 'declire', title: 'Lire un décimal sur la droite',
  generate: (lv, p, seed) => ({ ...base.generate(lv, p, seed), mode: 'lire' }),
};
