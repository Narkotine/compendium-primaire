/** Problèmes de division : partage (valeur d'une part), groupement (nombre de parts), interprétation du reste, deux étapes. */
import type { PbTemplate, PbInst } from './engine';
import { names, il, uOK } from './engine';
import { fmt, type Level } from '../../engine/types';
import type { Rng } from '../../engine/rng';

const K: Record<Level, [number, number]> = { CE1: [2, 5], CE2: [2, 9], CM1: [3, 9], CM2: [3, 9], '6e': [3, 9] };
const Q: Record<Level, [number, number]> = { CE1: [2, 10], CE2: [3, 20], CM1: [12, 150], CM2: [25, 999], '6e': [50, 9999] };
function useless(r: Rng): { s: string; v: number } {
  return r.pick([
    () => { const v = r.int(2, 6); return { s: `C’est le ${v}e jour de la kermesse. `, v }; },
    () => { const v = r.int(12, 29); return { s: `La maîtresse a ${v} ans de métier. `, v }; },
    () => { const v = r.int(3, 9); return { s: `Le car part à ${v} heures. `, v }; },
  ])();
}
const ops = ['+', '−', '×', '÷'];
const mk = (o: Partial<PbInst> & Pick<PbInst, 'text' | 'question' | 'nums' | 'answer' | 'unit' | 'model' | 'hint'>, u: { v: number } | null): PbInst =>
  ({ slots: o.nums.length, ops, useless: u && !o.nums.includes(u.v) ? [u.v] : [], ...o } as PbInst);
const notMul = (n: number, k: number) => (_: number[], o: string[]) => (o.includes('×') ? `Le résultat doit être plus petit que ${fmt(n)} : on partage, on ne multiplie pas.` : o.includes('−') ? `Enlever ${k} une seule fois ne suffit pas : on cherche combien de fois ${k} il y a dans ${fmt(n)}.` : null);

export const DIVISIFS: PbTemplate[] = [
  { id: 'partage', levels: ['CE2', 'CM1', 'CM2', '6e'], minP: 1, make(r, lv, p) {
    const k = r.int(...K[lv]), q = r.int(...Q[lv]); const n = k * q; const u = uOK(lv, p) ? useless(r) : null;
    return mk({ text: `${k} enfants se partagent ${fmt(n)} images. ${u?.s ?? ''}Chacun doit avoir le même nombre d’images.`, question: `Combien d’images aura chaque enfant ?`, nums: [n, k], answer: q, unit: 'images', model: `${fmt(n)} ÷ ${k}`, hint: `On partage ${fmt(n)} en ${k} parts égales.`, diag: notMul(n, k) }, u);
  } },
  { id: 'groupes', levels: ['CE2', 'CM1', 'CM2', '6e'], minP: 1, make(r, lv, p) {
    const k = r.int(...K[lv]), q = r.int(...Q[lv]); const n = k * q; const u = uOK(lv, p) ? useless(r) : null;
    return mk({ text: `Il y a ${fmt(n)} élèves pour le tournoi. ${u?.s ?? ''}On fait des équipes de ${k} élèves.`, question: `Combien y aura-t-il d’équipes ?`, nums: [n, k], answer: q, unit: 'équipes', model: `${fmt(n)} ÷ ${k}`, hint: `Combien de groupes de ${k} peut-on faire avec ${fmt(n)} élèves ?`, diag: notMul(n, k) }, u);
  } },
  { id: 'audessus', levels: ['CE2', 'CM1', 'CM2', '6e'], minP: 2, make(r, lv, p) {
    // « 189 photos, 10 par page » : il faut une page de plus pour le reste
    const k = r.pick(lv === 'CE2' ? [10, 5, 4] : [6, 8, 9, 10, 12]); const q = r.int(...Q[lv]); const n = k * q + r.int(1, k - 1); const u = uOK(lv, p) ? useless(r) : null;
    return mk({ text: `Je range mes ${fmt(n)} photos dans un album. ${u?.s ?? ''}Je peux mettre ${k} photos par page.`, question: `Combien de pages me faut-il pour ranger TOUTES mes photos ?`, nums: [n, k], answer: q + 1, exprValue: n / k, unit: 'pages', model: `${fmt(n)} ÷ ${k}`, hint: `Fais la division. S’il reste des photos, il faut encore une page pour elles.`, diag: notMul(n, k), resDiag: (x) => (x === q ? `${fmt(n)} = ${k} × ${fmt(q)} + ${n - k * q} : il reste ${n - k * q} photos. Elles ont besoin d’une page aussi !` : null) }, u);
  } },
  { id: 'audessous', levels: ['CE2', 'CM1', 'CM2', '6e'], minP: 2, make(r, lv, p) {
    const k = 6; const q = r.int(...Q[lv]); const n = k * q + r.int(1, 5); const u = uOK(lv, p) ? useless(r) : null;
    return mk({ text: `Un fermier a ${fmt(n)} œufs. ${u?.s ?? ''}Il les vend par boîtes de 6.`, question: `Combien de boîtes PLEINES peut-il vendre ?`, nums: [n, k], answer: q, exprValue: n / k, unit: 'boîtes', model: `${fmt(n)} ÷ 6`, hint: `Fais la division. Les œufs qui restent ne remplissent pas une boîte.`, diag: notMul(n, k), resDiag: (x) => (x === q + 1 ? `Il reste ${n - 6 * q} œufs : ce n’est pas assez pour une boîte pleine.` : null) }, u);
  } },
  { id: 'reste', levels: ['CE2', 'CM1', 'CM2', '6e'], minP: 3, make(r, lv) {
    const k = r.int(...K[lv]); const q = r.int(...Q[lv]); const rr = r.int(1, k - 1); const n = k * q + rr; const [P] = names(r, 1);
    return mk({ text: `${P} partage ${fmt(n)} billes entre ${k} amis, pour que chacun en ait autant. ${il(P) === 'elle' ? 'Elle' : 'Il'} garde celles qui restent.`, question: `Combien de billes ${P} garde-t-${il(P)} ?`, nums: [n, k], answer: rr, exprValue: n / k, unit: 'billes', model: `${fmt(n)} ÷ ${k} (on garde le reste)`, hint: `Fais la division : la question porte sur le RESTE.`, diag: notMul(n, k), resDiag: (x) => (x === q ? `${fmt(q)}, c’est ce que reçoit chaque ami (le quotient). On demande ce qui reste.` : null) }, null);
  } },
  { id: 'deux', levels: ['CE2', 'CM1', 'CM2', '6e'], minP: 3, make(r, lv) {
    const k = r.int(2, 6), q = r.int(3, lv === 'CE2' ? 15 : 60); const n = k * q; const s = r.int(2, 9);
    return mk({ text: `Un club range ${fmt(n)} ballons dans ${k} sacs, autant dans chaque sac. Ensuite, on ajoute ${s} ballons neufs dans chaque sac.`, question: `Combien de ballons y a-t-il maintenant dans chaque sac ?`, nums: [n, k, s], slots: 3, answer: q + s, unit: 'ballons', model: `${fmt(n)} ÷ ${k} + ${s}`, hint: `Deux étapes : d’abord le partage, puis on ajoute les ballons neufs à chaque sac.`, diag: (_: number[], o: string[]) => (o.includes('×') ? `On ne multiplie pas : on partage, puis on ajoute.` : null) }, null);
  } },
];
