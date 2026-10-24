/** Propriétés des générateurs sur N graines × niveaux × paliers (défaut 2000). Usage : tsx tests/props.test.ts 2000 */
import { echanger, value } from '../src/exos/echanger';
import { tableau, digitsOf, statement } from '../src/exos/tableau';
import { UNITS, MAXN, type Level, type Palier } from '../src/engine/types';
import { grands } from '../src/exos/grands';
import { suites, term, noCarry } from '../src/exos/suites';
import { words } from '../src/engine/words';
import { complements } from '../src/exos/complements';
import { mental } from '../src/exos/mental';
import { addpose, subpose, carries } from '../src/exos/pose';
import { probadd } from '../src/exos/probadd';
import { evalExpr } from '../src/ui/expr';
import { dizaines } from '../src/exos/dizaines';
import { ranger } from '../src/exos/ranger';
import { droite, N_INT } from '../src/exos/droite';
import { probmul } from '../src/exos/probmul';
import { probdiv } from '../src/exos/probdiv';
import { probprop } from '../src/exos/probprop';
import { probfrac } from '../src/exos/probfrac';
import { probdec } from '../src/exos/dec/probdec';
import { convertir, monnaie, horloge } from '../src/exos/mes/base';
import { duree, probmes } from '../src/exos/mes/suite';

