/**
 * Calcul mental raisonné (procédures du programme) :
 * passer par la dizaine (47 + 8), ajouter/enlever 9, 19, 29 (+10 − 1), soustraire en passant par la dizaine (523 − 7),
 * ajouter des dizaines ou des centaines avec échange (746 + 80).
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../engine/types';
import { keypad } from '../ui/keypad';

type Kind = 'plusU' | 'moinsU' | 'plus9' | 'moins9' | 'plusD' | 'plusC' | 'moinsD';
export interface MenData { lv: Level; p: Palier; a: number; b: number; op: '+' | '−'; kind: Kind }
const KINDS: Record<Level, Kind[][]> = {
  CE1: [['plusU', 'moinsU'], ['plusU', 'moinsU', 'plus9', 'moins9'], ['plus9', 'moins9', 'plusD', 'moinsD']],
  CE2: [['plusU', 'moinsU', 'plus9'], ['plus9', 'moins9', 'plusD', 'moinsD'], ['plusD', 'moinsD', 'plusC', 'plus9']],
  CM1: [['plus9', 'moins9', 'plusD'], ['plusD', 'moinsD', 'plusC'], ['plusC', 'plusD', 'moinsD', 'plus9']],
  CM2: [['plus9', 'plusD', 'moinsD'], ['plusD', 'moinsD', 'plusC'], ['plusC', 'plusD', 'moinsD', 'plus9']],
  '6e': [['plusD', 'moinsD', 'plusC'], ['plusC', 'plusD', 'moinsD'], ['plusC', 'plusD', 'moinsD', 'plus9']],
};
const res = (d: MenData) => (d.op === '+' ? d.a + d.b : d.a - d.b);

export const mental: ExoType<MenData, number> = {
  id: 'mental',
  title: 'Calcul mental malin',
  notion: 'Calcul mental raisonné',
  levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const big = { CE1: 999, CE2: 9999, CM1: 99999, CM2: 99999, '6e': 999999 }[lv];
    for (;;) {
      const kind = r.pick(KINDS[lv][p - 1]);
      let a = 0, b = 0, op: '+' | '−' = '+';
      if (kind === 'plusU') { a = r.int(12, Math.min(big, 989)); b = r.int(2, 9); if (a % 10 + b < 10) continue; }
      if (kind === 'moinsU') { op = '−'; a = r.int(21, Math.min(big, 999)); b = r.int(2, 9); if (a % 10 >= b) continue; }
      if (kind === 'plus9') { a = r.int(23, big - 40); b = r.pick(lv === 'CE1' ? [9] : [9, 19, 29]); if (a % 10 <= 1) continue; }
      if (kind === 'moins9') { op = '−'; a = r.int(40, big); b = r.pick(lv === 'CE1' ? [9] : [9, 19]); if (a % 10 >= 9) continue; }
      if (kind === 'plusD') { a = r.int(110, big - 100); b = r.int(2, 9) * 10; if (Math.floor(a / 10) % 10 + b / 10 < 10) continue; }
      if (kind === 'moinsD') { op = '−'; a = r.int(110, big); b = r.int(2, 9) * 10; if (Math.floor(a / 10) % 10 >= b / 10) continue; }
      if (kind === 'plusC') { a = r.int(1100, Math.max(1200, big - 1000)); b = r.int(2, 9) * 100; if (Math.floor(a / 100) % 10 + b / 100 < 10) continue; }
      const d: MenData = { lv, p, a, b, op, kind };
      if (res(d) < 0 || res(d) > big) continue;
      return d;
    }
  },
  solution: res,
  check(d, x) {
    const g = res(d);
    if (x === g) return { ok: true };
    if (d.kind === 'plus9' && x === d.a + d.b + 2) return { ok: false, msg: `Tu as ajouté ${d.b + 1} puis encore 1. Ajouter ${d.b}, c’est ajouter ${d.b + 1}, puis ENLEVER 1.` };
    if (d.kind === 'moins9' && x === d.a - d.b - 2) return { ok: false, msg: `Enlever ${d.b}, c’est enlever ${d.b + 1}, puis RAJOUTER 1 (on a enlevé 1 de trop).` };
    if ((d.kind === 'plusU' || d.kind === 'plus9') && x === g - 10) return { ok: false, msg: `Tu as oublié la dizaine qui se forme : les unités dépassent 10.` };
    if ((d.kind === 'moinsU' || d.kind === 'moins9') && x === g + 10) return { ok: false, msg: `Il n’y a pas assez d’unités : il faut passer par la dizaine du dessous.` };
    if (d.kind === 'plusD' && x === g - 100) return { ok: false, msg: `Les dizaines dépassent 10 : 10 dizaines font 1 centaine de plus.` };
    if (d.kind === 'plusC' && x === g - 1000) return { ok: false, msg: `Les centaines dépassent 10 : 10 centaines font 1 millier de plus.` };
    if (d.kind === 'moinsD' && x === g + 100) return { ok: false, msg: `Il n’y a pas assez de dizaines : il faut casser une centaine.` };
    return { ok: false, msg: `Ce n’est pas ça. Utilise la méthode du cours, étape par étape.` };
  },
  hint(d) {
    const { a, b } = d;
    switch (d.kind) {
      case 'plusU': { const t = 10 - (a % 10); return `Va d’abord à la dizaine : ${fmt(a)} + ${t} = ${fmt(a + t)}. Il reste encore ${b - t} à ajouter.`; }
      case 'moinsU': { const t = a % 10; return `Descends d’abord à la dizaine : ${fmt(a)} − ${t} = ${fmt(a - t)}. Il reste encore ${b - t} à enlever.`; }
      case 'plus9': return `Ajoute ${b + 1} (c’est facile), puis enlève 1.`;
      case 'moins9': return `Enlève ${b + 1}, puis rajoute 1.`;
      case 'plusD': return `Ajoute les dizaines : ${Math.floor(a / 10)} dizaines + ${b / 10} dizaines. Puis remets les ${a % 10} unités.`;
      case 'moinsD': return `Pense en dizaines : ${Math.floor(a / 10)} dizaines − ${b / 10} dizaines. Puis remets les ${a % 10} unités.`;
      default: return `Pense en centaines : ${Math.floor(a / 100)} centaines + ${b / 100} centaines. Puis remets le reste : ${a % 100}.`;
    }
  },
  correction(d) {
    const g = res(d);
    const { a, b } = d;
    const steps = d.kind === 'plus9' ? `${fmt(a)} + ${b + 1} = ${fmt(a + b + 1)}, puis ${fmt(a + b + 1)} − 1 = ${fmt(g)}`
      : d.kind === 'moins9' ? `${fmt(a)} − ${b + 1} = ${fmt(a - b - 1)}, puis ${fmt(a - b - 1)} + 1 = ${fmt(g)}`
      : d.kind === 'plusU' ? `${fmt(a)} + ${10 - (a % 10)} = ${fmt(a + 10 - (a % 10))}, puis + ${b - (10 - (a % 10))} = ${fmt(g)}`
      : d.kind === 'moinsU' ? `${fmt(a)} − ${a % 10} = ${fmt(a - (a % 10))}, puis − ${b - (a % 10)} = ${fmt(g)}`
      : `${fmt(a)} ${d.op} ${fmt(b)} = ${fmt(g)}`;
    return `<p>${steps}</p><p>Réponse : <b>${fmt(g)}</b></p>`;
  },
  mount(el, d) {
    el.innerHTML = `<p class="q">Calcule dans ta tête :</p><p class="eq">${fmt(d.a)} ${d.op} ${fmt(d.b)} = <span class="hole">?</span></p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le résultat', 6);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
