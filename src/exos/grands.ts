/**
 * « Les grands nombres » (CM1 ≤ 999 999, CM2 ≤ 999 999 999, 6e ≤ 999 999 999 999) :
 * écrire en chiffres un nombre donné en lettres. Même notion, classes jusqu’aux milliards en 6e.
 * Piège principal : les zéros des classes.
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../engine/types';
import { words } from '../engine/words';
import { keypad } from '../ui/keypad';

export interface GraData { lv: Level; p: Palier; n: number }
const CLASSES = ['unités', 'milliers', 'millions', 'milliards'];
const classes = (n: number) => [
  n % 1000,
  Math.floor(n / 1000) % 1000,
  Math.floor(n / 1e6) % 1000,
  Math.floor(n / 1e9) % 1000,
];

export const grands: ExoType<GraData, number> = {
  id: 'grands',
  title: 'Écrire un grand nombre en chiffres',
  notion: 'Les grands nombres',
  levels: ['CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const top = lv === 'CM1' ? 1 : lv === 'CM2' ? 2 : 3; // milliers / millions / milliards
    for (;;) {
      const c = [0, 0, 0, 0];
      for (let k = 0; k <= top; k++) c[k] = r.int(0, 999);
      c[top] = r.int(1, 999);
      if (lv === 'CM1' && p >= 2) c[top] = r.int(10, 999);
      if (lv === '6e' && p >= 2) c[top] = r.int(10, 999);
      const parts = [String(c[top])];
      for (let k = top - 1; k >= 0; k--) parts.push(String(c[k]).padStart(3, '0'));
      const s = parts.join('');
      const zeros = (s.match(/0/g) ?? []).length;
      if (p === 1 && zeros > 0) continue;
      if (p === 2 && (zeros === 0 || c.slice(0, top).some((x) => x < 10))) continue;
      if (p === 3) { const k = r.int(0, top - 1); c[k] = r.pick([0, r.int(1, 9)]); }
      const n = c[0] + c[1] * 1000 + c[2] * 1e6 + c[3] * 1e9;
      if (p === 3 && !c.slice(0, top).some((x) => x < 10)) continue;
      return { lv, p, n };
    }
  },
  solution: (d) => d.n,
  check(d, a) {
    if (a === d.n) return { ok: true };
    const cn = classes(d.n), ca = classes(a);
    const s = String(d.n), sa = String(a);
    if (sa.length < s.length && sa.replace(/0/g, '') === s.replace(/0/g, '')) return { ok: false, msg: `Il manque des zéros. Chaque classe s'écrit toujours avec 3 chiffres (sauf la première).` };
    if (sa.length < s.length) return { ok: false, msg: `Ton nombre a ${sa.length} chiffres, il en faut ${s.length}. Une classe qui n'est pas la première s'écrit toujours avec 3 chiffres : pense aux zéros.` };
    if (sa.length > s.length) return { ok: false, msg: `Ton nombre est trop long. On n'écrit pas « mille », « million » ou « milliard » avec des zéros : on remplit seulement leur classe.` };
    const top = cn[3] ? 3 : cn[2] ? 2 : 1;
    const bad = [0, 1, 2, 3].filter((k) => k <= top && cn[k] !== ca[k]);
    const labels = top === 3 ? 'milliards, millions, milliers, unités' : top === 2 ? 'millions, milliers, unités' : 'milliers, unités';
    return { ok: false, msg: bad.length === 1 ? `Presque ! La classe des ${CLASSES[bad[0]]} n'est pas juste.` : `Découpe le nombre en classes : ${labels}.` };
  },
  hint(d) {
    const c = classes(d.n);
    const top = c[3] ? 3 : c[2] ? 2 : 1;
    const mot = top === 3 ? 'milliard' : top === 2 ? 'million' : 'mille';
    return `Cherche les mots « milliard », « million » et « mille ». Ce qui est avant « ${mot} » donne la première classe : ${c[top]}. Puis chaque classe suivante a 3 chiffres.`;
  },
  correction(d) {
    const c = classes(d.n);
    const top = c[3] ? 3 : c[2] ? 2 : 1;
    const rows = [3, 2, 1, 0].filter((k) => k <= top).map((k) => `<li>${CLASSES[k]} : <b>${k === top ? c[k] : String(c[k]).padStart(3, '0')}</b></li>`).join('');
    return `<ul>${rows}</ul><p>Le nombre est <b>${fmt(d.n)}</b>.</p>`;
  },
  mount(el, d) {
    const dig = String(Math.trunc(d.n)).length;
    el.innerHTML = `<p class="q">Écris ce nombre en chiffres :</p><p class="words">${words(d.n)}</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Ta réponse', Math.max(9, dig));
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