const N = Number(process.argv[2] || 2000);
let pass = 0, fail = 0;
const errs: string[] = [];
const t = (c: boolean, m: string) => { if (c) pass++; else { fail++; if (errs.length < Number(process.env.ERRS ?? 15)) errs.push(m); } };
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
// ---- chapitre 1, suite (tous niveaux)
const LV4: Level[] = ['CE1', 'CE2', 'CM1', 'CM2'];
for (const lv of LV4) for (const p of P) for (let s = 1; s <= N; s++) {
  const tag = `${lv}/p${p}/s${s}`;
  const lim = [Math.ceil((MAXN[lv] + 1) / 10), MAXN[lv]];
  const z = dizaines.generate(lv, p, s);
  t(z.n >= lim[0] && z.n <= lim[1], `diz plage ${tag}`);
  const good = dizaines.solution(z);
  const digit = Math.floor(z.n / UNITS[z.unit].v) % 10, count = Math.floor(z.n / UNITS[z.unit].v);
  t(digit !== count, `diz réponses distinctes ${tag}`);
  t(dizaines.check(z, good).ok, `diz solution ${tag}`);
  const wrong = z.kind === 'chiffre' ? count : digit;
  const v = dizaines.check(z, wrong);
  t(!v.ok && /(NOMBRE|chiffre de la colonne)/.test(v.msg ?? ''), `diz diag confusion ${tag}`);
  if (p === 1) t(z.kind === 'chiffre', `diz p1 chiffre ${tag}`);
  if (p === 2) t(z.kind === 'nombre', `diz p2 nombre ${tag}`);

  const r = ranger.generate(lv, p, s);
  t(new Set(r.nums).size === r.nums.length, `ran distincts ${tag}`);
  t(r.nums.length === (p === 1 ? 4 : 5), `ran taille ${tag}`);
  t(r.nums.every((x) => x <= lim[1] && x >= (p === 3 ? (lim[0] / 10) * 9 : lim[0])), `ran plage ${tag} ${r.nums}`);
  const sol = ranger.solution(r);
  t(ranger.check(r, sol).ok, `ran solution ${tag}`);
  t(!sol.every((x, i) => x === i), `ran pas déjà rangé ${tag}`);
  t(sol.every((x, k) => k === 0 || (r.dir === 'asc' ? r.nums[sol[k - 1]] < r.nums[x] : r.nums[sol[k - 1]] > r.nums[x])), `ran ordre strict ${tag}`);
  const rv = ranger.check(r, [...sol].reverse());
  t(!rv.ok && /autre sens/.test(rv.msg ?? ''), `ran diag sens ${tag}`);
  if (p === 3) t(r.nums.some((x) => String(x).length < String(lim[0]).length), `ran p3 nombre plus court ${tag}`);

  const g = droite.generate(lv, p, s);
  const end = g.start + N_INT * g.step;
  t(g.start % g.step === 0 && g.start >= 0 && end <= MAXN[lv] + 1, `dro plage ${tag}`);
  t(g.k >= 1 && g.k <= N_INT && !g.labeled.includes(g.k), `dro cible non écrite ${tag}`);
  t(g.labeled.every((k) => k >= 0 && k <= N_INT) && g.labeled[1] > g.labeled[0], `dro étiquettes ${tag}`);
  if (lv === 'CE1') t([1, 10, 100].includes(g.step), `dro pas CE1 ${tag}`);
  t(droite.check(g, droite.solution(g)).ok, `dro solution ${tag}`);
  if (g.mode === 'placer') { const w = g.k === N_INT ? g.k - 1 : g.k + 1; t(/espaces/.test(droite.check(g, w).msg ?? ''), `dro diag décalage ${tag}`); }
  t(droite.hint(g).length > 10 && droite.correction(g).length > 10, `dro aide ${tag}`);
}
// ---- grands nombres et suites
const W1: Record<number, string> = { 635: 'six-cent-trente-cinq', 80: 'quatre-vingts', 81: 'quatre-vingt-un', 71: 'soixante-et-onze', 200: 'deux-cents', 200000: 'deux-cent-mille', 280000: 'deux-cent-quatre-vingt-mille', 2030004: 'deux-millions-trente-mille-quatre', 1000000: 'un-million', 300000000: 'trois-cents-millions', 1001: 'mille-un', 21: 'vingt-et-un', 91: 'quatre-vingt-onze' };
for (const [n, w] of Object.entries(W1)) t(words(Number(n)) === w, `lettres ${n} → ${words(Number(n))}`);
for (const lv of ['CM1', 'CM2'] as Level[]) for (const p of P) for (let s = 1; s <= N; s++) {
  const tag = `${lv}/p${p}/s${s}`;
  const g = grands.generate(lv, p, s);
  const len = String(g.n).length;
  t(g.n <= MAXN[lv] && len >= (lv === 'CM1' ? 4 : 7), `gra plage ${tag} ${g.n}`);
  if (lv === 'CM1' && p >= 2) t(len >= 5, `gra CM1 ≥ 5 chiffres ${tag}`);
  t(grands.check(g, g.n).ok, `gra solution ${tag}`);
  if (p === 1) t(!String(g.n).includes('0'), `gra p1 sans zéro ${tag}`);
  if (p >= 2) t(String(g.n).includes('0'), `gra p2-3 avec zéros ${tag}`);
  const nz = Number(String(g.n).replace(/0/g, ''));
  if (p >= 2) t(/zéros/.test(grands.check(g, nz).msg ?? ''), `gra diag zéros oubliés ${tag}`);
  t(!/--|^-|-$/.test(words(g.n)) && /^[a-zé-]+$/.test(words(g.n)), `gra lettres bien formées ${tag}`);
}
for (const lv of ['CE1', 'CE2'] as Level[]) for (const p of P) for (let s = 1; s <= N; s++) {
  const tag = `${lv}/p${p}/s${s}`;
  const d = suites.generate(lv, p, s);
  const all = Array.from({ length: d.len }, (_, i) => term(d, i));
  t(all.every((x) => x >= 0 && x <= MAXN[lv]), `sui plage ${tag}`);
  t(d.hole >= 2 && d.hole < d.len, `sui case vide après 2 termes ${tag}`);
  t(suites.check(d, term(d, d.hole)).ok, `sui solution ${tag}`);
  if (p === 1) t(d.step > 0, `sui p1 croissante ${tag}`);
  const nc = noCarry(term(d, d.hole - 1), d.step);
  if (nc !== null && nc !== term(d, d.hole)) t(/échange/.test(suites.check(d, nc).msg ?? ''), `sui diag sans échange ${tag}`);
}
// ---- chapitre 2
for (const lv of LV4) for (const p of P) for (let s = 1; s <= N; s++) {
  const tag = `${lv}/p${p}/s${s}`;
  const c = complements.generate(lv, p, s);
  t(c.c - c.a > 0 && complements.check(c, c.c - c.a).ok, `com solution ${tag}`);
  t(/ajouté/.test(complements.check(c, c.c + c.a).msg ?? ''), `com diag addition ${tag}`);
  const m = mental.generate(lv, p, s);
  const mr = mental.solution(m);
  t(mr >= 0 && mental.check(m, mr).ok, `men solution ${tag}`);
  if (m.kind === 'plus9') t(/ENLEVER/.test(mental.check(m, mr + 2).msg ?? ''), `men diag +9 ${tag}`);
  if (m.kind === 'plusU') t(m.a % 10 + m.b >= 10, `men plusU franchit la dizaine ${tag}`);
  if (m.kind === 'moinsU') t(m.a % 10 < m.b, `men moinsU franchit la dizaine ${tag}`);
  for (const E of [addpose, subpose]) {
    const d = E.generate(lv, p, s);
    const v = d.op === '+' ? d.rows.reduce((x, y) => x + y, 0) : d.rows[0] - d.rows[1];
    const max = { CE1: 999, CE2: 9999, CM1: 99999, CM2: 99999 }[lv];
    t(v > 0 && v <= max && d.rows.every((x) => x > 0 && x <= max), `${E.id} plage ${tag} ${d.rows}`);
    const ch = carries(d);
    t(p === 1 ? ch === 0 : p === 2 ? ch === 1 : ch >= 2, `${E.id} retenues/échanges selon palier ${tag} (${ch})`);
    t(E.check(d, E.solution(d)).ok, `${E.id} solution ${tag}`);
    t(Number([...E.solution(d)].reverse().join('')) === v, `${E.id} chiffres ${tag}`);
    if (d.op === '+' && ch > 0) {
      const nc = [...Array(String(Math.max(...d.rows)).length + 1).keys()].map((i) => d.rows.reduce((a, x) => a + (Math.floor(x / 10 ** i) % 10), 0) % 10);
      while (nc.length > 1 && nc[nc.length - 1] === 0) nc.pop();
      t(/retenues/.test(E.check(d, nc).msg ?? '') || Number([...nc].reverse().join('')) === v, `addpose diag retenue ${tag}`);
    }
    if (d.op === '−' && ch > 0) {
      const len = String(d.rows[0]).length;
      const ab = [...Array(len).keys()].map((i) => Math.abs((Math.floor(d.rows[0] / 10 ** i) % 10) - (Math.floor(d.rows[1] / 10 ** i) % 10)));
      while (ab.length > 1 && ab[ab.length - 1] === 0) ab.pop();
      t(/bas au haut/.test(E.check(d, ab).msg ?? ''), `subpose diag petit-du-grand ${tag}`);
    }
    if (d.op === '−' && p === 3) t(/0/.test(String(d.rows[0]).slice(1, -1)), `subpose p3 zéro au milieu ${tag}`);
  }
  const pb = probadd.generate(lv, p, s);
  const sol = probadd.solution(pb);
  t(evalExpr(sol.nums, sol.ops) === pb.inst.answer, `pb modèle = réponse ${tag} ${pb.tpl}`);
  t(pb.inst.answer > 0, `pb réponse positive ${tag} ${pb.tpl}`);
  t(probadd.check(pb, sol).ok, `pb solution acceptée ${tag} ${pb.tpl}`);
  t(pb.inst.nums.every((x) => pb.inst.text.includes(x.toLocaleString('fr-FR').replace(/\u202f|\s/g, '\u202f')) || pb.inst.text.replace(/\u202f/g, '').includes(String(x))), `pb nombres dans l’énoncé ${tag} ${pb.tpl}`);
  if (p === 1) t(pb.inst.useless.length === 0, `pb p1 sans donnée inutile ${tag}`);
  if (pb.inst.useless.length) {
    const u = pb.inst.useless[0];
    const wrong = { nums: [pb.inst.nums[0], u], ops: ['+'], result: 0 };
    if (pb.inst.slots === 2) t(/ne sert pas/.test(probadd.check(pb, wrong).msg ?? ''), `pb diag donnée inutile ${tag}`);
  }
  // opération contraire : message ciblé (et jamais acceptée)
  if (pb.inst.slots === 2) {
    const flip = { nums: sol.nums, ops: [sol.ops[0] === '+' ? '−' : '+'], result: null };
    const v = probadd.check(pb, flip);
    t(!v.ok && !!v.msg, `pb opération contraire refusée ${tag} ${pb.tpl}`);
  }
  if (pb.tpl === 'tout' || pb.tpl === 'deplus') { const sw = { nums: [...sol.nums].reverse(), ops: sol.ops, result: pb.inst.answer }; t(probadd.check(pb, sw).ok, `pb addition commutative acceptée ${tag}`); }
}

