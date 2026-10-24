/**
 * Problèmes avec décimaux (monnaie, mesures). L'enfant écrit le calcul (glisser-déposer)
 * puis donne le résultat au pavé à virgule. Données inutiles possibles.
 */
import { rng } from '../../engine/rng';
import type { Rng } from '../../engine/rng';
import { type ExoType, type Level, type Palier } from '../../engine/types';
import { type Dec, fmtDec, fromParts, add, sub, mulInt, parseDec, cmp } from '../../engine/dec';
import { exprBuilder } from '../../ui/expr';
import { keypad } from '../../ui/keypad';
import { names, il, uOK } from '../pb/engine';

export interface PdInst {
  text: string; question: string;
  /** valeurs utiles (scalées) */ nums: Dec[];
  useless: Dec[];
  slots: number; ops: string[];
  answer: Dec; unit: string;
  model: string; hint: string;
  diag?: (nums: Dec[], ops: string[]) => string | null;
}
export interface PdData { lv: Level; p: Palier; inst: PdInst }

const F = (d: Dec) => fmtDec(d);
const same = (a: Dec[], b: Dec[]) => a.length === b.length && [...a].every((x) => b.some((y) => cmp(x, y) === 0)) && [...b].every((y) => a.some((x) => cmp(x, y) === 0));

function make(r: Rng, lv: Level, p: Palier): PdInst {
  const [P] = names(r, 1);
  const kind = r.pick(p === 1 ? ['masse', 'prix'] : p === 2 ? ['masse', 'prix', 'deplus'] : ['masse', 'prix', 'deplus', 'mul']);
  const useless = uOK(lv, p) ? [fromParts(r.int(2, 9), [r.int(0, 9)])] : [];
  const uTxt = useless.length ? r.pick([` ${P} a ${r.int(8, 12)} ans.`, ` Il est ${r.int(8, 18)} h.`, ` Le panier coûte ${F(useless[0])} € (ne s’utilise pas).`]) : '';

  if (kind === 'masse') {
    const total = fromParts(r.int(3, 12), [r.int(0, 9)]);
    const pommes = fromParts(r.int(1, Math.max(1, Math.trunc(total.n / 10 ** total.s) - 1)), [r.int(0, 9)]);
    // ensure pommes < total
    let a = pommes, t = total;
    if (cmp(a, t) >= 0) { t = add(a, fromParts(r.int(1, 5), [r.int(1, 9)])); }
    const ans = sub(t, a);
    return {
      text: `${P} a acheté ${F(a)} kg de pommes.${uTxt} ${il(P)[0].toUpperCase() + il(P).slice(1)} a acheté ${F(t)} kg de fruits en tout.`,
      question: `Quelle masse de poires a-t-${il(P)} achetée ?`,
      nums: [t, a], useless, slots: 2, ops: ['+', '−', '×'], answer: ans, unit: 'kg',
      model: `${F(t)} − ${F(a)}`, hint: `La masse totale moins les pommes.`,
      diag: (_nums, ops) => (ops[0] === '+' ? `On enlève la masse des pommes au total, on ne les ajoute pas.` : ops[0] === '×' ? `On ne multiplie pas : on cherche ce qui reste quand on enlève les pommes du total.` : null),
    };
  }
  if (kind === 'prix') {
    const a = fromParts(r.int(1, 20), [r.int(0, 9), r.int(0, 9)]);
    const b = fromParts(r.int(1, 15), [r.int(0, 9), r.int(0, 9)]);
    const ans = add(a, b);
    return {
      text: `${P} achète un livre à ${F(a)} € et un cahier à ${F(b)} €.${uTxt}`,
      question: `Combien paie-t-${il(P)} en tout ?`,
      nums: [a, b], useless, slots: 2, ops: ['+', '−', '×'], answer: ans, unit: '€',
      model: `${F(a)} + ${F(b)}`, hint: `On réunit les deux prix.`,
      diag: (_nums, ops) => (ops[0] === '−' ? `On paie les deux : on additionne.` : ops[0] === '×' ? `Un livre ET un cahier : on additionne les deux prix, on ne multiplie pas.` : null),
    };
  }
  if (kind === 'deplus') {
    const a = fromParts(r.int(10, 20), [r.int(0, 9), r.int(0, 9)]); // taille
    const d = fromParts(0, [r.int(1, 9), r.int(0, 9)]); // écart en m... use cm as 0,xx m
    const ans = sub(a, d);
    const [Q] = names(r, 1);
    return {
      text: `${P} mesure ${F(a)} m.${uTxt} ${P} mesure ${F(d)} m de plus que ${Q}.`,
      question: `Quelle est la taille de ${Q} ?`,
      nums: [a, d], useless, slots: 2, ops: ['+', '−', '×'], answer: ans, unit: 'm',
      model: `${F(a)} − ${F(d)}`, hint: `${P} est plus grand : on enlève l’écart pour trouver ${Q}.`,
      diag: (_nums, ops) => (ops[0] === '+' ? `${Q} est plus petit que ${P} : on enlève.` : ops[0] === '×' ? `« De plus » donne un écart : on enlève, on ne multiplie pas.` : null),
    };
  }
  // mul: entier × décimal
  const k = r.int(2, 8);
  const prix = fromParts(r.int(5, 25), [r.int(0, 9), r.int(0, 9)]);
  const ans = mulInt(prix, k);
  return {
    text: `Un dictionnaire coûte ${F(prix)} €.${uTxt} La maîtresse en achète ${k}.`,
    question: `Quel montant doit-elle payer ?`,
    nums: [prix, fromParts(k, [])], useless, slots: 2, ops: ['+', '−', '×'], answer: ans, unit: '€',
    model: `${F(prix)} × ${k}`, hint: `${k} dictionnaires au même prix : on multiplie.`,
    diag: (_nums, ops) => (ops[0] === '+' ? `Ce n’est pas un ajout une fois : c’est ${k} fois le prix.` : ops[0] === '−' ? `On achète ${k} dictionnaires : on paie ${k} fois le prix.` : null),
  };
}

