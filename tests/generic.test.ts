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
// chapitre 5 : fractions (contrôles méticuleux)
import { fracWords } from '../src/engine/frac';
import { partsegales, colorier, lirefrac } from '../src/exos/frac/figures';
import { fracdroite, fraclire, egales, fraccomp, entierfrac } from '../src/exos/frac/nombres';
import { fracsomme, fracquant } from '../src/exos/frac/calculs';
import { fracpb } from '../src/exos/frac/histoires';
const FW: [number, number, string][] = [[3, 4, 'trois quarts'], [1, 2, 'un demi'], [3, 2, 'trois demis'], [2, 3, 'deux tiers'], [5, 9, 'cinq neuvièmes'], [1, 5, 'un cinquième'], [7, 12, 'sept douzièmes'], [1, 11, 'un onzième'], [3, 17, 'trois dix-septièmes'], [1, 19, 'un dix-neuvième'], [1, 20, 'un vingtième'], [9, 10, 'neuf dixièmes'], [4, 15, 'quatre quinzièmes'], [1, 60, 'un soixantième']];
for (const [a, b, w] of FW) t(fracWords(a, b) === w, `mots ${a}/${b} → ${fracWords(a, b)}`);
const MAXD: Record<string, number> = { CE1: 10, CE2: 12, CM1: 20, CM2: 60 };
const CE1D = [2, 3, 4, 5, 6, 8, 10];
const okDen = (lv: string, d: number) => (lv === 'CE1' ? CE1D.includes(d) : d <= MAXD[lv]);
for (let s = 1; s <= N; s++) for (const p of [1, 2, 3] as Palier[]) {
  for (const lv of partsegales.levels) {
    const d = partsegales.generate(lv, p, s);
    t(okDen(lv, d.b), `partsegales dénominateur ${lv} ${d.b}`);
    t(d.figs.some((f) => f.kind === 'ok') && d.figs.some((f) => f.kind !== 'ok'), 'partsegales : au moins une bonne et une fausse');
    for (const f of d.figs) {
      if (f.kind === 'ok') t(f.b === d.b && f.shade.length === d.a && !f.cuts, 'partsegales ok = parts égales, a grisées');
      if (f.kind === 'inegal') { const w = f.cuts!.slice(1).map((c, i) => c - f.cuts![i]); t(Math.max(...w) / Math.min(...w) >= 1.99, 'partsegales parts vraiment inégales'); }
      if (f.kind === 'compte') t(f.shade.length !== d.a && f.b === d.b, 'partsegales compte faux');
      if (f.kind === 'den') t(f.b !== d.b, 'partsegales dénominateur différent');
    }
    if (lv === 'CE1' && p < 3) t(d.a === 1, 'CE1 : fractions unitaires d’abord');
  }
  for (const lv of colorier.levels) { const d = colorier.generate(lv, p, s); t(okDen(lv, d.b), 'colorier dénominateur'); if (!lv.startsWith('CM')) t(d.a < d.b, 'colorier ≤ 1 au CE'); t(!colorier.check(d, d.b - d.a).ok || d.b - d.a === d.a, 'colorier refuse le complément'); }
  for (const lv of lirefrac.levels) {
    const d = lirefrac.generate(lv, p, s); t(okDen(lv, d.b), 'lirefrac dénominateur');
    if (d.a !== d.b) t(/inversé/.test(lirefrac.check(d, { n: d.b, d: d.a }).msg ?? ''), 'lirefrac inversion ciblée');
    if (d.mode === 'fig') t(lirefrac.check(d, { n: 2 * d.a, d: 2 * d.b }).ok, 'lirefrac fraction égale acceptée');
    t(!lirefrac.check(d, { n: d.a, d: d.b + 1 }).ok, 'lirefrac refuse b+1');
  }
  for (const E of [fracdroite, fraclire]) for (const lv of E.levels) { const d = E.generate(lv, p, s); t(d.k % d.b !== 0 && d.U * d.b <= 24 && d.k < d.U * d.b, 'droite fraction non entière, ≤ 24 intervalles'); if (lv === 'CE2') t(d.U === 1, 'CE2 : bande-unité de 0 à 1'); }
  for (const lv of fraclire.levels) { const d = fraclire.generate(lv, p, s); t(fraclire.check(d, { n: 2 * d.k, d: 2 * d.b }).ok, 'fraclire égale acceptée'); }
  for (const lv of egales.levels) {
    const d = egales.generate(lv, p, s); t(d.b * d.k <= MAXD[lv], `egales dénominateur ≤ max ${lv} ${d.b * d.k}`);
    if (lv === 'CE2') t(d.a < d.b, 'egales ≤ 1 au CE2');
    if (d.miss === 'n' && d.k > 1) t(/ajouté/.test(egales.check(d, d.a + d.b * d.k - d.b).msg ?? ''), 'egales diagnostic additif');
    if (d.miss === 'pick') { const g = egales.solution(d) as number[]; t(g.every((i) => d.cards![i].n * d.b === d.a * d.cards![i].d), 'egales cartes justes'); t(g.length < d.cards!.length, 'egales au moins un piège'); }
  }
  for (const lv of fraccomp.levels) {
    const d = fraccomp.generate(lv, p, s); const cross = Math.sign(d.x.n * d.y.d - d.y.n * d.x.d);
    t(fraccomp.solution(d) === (cross < 0 ? '<' : cross > 0 ? '>' : '='), 'fraccomp signe = produit en croix');
    t(okDen(lv, d.x.d) && okDen(lv, d.y.d), `fraccomp dénominateurs ${lv} ${d.x.d} ${d.y.d}`);
    if (lv === 'CE1' || lv === 'CE2') t(d.x.n <= d.x.d && d.y.n <= d.y.d, `fraccomp ≤ 1 au CE ${d.x.n}/${d.x.d} ${d.y.n}/${d.y.d}`);
    for (const w of ['<', '=', '>']) if (w !== fraccomp.solution(d)) t(!!fraccomp.check(d, w).msg, 'fraccomp message');
  }
  for (const lv of fracsomme.levels) {
    const d = fracsomme.generate(lv, p, s); const g = fracsomme.solution(d);
    t(g.n > 0 && okDen(lv, g.d), `fracsomme résultat ${lv} ${g.n}/${g.d}`);
    if (lv === 'CE1' || lv === 'CE2') t(g.n <= g.d, 'fracsomme ≤ 1 au CE');
    t(fracsomme.check(d, { n: g.n * 3, d: g.d * 3 }).ok, 'fracsomme fraction égale acceptée');
    if (d.kind === 'add' && d.x.d === d.y.d) t(/dénominateurs/.test(fracsomme.check(d, { n: d.x.n + d.y.n, d: 2 * d.x.d }).msg ?? ''), 'fracsomme ajoute les dénominateurs');
  }
  for (const lv of entierfrac.levels) { const d = entierfrac.generate(lv, p, s); const [w, r] = [Math.floor(d.n / d.b), d.n % d.b]; t(w >= 1 && r > 0 && w * d.b + r === d.n, 'entierfrac décomposition'); t(d.b <= MAXD[lv], 'entierfrac dénominateur'); }
  for (const lv of fracquant.levels) { const d = fracquant.generate(lv, p, s); t(d.n % d.b === 0, 'fracquant tombe juste'); if (lv === 'CM1') t(d.a === 1, 'CM1 : fractions unitaires de quantités'); if (d.a > 1) t(/On en veut/.test(fracquant.check(d, d.n / d.b).msg ?? ''), 'fracquant arrêt au quart'); }
  for (const lv of fracpb.levels) { const d = fracpb.generate(lv, p, s); const g = fracpb.solution(d); t(g.n > 0 && g.n <= g.d && okDen(lv, g.d), 'fracpb réponse dans (0, 1]'); if (lv === 'CE1') t(p === 3 || d.extra === '', 'fracpb CE1 inutile seulement p3'); }
}
console.log(bad.join('\n'));
console.log(`${pass} vérifications génériques réussies, ${fail} échecs`);
process.exit(fail ? 1 : 0);
