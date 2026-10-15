/** Propriétés des générateurs sur N graines × niveaux × paliers (défaut 2000). Usage : tsx tests/props.test.ts 2000 */
import { echanger, value } from '../src/exos/echanger';
import { tableau, digitsOf, statement } from '../src/exos/tableau';
import { UNITS, type Level, type Palier } from '../src/engine/types';

const N = Number(process.argv[2] || 2000);
let pass = 0, fail = 0;
const errs: string[] = [];
const t = (c: boolean, m: string) => { if (c) pass++; else { fail++; if (errs.length < 15) errs.push(m); } };
const LV: Level[] = ['CE1', 'CE2'], P: Palier[] = [1, 2, 3];

for (const lv of LV) for (const p of P) for (let s = 1; s <= N; s++) {
  const tag = `${lv}/p${p}/s${s}`;
  // ---- échanger
  const e = echanger.generate(lv, p, s);
  const lim = lv === 'CE1' ? [100, 999] : [1000, 9999];
  t(e.n === value(e.counts), `ech valeur ${tag}`);
  t(e.n >= lim[0] && e.n <= lim[1], `ech plage ${tag} ${e.n}`);
  t(e.counts.some((x) => x >= 10), `ech au moins un échange ${tag}`);
  t(e.counts.every((x) => x >= 0 && x <= 39), `ech pièces ≤ 39 ${tag}`);
  t(e.counts[e.counts.length - 1] <= 9, `ech colonne haute ≤ 9 ${tag}`);
  if (lv === 'CE1' && p === 1) t(e.counts[0] >= 10 && e.counts[1] <= 9, `ech CE1 p1 = unités en trop ${tag}`);
  if (lv === 'CE2' && p === 2) t(e.counts[2] >= 10, `ech CE2 p2 = centaines en trop ${tag}`);
  t(echanger.check(e, e.n).ok, `ech solution acceptée ${tag}`);
  for (const d of [-1, 1, 10, -10, 100]) t(!echanger.check(e, e.n + d).ok, `ech refuse n${d} ${tag}`);
  const concat = Number([...e.counts].reverse().join(''));
  t(/à la suite/.test(echanger.check(e, concat).msg ?? ''), `ech diag concat ${tag}`);
  t(echanger.hint(e).length > 10 && echanger.correction(e).includes(String(e.n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')), `ech corrigé ${tag}`);
  t(echanger.generate(lv, p, s).n === e.n, `ech reproductible ${tag}`);
  // ---- tableau
  const d = tableau.generate(lv, p, s);
  t(d.n >= lim[0] && d.n <= lim[1], `tab plage ${tag}`);
  t(d.digits.reduce((a, x, k) => a + x * UNITS[k].v, 0) === d.n && digitsOf(d.n, d.digits.length).join() === d.digits.join(), `tab chiffres ${tag}`);
  if (p === 1) t(!d.digits.includes(0), `tab p1 sans zéro ${tag}`);
  if (p === 3) t(d.digits.includes(0), `tab p3 avec zéro ${tag}`);
  if (p >= 2) t(d.order.some((k, i) => k !== d.digits.length - 1 - i), `tab désordre ${tag}`);
  // la réserve contient de quoi répondre
  const pool = [...d.pool];
  t(d.digits.every((x) => { const i = pool.indexOf(x); if (i < 0) return false; pool.splice(i, 1); return true; }), `tab réserve suffisante ${tag}`);
  t(pool.length >= 1, `tab étiquettes en trop ${tag}`);
  t(tableau.check(d, d.digits).ok, `tab solution acceptée ${tag}`);
  const rev = [...d.digits].reverse();
  if (rev.join() !== d.digits.join()) t(!tableau.check(d, rev).ok && !!tableau.check(d, rev).msg, `tab refuse l'envers ${tag}`);
  // énoncé : chaque chiffre non nul est mentionné
  const st = statement(d);
  t(d.digits.every((x) => x === 0 || st.includes(String(x))), `tab énoncé complet ${tag}`);
  t(d.digits.length === (lv === 'CE1' ? 3 : 4), `tab colonnes ${tag}`);
}
// diagnostic ciblé : recopier dans l'ordre de l'énoncé
{
  let seen = 0;
  for (let s = 1; s <= N && seen < 50; s++) {
    const d = tableau.generate('CE1', 2, s);
    if (d.digits.includes(0)) continue;
    const typed = d.order.map((k) => d.digits[k]).reverse();
    const v = tableau.check(d, typed);
    if (typed.join() === d.digits.join()) continue;
    t(/ordre de l'énoncé/.test(v.msg ?? ''), `tab diag ordre énoncé s${s}`); seen++;
  }
  t(seen > 0, 'diag ordre testé');
}
console.log(`${pass} vérifications réussies, ${fail} échecs (${N} graines × 2 niveaux × 3 paliers)`);
errs.forEach((e) => console.log('  ✗', e));
process.exit(fail ? 1 : 0);
