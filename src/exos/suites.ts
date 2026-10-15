/**
 * « Compter de n en n » (CE1–CE2) : compléter une bande de nombres (programme : bande lacunaire 391, 392, 393, …).
 * Palier 3 : on passe une dizaine, une centaine ou un millier (395 → 405, 1 990 → 2 010).
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, MAXN, fmt } from '../engine/types';
import { keypad } from '../ui/keypad';

export interface SuiData { lv: Level; p: Palier; start: number; step: number; len: number; hole: number }
export const term = (d: SuiData, i: number) => d.start + i * d.step;
/** Erreur « sans échange » : on ajoute 1 au chiffre du rang du pas, sans retenue (395 + 10 → 3 105). */
export function noCarry(prev: number, step: number): number | null {
  const abs = Math.abs(step);
  if (!/^10*$/.test(String(abs)) || step < 0) return null;
  const s = String(prev);
  const pos = s.length - String(abs).length; // index du chiffre concerné
  if (pos < 0 || s[pos] !== '9') return null;
  return Number(s.slice(0, pos) + '10' + s.slice(pos + 1));
}

export const suites: ExoType<SuiData, number> = {
  id: 'suites',
  title: 'Compter de n en n',
  notion: 'Compter de n en n, suites',
  levels: ['CE1', 'CE2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const steps = lv === 'CE1' ? [1, 2, 5, 10, 100] : [1, 10, 100, 1000, 5, 50, 25];
    const max = MAXN[lv];
    const len = 6;
    for (;;) {
      const up = p === 1 ? true : r.next() < 0.6;
      const mag = p === 1 ? r.pick([1, 10, ...(lv === 'CE2' ? [100] : [2, 5])]) : r.pick(steps);
      const step = up ? mag : -mag;
      const start = r.int(lv === 'CE1' ? 10 : 100, max);
      const hole = r.int(2, len - 1);
      const d: SuiData = { lv, p, start, step, len, hole };
      const all = Array.from({ length: len }, (_, i) => term(d, i));
      if (all.some((x) => x < 0 || x > max)) continue;
      // palier 3 : la case vide franchit un « rang » (le chiffre à gauche change)
      const crosses = (a: number, b: number) => Math.floor(a / (Math.abs(step) * 10)) !== Math.floor(b / (Math.abs(step) * 10));
      if (p === 3 && !crosses(term(d, hole - 1), term(d, hole))) continue;
      if (p === 3 && !/^10*$/.test(String(mag))) continue;
      return d;
    }
  },
  solution: (d) => term(d, d.hole),
  check(d, a) {
    const good = term(d, d.hole);
    if (a === good) return { ok: true };
    const prev = term(d, d.hole - 1);
    if (a === prev - d.step) return { ok: false, msg: `Regarde dans quel sens va la suite : elle ${d.step > 0 ? 'monte' : 'descend'}.` };
    const nc = noCarry(prev, d.step);
    if (nc !== null && a === nc) return { ok: false, msg: `Un chiffre ne peut pas valoir 10. Quand on dépasse 9, on fait un échange : 10 ${d.step === 1 ? 'unités font 1 dizaine' : d.step === 10 ? 'dizaines font 1 centaine' : d.step === 100 ? 'centaines font 1 millier' : 'milliers font 1 dizaine de milliers'}.` };
    if (Math.abs(a - prev) === 1 && Math.abs(d.step) !== 1) return { ok: false, msg: `Ici, on n'avance pas de 1. Regarde de combien on avance entre deux cases.` };
    if (a === good + d.step || a === good - d.step) return { ok: false, msg: `Tu t'es décalé d'une case. Pars du nombre juste avant la case vide.` };
    return { ok: false, msg: `Trouve d'abord de combien on avance entre deux cases.` };
  },
  hint: (d) => `Entre deux cases, on ${d.step > 0 ? 'ajoute' : 'enlève'} ${fmt(Math.abs(d.step))}. Pars de ${fmt(term(d, d.hole - 1))}.`,
  correction: (d) => `<p>${fmt(term(d, d.hole - 1))} ${d.step > 0 ? '+' : '−'} ${fmt(Math.abs(d.step))} = <b>${fmt(term(d, d.hole))}</b></p>`,
  mount(el, d) {
    const cells = Array.from({ length: d.len }, (_, i) => (i === d.hole ? '<span class="band-c band-hole">?</span>' : `<span class="band-c">${fmt(term(d, i))}</span>`)).join('');
    el.innerHTML = `<p class="q">Quel nombre manque dans la bande ?</p><div class="band">${cells}</div><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le nombre qui manque');
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