export const probdec: ExoType<PdData, { nums: Dec[]; ops: string[]; result: string | null }> = {
  id: 'probdec', title: 'Problèmes avec des décimaux', notion: 'Problèmes', levels: ['CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    for (let i = 0; i < 40; i++) {
      const inst = make(r, lv, p);
      if (cmp(inst.answer, fromParts(0, [])) > 0) return { lv, p, inst };
    }
    // fallback
    return { lv, p, inst: make(rng(seed + 99), lv, 1) };
  },
  solution: (d) => ({ nums: d.inst.nums, ops: d.inst.model.match(/ [+−×÷] /g)!.map((x) => x.trim()), result: F(d.inst.answer) }),
  check(d, a) {
    const i = d.inst;
    const usedU = a.nums.filter((n) => i.useless.some((u) => cmp(u, n) === 0) && !i.nums.some((x) => cmp(x, n) === 0));
    if (usedU.length) return { ok: false, msg: `Le nombre ${F(usedU[0])} ne sert pas à répondre. Relis la question.` };
    if (!same(a.nums, i.nums)) return { ok: false, msg: `Utilise tous les nombres utiles de l’énoncé, chacun une fois.` };
    const msg = i.diag?.(a.nums, a.ops);
    // verify ops match roughly via model
    const wantOps = i.model.match(/ [+−×÷] /g)!.map((x) => x.trim());
    if (a.ops.join() !== wantOps.join() || msg) return { ok: false, msg: msg ?? `Ce calcul ne répond pas à la question.` };
    if (a.result === null) return { ok: false, msg: 'Le calcul est juste ! Maintenant calcule le résultat.' };
    const got = parseDec(a.result);
    if (!got) return { ok: false, msg: 'Écris le résultat avec une virgule si besoin.' };
    const s = Math.max(got.s, i.answer.s);
    if (got.n * 10 ** (s - got.s) === i.answer.n * 10 ** (s - i.answer.s)) return { ok: true };
    return { ok: false, msg: `Ton calcul est bien choisi, mais le résultat n’est pas juste. Refais l’opération.` };
  },
  hint: (d) => d.inst.hint,
  correction: (d) => `<p>Calcul : <b>${d.inst.model} = ${F(d.inst.answer)}</b></p><p>Réponse : ${F(d.inst.answer)} ${d.inst.unit}.</p>`,
  mount(el, d) {
    const i = d.inst;
    // encode Dec as number key: n + s/10 (unique enough for pool) — better: use parallel arrays
    const all = [...i.nums, ...i.useless.filter((u) => !i.nums.some((x) => cmp(x, u) === 0))];
    // indices 0..n-1 as token values ; display via all[i]
    const packed = all.map((_, idx) => idx);
    el.innerHTML = `<p class="pb-text">${i.text}</p><p class="q"><b>${i.question}</b></p>
      <p class="tip">1. Écris le calcul avec les étiquettes.</p><div class="w-ex"></div>
      <p class="tip">2. Calcule le résultat.</p><div class="w-kp"></div>`;
    const ex = exprBuilder(el.querySelector('.w-ex')!, packed, i.ops, i.slots, (n) => F(all[n]));
    const k = keypad(el.querySelector('.w-kp')!, 'Le résultat', 5, { comma: true, maxDec: 3 });
    return {
      answer: () => {
        const v = ex.value();
        if (!v) return null;
        return { nums: v.nums.map((n) => all[n]), ops: v.ops, result: k.value() as string | null };
      },
      ready: () => (!ex.value() ? 'Écris d’abord le calcul.' : k.value() === null ? 'Calcule aussi le résultat.' : null),
      lock: () => { ex.lock(); k.lock(); },
    };
  },
};
