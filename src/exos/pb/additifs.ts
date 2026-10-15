/** Problèmes additifs (programme cycle 2 : parties-tout, transformation, comparaison, deux étapes) + données inutiles. */
import type { PbTemplate, PbInst } from './engine';
import { names, il, RANGE, uOK } from './engine';
import { fmt, type Level } from '../../engine/types';
import type { Rng } from '../../engine/rng';

const n = (r: Rng, lv: Level, k = 1) => { const [a, b] = RANGE[lv]; return r.int(Math.ceil(a / k), Math.floor(b / k)); };
/** donnée inutile plausible */
function useless(r: Rng, who: string | null): { s: string; v: number } {
  return r.pick([
    () => { const v = r.int(7, 11); return who ? { s: `${who} a ${v} ans. `, v } : { s: `La sortie a lieu le ${v} mai. `, v }; },
    () => { const v = r.int(2, 6); return { s: `C’est le ${v}e jour des vacances. `, v }; },
    () => { const v = r.int(12, 30); return { s: `Dans la classe, il y a ${v} élèves. `, v }; },
    () => { const v = r.int(3, 9); return { s: `La boîte coûte ${v} €. `, v }; },
  ])();
}
const OBJ = ['billes', 'images', 'cartes', 'perles', 'timbres', 'autocollants'];
const add = (a: number, b: number) => `${fmt(a)} + ${fmt(b)}`;
const sub = (a: number, b: number) => `${fmt(a)} − ${fmt(b)}`;
const wantsPlus = (o: string[]) => o.every((x) => x === '+');

