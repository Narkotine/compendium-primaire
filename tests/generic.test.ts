/** Propriétés communes à TOUS les exercices : génération déterministe et terminée, solution acceptée, réponse voisine refusée avec un message. */
import { EXOS } from '../src/exos/index';
import type { Palier } from '../src/engine/types';
const N = Number(process.argv[2] || 300);
let pass = 0, fail = 0; const bad: string[] = [];
const t = (c: boolean, m: string) => { if (c) pass++; else { fail++; if (bad.length < 30) bad.push(m); } };
for (const [id, E] of Object.entries(EXOS)) for (const lv of E.levels) for (const p of [1, 2, 3] as Palier[]) for (let s = 1; s <= N; s++) {
  const d = E.generate(lv, p, s);
  t(JSON.stringify(d) === JSON.stringify(E.generate(lv, p, s)), `${id} déterministe ${lv} p${p} s${s}`);
  const sol = E.solution(d);
  const v = E.check(d, sol);
  t(v.ok, `${id} solution acceptée ${lv} p${p} s${s} ${v.msg}`);
  if (typeof sol === 'number') for (const k of [1, -1, 10]) { const w = E.check(d, sol + k); t(!w.ok && !!w.msg, `${id} refuse ${sol + k} ${lv} p${p} s${s}`); }
  t(E.hint(d).length > 5 && E.correction(d).length > 5, `${id} aide et corrigé ${lv} p${p} s${s}`);
  t(!/NaN|undefined|Infinity/.test(E.hint(d) + E.correction(d) + JSON.stringify(d)), `${id} pas de NaN/undefined ${lv} p${p} s${s}`);
}
// chapitre 3 : diagnostics ciblés et plages
import { mulpose, partials } from '../src/exos/mulpose';
import { multiples } from '../src/exos/multiples';
import { tables } from '../src/exos/tables';
import { fois10 } from '../src/exos/fois10';
import { probmul } from '../src/exos/probmul';
import { MAXN } from '../src/engine/types';
for (let s = 1; s <= N; s++) for (const p of [1, 2, 3] as Palier[]) {
  for (const lv of mulpose.levels) {
    const d = mulpose.generate(lv, p, s); const ps = partials(d);
    if (lv === 'CE2') t(d.a * d.b <= 9999, `mulpose CE2 ≤ 9 999 s${s}`);
    const sh = ps.find((x) => x.k > 0);
    if (sh && ps.length > 1) { const a = mulpose.solution(d); a[ps.indexOf(sh)] = d.a * sh.c; const v = mulpose.check(d, a); t(!v.ok && /décale/.test(v.msg!) && v.bad!.length >= 1, `mulpose décalage oublié ${lv} s${s}`); }
  }
  for (const lv of fois10.levels) { const d = fois10.generate(lv, p, s); t(d.n * d.m <= MAXN[lv], `fois10 ≤ max ${lv} ${d.n}×${d.m}`); if (d.kind === 'prod' && d.m >= 100) t(/Pas assez/.test(fois10.check(d, d.n * 10).msg!), `fois10 un seul rang ${lv}`); }
  for (const lv of tables.levels) { const d = tables.generate(lv, p, s); if (d.kind === 'prod' && d.a > 1 && d.b > 1 && d.a !== d.b) t(/ajouté/.test(tables.check(d, d.a + d.b).msg!) || d.a + d.b === d.a * d.b, `tables addition ${lv}`); }
  for (const lv of multiples.levels) { const d = multiples.generate(lv, p, s); const g = multiples.solution(d); t(g.length >= 2 && g.length <= 4 && d.cards.length === 6, `multiples 2–4 bons ${lv}`); const dv = d.cards.findIndex((n) => d.k % n === 0 && n < d.k); if (dv >= 0) t(/pas un multiple/.test(multiples.check(d, [...g, dv]).msg!), `multiples piège diviseur ${lv}`); }
  for (const lv of probmul.levels) { const d = probmul.generate(lv, p, s); if (d.inst.slots === 2 && d.tpl !== 'deplus') { const v = probmul.check(d, { nums: d.inst.nums, ops: ['+'], result: null }); t(!v.ok && !!v.msg, `probmul + refusé ${lv} ${d.tpl}`); } if (lv === 'CE1') t(p === 3 || !d.inst.useless.length, `probmul CE1 inutile seulement p3`); }
}
// chapitre 4
import { divpose, steps } from '../src/exos/divpose';
import { reste } from '../src/exos/reste';
import { partage } from '../src/exos/partage';
import { probdiv } from '../src/exos/probdiv';
import { divisible } from '../src/exos/divisible';
for (let s = 1; s <= N; s++) for (const p of [1, 2, 3] as Palier[]) {
  for (const lv of divpose.levels) {
    const d = divpose.generate(lv, p, s); const st = steps(d);
    t(st.reduce((q, x) => q * 10 + x.q, 0) === Math.floor(d.n / d.d) && st[st.length - 1].r === d.n % d.d, `divpose étapes = division ${d.n}/${d.d}`);
    t(st.every((x) => x.r < d.d), `divpose restes < diviseur`);
    const z = st.findIndex((x, i) => i > 0 && x.q === 0);
    if (p === 3) { t(z > 0, `divpose p3 a un 0 au quotient ${d.n}/${d.d}`); const a = divpose.solution(d); a.splice(2 * z, 2); const w = [...a.slice(0, 2 * z), 1, st[z].r, ...a.slice(2 * z)]; t(/mets 0/.test(divpose.check(d, w).msg ?? ''), `divpose message zéro ${d.n}/${d.d}`); }
    const a = divpose.solution(d); a[0] = (a[0] as number) + 1; t(!divpose.check(d, a).ok, `divpose refuse q+1`);
  }
  for (const lv of reste.levels) { const d = reste.generate(lv, p, s); const q = Math.floor(d.n / d.d), r = d.n % d.d; if (q > 0) t(/plus grand que/.test(reste.check(d, [q - 1, r + d.d]).msg ?? ''), `reste ≥ diviseur ${lv}`); t(!reste.check(d, [q, r + 1]).ok, `reste refuse r+1`); }
  for (const lv of partage.levels) { const d = partage.generate(lv, p, s); const c = partage.solution(d).counts; c[0]++; t(/pas égales/.test(partage.check(d, { counts: c, left: d.n % d.k - 1 }).msg ?? ''), `partage inégal ${lv}`); if (p === 3) t(d.n % d.k > 0, 'partage p3 avec reste'); }
  for (const lv of divisible.levels) { const d = divisible.generate(lv, p, s); t([2, 5, 10].includes(d.k), 'divisible k ∈ {2,5,10}'); }
  for (const lv of probdiv.levels) { const d = probdiv.generate(lv, p, s); if (d.tpl === 'audessus') { const sol = probdiv.solution(d); t(/page aussi/.test(probdiv.check(d, { ...sol, result: d.inst.answer - 1 }).msg ?? ''), 'probdiv reste → page de plus'); } }
}
console.log(bad.join('\n'));
console.log(`${pass} vérifications génériques réussies, ${fail} échecs`);
process.exit(fail ? 1 : 0);
