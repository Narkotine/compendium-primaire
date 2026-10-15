/** Addition/soustraction posées, ×÷10, décimal × entier. */
import { rng } from '../../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../../engine/types';
import { type Dec, fmtDec, fromParts, maxS, add, sub, mulInt, parseDec, cmp } from '../../engine/dec';
import { keypad } from '../../ui/keypad';

const LV = (lv: Level) => (lv === 'CM2' || lv === '6e' ? 'CM2' : 'CM1') as 'CM1' | 'CM2';
function mk(r: ReturnType<typeof rng>, lv: 'CM1' | 'CM2', sMax?: number): Dec {
  const s = r.int(1, sMax ?? maxS(lv));
  return fromParts(r.int(0, 50), Array.from({ length: s }, (_, i) => r.int(i === s - 1 ? 1 : 0, 9)));
}

/* ---------- decpose ---------- */
export interface DpData { lv: Level; p: Palier; op: '+' | '−'; a: Dec; b: Dec }
export const decpose: ExoType<DpData, string> = {
  id: 'decpose', title: 'Addition et soustraction de décimaux', notion: 'Addition et soustraction', levels: ['CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed); const L = LV(lv);
    for (;;) {
      const op: '+' | '−' = r.next() < 0.55 ? '+' : '−';
      let a = mk(r, L, p === 1 ? 1 : maxS(L));
      let b = mk(r, L, p === 1 ? 1 : maxS(L));
      if (p === 1) { // no carry across comma awkwardness: same s
        // same scale p1
        a = fromParts(r.int(1, 20), [r.int(0, 4)]);
        b = fromParts(r.int(1, 20), [r.int(0, 4)]);
      }
      if (p === 2) {
        // different number of decimals (align trap)
        a = fromParts(r.int(1, 30), [r.int(1, 9)]);
        b = fromParts(r.int(1, 20), [r.int(0, 9), r.int(1, 9)]);
      }
      if (op === '−' && cmp(a, b) < 0) [a, b] = [b, a];
      if (op === '−' && cmp(a, b) === 0) continue;
      return { lv, p, op, a, b };
    }
  },
  solution: (d) => fmtDec(d.op === '+' ? add(d.a, d.b) : sub(d.a, d.b)),
  check(d, a) {
    const got = parseDec(a);
    const good = d.op === '+' ? add(d.a, d.b) : sub(d.a, d.b);
    if (!got) return { ok: false, msg: 'Écris le résultat avec une virgule si besoin.' };
    const s = Math.max(got.s, good.s);
    if (got.n * 10 ** (s - got.s) === good.n * 10 ** (s - good.s)) return { ok: true };
    // right-align trap: treat as integers by concatenating digits
    const as = fmtDec(d.a).replace(',', '').replace(/\u202f/g, '');
    const bs = fmtDec(d.b).replace(',', '').replace(/\u202f/g, '');
    const ia = Number(as), ib = Number(bs);
    if (d.op === '+' && got.s === 0 && got.n === ia + ib) return { ok: false, msg: `Tu as aligné à droite, comme des entiers. Aligne les virgules : dixièmes sous dixièmes.` };
    if (d.op === '−' && got.s === 0 && got.n === Math.abs(ia - ib)) return { ok: false, msg: `Aligne les virgules avant de calculer, pas les derniers chiffres.` };
    return { ok: false, msg: `Aligne les virgules, puis calcule colonne par colonne.` };
  },
  hint: (d) => `Écris ${fmtDec(d.a)} et ${fmtDec(d.b)} l’un sous l’autre en alignant les virgules. Tu peux ajouter des 0 (2,5 = 2,50).`,
  correction: (d) => `<p>${fmtDec(d.a)} ${d.op} ${fmtDec(d.b)} = <b>${decpose.solution(d)}</b></p><p class="small">Virgules alignées = unités de même rang alignées.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Calcule : <b class="big">${fmtDec(d.a)} ${d.op} ${fmtDec(d.b)}</b></p><p class="tip">Aligne les virgules dans ta tête (ou sur un brouillon), puis écris le résultat.</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le résultat', 4, { comma: true, maxDec: 3 });
    return { answer: () => k.value() as string | null, ready: () => (k.value() === null ? 'Écris le résultat.' : null), lock: () => k.lock() };
  },
};

/* ---------- decfois ---------- */
export interface DfData { lv: Level; p: Palier; d: Dec; m: number; op: '×' | '÷' }
export const decfois: ExoType<DfData, string> = {
  id: 'decfois', title: '× 10, × 100, ÷ 10', notion: '× 10, × 100, ÷ 10', levels: ['CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const m = p === 1 ? 10 : r.pick([10, 100, 1000]);
    const op: '×' | '÷' = p === 3 && r.next() < 0.5 ? '÷' : '×';
    const s = r.int(1, 3);
    const d = fromParts(r.int(1, 99), Array.from({ length: s }, (_, i) => r.int(i === s - 1 ? 1 : 0, 9)));
    // for ÷, ensure result is nice
    if (op === '÷') {
      // d should be divisible visually: just use d, result shifts
    }
    return { lv, p, d, m, op };
  },
  solution(d) {
    const ranks = Math.round(Math.log10(d.m));
    if (d.op === '×') {
      const news = d.d.s - ranks;
      return news >= 0 ? fmtDec({ n: d.d.n, s: news }) : fmtDec({ n: d.d.n * 10 ** (-news), s: 0 });
    }
    return fmtDec({ n: d.d.n, s: d.d.s + ranks });
  },
  check(d, a) {
    const got = parseDec(a);
    const good = parseDec(decfois.solution(d))!;
    if (!got) return { ok: false, msg: 'Écris le résultat.' };
    const s = Math.max(got.s, good.s);
    if (got.n * 10 ** (s - got.s) === good.n * 10 ** (s - good.s)) return { ok: true };
    // "add a zero" trap : same value as the start (7,2 → 7,20) or digits+0 without shift
    {
      const s0 = Math.max(got.s, d.d.s);
      if (d.op === '×' && got.n * 10 ** (s0 - got.s) === d.d.n * 10 ** (s0 - d.d.s))
        return { ok: false, msg: `Tu as « ajouté un zéro » sans faire glisser les chiffres. ${fmtDec(d.d)} × ${fmt(d.m)} : les chiffres montent de ${Math.round(Math.log10(d.m))} rang${d.m > 10 ? 's' : ''} (ex. 7,2 × 10 = 72, pas 7,20).` };
    }
    return { ok: false, msg: `Chaque chiffre ${d.op === '×' ? 'monte' : 'descend'} de ${Math.round(Math.log10(d.m))} rang${d.m > 10 ? 's' : ''}. La virgule reste le repère des unités.` };
  },
  hint: (d) => `${d.op} ${fmt(d.m)} : les chiffres glissent de ${Math.round(Math.log10(d.m))} rang${d.m > 10 ? 's' : ''} vers la ${d.op === '×' ? 'gauche' : 'droite'}.`,
  correction: (d) => `<p>${fmtDec(d.d)} ${d.op} ${fmt(d.m)} = <b>${decfois.solution(d)}</b></p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Calcule : <b class="big">${fmtDec(d.d)} ${d.op} ${fmt(d.m)}</b></p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le résultat', 6, { comma: true, maxDec: 4 });
    return { answer: () => k.value() as string | null, lock: () => k.lock() };
  },
};