export const ADDITIFS: PbTemplate[] = [
  { id: 'tout', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'], minP: 1, make(r, lv, p) {
    const [P] = names(r, 1); const o = r.pick(OBJ); const a = n(r, lv), b = n(r, lv);
    const u = uOK(lv, p) ? useless(r, P) : null;
    return mk(`${P} range ses ${o} dans deux boîtes. Il y en a ${fmt(a)} dans la boîte verte et ${fmt(b)} dans la boîte rouge. ${u?.s ?? ''}`, `Combien de ${o} ${P} a-t-${il(P)} en tout ?`, [a, b], u, a + b, o, add(a, b), `On réunit les deux boîtes : on cherche le tout.`, (_, ops) => (ops[0] === '−' ? `On réunit les deux boîtes : le tout est plus grand que chaque boîte.` : null));
  } },
  { id: 'partie', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'], minP: 1, make(r, lv, p) {
    const [P] = names(r, 1); const o = r.pick(OBJ); const a = n(r, lv), b = n(r, lv); const t = a + b;
    const u = uOK(lv, p) ? useless(r, P) : null;
    return mk(`Dans ses deux boîtes, ${P} a ${fmt(t)} ${o}. ${u?.s ?? ''}Il y en a ${fmt(a)} dans la boîte verte.`, `Combien y en a-t-il dans la boîte rouge ?`, [t, a], u, b, o, sub(t, a), `On connaît le tout et une partie : on cherche l’autre partie.`, (_, ops) => (wantsPlus(ops) ? `La boîte rouge contient une partie du tout : elle en a moins que ${fmt(t)}.` : null));
  } },
  { id: 'avant', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'], minP: 2, make(r, lv, p) {
    // piège : « il reste » fait penser à une soustraction, mais on cherche le début
    const [P] = names(r, 1); const o = r.pick(OBJ); const b = n(r, lv), c = n(r, lv);
    const u = uOK(lv, p) ? useless(r, P) : null;
    return mk(`${P} a donné ${fmt(b)} ${o} à ses amis. ${u?.s ?? ''}Maintenant, il lui en reste ${fmt(c)}.`, `Combien de ${o} ${P} avait-${il(P)} au début ?`, [b, c], u, b + c, o, add(c, b), `Au début, il en avait plus qu’à la fin : il avait ce qui reste ET ce qu’il a donné.`, (_, ops) => (ops[0] === '−' ? `Attention au mot « reste » ! Au début, ${P} avait plus de ${o} qu’à la fin.` : null));
  } },
  { id: 'apres', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'], minP: 1, make(r, lv, p) {
    const [P] = names(r, 1); const a = n(r, lv), b = r.int(1, Math.max(1, Math.floor(a / 2)));
    const u = uOK(lv, p) ? useless(r, P) : null;
    return mk(`Dans le car de l’école, il y a ${fmt(a)} passagers. ${u?.s ?? ''}À l’arrêt, ${fmt(b)} passagers descendent.`, `Combien de passagers reste-t-il dans le car ?`, [a, b], u, a - b, 'passagers', sub(a, b), `Des passagers descendent : il en reste moins.`, (_, ops) => (wantsPlus(ops) ? `Des passagers descendent : il en reste moins qu’au départ.` : null));
  } },
  { id: 'deplus', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'], minP: 1, make(r, lv, p) {
    const [P, Q] = names(r, 2); const o = r.pick(OBJ); const a = n(r, lv), d = n(r, lv);
    const u = uOK(lv, p) ? useless(r, Q) : null;
    return mk(`${P} a ${fmt(a)} ${o}. ${u?.s ?? ''}${Q} en a ${fmt(d)} de plus que ${P}.`, `Combien de ${o} ${Q} a-t-${il(Q)} ?`, [a, d], u, a + d, o, add(a, d), `${Q} en a autant que ${P}, et encore ${fmt(d)} de plus.`, (_, ops) => (ops[0] === '−' ? `${Q} en a PLUS que ${P}.` : null));
  } },
  { id: 'ecart', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'], minP: 2, make(r, lv, p) {
    const g = n(r, lv), f = g + n(r, lv, 2);
    const u = uOK(lv, p) ? useless(r, null) : null;
    return mk(`Dans le village, il y a ${fmt(g)} garçons et ${fmt(f)} filles. ${u?.s ?? ''}`, `Combien de filles y a-t-il de plus que de garçons ?`, [f, g], u, f - g, 'filles de plus', sub(f, g), `On cherche l’écart entre les deux nombres.`, (_, ops) => (wantsPlus(ops) ? `On ne cherche pas le total : on cherche de combien les filles sont plus nombreuses (l’écart).` : null));
  } },
  { id: 'demoins', levels: ['CE2', 'CM1', 'CM2', '6e'], minP: 3, make(r, lv) {
    // piège : « de plus » mais on cherche le plus petit
    const [P, Q] = names(r, 2); const a = n(r, lv), d = r.int(1, Math.max(1, Math.floor(a / 2)));
    return mk(`${P} a ${fmt(a)} € dans sa tirelire. ${P} a ${fmt(d)} € de plus que ${Q}.`, `Combien d’euros ${Q} a-t-${il(Q)} ?`, [a, d], null, a - d, '€', sub(a, d), `Qui en a le plus ? C’est ${P}. Donc ${Q} en a moins.`, (_, ops) => (wantsPlus(ops) ? `Attention au mot « plus » ! C’est ${P} qui a le plus d’argent. ${Q} en a moins.` : null));
  } },
  { id: 'deux', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'], minP: 2, make(r, lv, p) {
    const a = n(r, lv), b = n(r, lv, 3), c = r.int(1, a);
    const u = uOK(lv, p) ? useless(r, null) : null;
    const inst = mk(`Dans la bibliothèque, il y a ${fmt(a)} livres. On en apporte ${fmt(b)} de plus. ${u?.s ?? ''}Puis les élèves en empruntent ${fmt(c)}.`, `Combien de livres reste-t-il dans la bibliothèque ?`, [a, b, c], u, a + b - c, 'livres', `${fmt(a)} + ${fmt(b)} − ${fmt(c)}`, `Deux étapes : d’abord on apporte des livres, puis on en emprunte.`, (_, ops) => (wantsPlus(ops) ? `Les livres empruntés sortent de la bibliothèque : il faut les enlever.` : null));
    inst.slots = 3;
    return inst;
  } },
];

function mk(text: string, question: string, nums: number[], u: { v: number } | null, answer: number, unit: string, model: string, hint: string, diag: PbInst['diag']): PbInst {
  return { text, question, nums, useless: u && !nums.includes(u.v) ? [u.v] : [], slots: 2, ops: ['+', '−'], answer, unit, diag, hint, model };
}