// ---- bornes de calcul par niveau (retour Nguhma 24/10 : CE1 faisable de tête ou presque)
const CAPS: Record<string, number[]> = { CE1: [100, 100, 100], CE2: [600, 5000, 10000] };
const num = (x: string) => Number(x.replace(/\D/g, ''));
for (const lv of LV) for (const p of P) {
  let conv = new Set<string>();
  for (let s = 1; s <= N; s++) {
    const tag = `${lv}/p${p}/s${s}`, cap = CAPS[lv][p - 1];
    // probadd : données, résultats intermédiaires et réponse sous le plafond ; CE1 palier 1 sans retenue
    const pb = probadd.generate(lv, p, s);
    const tk = pb.inst.model.split(/ ([+−]) /);
    let acc = num(tk[0]); let okc = acc <= cap, carry = false;
    for (let i = 1; i < tk.length; i += 2) {
      const b = num(tk[i + 1]);
      if (tk[i] === '+') carry ||= (acc % 10) + (b % 10) >= 10; else carry ||= acc % 10 < b % 10;
      acc = tk[i] === '+' ? acc + b : acc - b; okc &&= b <= cap && acc <= cap && acc >= 0;
    }
    t(okc && pb.inst.answer <= cap, `pb plafond ${cap} ${tag} ${pb.inst.model}`);
    if (lv === 'CE1' && p === 1) t(!carry, `pb CE1 p1 sans retenue ${tag} ${pb.inst.model}`);
    if (lv === 'CE1') t(pb.inst.nums.every((x) => x <= 100) && pb.inst.useless.every((x) => x <= 100), `pb CE1 p${p} nombres ≤ 100 ${tag}`);
    // probmul CE1 : tables de 2, 5, 10 au palier 1 ; produit ≤ 100 puis ≤ 150
    const pm = probmul.generate(lv, p, s);
    if (lv === 'CE1') {
      t(pm.inst.answer <= [90, 100, 100][p - 1] && pm.inst.nums.every((x) => x <= 100), `pmul CE1 produit ${tag} ${pm.inst.model}`);
      const f = pm.inst.model.match(/^(\d+) × (\d+)$/);
      if (f && p === 1) t([2, 5, 10].includes(+f[1]) || [2, 5, 10].includes(+f[2]), `pmul CE1 p1 table 2/5/10 ${tag} ${pm.inst.model}`);
    } else t(pm.inst.answer <= 10000, `pmul CE2 ≤ 10 000 ${tag}`);
    // mental CE1 : 2 chiffres aux paliers 1–2
    const mm = mental.generate(lv, p, s); const mr = mental.solution(mm);
    if (lv === 'CE1') t(Math.max(mm.a, mm.b, mr) <= 100, `mental CE1 p${p} ≤ 100 ${tag} ${mm.a} ${mm.op} ${mm.b}`);
    else t(Math.max(mm.a, mr) <= (p === 1 ? 999 : 10000), `mental CE2 p${p} ${tag}`);
    if (mm.kind === 'moinsU') t(mm.a % 10 > 0, `mental moinsU pas « − 0 » ${tag}`);
    // convertir : unités du programme et nombres dans le champ du niveau
    const cv = convertir.generate(lv, p, s); conv.add(cv.from + '>' + cv.to);
    const units = lv === 'CE1' ? ['m', 'cm', 'km', 'g', 'kg'] : ['m', 'cm', 'mm', 'dm', 'km', 'g', 'kg', 't', 'L', 'cL'];
    t(units.includes(cv.from) && units.includes(cv.to), `conv unités ${lv} ${tag} ${cv.from}>${cv.to}`);
    t(Math.max(cv.n, convertir.solution(cv)) <= (lv === 'CE1' ? 1000 : 10000), `conv champ ${tag}`);
    // monnaie CE1 : euros entiers, billet de 5, 10 ou 20 €
    const mo = monnaie.generate(lv, p, s);
    if (lv === 'CE1') t(mo.prix.n % 10 ** mo.prix.s === 0 && !/,\d*[1-9]/.test(monnaie.solution(mo)), `monnaie CE1 entiers ${tag}`);
    if (lv === 'CE1') t([5, 10, 20].includes(mo.paye.n / 10 ** mo.paye.s), `monnaie CE1 billet ${tag}`);
    // heures et durées CE1 : quarts d'heure
    if (lv === 'CE1') {
      const ho = horloge.generate(lv, p, s); t(ho.m % 15 === 0, `horloge CE1 quarts ${tag}`);
      const du = duree.generate(lv, p, s); t(du.m1 % 15 === 0 && du.m2 % 15 === 0 && duree.solution(du) <= [45, 60, 90][p - 1], `durée CE1 quarts ${tag}`);
      const ms = probmes.generate(lv, p, s); t(ms.answer <= 1000, `probmes CE1 ≤ 1 000 ${tag}`);
    }
    // corrigé de la soustraction posée : jamais de nombre négatif (403 − 158)
    const sp = subpose.generate(lv, p, s); t(!/-\d/.test(subpose.correction(sp)), `subpose corrigé sans « -1 » ${tag}`);
  }
  if (lv === 'CE1') t(conv.size >= 4, `conv CE1 variété ${p} ${[...conv]}`);
}

