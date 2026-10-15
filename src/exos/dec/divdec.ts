/**
 * Division décimale CM2 : dividende entier ou décimal, diviseur à un chiffre.
 * Quotients exacts terminants (programme CM2). Construction : quotient d’abord.
 */
import { rng } from '../../engine/rng';
import { type ExoType, type Level, type Palier } from '../../engine/types';
import { type Dec, fmtDec, parseDec } from '../../engine/dec';
import { keypad } from '../../ui/keypad';

export interface DdData { lv: Level; p: Palier; num: Dec; den: number; decs: number }

function exactQuotient(num: Dec, den: number, decs: number): Dec {
  const s = Math.max(num.s, decs);
  return { n: (num.n * 10 ** (s - num.s)) / den, s };
}

function timesDen(quot: Dec, den: number): Dec {
  let n = quot.n * den, s = quot.s;
  while (s > 0 && n % 10 === 0) { n /= 10; s--; }
  return { n, s };
}

/** Dernier chiffre de la partie décimale ≠ 0 (force exactement `decs` décimales). */
function frac(r: ReturnType<typeof rng>, decs: number): number {
  let qf = r.int(1, 10 ** decs - 1);
  if (qf % 10 === 0) qf = qf > 1 ? qf - 1 : 1;
  return qf;
}

export const decdiv: ExoType<DdData, string> = {
  id: 'decdiv', title: 'Division décimale', notion: 'Division décimale', levels: ['CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const decs = p === 1 ? 1 : p === 2 ? r.pick([1, 2]) : r.pick([1, 2, 3]);
    // Palier 1 : dividende entier → diviseur dans {2,4,5,8} pour quotients décimaux fréquents
    const wantInt = p === 1 || (p === 2 && r.next() < 0.45);
    const den = wantInt ? r.pick([2, 4, 5, 8]) : r.int(2, 9);
    const qInt = r.int(p === 1 ? 1 : 2, p === 3 ? 99 : 40);
    let qf = frac(r, decs);
    // Pour dividende entier : quot.n * den divisible par 10^decs
    if (wantInt) {
      for (let t = 0; t < 60; t++) {
        qf = frac(r, decs);
        const qn = qInt * 10 ** decs + qf;
        if ((qn * den) % 10 ** decs === 0) {
          return { lv, p, num: { n: (qn * den) / 10 ** decs, s: 0 }, den, decs };
        }
      }
      // rare : forcer avec qf = 5 * 10^(decs-1) et den pair / 5
      const forced = den === 5 ? 2 * 10 ** (decs - 1) : 5 * 10 ** (decs - 1);
      const qn = qInt * 10 ** decs + forced;
      if ((qn * den) % 10 ** decs === 0)
        return { lv, p, num: { n: (qn * den) / 10 ** decs, s: 0 }, den, decs };
    }
    const quot: Dec = { n: qInt * 10 ** decs + qf, s: decs };
    return { lv, p, num: timesDen(quot, den), den, decs };
  },
  solution: (d) => fmtDec(exactQuotient(d.num, d.den, d.decs)),
  check(d, a) {
    const got = parseDec(a);
    const good = exactQuotient(d.num, d.den, d.decs);
    if (!got) return { ok: false, msg: 'Écris le quotient avec une virgule si besoin.' };
    const s = Math.max(got.s, good.s);
    if (got.n * 10 ** (s - got.s) === good.n * 10 ** (s - good.s)) return { ok: true };
    const intQ = Math.trunc(good.n / 10 ** good.s);
    if (got.s === 0 && got.n === intQ)
      return { ok: false, msg: `Tu t’es arrêté à l’entier. Il restait un reste : ajoute une virgule et continue avec des 0.` };
    if (got.n === good.n && got.s !== good.s)
      return { ok: false, msg: `Les chiffres sont bons, mais la virgule n’est pas au bon endroit.` };
    if (got.s === 0 && d.num.s === 0 && got.n === d.num.n * d.den)
      return { ok: false, msg: `Tu as multiplié. Ici on partage en ${d.den}.` };
    return { ok: false, msg: `Pose ${fmtDec(d.num)} ÷ ${d.den} : à chaque reste, échange contre 10 unités plus petites et continue.` };
  },
  hint: (d) => `Combien de fois ${d.den} dans les premières unités de ${fmtDec(d.num)} ? Puis continue après la virgule.`,
  correction: (d) => {
    const g = exactQuotient(d.num, d.den, d.decs);
    return `<p>${fmtDec(d.num)} ÷ ${d.den} = <b>${fmtDec(g)}</b></p><p class="small">On continue après la virgule en ajoutant des 0 au reste.</p>`;
  },
  mount(el, d) {
    el.innerHTML = `<p class="q">Calcule : <b class="big">${fmtDec(d.num)} ÷ ${d.den}</b></p><p class="tip">Le quotient a ${d.decs} chiffre${d.decs > 1 ? 's' : ''} après la virgule.</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le quotient', 5, { comma: true, maxDec: 3 });
    return { answer: () => k.value() as string | null, ready: () => (k.value() === null ? 'Écris le quotient.' : null), lock: () => k.lock() };
  },
};
