/** Problèmes « fraction d'une quantité » (CM1 : fractions unitaires ; CM2 : non unitaires), avec reste et deux étapes. */
import type { PbTemplate, PbInst } from './engine';
import { names, il, uOK } from './engine';
import { fmt } from '../../engine/types';
import { F, fracWords } from '../../engine/frac';
import type { Rng } from '../../engine/rng';

function useless(r: Rng): { s: string; v: number } {
  return r.pick([() => { const v = r.int(2, 9); return { s: `La sortie a lieu en ${['', '', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'septembre', 'octobre'][v]}, le ${v + 10}. `, v: v + 10 }; }, () => { const v = r.int(3, 9); return { s: `Le bus a ${v} minutes de retard. `, v }; }])();
}
const ops = ['+', '−', '×', '÷'];
const mk = (o: Pick<PbInst, 'text' | 'question' | 'nums' | 'answer' | 'unit' | 'model' | 'hint'> & Partial<PbInst>, u: { v: number } | null): PbInst => ({ slots: o.nums.length, ops, useless: u && !o.nums.includes(u.v) ? [u.v] : [], ...o } as PbInst);

export const FRACPB: PbTemplate[] = [
  { id: 'unitaire', levels: ['CM1', 'CM2'], minP: 1, make(r, lv, p) {
    const b = r.pick([2, 3, 4, 5, 10]); const n = b * r.int(3, 30); const [P] = names(r, 1); const u = uOK(lv, p) ? useless(r) : null;
    return mk({ text: `${P} a ${fmt(n)} billes. ${u?.s ?? ''}${il(P) === 'elle' ? 'Elle' : 'Il'} en donne ${fracWords(1, b)} (${F(1, b)}) à son frère.`, question: `Combien de billes donne-t-${il(P)} ?`, nums: [n, b], answer: n / b, unit: 'billes', model: `${fmt(n)} ÷ ${b}`, hint: `${F(1, b)} de ${fmt(n)} : on partage ${fmt(n)} en ${b} parts égales.`, diag: (_, o) => (o.includes('×') ? `${F(1, b)} de ${fmt(n)}, c’est une part de ${fmt(n)} : c’est plus petit. On divise.` : null) }, u);
  } },
  { id: 'nonunit', levels: ['CM2'], minP: 2, make(r, lv, p) {
    const b = r.pick([3, 4, 5, 10]); const a = r.int(2, b - 1); const n = b * r.int(3, 25); const u = uOK(lv, p) ? useless(r) : null;
    return mk({ text: `Un ruban mesure ${fmt(n)} cm. ${u?.s ?? ''}On en utilise ${fracWords(a, b)} (${F(a, b)}).`, question: `Quelle longueur de ruban utilise-t-on ?`, nums: [n, b, a], answer: (n / b) * a, unit: 'cm', model: `${fmt(n)} ÷ ${b} × ${a}`, hint: `Deux étapes : ${F(1, b)} du ruban (${fmt(n)} ÷ ${b}), puis ${a} fois ce morceau.`, diag: (nn, o) => (o[0] === '×' && nn[1] === b ? `On partage d’abord en ${b}, puis on multiplie par ${a}.` : null) }, u);
  } },
  { id: 'reste', levels: ['CM1', 'CM2'], minP: 3, make(r) {
    const b = r.pick([2, 3, 4, 5]); const n = b * r.int(5, 20);
    return mk({ text: `Dans une classe de ${fmt(n)} élèves, ${fracWords(1, b)} (${F(1, b)}) des élèves mangent à la maison. Les autres mangent à la cantine.`, question: `Combien d’élèves mangent à la cantine ?`, nums: [n, n, b], answer: n - n / b, unit: 'élèves', model: `${fmt(n)} − ${fmt(n)} ÷ ${b}`, hint: `Deux étapes : combien mangent à la maison (${F(1, b)} de ${fmt(n)}) ? Puis les autres.`, diag: (_, o) => (!o.includes('−') ? `On cherche LES AUTRES élèves : il faut enlever ceux qui mangent à la maison.` : null) }, null);
  } },
];
