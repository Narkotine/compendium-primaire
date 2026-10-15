/** Problèmes multiplicatifs : paquets, rangées, prix, « fois plus » ; pièges additifs ; deux étapes (prix × quantité − réduction). */
import type { PbTemplate, PbInst } from './engine';
import { names, il, uOK } from './engine';
import { fmt, type Level } from '../../engine/types';
import type { Rng } from '../../engine/rng';

const A: Record<Level, [number, number]> = { CE1: [2, 9], CE2: [3, 9], CM1: [6, 40], CM2: [12, 99] };
const B: Record<Level, [number, number]> = { CE1: [2, 10], CE2: [12, 99], CM1: [15, 250], CM2: [25, 999] };
const ab = (r: Rng, lv: Level) => [r.int(...A[lv]), lv === 'CE1' && r.next() < 0.3 ? 10 * r.int(2, 5) : r.int(...B[lv])];
function useless(r: Rng): { s: string; v: number } {
  return r.pick([
    () => { const v = r.int(2, 6); return { s: `On est le ${v} juin. `, v }; },
    () => { const v = r.int(12, 29); return { s: `Il y a ${v} élèves dans la classe. `, v }; },
    () => { const v = r.int(3, 9); return { s: `Le trajet dure ${v} minutes. `, v }; },
  ])();
}
const mk = (text: string, question: string, nums: number[], u: { v: number } | null, answer: number, unit: string, model: string, hint: string, diag: PbInst['diag'], ops = ['+', '×']): PbInst =>
  ({ text, question, nums, useless: u && !nums.includes(u.v) ? [u.v] : [], slots: nums.length, ops, answer, unit, diag, hint, model });
const plusMsg = (a: number, b: number, what: string) => (_: number[], ops: string[]) => (ops.includes('+') ? `Ajouter ${fmt(a)} et ${fmt(b)} ne suffit pas : il y a ${fmt(a)} fois ${fmt(b)} ${what}.` : null);

export const MULTIPLICATIFS: PbTemplate[] = [
  { id: 'paquets', levels: ['CE1', 'CE2', 'CM1', 'CM2'], minP: 1, make(r, lv, p) {
    const [P] = names(r, 1); const [a, b] = ab(r, lv); const u = uOK(lv, p) ? useless(r) : null;
    return mk(`${P} a ${fmt(a)} paquets de biscuits. ${u?.s ?? ''}Chaque paquet contient ${fmt(b)} biscuits.`, `Combien de biscuits ${P} a-t-${il(P)} ?`, [a, b], u, a * b, 'biscuits', `${fmt(a)} × ${fmt(b)}`, `Il y a ${fmt(a)} paquets, tous pareils : c’est ${fmt(a)} fois ${fmt(b)}.`, plusMsg(a, b, 'biscuits'));
  } },
  { id: 'rangees', levels: ['CE1', 'CE2', 'CM1', 'CM2'], minP: 1, make(r, lv, p) {
    const [a, b] = ab(r, lv); const u = uOK(lv, p) ? useless(r) : null;
    return mk(`Dans la salle de spectacle, il y a ${fmt(a)} rangées. ${u?.s ?? ''}Chaque rangée a ${fmt(b)} chaises.`, `Combien y a-t-il de chaises ?`, [a, b], u, a * b, 'chaises', `${fmt(a)} × ${fmt(b)}`, `Imagine le rectangle : ${fmt(a)} rangées de ${fmt(b)}.`, plusMsg(a, b, 'chaises'));
  } },
  { id: 'prix', levels: ['CE2', 'CM1', 'CM2'], minP: 2, make(r, lv, p) {
    const [P] = names(r, 1); const q = r.int(...A[lv]); const pr = r.int(2, lv === 'CE2' ? 25 : 99); const u = uOK(lv, p) ? useless(r) : null;
    return mk(`${P} achète ${q} livres. ${u?.s ?? ''}Un livre coûte ${pr} €.`, `Combien ${P} paie-t-${il(P)} ?`, [q, pr], u, q * pr, '€', `${q} × ${pr}`, `${q} livres au même prix : ${q} fois ${pr} €.`, plusMsg(q, pr, '€'));
  } },
  { id: 'foisplus', levels: ['CE1', 'CE2', 'CM1', 'CM2'], minP: 2, make(r, lv, p) {
    const [P, Q] = names(r, 2); const k = r.int(2, lv === 'CE1' ? 5 : 9); const b = r.int(...B[lv]); const u = uOK(lv, p) ? useless(r) : null;
    return mk(`${P} a ${fmt(b)} images. ${u?.s ?? ''}${Q} en a ${k} fois plus.`, `Combien d’images ${Q} a-t-${il(Q)} ?`, [k, b], u, k * b, 'images', `${k} × ${fmt(b)}`, `« ${k} fois plus » : ${Q} a ${k} fois le nombre d’images de ${P}.`, (_, ops) => (ops.includes('+') ? `« ${k} fois plus », ce n’est pas « ${k} de plus » : on multiplie.` : null));
  } },
  { id: 'deplus', levels: ['CE1', 'CE2', 'CM1', 'CM2'], minP: 3, make(r, lv) {
    // piège inverse : « de plus » dans un chapitre de multiplication → on ajoute
    const [P, Q] = names(r, 2); const k = r.int(2, 9); const b = r.int(...B[lv]);
    return mk(`${P} a ${fmt(b)} images. ${Q} en a ${k} de plus.`, `Combien d’images ${Q} a-t-${il(Q)} ?`, [k, b], null, k + b, 'images', `${fmt(b)} + ${k}`, `« ${k} de plus » : ${Q} a les mêmes, et encore ${k}.`, (_, ops) => (ops.includes('×') ? `Attention : « ${k} DE plus », ce n’est pas « ${k} FOIS plus ». On ajoute ${k}.` : null));
  } },
  { id: 'reduc', levels: ['CE2', 'CM1', 'CM2'], minP: 3, make(r, lv) {
    const [P] = names(r, 1); const q = r.int(3, 9); const pr = r.int(4, lv === 'CE2' ? 20 : 60); const red = r.int(2, Math.max(3, Math.floor(q * pr / 3)));
    return mk(`${P} achète ${q} places de cinéma à ${pr} € la place. ${il(P) === 'elle' ? 'Elle' : 'Il'} a un bon de réduction de ${red} €.`, `Combien ${P} paie-t-${il(P)} ?`, [q, pr, red], null, q * pr - red, '€', `${q} × ${pr} − ${red}`, `Deux étapes : d’abord le prix des ${q} places, puis on enlève la réduction.`, (_, ops) => (!ops.includes('×') ? `Les ${q} places coûtent ${pr} € chacune : il faut d’abord multiplier.` : ops.includes('+') ? `Une réduction fait payer MOINS : on l’enlève.` : null), ['+', '−', '×']);
  } },
];
