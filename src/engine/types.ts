export type Level = 'CE1' | 'CE2';
export const LEVELS: Level[] = ['CE1', 'CE2'];
/** Palier de difficulté dans un niveau : 1 (découverte), 2, 3 (pièges). */
export type Palier = 1 | 2 | 3;
/** Unités de numération, de la plus petite à la plus grande. */
export const UNITS = [
  { key: 'u', one: 'unité', many: 'unités', short: 'U', v: 1 },
  { key: 'd', one: 'dizaine', many: 'dizaines', short: 'D', v: 10 },
  { key: 'c', one: 'centaine', many: 'centaines', short: 'C', v: 100 },
  { key: 'm', one: 'millier', many: 'milliers', short: 'M', v: 1000 },
] as const;
export const unitName = (k: number, n: number) => (n > 1 ? UNITS[k].many : UNITS[k].one);
/** Nombre de colonnes (U, D, C [, M]) selon le niveau. */
export const nCols = (lv: Level) => (lv === 'CE1' ? 3 : 4);

export interface Verdict { ok: boolean; msg?: string; /** cases à signaler (index de colonne) */ bad?: number[] }
export interface Mounted<A> { answer(): A | null; lock(): void; showBad?(cols: number[]): void; /** message si la réponse ne peut pas encore être vérifiée (sans pénalité) */ ready?(): string | null }
export interface ExoType<D, A> {
  id: string;
  title: string;
  notion: string;
  levels: Level[];
  generate(lv: Level, p: Palier, seed: number): D;
  /** Réponse attendue (pour les tests et le corrigé). */
  solution(d: D): A;
  check(d: D, a: A): Verdict;
  hint(d: D): string;
  correction(d: D): string;
  mount(el: HTMLElement, d: D): Mounted<A>;
}
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
