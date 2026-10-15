/**
 * Multiplication posée = découpage rangé (distributivité) : 548 × 16 = 548 × 6 + 548 × 10.
 * Une ligne par chiffre du second facteur (son « produit partiel »), puis la somme.
 * Programme : CE2 (période 4) 2–3 chiffres × 1–2 chiffres ; CM1–CM2 jusqu'à 3 chiffres × 2–3 chiffres.
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, UNITS, fmt } from '../engine/types';
import { lineFields } from '../ui/lines';

export interface MulData { lv: Level; p: Palier; a: number; b: number }
const SHAPE: Record<Level, [number, number][]> = {
  CE1: [[2, 1], [2, 1], [2, 1]],
  CE2: [[2, 1], [3, 1], [2, 2]],
  CM1: [[3, 1], [2, 2], [3, 2]],
  CM2: [[3, 2], [3, 2], [3, 3]],
};
/** produits partiels non nuls : a × (chiffre de b) × 10^k */
export const partials = (d: MulData) => String(d.b).split('').reverse().map((c, k) => ({ k, c: Number(c), v: d.a * Number(c) * 10 ** k })).filter((x) => x.c > 0);
export const nLines = (d: MulData) => { const ps = partials(d); return ps.length > 1 ? ps.length + 1 : 1; };
export const mulpose: ExoType<MulData, (number | null)[]> = {
  id: 'mulpose', title: 'Multiplication posée', notion: 'Multiplication posée', levels: ['CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const [la, lb] = SHAPE[lv][p - 1];
    for (;;) {
      const a = r.int(10 ** (la - 1) + 1, 10 ** la - 1), b = r.int(lb === 1 ? 3 : 10 ** (lb - 1) + 1, 10 ** lb - 1);
      if (lv === 'CE2' && a * b > 9999) continue;
      if (a % 10 === 0 || (b > 9 && b % 10 === 0)) continue;
      return { lv, p, a, b };
    }
  },
  solution: (d) => { const ps = partials(d); return ps.length > 1 ? [...ps.map((x) => x.v), d.a * d.b] : [d.a * d.b]; },
  check(d, a) {
    const good = mulpose.solution(d);
    const ps = partials(d);
    const bad = good.map((g, i) => (a[i] !== g ? i : -1)).filter((i) => i >= 0);
    if (!bad.length) return { ok: true };
    for (const i of bad) {
      if (i < ps.length && ps.length > 1) {
        const x = ps[i];
        if (x.k > 0 && a[i] === d.a * x.c) return { ok: false, bad, msg: `Cette ligne, c’est × ${fmt(x.c * 10 ** x.k)}, pas × ${x.c} : le ${x.c} est le chiffre des ${UNITS[x.k].many}. Elle se décale de ${x.k} rang${x.k > 1 ? 's' : ''} (un 0 à droite${x.k > 1 ? ' par rang' : ''}).` };
        return { ok: false, bad, msg: `Vérifie la ligne ${fmt(d.a)} × ${fmt(x.c * 10 ** x.k)}. N’oublie pas les retenues.` };
      }
    }
    if (ps.length > 1 && bad.length === 1 && bad[0] === good.length - 1) return { ok: false, bad, msg: `Tes lignes sont justes ! Il reste à bien les additionner (attention aux retenues).` };
    const g = d.a * d.b;
    const last = a[a.length - 1];
    if (ps.length === 1 && last !== null && last === Number(String(d.a).split('').map((c) => String(Number(c) * d.b % 10)).join(''))) return { ok: false, bad, msg: `Tu as oublié les retenues. Par exemple, ${d.a % 10} × ${d.b} = ${(d.a % 10) * d.b} : on écrit ${(d.a % 10) * d.b % 10} et on retient ${Math.floor((d.a % 10) * d.b / 10)}.` };
    if (last !== null && Math.abs(last - g) < g / 2) return { ok: false, bad, msg: `Presque. Refais chaque petite multiplication, de droite à gauche, avec les retenues.` };
    return { ok: false, bad, msg: `Multiplie chaque chiffre de ${fmt(d.a)} par ${d.b > 9 ? 'chaque chiffre du nombre du bas' : d.b}, en commençant par les unités.` };
  },
  hint(d) {
    const ps = partials(d);
    if (ps.length === 1) { const t = Math.floor(d.a / 10) * 10; return `${fmt(d.a)} × ${d.b}, c’est ${fmt(t)} × ${d.b} + ${d.a - t} × ${d.b}.`; }
    return `${fmt(d.a)} × ${fmt(d.b)} = ${ps.map((x) => `${fmt(d.a)} × ${fmt(x.c * 10 ** x.k)}`).join(' + ')}. Une ligne pour chaque morceau.`;
  },
  correction(d) {
    const ps = partials(d);
    return `<p>${ps.map((x) => `${fmt(d.a)} × ${fmt(x.c * 10 ** x.k)} = ${fmt(x.v)}`).join('<br>')}</p><p><b>${fmt(d.a)} × ${fmt(d.b)} = ${fmt(d.a * d.b)}</b></p>`;
  },
  mount(el, d) {
    const ps = partials(d);
    const specs = ps.length > 1
      ? [...ps.map((x) => ({ label: `${fmt(d.a)} × ${fmt(x.c * 10 ** x.k)}`, aria: `Ligne ${fmt(d.a)} fois ${fmt(x.c * 10 ** x.k)}` })), { label: 'Total', aria: 'Total' }]
      : [{ label: '', aria: 'Résultat' }];
    el.innerHTML = `<p class="q">Pose et calcule : <b>${fmt(d.a)} × ${fmt(d.b)}</b></p><p class="tip">${ps.length > 1 ? 'Une ligne par chiffre du bas, puis le total. Touche une ligne pour l’écrire.' : 'Commence par les unités, sans oublier les retenues.'}</p><div class="w-ln"></div>`;
    const head = `<div class="ln-top">${fmt(d.a)}</div><div class="ln-top">× ${fmt(d.b)}</div><div class="ln-bar"></div>`;
    const L = lineFields(el.querySelector('.w-ln')!, specs, head);
    return {
      answer: () => L.values(),
      ready: () => (L.values().some((x) => x === null) ? 'Remplis toutes les lignes avant de vérifier.' : null),
      lock: () => L.lock(), showBad: (b) => L.showBad(b),
    };
  },
};
