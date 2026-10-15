/**
 * « Demi-droite graduée » : placer un nombre (paliers 1–2) ou lire un point (palier 3).
 * Pas de 1, 10, 100 (CE1), et 1 000 (CE2) ; portions qui ne commencent pas à 0.
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, MAXN, fmt } from '../engine/types';
import { numberLine } from '../ui/numberline';
import { keypad } from '../ui/keypad';

export interface DroData { lv: Level; p: Palier; start: number; step: number; k: number; labeled: number[]; mode: 'placer' | 'lire' }
export const N_INT = 10;
const val = (d: DroData, k: number) => d.start + k * d.step;

export const droite: ExoType<DroData, number> = {
  id: 'droite',
  title: 'Placer sur la demi-droite graduée',
  notion: 'La demi-droite graduée',
  levels: ['CE1', 'CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const steps = { CE1: [1, 10, 100], CE2: [1, 10, 100, 1000], CM1: [10, 100, 1000, 10000, 100000], CM2: [1000, 10000, 100000, 1000000, 10000000] }[lv];
    const max = MAXN[lv] + 1;
    for (;;) {
      const step = p === 1 ? r.pick(steps.slice(0, 2)) : r.pick(steps);
      const start = step * r.int(0, Math.floor(max / step) - N_INT);
      if (start + N_INT * step > max) continue;
      // graduations étiquetées : p1 deux voisines au début ; p2/p3 deux graduations éloignées (il faut trouver le pas)
      const a = p === 1 ? 0 : r.int(0, 3);
      const labeled = p === 1 ? [0, 1] : [a, a + r.pick([2, 5])];
      const k = r.int(1, N_INT);
      if (labeled.includes(k)) continue;
      return { lv, p, start, step, k, labeled, mode: p === 3 ? 'lire' : 'placer' };
    }
  },
  solution: (d) => (d.mode === 'placer' ? d.k : val(d, d.k)),
  check(d, a) {
    if (d.mode === 'placer') {
      if (a === d.k) return { ok: true };
      if (Math.abs(a - d.k) === 1) return { ok: false, msg: `Tu es juste à côté. Compte les espaces entre les traits, pas les traits.` };
      return { ok: false, msg: `Trouve d'abord le pas : de combien on avance d'une graduation à la suivante ?` };
    }
    const good = val(d, d.k);
    if (a === good) return { ok: true };
    if (a === val(d, d.k - 1) || a === val(d, d.k + 1)) return { ok: false, msg: `Presque : tu t'es décalé d'une graduation. Compte les espaces depuis un nombre écrit.` };
    const gap = d.labeled[1] - d.labeled[0];
    if (gap > 1 && a === val(d, d.labeled[0]) + (d.k - d.labeled[0]) * d.step * gap) return { ok: false, msg: `Une graduation ne vaut pas ${fmt(d.step * gap)} ici : il y a ${gap} espaces entre ${fmt(val(d, d.labeled[0]))} et ${fmt(val(d, d.labeled[1]))}.` };
    if (a === val(d, d.labeled[0]) + (d.k - d.labeled[0])) return { ok: false, msg: `Le pas ne vaut pas 1 ici. Regarde les nombres écrits pour le trouver.` };
    return { ok: false, msg: `Trouve d'abord le pas, puis avance de graduation en graduation.` };
  },
  hint(d) {
    const [a, b] = d.labeled;
    return `De ${fmt(val(d, a))} à ${fmt(val(d, b))}, il y a ${b - a} espace${b - a > 1 ? 's' : ''}. Donc un espace vaut ${b - a > 1 ? `${fmt(val(d, b) - val(d, a))} ÷ ${b - a} = ` : ''}${fmt(d.step)}.`;
  },
  correction(d) {
    const a = d.labeled[0];
    const n = d.k - a;
    return `<p>Le pas est <b>${fmt(d.step)}</b>. Depuis ${fmt(val(d, a))}, on avance de ${Math.abs(n)} graduation${Math.abs(n) > 1 ? 's' : ''} ${n > 0 ? 'vers la droite' : 'vers la gauche'} : ${fmt(val(d, a))} ${n > 0 ? '+' : '−'} ${Math.abs(n)} × ${fmt(d.step)} = <b>${fmt(val(d, d.k))}</b>.</p>`;
  },
  mount(el, d) {
    const labels = Object.fromEntries(d.labeled.map((k) => [k, fmt(val(d, k))]));
    if (d.mode === 'placer') {
      el.innerHTML = `<p class="q">Place le nombre <b class="big">${fmt(val(d, d.k))}</b> sur la demi-droite.</p><div class="w-nl"></div>`;
      const nl = numberLine(el.querySelector('.w-nl')!, { ticks: N_INT, labels });
      return { answer: () => nl.pos(), lock: () => nl.lock() };
    }
    el.innerHTML = `<p class="q">Quel nombre est au point <b>?</b></p><div class="w-nl"></div><div class="w-kp"></div>`;
    const nl = numberLine(el.querySelector('.w-nl')!, { ticks: N_INT, labels, marked: d.k });
    el.querySelector('.nl-btns')?.remove();
    nl.lock();
    el.querySelector('.nl-svg')?.removeAttribute('role');
    el.querySelector('.nl-svg')?.setAttribute('tabindex', '-1');
    const k = keypad(el.querySelector('.w-kp')!, 'Ta réponse');
    return { answer: () => k.value(), lock: () => { k.lock(); nl.lock(); } };
  },
};
