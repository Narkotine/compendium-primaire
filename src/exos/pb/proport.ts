/** Problèmes de proportionnalité (CE2 : prix unitaire donné ; CM : linéarité ×, +, pièges non proportionnels). */
import type { PbTemplate, PbInst } from './engine';
import { names, il, uOK } from './engine';
import { fmt } from '../../engine/types';
import type { Rng } from '../../engine/rng';

function useless(r: Rng): { s: string; v: number } {
  return r.pick([() => { const v = r.int(2, 6); return { s: `La boulangerie ouvre à ${v + 4} heures. `, v: v + 4 }; }, () => { const v = r.int(12, 28); return { s: `On est le ${v} du mois. `, v }; }])();
}
const ops = ['+', '−', '×', '÷'];
const base = (o: Pick<PbInst, 'text' | 'question' | 'nums' | 'answer' | 'unit' | 'model' | 'hint'> & Partial<PbInst>, u: { v: number } | null): PbInst => ({ slots: o.nums.length, ops, useless: u && !o.nums.includes(u.v) ? [u.v] : [], ...o } as PbInst);

export const PROPPB: PbTemplate[] = [
  { id: 'unitaire', levels: ['CE2', 'CM1', 'CM2', '6e'], minP: 1, make(r, lv, p) {
    const pr = r.int(6, 19), q = r.int(3, 9); const u = uOK(lv, p) ? useless(r) : null;
    return base({ text: `Des tee-shirts coûtent ${pr} € chacun. ${u?.s ?? ''}`, question: `Quel est le prix de ${q} tee-shirts ?`, nums: [pr, q], answer: pr * q, unit: '€', model: `${q} × ${pr}`, hint: `${q} tee-shirts, c’est ${q} fois le prix d’un tee-shirt.`, diag: (_, o) => (o.includes('+') ? `${q} tee-shirts coûtent ${q} FOIS ${pr} €.` : null) }, u);
  } },
  { id: 'foisplus', levels: ['CM1', 'CM2', '6e'], minP: 1, make(r, lv, p) {
    const k = r.int(2, lv === 'CM1' ? 5 : 9), x = r.int(2, 6), y = r.int(3, 15); const u = uOK(lv, p) ? useless(r) : null; const [P] = names(r, 1);
    return base({ text: `${x} pains aux raisins coûtent ${y} €. ${u?.s ?? ''}${P} achète ${x * k} pains aux raisins.`, question: `Combien ${P} paie-t-${il(P)} ?`, nums: [x * k, x, y], answer: y * k, unit: '€', model: `${x * k} ÷ ${x} × ${y}`, hint: `${x * k} pains, c’est combien de fois plus que ${x} pains ? Le prix est autant de fois plus grand. (Pas besoin du prix d’un pain !)`, diag: (_, o) => (o.includes("+") || o.includes("−") ? `Ce n’est pas « autant de plus » : ${x * k} pains, c’est ${fmt(k)} fois plus que ${x} pains, donc ${k} fois plus cher.` : null) }, u);
  } },
  { id: 'additif', levels: ['CM1', 'CM2', '6e'], minP: 2, make(r, lv, p) {
    const q = r.pick([2, 3, 4]); const uu = r.int(3, 9) * q; const x1 = r.int(3, 7), x2 = r.int(1, 5);
    if ((uu * x1) % q || (uu * x2) % q || x1 === x2) return null;
    const y1 = (uu * x1) / q, y2 = (uu * x2) / q; const u = uOK(lv, p) ? useless(r) : null;
    return base({ text: `${x1} kg de pommes coûtent ${y1} €. ${x2} kg de pommes coûtent ${y2} €. ${u?.s ?? ''}`, question: `Combien coûtent ${x1 + x2} kg de pommes ?`, nums: [y1, y2], answer: y1 + y2, unit: '€', model: `${y1} + ${y2}`, hint: `${x1 + x2} kg, c’est ${x1} kg + ${x2} kg.`, uselessDiag: (n) => (n === x1 || n === x2 ? `${n} kg ne se paie pas ${n} € ! On cherche le prix : ${x1 + x2} kg = ${x1} kg + ${x2} kg, donc on ajoute les deux prix.` : null) }, u);
  } },
  { id: 'manege', levels: ['CM1', 'CM2', '6e'], minP: 3, make(r) {
    // piège non proportionnel : une entrée fixe
    const e = r.int(3, 8), t = r.int(2, 4), n = r.int(5, 9), tot = e + t * 3; const [P] = names(r, 1);
    const inst = base({ text: `À la fête foraine, l’entrée coûte ${e} €, puis chaque tour de manège coûte ${t} €. Pour 3 tours, ${P} a payé ${tot} € en tout.`, question: `Combien paiera-t-on pour ${n} tours ?`, nums: [e, t, n], answer: e + t * n, unit: '€', model: `${e} + ${t} × ${n}`, hint: `Ce n’est pas proportionnel : l’entrée se paie une seule fois. Calcule le prix des ${n} tours, puis ajoute l’entrée.`, diag: (_, o) => (!o.includes('×') ? `Chaque tour coûte ${t} € : il faut multiplier.` : null) }, null);
    inst.useless = [3, tot].filter((v) => ![e, t, n].includes(v));
    inst.uselessDiag = (v) => (v === tot || v === 3 ? `Attention : ${tot} € pour 3 tours, ce n’est pas proportionnel (l’entrée est comptée une fois). Recalcule à partir de l’entrée et du prix d’un tour.` : null);
    return inst;
  } },
  { id: 'deux', levels: ['CM2', '6e'], minP: 3, make(r) {
    const k = r.int(2, 4), x = r.int(2, 5), y = r.int(2, 6) * 50, b = r.int(2, 9);
    return base({ text: `Pour ${x} crêpes, il faut ${y} g de farine. Le cuisinier veut faire ${x * k} crêpes. Il a déjà ${b * 10} g de farine.`, question: `Combien de grammes de farine doit-il encore acheter ?`, nums: [x * k, x, y, b * 10], slots: 4, answer: (y * k) - b * 10, unit: 'g', model: `${x * k} ÷ ${x} × ${y} − ${b * 10}`, hint: `Deux étapes : la farine pour ${x * k} crêpes (${k} fois plus), puis on enlève ce qu’il a déjà.`, diag: (_, o) => (!o.includes('−') ? `Il a déjà de la farine : il faut l’enlever de ce qu’il lui faut.` : null) }, null);
  } },
];
