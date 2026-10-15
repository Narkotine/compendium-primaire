/**
 * « Échanger » : une collection avec 10 pièces ou plus dans une colonne (ex. 2 centaines, 15 dizaines, 4 unités).
 * L'enfant peut faire les échanges au doigt, puis écrit le nombre au pavé.
 * Programme CE1 : nombres ≤ 1 000, exemples « 17 unités, 8 dizaines et 2 centaines » ;
 * CE2 : ≤ 10 000, « 17 unités, 8 dizaines, 32 centaines et 2 milliers ».
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, UNITS, MAXN, unitName, nCols, fmt } from '../engine/types';
import { material } from '../ui/material';
import { keypad } from '../ui/keypad';

export interface EchData { lv: Level; p: Palier; counts: number[]; n: number }
const LIMIT = MAXN;
export const value = (c: number[]) => c.reduce((s, x, k) => s + x * UNITS[k].v, 0);
const desc = (c: number[]) => c.map((x, k) => (x ? `${x} ${unitName(k, x)}` : '')).filter(Boolean).reverse().join(', ');

export const echanger: ExoType<EchData, number> = {
  id: 'echanger',
  title: 'Échanger pour trouver le nombre',
  notion: 'Échanger et décomposer',
  levels: ['CE1', 'CE2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const cols = nCols(lv);
    const top = cols - 1;
    for (;;) {
      const c = Array(cols).fill(0).map(() => r.int(0, 9));
      // colonnes « en trop » (≥ 10) selon le palier
      const big = lv === 'CE1' ? [[0], [1], [0, 1]][p - 1] : [[r.pick([0, 1])], [2], r.shuffle([0, 1, 2]).slice(0, r.int(2, 3))][p - 1];
      const hi = lv === 'CE1' ? [19, 19, 29][p - 1] : [29, 39, 39][p - 1];
      for (const k of big) c[k] = r.int(10, hi);
      const rest = value(c.map((x, k) => (k === top ? 0 : x)));
      const maxTop = Math.floor((LIMIT[lv] - rest) / UNITS[top].v);
      if (maxTop < (big.includes(top) ? 10 : 1)) continue;
      if (!big.includes(top)) c[top] = r.int(1, Math.min(9, maxTop));
      const n = value(c);
      if (n <= LIMIT[lv] && n >= (lv === 'CE1' ? 100 : 1000)) return { lv, p, counts: c, n };
    }
  },
  solution: (d) => d.n,
  check(d, a) {
    if (a === d.n) return { ok: true };
    const concat = Number(d.counts.slice().reverse().join(''));
    if (a === concat) return { ok: false, msg: `Tu as écrit les nombres de chaque colonne à la suite. Mais une colonne ne peut pas garder 10 pièces ou plus : il faut d'abord échanger.` };
    const noCarry = Number(d.counts.map((x) => x % 10).reverse().join(''));
    if (a === noCarry) return { ok: false, msg: `Tu as enlevé les pièces en trop, mais où sont-elles passées ? Quand on échange 10 pièces, on gagne 1 pièce dans la colonne de gauche.` };
    const ds = (x: number) => String(x).padStart(nCols(d.lv), '0').split('').reverse().map(Number);
    const ga = ds(a), gn = ds(d.n);
    if (ga.length === gn.length) {
      const bad = gn.map((x, k) => (x !== ga[k] ? k : -1)).filter((k) => k >= 0);
      if (bad.length === 1) return { ok: false, msg: `Presque ! Regarde bien les ${UNITS[bad[0]].many}.`, bad };
    }
    return { ok: false, msg: `Ce n'est pas ça. Fais les échanges, puis lis le nombre colonne par colonne.` };
  },
  hint(d) {
    const k = d.counts.findIndex((x) => x >= 10);
    return `Commence par les ${UNITS[k].many} : il y en a ${d.counts[k]}. Échange 10 ${UNITS[k].many} contre 1 ${UNITS[k + 1].one}, autant de fois que possible.`;
  },
  correction(d) {
    const c = [...d.counts];
    const steps: string[] = [];
    for (let k = 0; k < c.length - 1; k++) {
      if (c[k] >= 10) {
        const g = Math.floor(c[k] / 10);
        steps.push(`${c[k]} ${UNITS[k].many} = ${g} ${unitName(k + 1, g)} et ${c[k] % 10} ${unitName(k, c[k] % 10)}.`);
        c[k + 1] += g; c[k] %= 10;
      }
    }
    return `<ol>${steps.map((s) => `<li>${s}</li>`).join('')}<li>Il reste ${desc(c)} : c'est <b>${fmt(d.n)}</b>.</li></ol>`;
  },
  mount(el, d) {
    el.innerHTML = `<p class="q">Voici <b>${desc(d.counts)}</b>.<br>Quel est ce nombre ?</p>
      <p class="tip">${d.p === 1 ? 'Fais d’abord les échanges' : 'Tu peux échanger'} : glisse une pièce vers la colonne voisine, ou utilise les boutons.</p>
      <div class="w-mat"></div><div class="w-kp"></div>`;
    const m = material(el.querySelector('.w-mat')!, d.counts);
    const k = keypad(el.querySelector('.w-kp')!, 'Ta réponse');
    return {
      answer: () => k.value(),
      // palier 1 : le matériel est mis en avant, on fait d'abord tous les échanges (sans pénalité)
      ready: () => (d.p === 1 && m.counts().some((x, i) => x >= 10 && i < d.counts.length - 1) ? 'Au début, on fait les échanges avec le matériel : il reste une colonne avec 10 pièces ou plus.' : null),
      lock: () => { m.lock(); k.lock(); },
    };
  },
};
