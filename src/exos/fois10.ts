/** Multiplier par 10, 100, 1 000 : chaque chiffre change de rang (glisse-nombres). « Ajouter des zéros » n'est qu'une conséquence. */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, UNITS, MAXN, fmt } from '../engine/types';
import { keypad } from '../ui/keypad';

export interface F10Data { lv: Level; p: Palier; n: number; m: number; kind: 'prod' | 'fact' }
const MS: Record<Level, number[]> = { CE1: [10], CE2: [10, 100], CM1: [10, 100, 1000], CM2: [10, 100, 1000] };
const ans = (d: F10Data) => (d.kind === 'prod' ? d.n * d.m : d.m);
const ranks = (m: number) => String(m).length - 1;
export const fois10: ExoType<F10Data, number> = {
  id: 'fois10', title: 'Multiplier par 10, 100, 1 000', notion: '× 10, × 100, × 1 000', levels: ['CE1', 'CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const m = r.pick(MS[lv]);
    const nmax = Math.min(Math.floor(MAXN[lv] / m), p === 1 ? 99 : 99999);
    let n = r.int(p === 1 ? 2 : 11, Math.max(11, nmax));
    if (p === 2 && r.next() < 0.4 && n >= 20) n -= n % 10; // déjà un 0 à droite : 40 × 10
    if (p === 3 && nmax >= 101) { const h = r.int(1, Math.floor(nmax / 100)); n = h * 100 + r.int(1, 9); } // zéro au milieu : 307
    return { lv, p, n, m, kind: p === 3 && r.next() < 0.5 ? 'fact' : 'prod' };
  },
  solution: ans,
  check(d, x) {
    if (x === ans(d)) return { ok: true };
    if (d.kind === 'fact') return { ok: false, msg: `De ${fmt(d.n)} à ${fmt(d.n * d.m)}, de combien de rangs les chiffres ont-ils monté ? Un rang = × 10.` };
    for (const m of [1, 10, 100, 1000, 10000]) if (m !== d.m && x === d.n * m) return { ok: false, msg: m < d.m ? `Pas assez ! × ${fmt(d.m)}, chaque chiffre monte de ${ranks(d.m)} rang${ranks(d.m) > 1 ? 's' : ''}.` : `Trop ! × ${fmt(d.m)}, chaque chiffre monte de ${ranks(d.m)} rang${ranks(d.m) > 1 ? 's' : ''} seulement.` };
    if (x === d.n + d.m) return { ok: false, msg: `Tu as ajouté ${fmt(d.m)}. Multiplier par ${fmt(d.m)}, c’est prendre ${fmt(d.m)} fois le nombre.` };
    return { ok: false, msg: `Chaque chiffre garde sa place dans l’ordre, mais il monte de ${ranks(d.m)} rang${ranks(d.m) > 1 ? 's' : ''}.` };
  },
  hint: (d) => `× ${fmt(d.m)} : les unités deviennent des ${UNITS[ranks(d.m)].many}. Chaque chiffre monte de ${ranks(d.m)} rang${ranks(d.m) > 1 ? 's' : ''}, et des 0 remplissent les rangs vides à droite.`,
  correction(d) {
    const s = String(d.n), R = String(d.n * d.m);
    const L = R.length;
    const head = [...Array(L).keys()].reverse().map((k) => `<th>${UNITS[k].short}</th>`).join('');
    const row = (t: string) => [...Array(L).keys()].reverse().map((k) => `<td>${t[t.length - 1 - k] ?? ''}</td>`).join('');
    return `<p><b>${fmt(d.n)} × ${fmt(d.m)} = ${fmt(d.n * d.m)}</b></p><table class="mini"><tr>${head}</tr><tr>${row(s)}</tr><tr>${row(R)}</tr></table><p class="small">Chaque chiffre a monté de ${ranks(d.m)} rang${ranks(d.m) > 1 ? 's' : ''}.</p>`;
  },
  mount(el, d) {
    const h = '<span class="hole">?</span>';
    el.innerHTML = `<p class="q">Complète :</p><p class="eq">${d.kind === 'prod' ? `${fmt(d.n)} × ${fmt(d.m)} = ${h}` : `${fmt(d.n)} × ${h} = ${fmt(d.n * d.m)}`}</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le nombre qui manque', 9);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
