import type { Level, Palier } from '../../engine/types';
import type { Rng } from '../../engine/rng';
import { F, gcd } from '../../engine/frac';
/** Dénominateurs du programme. CE1 : 2, 3, 4, 5, 6, 8, 10 ; CE2 : ≤ 12 ; CM1 : ≤ 20 ; CM2 : ≤ 60 (figures : ≤ 12). */
export const DEN_FIG: Record<Level, number[]> = { CE1: [2, 3, 4, 5, 6, 8, 10], CE2: [2, 3, 4, 5, 6, 8, 10, 12], CM1: [2, 3, 4, 5, 6, 8, 10, 12], CM2: [2, 3, 4, 5, 6, 8, 10, 12] };
export const DEN: Record<Level, number[]> = { CE1: DEN_FIG.CE1, CE2: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], CM1: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 20], CM2: [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 20, 24, 25, 30, 40, 50, 60] };
export const easyDen = (lv: Level, p: Palier) => (p === 1 ? [2, 3, 4] : DEN_FIG[lv]);
export interface Frac { n: number; d: number }
export const fv = (f: Frac) => f.n / f.d;
export const eqF = (a: Frac, b: Frac) => a.n * b.d === b.n * a.d;
export const show = (f: Frac) => F(f.n, f.d);
export const simp = (f: Frac): Frac => { const g = gcd(f.n, f.d) || 1; return { n: f.n / g, d: f.d / g }; };
export const pickA = (r: Rng, b: number, unit: boolean) => (unit ? 1 : r.int(1, b - 1));
export const SHAPES = ['bande', 'disque', 'rect'] as const;
