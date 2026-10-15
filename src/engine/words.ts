/**
 * Nombres en lettres (orthographe rectifiée de 1990, utilisée par le programme : traits d'union partout,
 * « six-cent-trente-cinq »). « cent » et « vingt » prennent un s s'ils sont multipliés et terminent le nombre
 * (ou sont suivis de « millions », qui est un nom) ; « mille » est invariable.
 */
const U = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
const T = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
function below100(n: number): string {
  if (n <= 16) return U[n];
  if (n < 20) return 'dix-' + U[n - 10];
  if (n < 70) { const t = Math.floor(n / 10), u = n % 10; return T[t] + (u === 0 ? '' : u === 1 ? '-et-un' : '-' + U[u]); }
  if (n < 80) return n === 71 ? 'soixante-et-onze' : 'soixante-' + below100(n - 60);
  if (n === 80) return 'quatre-vingts';
  return 'quatre-vingt-' + below100(n - 80);
}
/** 0 < n < 1000 ; `final` : rien ne suit, ou un nom (millions) → pluriels de cent/vingt. */
function below1000(n: number, final: boolean): string {
  const c = Math.floor(n / 100), r = n % 100;
  let s = '';
  if (c) s = (c > 1 ? U[c] + '-' : '') + 'cent' + (c > 1 && r === 0 && final ? 's' : '');
  if (r) {
    let w = below100(r);
    if (r === 80 && !final) w = 'quatre-vingt';
    s += (s ? '-' : '') + w;
  }
  return s;
}
export function words(n: number): string {
  if (n === 0) return 'zéro';
  const md = Math.floor(n / 1e9), mi = Math.floor(n / 1e6) % 1000, mil = Math.floor(n / 1000) % 1000, un = n % 1000;
  const parts: string[] = [];
  if (md) parts.push(below1000(md, true) + '-milliard' + (md > 1 ? 's' : ''));
  if (mi) parts.push(below1000(mi, true) + '-million' + (mi > 1 ? 's' : ''));
  if (mil) parts.push((mil === 1 ? '' : below1000(mil, false) + '-') + 'mille');
  if (un) parts.push(below1000(un, true));
  return parts.join('-');
}
