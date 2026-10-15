/**
 * « Chiffre ou nombre de… » : dans 352, le chiffre des dizaines est 5, mais il y a 35 dizaines en tout.
 * Les deux questions alternent pour casser la confusion (piège classique du programme : « 63 dizaines et 5 unités »).
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, UNITS, MAXN, fmt } from '../engine/types';
import { keypad } from '../ui/keypad';

export interface DizData { lv: Level; p: Palier; n: number; unit: number; kind: 'chiffre' | 'nombre' }
const digit = (n: number, k: number) => Math.floor(n / UNITS[k].v) % 10;
const count = (n: number, k: number) => Math.floor(n / UNITS[k].v);

export const dizaines: ExoType<DizData, number> = {
  id: 'dizaines',
  title: 'Chiffre des dizaines ou nombre de dizaines ?',
  notion: 'La valeur d’un chiffre dépend de sa place',
  levels: ['CE1', 'CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const hi = MAXN[lv], lo = Math.ceil((hi + 1) / 10);
    const units = { CE1: [1], CE2: [1, 2], CM1: [1, 2, 3, 4], CM2: [2, 3, 4, 5, 6] }[lv];
    for (;;) {
      const n = r.int(lo, hi);
      const unit = r.pick(units);
      const kind: DizData['kind'] = p === 1 ? 'chiffre' : p === 2 ? 'nombre' : r.pick(['chiffre', 'nombre'] as const);
      if (count(n, unit) === digit(n, unit)) continue; // les deux réponses doivent différer
      if (p === 3 && digit(n, unit) !== 0 && r.next() < 0.5) continue; // palier 3 : souvent un 0 à cette place
      return { lv, p, n, unit, kind };
    }
  },
  solution: (d) => (d.kind === 'chiffre' ? digit(d.n, d.unit) : count(d.n, d.unit)),
  check(d, a) {
    const good = dizaines.solution(d);
    if (a === good) return { ok: true };
    const u = UNITS[d.unit];
    if (d.kind === 'chiffre' && a === count(d.n, d.unit)) return { ok: false, msg: `Tu as donné le NOMBRE de ${u.many} en tout. On demande seulement le CHIFFRE qui est dans la colonne des ${u.many}.` };
    if (d.kind === 'nombre' && a === digit(d.n, d.unit)) return { ok: false, msg: `Ça, c'est le chiffre de la colonne des ${u.many}. Mais les colonnes de gauche contiennent aussi des ${u.many} ! Compte-les toutes.` };
    if (d.kind === 'nombre' && a === d.n) return { ok: false, msg: `Ça, c'est le nombre d'unités. Combien de paquets de ${u.v} peut-on faire ?` };
    const other = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((k) => k !== d.unit && k < String(d.n).length);
    for (const k of other) if (a === (d.kind === 'chiffre' ? digit(d.n, k) : count(d.n, k))) return { ok: false, msg: `Tu as regardé la colonne des ${UNITS[k].many}. On demande les ${u.many}.` };
    return { ok: false, msg: `Ce n'est pas ça. Range le nombre dans le tableau dans ta tête : ${u.short} est la colonne des ${u.many}.` };
  },
  hint(d) {
    const u = UNITS[d.unit];
    if (d.kind === 'chiffre') return `Le chiffre des unités est tout à droite. Puis, vers la gauche : dizaines, centaines, milliers… Cherche la colonne des ${u.many}.`;
    return `Cache les chiffres à droite de la colonne des ${u.many}. Le nombre qui reste, c'est le nombre de ${u.many}.`;
  },
  correction(d) {
    const u = UNITS[d.unit];
    const s = String(d.n);
    const cut = s.length - d.unit;
    return d.kind === 'chiffre'
      ? `<p>Dans <b>${fmt(d.n)}</b>, la colonne des ${u.many} contient le chiffre <b>${digit(d.n, d.unit)}</b>.</p>`
      : `<p>Dans <b>${s.slice(0, cut)}</b><span class="dim">${s.slice(cut)}</span>, on garde ce qui est à gauche des ${UNITS[d.unit - 1].many} : il y a <b>${count(d.n, d.unit)} ${u.many}</b> en tout.</p><p>Vérification : ${count(d.n, d.unit)} × ${fmt(u.v)} = ${fmt(count(d.n, d.unit) * u.v)}, et il reste ${d.n % u.v}.</p>`;
  },
  mount(el, d) {
    const u = UNITS[d.unit];
    el.innerHTML = `<p class="q">Dans le nombre <b class="big">${fmt(d.n)}</b>,<br>${d.kind === 'chiffre' ? `quel est le <b>chiffre</b> des ${u.many} ?` : `combien y a-t-il de <b>${u.many} en tout</b> ?`}</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Ta réponse');
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