/* ---------- decmul ---------- */
export interface DmData { lv: Level; p: Palier; d: Dec; k: number }
export const decmul: ExoType<DmData, string> = {
  id: 'decmul', title: 'Décimal × entier', notion: 'Décimal × entier', levels: ['CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed); const L = LV(lv);
    const k = L === 'CM1' || p === 1 ? r.int(2, 9) : r.int(2, p === 2 ? 15 : 35);
    const s = r.int(1, maxS(L));
    const d = fromParts(r.int(1, 40), Array.from({ length: s }, (_, i) => r.int(i === s - 1 ? 1 : 0, 9)));
    return { lv, p, d, k };
  },
  solution: (d) => fmtDec(mulInt(d.d, d.k)),
  check(d, a) {
    const got = parseDec(a);
    const good = mulInt(d.d, d.k);
    if (!got) return { ok: false, msg: 'Écris le résultat.' };
    const s = Math.max(got.s, good.s);
    if (got.n * 10 ** (s - got.s) === good.n * 10 ** (s - good.s)) return { ok: true };
    // forgot comma: product of integers
    const digits = Math.abs(d.d.n);
    if (got.s === 0 && got.n === digits * d.k) return { ok: false, msg: `Tu as multiplié les chiffres, mais tu as oublié de remettre la virgule (${d.d.s} chiffre${d.d.s > 1 ? 's' : ''} après la virgule dans ${fmtDec(d.d)}).` };
    // wrong place for comma
    if (got.n === good.n && got.s !== good.s) return { ok: false, msg: `Le nombre de chiffres après la virgule doit être le même que dans ${fmtDec(d.d)} (${d.d.s}).` };
    return { ok: false, msg: `Estime : ${d.k} × ${fmtDec({ n: Math.round(d.d.n / 10 ** d.d.s), s: 0 })} ≈ ? Puis replace la virgule.` };
  },
  hint: (d) => `Calcule ${fmt(Math.abs(d.d.n))} × ${d.k} comme des entiers, puis place la virgule pour garder ${d.d.s} décimale${d.d.s > 1 ? 's' : ''}.`,
  correction: (d) => `<p>${fmtDec(d.d)} × ${d.k} = <b>${decmul.solution(d)}</b></p><p class="small">${fmt(Math.abs(d.d.n))} × ${d.k} = ${fmt(Math.abs(d.d.n) * d.k)}, puis virgule (${d.d.s} décimale${d.d.s > 1 ? 's' : ''}).</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Calcule : <b class="big">${fmtDec(d.d)} × ${d.k}</b></p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le produit', 6, { comma: true, maxDec: 3 });
    return { answer: () => k.value() as string | null, lock: () => k.lock() };
  },
};
