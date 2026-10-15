/** Partie 3 : calculer. Additionner / soustraire (même dénominateur, puis dénominateurs multiples), complément à 1, fraction d'une quantité, entier × fraction. */
import { rng } from '../../engine/rng';
import type { ExoType, Level, Palier } from '../../engine/types';
import { fmt } from '../../engine/types';
import { F, fracWords } from '../../engine/frac';
import { fracInput } from '../../ui/fracin';
import { keypad } from '../../ui/keypad';
import { type Frac, eqF } from './common';

type SKind = 'add' | 'sub' | 'compl' | 'mult' | 'fois';
export interface SomData { lv: Level; p: Palier; x: Frac; y: Frac; op: '+' | '−'; kind: SKind; k?: number }
const res = (d: SomData): Frac => {
  if (d.kind === 'fois') return { n: d.k! * d.x.n, d: d.x.d };
  const D = Math.max(d.x.d, d.y.d);
  const nx = d.x.n * (D / d.x.d), ny = d.y.n * (D / d.y.d);
  return { n: d.op === '+' ? nx + ny : nx - ny, d: D };
};
const KS: Record<Level, SKind[][]> = { CE1: [['add'], ['add', 'sub'], ['add', 'sub', 'compl']], CE2: [['add', 'sub', 'compl'], ['add', 'sub', 'mult'], ['mult', 'compl']], CM1: [['add', 'sub'], ['mult', 'compl'], ['mult', 'add']], CM2: [['add', 'sub', 'mult'], ['mult', 'fois'], ['mult', 'fois', 'sub']] };
export const fracsomme: ExoType<SomData, Frac> = {
  id: 'fracsomme', title: 'Ajouter et enlever des fractions', notion: 'Additionner et soustraire', levels: ['CE1', 'CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const kind = r.pick(KS[lv][p - 1]);
    const Ds = lv === 'CE1' ? [2, 3, 4, 5, 6, 8, 10] : [3, 4, 5, 6, 8, 10, 12];
    const le1 = lv === 'CE1' || lv === 'CE2';
    for (;;) {
      const b = r.pick(Ds);
      if (kind === 'fois') { const a = r.int(1, b - 1), k = r.int(2, 5); return { lv, p, x: { n: a, d: b }, y: { n: 0, d: b }, op: '+', kind, k }; }
      if (kind === 'compl') { const a = r.int(1, b - 1); return { lv, p, x: { n: b, d: b }, y: { n: a, d: b }, op: '−', kind }; }
      if (kind === 'mult') {
        const k = r.pick([2, 3]); const D = b * k; if (D > (lv === 'CE2' ? 12 : 20)) continue;
        const x = { n: r.int(1, le1 ? b - 1 : 2 * b), d: b }, y = { n: r.int(1, le1 ? D - 1 : 2 * D), d: D };
        const op = r.next() < 0.5 ? '+' : '−';
        const d: SomData = { lv, p, x, y, op, kind };
        const s = res(d); if (s.n <= 0 || (le1 && s.n > s.d)) continue;
        return d;
      }
      const big = !le1;
      const x = { n: r.int(1, big ? 2 * b : b - 1), d: b }, y = { n: r.int(1, big ? b : b - 1), d: b };
      const d: SomData = { lv, p, x, y, op: kind === 'add' ? '+' : '−', kind };
      const s = res(d); if (s.n <= 0 || (le1 && s.n > s.d)) continue;
      return d;
    }
  },
  solution: res,
  check(d, f) {
    const g = res(d);
    if (f.d > 0 && eqF(f, g)) return { ok: true };
    const { x, y } = d;
    if (d.kind === 'fois') { if (f.d === d.k! * d.x.d) return { ok: false, bad: [2], msg: `${d.k} fois ${fracWords(d.x.n, d.x.d)}, ce sont toujours des ${fracWords(2, d.x.d).split(' ')[1]} : le bas ne change pas.` }; return { ok: false, bad: [1], msg: `${d.k} × ${F(d.x.n, d.x.d)} = ${Array(d.k).fill(F(d.x.n, d.x.d)).join(' + ')}.` }; }
    if (f.d === x.d + y.d || (d.op === '−' && f.d === 0)) return { ok: false, bad: [2], msg: `On ne ${d.op === '+' ? 'additionne' : 'soustrait'} pas les dénominateurs ! On compte des ${fracWords(2, g.d).split(' ')[1]} : le bas reste ${g.d}.` };
    if (d.kind === 'mult' && f.n === (d.op === '+' ? x.n + y.n : x.n - y.n)) return { ok: false, bad: [1, 2], msg: `Les parts ne sont pas de la même taille. Transforme d’abord : ${x.d < y.d ? `${F(x.n, x.d)} = ${F(x.n * (y.d / x.d), y.d)}` : `${F(y.n, y.d)} = ${F(y.n * (x.d / y.d), x.d)}`}.` };
    if (d.kind === 'compl') return { ok: false, bad: [1], msg: `Le tout, c’est ${F(x.d, x.d)}. Il manque combien de parts pour aller de ${y.n} à ${x.d} ?` };
    if (f.d === g.d) return { ok: false, bad: [1], msg: `Le dénominateur est bon. Compte les parts : ${d.op === '+' ? `${x.n} + ${y.n}` : `${x.n} − ${y.n}`}${d.kind === 'mult' ? ' (après avoir transformé)' : ''}.` };
    return { ok: false, bad: [1, 2], msg: `On compte des ${fracWords(2, g.d).split(' ')[1]}, comme on compterait des billes.` };
  },
  hint: (d) => (d.kind === 'mult' ? `Mets les deux fractions en ${fracWords(2, Math.max(d.x.d, d.y.d)).split(' ')[1]} d’abord.` : d.kind === 'compl' ? `1 = ${F(d.x.d, d.x.d)}.` : d.kind === 'fois' ? `${d.k} × ${F(d.x.n, d.x.d)}, c’est ${d.k} fois ${d.x.n} ${fracWords(2, d.x.d).split(' ')[1]}.` : `« ${fracWords(d.x.n, d.x.d)} ${d.op === '+' ? 'plus' : 'moins'} ${fracWords(d.y.n, d.y.d)} » : on compte des ${fracWords(2, d.x.d).split(' ')[1]}.`),
  correction: (d) => { const g = res(d); return `<p><b>${d.kind === 'fois' ? `${d.k} × ${F(d.x.n, d.x.d)}` : d.kind === 'compl' ? `1 − ${F(d.y.n, d.y.d)}` : `${F(d.x.n, d.x.d)} ${d.op} ${F(d.y.n, d.y.d)}`} = ${F(g.n, g.d)}</b>${g.n > g.d && g.n % g.d ? ` = ${Math.floor(g.n / g.d)} + ${F(g.n % g.d, g.d)}` : g.n === g.d ? ' = 1' : ''}</p>`; },
  mount(el, d) {
    const left = d.kind === 'fois' ? `${d.k} × ${F(d.x.n, d.x.d)}` : d.kind === 'compl' ? `1 − ${F(d.y.n, d.y.d)}` : `${F(d.x.n, d.x.d)} ${d.op} ${F(d.y.n, d.y.d)}`;
    el.innerHTML = `<p class="q">Calcule :</p><p class="eq">${left} = <span class="hole">?</span></p><div class="w-fi"></div>`;
    const I = fracInput(el.querySelector('.w-fi')!);
    return { answer: () => I.value(), lock: () => I.lock(), showBad: (b) => I.showBad(b) };
  },
};

