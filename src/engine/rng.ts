/** Générateur pseudo-aléatoire à graine (mulberry32) : un exercice = (type, niveau, palier, graine). */
export type Rng = { next(): number; int(a: number, b: number): number; pick<T>(a: readonly T[]): T; shuffle<T>(a: T[]): T[] };
export function rng(seed: number): Rng {
  let s = seed >>> 0 || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (a: number, b: number) => a + Math.floor(next() * (b - a + 1));
  return {
    next,
    int,
    pick: (a) => a[Math.floor(next() * a.length)],
    shuffle: (a) => {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}
export const newSeed = () => Math.floor(Math.random() * 2 ** 31);
