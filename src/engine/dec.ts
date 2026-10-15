/** Décimaux en entiers scalés (évite les erreurs de flottants). n / 10^s. */
export type Dec = { n: number; s: number }; // valeur = n / 10^s
export const DUNITS = [
  { key: 'mi', one: 'millième', many: 'millièmes', short: 'm', s: 3 },
  { key: 'c', one: 'centième', many: 'centièmes', short: 'c', s: 2 },
  { key: 'd', one: 'dixième', many: 'dixièmes', short: 'd', s: 1 },
  { key: 'u', one: 'unité', many: 'unités', short: 'U', s: 0 },
] as const;
/** CM1 : jusqu'aux centièmes (s≤2) ; CM2 : millièmes (s≤3). */
export const maxS = (lv: 'CM1' | 'CM2') => (lv === 'CM1' ? 2 : 3);
export const scale = (d: Dec, s: number): number => {
  if (s === d.s) return d.n;
  if (s > d.s) return d.n * 10 ** (s - d.s);
  return Math.trunc(d.n / 10 ** (d.s - s)); // troncature vers 0
};
export const sameS = (a: Dec, b: Dec): [number, number, number] => {
  const s = Math.max(a.s, b.s);
  return [scale(a, s), scale(b, s), s];
};
export const cmp = (a: Dec, b: Dec) => { const [x, y] = sameS(a, b); return x === y ? 0 : x < y ? -1 : 1; };
export const add = (a: Dec, b: Dec): Dec => { const [x, y, s] = sameS(a, b); return { n: x + y, s }; };
export const sub = (a: Dec, b: Dec): Dec => { const [x, y, s] = sameS(a, b); return { n: x - y, s }; };
export const mulInt = (a: Dec, k: number): Dec => ({ n: a.n * k, s: a.s });
/** Formate avec virgule française. Pas de zéro superflu à droite, sauf si keepZeros. */
export function fmtDec(d: Dec, keepZeros = false): string {
  const neg = d.n < 0; const n = Math.abs(d.n);
  if (d.s === 0) return (neg ? '−' : '') + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  const raw = String(n).padStart(d.s + 1, '0');
  let intp = raw.slice(0, -d.s) || '0';
  let frac = raw.slice(-d.s);
  if (!keepZeros) frac = frac.replace(/0+$/, '');
  intp = intp.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  return (neg ? '−' : '') + (frac ? `${intp},${frac}` : intp);
}
export const fromScaled = (n: number, s: number): Dec => ({ n, s });
/** Construit un décimal à partir de la partie entière et des chiffres après la virgule. */
export const fromParts = (intp: number, fracDigits: number[]): Dec => {
  const s = fracDigits.length;
  let f = 0; for (const d of fracDigits) f = f * 10 + d;
  return { n: intp * 10 ** s + (intp < 0 ? -f : f), s };
};
export const intPart = (d: Dec) => Math.trunc(scale(d, 0) === d.n && d.s === 0 ? d.n : d.n / 10 ** d.s);
/** Arrondi à l'entier (½ vers le haut en valeur absolue, comme le programme : 3,5 → 4). */
export function roundInt(d: Dec): number {
  const s = d.s; if (s === 0) return d.n;
  const q = Math.trunc(d.n / 10 ** s);
  const r = Math.abs(d.n) % 10 ** s;
  const half = 5 * 10 ** (s - 1);
  if (r >= half) return q + (d.n >= 0 ? 1 : -1);
  return q;
}
/** Chiffres : […, centaines, dizaines, unités, dixièmes, centièmes, millièmes] indexés depuis les unités (0).
 *  Negatif = à gauche des unités. Positif = après la virgule. */
export function digitsAround(d: Dec): { k: number; v: number }[] {
  const s = String(Math.abs(d.n)).padStart(d.s + 1, '0');
  const out: { k: number; v: number }[] = [];
  for (let i = 0; i < s.length; i++) {
    const fromRight = s.length - 1 - i;
    const k = fromRight - d.s; // 0 = unités
    out.push({ k, v: Number(s[i]) });
  }
  return out;
}
export const eqDec = (a: Dec, b: Dec) => cmp(a, b) === 0;
/** Parse une saisie "12,35" ou "12.35" → Dec (s = nb de décimales tapées). */
export function parseDec(raw: string): Dec | null {
  const t = raw.trim().replace(/\u202f/g, '').replace(/\./g, ',');
  if (!t || t === ',' || t === '−' || t === '-') return null;
  const m = /^(-|−)?(\d+)?(?:,(\d+))?$/.exec(t);
  if (!m) return null;
  const neg = !!m[1];
  const intp = m[2] ? Number(m[2]) : 0;
  const frac = m[3] ?? '';
  if (!m[2] && !frac) return null;
  const s = frac.length;
  const n = intp * 10 ** s + (frac ? Number(frac) : 0);
  return { n: neg ? -n : n, s };
}