// ---- problèmes : la bonne opération n'est pas toujours celle du chapitre (retour Nguhma 24/10)
{
  const EX: [typeof probmul, string, [number, number, number]][] = [[probmul, '×', [0.35, 0.45, 0.5]], [probdiv, '÷', [0.3, 0.35, 0.4]], [probprop, '×', [0.35, 0.35, 0.4]], [probfrac, '÷', [0.3, 0.3, 0.35]]];
  for (const [E, op, share] of EX) for (const lv of E.levels) for (const p of P) {
    let alt = 0; const opsSeen = new Set<string>(); const tpls = new Set<string>();
    for (let s = 1; s <= N; s++) {
      const tag = `${E.id} ${lv}/p${p}/s${s}`;
      const d = E.generate(lv, p, s); const i = d.inst; const sol = E.solution(d); tpls.add(d.tpl);
      const isMain = i.model.includes(op);
      if (!isMain) alt++;
      opsSeen.add(i.ops.join(''));
      t(E.check(d, sol).ok, `${tag} solution acceptée ${d.tpl}`);
      t(Math.abs(evalExpr(sol.nums, sol.ops) - (i.exprValue ?? i.answer)) < 1e-9, `${tag} modèle = réponse ${d.tpl}`);
      t(i.ops.includes(op) && i.ops.includes('+') && i.ops.includes('−'), `${tag} étiquettes ${op}, + et − proposées`);
      { const tx = (i.text + ' ' + i.question).replace(/\u202f/g, ''); t(i.nums.every((x) => tx.includes(String(x))), `${tag} nombres dans l’énoncé ${d.tpl}`); }
      if (i.slots === 2) {
        // l'autre opération : jamais acceptée, message ciblé (pas le message générique)
        const wrongOp = isMain ? '+' : op;
        const v = E.check(d, { nums: sol.nums, ops: [wrongOp], result: null });
        t(!v.ok && !!v.msg && !/^Ce calcul ne répond pas/.test(v.msg) && !/Le calcul est juste/.test(v.msg), `${tag} ${wrongOp} refusé avec message ciblé ${d.tpl} : ${v.msg}`);
      }
      t(/class="small"/.test(E.correction(d)) && E.correction(d).includes(i.model), `${tag} corrigé avec la méthode`);
      if (E === probmul && lv === 'CE1') t(i.answer <= 100 && i.nums.every((x) => x <= 100), `${tag} CE1 ≤ 100`);
      if (E === probmul && i.slots === 2) t(i.nums[0] + i.nums[1] !== i.nums[0] * i.nums[1], `${tag} jamais 2 et 2`);
    }
    t(opsSeen.size === 1, `${E.id} ${lv}/p${p} mêmes étiquettes pour tous les problèmes ${[...opsSeen]}`);
    const f = alt / N; t(Math.abs(f - share[p - 1]) < 0.06, `${E.id} ${lv}/p${p} part de non-${op} ${f.toFixed(2)} ≈ ${share[p - 1]}`);
    t(f >= 0.25 && f <= 0.55, `${E.id} ${lv}/p${p} entre 1/4 et un peu plus de 1/2 de non-${op} (${f.toFixed(2)})`);
  }
  // probdec : mêmes étiquettes +, −, × pour tous les problèmes
  for (const lv of probdec.levels) for (const p of P) for (let s = 1; s <= Math.min(N, 300); s++) {
    const d = probdec.generate(lv, p, s); t(d.inst.ops.join('') === '+−×', `probdec étiquettes ${lv}/p${p}/s${s}`); t(probdec.check(d, probdec.solution(d)).ok, `probdec solution ${lv}/p${p}/s${s}`);
  }
}
// ---- maîtrise, révisions espacées (localStorage simulé)
{
  const mem: Record<string, string> = {};
  (globalThis as any).localStorage = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => (mem[k] = v) };
  const S = await import('../src/store');
  const D = 24 * 3600 * 1000;
  let now = 1e12;
  for (let i = 0; i < 4; i++) S.record('x', 'CE1', true, now);
  t(S.stars(S.getMastery('x', 'CE1')) === 1, 'maîtrise : 4 de suite = encore ★');
  S.record('x', 'CE1', false, now);
  t(S.getMastery('x', 'CE1').streak === 2, 'maîtrise : erreur au 1er essai = série − 2');
  for (let i = 0; i < 3; i++) S.record('x', 'CE1', true, now);
  t(S.stars(S.getMastery('x', 'CE1')) === 2, 'maîtrise : 5 de suite = ★★');
  t(!S.isDue(S.getMastery('x', 'CE1'), now) && S.isDue(S.getMastery('x', 'CE1'), now + D), 'révision due après 1 jour');
  now += D; S.record('x', 'CE1', true, now);
  now += 3 * D; S.record('x', 'CE1', true, now);
  t(S.stars(S.getMastery('x', 'CE1')) === 2, 'révisions J+1, J+3 : encore ★★');
  now += 7 * D; S.record('x', 'CE1', true, now);
  t(S.stars(S.getMastery('x', 'CE1')) === 3, 'révision d’une semaine réussie : ★★★');
  now += 30 * D; S.record('x', 'CE1', false, now);
  t(S.getMastery('x', 'CE1').stage === 2 && S.stars(S.getMastery('x', 'CE1')) === 2, 'révision ratée : on recule d’une étape');
  t(S.dueList(now).length === 0 && S.dueList(now + D).length === 1, 'liste « à réviser »');
  t(Object.keys(mem).every((k) => k.startsWith('compendium-primaire.')), 'stockage préfixé compendium-primaire.');
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
console.log(`${pass} vérifications réussies, ${fail} échecs (${N} graines par niveau et par palier)`);
errs.forEach((e) => console.log('  ✗', e));
process.exit(fail ? 1 : 0);
