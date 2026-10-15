export type Level = 'CE1' | 'CE2' | 'CM1' | 'CM2' | '6e';
export const LEVELS: Level[] = ['CE1', 'CE2', 'CM1', 'CM2', '6e'];
/** Plus grand nombre entier (CE1…CM2 programme ; 6e : mêmes notions, jusqu’au milliard). */
export const MAXN: Record<Level, number> = { CE1: 999, CE2: 9999, CM1: 999999, CM2: 999999999, '6e': 999999999999 };
export const NDIG: Record<Level, number> = { CE1: 3, CE2: 4, CM1: 6, CM2: 9, '6e': 12 };
/** Palier de difficulté dans un niveau : 1 (découverte), 2, 3 (pièges). */
export type Palier = 1 | 2 | 3;
/** Unités de numération, de la plus petite à la plus grande. */
export const UNITS = [
  { key: 'u', one: 'unité', many: 'unités', short: 'U', v: 1 },
  { key: 'd', one: 'dizaine', many: 'dizaines', short: 'D', v: 10 },
  { key: 'c', one: 'centaine', many: 'centaines', short: 'C', v: 100 },
  { key: 'm', one: 'millier', many: 'milliers', short: 'M', v: 1000 },
  { key: 'dm', one: 'dizaine de milliers', many: 'dizaines de milliers', short: 'DM', v: 1e4 },
  { key: 'cm', one: 'centaine de milliers', many: 'centaines de milliers', short: 'CM', v: 1e5 },
  { key: 'mi', one: 'million', many: 'millions', short: 'Mi', v: 1e6 },
  { key: 'dmi', one: 'dizaine de millions', many: 'dizaines de millions', short: 'DMi', v: 1e7 },
  { key: 'cmi', one: 'centaine de millions', many: 'centaines de millions', short: 'CMi', v: 1e8 },
  { key: 'md', one: 'milliard', many: 'milliards', short: 'Md', v: 1e9 },
  { key: 'dmd', one: 'dizaine de milliards', many: 'dizaines de milliards', short: 'DMd', v: 1e10 },
  { key: 'cmd', one: 'centaine de milliards', many: 'centaines de milliards', short: 'CMd', v: 1e11 },
] as const;
export const unitName = (k: number, n: number) => (n > 1 ? UNITS[k].many : UNITS[k].one);
/** Nombre de colonnes (U, D, C [, M]) selon le niveau. */
export const nCols = (lv: Level) => (lv === 'CE1' ? 3 : 4); // matériel et tableau : CE seulement
/** CM2 ou 6e (mêmes notions, nombres plus grands en 6e). */
export const atLeastCM2 = (lv: Level) => lv === 'CM2' || lv === '6e';
/** Pour logique « comme CM2 » quand 6e n’a pas de branche dédiée. */
export const asCM = (lv: Level): Exclude<Level, '6e'> => (lv === '6e' ? 'CM2' : lv);

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
