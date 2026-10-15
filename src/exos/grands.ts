/**
 * « Les grands nombres » (CM1 ≤ 999 999, CM2 ≤ 999 999 999) : écrire en chiffres un nombre donné en lettres.
 * Piège principal : les zéros des classes (« deux-millions-trente-mille-quatre » = 2 030 004).
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../engine/types';
import { words } from '../engine/words';
import { keypad } from '../ui/keypad';

export interface GraData { lv: Level; p: Palier; n: number }
const CLASSES = ['unités', 'milliers', 'millions'];
const classes = (n: number) => [n % 1000, Math.floor(n / 1000) % 1000, Math.floor(n / 1e6)];

export const grands: ExoType<GraData, number> = {
  id: 'grands',
  title: 'Écrire un grand nombre en chiffres',
  notion: 'Les grands nombres',
  levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const top = lv === 'CM1' ? 1 : 2; // classe la plus haute : milliers ou millions
    for (;;) {
      const c = [r.int(0, 999), r.int(0, 999), r.int(0, 999)];
      for (let k = top + 1; k < 3; k++) c[k] = 0;
      c[top] = r.int(1, 999);
      if (lv === 'CM1' && p >= 2) c[top] = r.int(10, 999); // au moins 5 chiffres
      // palier 1 : pas de zéro ; palier 2 : des zéros dans les classes (305, 40) ; palier 3 : une classe entière vide ou presque
      const s = String(c[top]) + c.slice(0, top).reverse().map((x) => String(x).padStart(3, '0')).join('');
      const zeros = (s.match(/0/g) ?? []).length;
      if (p === 1 && zeros > 0) continue;
      if (p === 2 && (zeros === 0 || c.slice(0, top).some((x) => x < 10))) continue;
      if (p === 3) { const k = r.int(0, top - 1); c[k] = r.pick([0, r.int(1, 9)]); }
      const n = c[0] + c[1] * 1000 + c[2] * 1e6;
      if (p === 3 && !c.slice(0, top).some((x) => x < 10)) continue;
      return { lv, p, n };
    }
  },
  solution: (d) => d.n,
  check(d, a) {
    if (a === d.n) return { ok: true };
    const cn = classes(d.n), ca = classes(a);
    const s = String(d.n), sa = String(a);
    if (sa.length < s.length && sa.replace(/0/g, '') === s.replace(/0/g, '')) return { ok: false, msg: `Il manque des zéros. Chaque classe (milliers, unités) s'écrit toujours avec 3 chiffres : 30 mille s'écrit 030 dans la classe des milliers.` };
    if (sa.length < s.length) return { ok: false, msg: `Ton nombre a ${sa.length} chiffres, il en faut ${s.length}. Une classe qui n'est pas la première s'écrit toujours avec 3 chiffres : pense aux zéros.` };
    // morceaux écrits à la suite : « 2 000 000 30 000 4 »
    if (sa.length > s.length) return { ok: false, msg: `Ton nombre est trop long. On n'écrit pas « mille » ou « million » avec des zéros : on remplit seulement leur classe.` };
    const bad = [0, 1, 2].filter((k) => cn[k] !== ca[k]);
    return { ok: false, msg: bad.length === 1 ? `Presque ! La classe des ${CLASSES[bad[0]]} n'est pas juste.` : `Découpe le nombre en classes : d'abord les millions, puis les milliers, puis les unités.` };
  },
  hint(d) {
    const c = classes(d.n);
    const top = c[2] ? 2 : 1;
    return `Cherche les mots « million » et « mille ». Ce qui est avant « ${top === 2 ? 'million' : 'mille'} » donne la première classe : ${c[top]}. Puis chaque classe suivante a 3 chiffres.`;
  },
  correction(d) {
    const c = classes(d.n);
    const top = c[2] ? 2 : 1;
    const rows = [2, 1, 0].filter((k) => k <= top).map((k) => `<li>${CLASSES[k]} : <b>${k === top ? c[k] : String(c[k]).padStart(3, '0')}</b></li>`).join('');
    return `<ul>${rows}</ul><p>Le nombre est <b>${fmt(d.n)}</b>.</p>`;
  },
  mount(el, d) {
    el.innerHTML = `<p class="q">Écris ce nombre en chiffres :</p><p class="words">${words(d.n)}</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Ta réponse', 9);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