/* ---------- fraction d'une quantité ---------- */
export interface QData { lv: Level; p: Palier; a: number; b: number; n: number; unit: string }
const UNITS_Q = [['billes', ''], ['€', ''], ['mètres', ''], ['élèves', ''], ['minutes', '']];
export const fracquant: ExoType<QData, number> = {
  id: 'fracquant', title: 'Fraction d’une quantité', notion: 'Fraction d’une quantité', levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const b = r.pick(p === 1 ? [2, 3, 4, 10] : [2, 3, 4, 5, 6, 8, 10]);
    const a = lv === 'CM1' || p === 1 ? 1 : r.int(2, b - 1);
    const n = b * r.int(2, p === 3 ? 50 : 12);
    return { lv, p, a, b, n, unit: r.pick(UNITS_Q)[0] };
  },
  solution: (d) => (d.n / d.b) * d.a,
  check(d, x) {
    const g = (d.n / d.b) * d.a, part = d.n / d.b;
    if (x === g) return { ok: true };
    if (d.a > 1 && x === part) return { ok: false, msg: `Tu as trouvé ${fracWords(1, d.b)} : ${fmt(part)}. On en veut ${fracWords(d.a, d.b)}, donc ${d.a} fois plus.` };
    if (x === d.n * d.a * d.b || x === d.n * d.b) return { ok: false, msg: `Une fraction plus petite que 1 d’une quantité, c’est MOINS que la quantité. On partage ${fmt(d.n)} en ${d.b}.` };
    if (Number.isInteger(d.n / d.a) && x === (d.n / d.a) * d.b) return { ok: false, msg: `Tu as inversé : on partage en ${d.b} (le bas), puis on prend ${d.a} parts (le haut).` };
    if (x === d.n - g) return { ok: false, msg: `${fmt(x)}, c’est ce qui reste. On demande ${fracWords(d.a, d.b)} de ${fmt(d.n)}.` };
    return { ok: false, msg: `D’abord ${fracWords(1, d.b)} : ${fmt(d.n)} ÷ ${d.b}. ${d.a > 1 ? `Puis ${d.a} fois ce nombre.` : ''}` };
  },
  hint: (d) => `${F(1, d.b)} de ${fmt(d.n)} : partage ${fmt(d.n)} en ${d.b} parts égales.${d.a > 1 ? ` Puis prends ${d.a} parts.` : ''}`,
  correction: (d) => `<p>${fmt(d.n)} ÷ ${d.b} = ${fmt(d.n / d.b)}${d.a > 1 ? `, puis ${fmt(d.n / d.b)} × ${d.a} = ${fmt((d.n / d.b) * d.a)}` : ''}.</p><p><b>${F(d.a, d.b)} de ${fmt(d.n)} ${d.unit} = ${fmt((d.n / d.b) * d.a)} ${d.unit}</b></p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Combien font <span class="eq">${F(d.a, d.b)}</span> de <b>${fmt(d.n)} ${d.unit}</b> ?</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Ta réponse', 5);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
