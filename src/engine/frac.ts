/** Fractions : pgcd, égalité, mots (« trois quarts »). */
import { words } from './words';
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const same = (a: number, b: number, c: number, d: number) => a * d === b * c;
/** nom de la part : demi, tiers, quart, cinquième… (au singulier) */
export function partName(b: number) {
  if (b === 2) return 'demi';
  if (b === 3) return 'tiers';
  if (b === 4) return 'quart';
  let w = words(b);
  if (w.endsWith('cinq')) w += 'u';
  if (w.endsWith('neuf')) w = w.slice(0, -1) + 'v';
  if (w.endsWith('e')) w = w.slice(0, -1);
  return w + 'ième';
}
/** « trois quarts », « un demi », « cinq tiers » */
export function fracWords(a: number, b: number) {
  const p = partName(b);
  const pl = a > 1 && !p.endsWith('s') ? p + 's' : p;
  return `${words(a)} ${pl}`;
}
/** écriture HTML empilée */
export const F = (a: number | string, b: number | string) => `<span class="fr"><span class="fr-n">${a}</span><span class="fr-d">${b}</span></span>`;
