/**
 * Division posée, étape par étape (CM1–CM2 : diviseur à un chiffre ; le diviseur à deux chiffres est en 6e).
 * On partage d'abord les plus grandes unités ; le reste est échangé contre des unités 10 fois plus petites.
 * À chaque étape : combien de fois le diviseur ? Combien reste-t-il ? Un 0 au quotient quand on ne peut pas partager.
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, UNITS, fmt } from '../engine/types';
import { lineFields } from '../ui/lines';

export interface DivData { lv: Level; p: Palier; n: number; d: number }
export interface Step { X: number; k: number; q: number; r: number }
export function steps(x: DivData): Step[] {
  const s = String(x.n); const out: Step[] = [];
  let i = 0, X = 0;
  while (i < s.length - 1 && X * 10 + Number(s[i]) < x.d) { X = X * 10 + Number(s[i]); i++; }
  X = X * 10 + Number(s[i]);
  for (;;) {
    const k = s.length - 1 - i;
    const q = Math.floor(X / x.d), r = X - q * x.d;
    out.push({ X, k, q, r });
    i++;
    if (i >= s.length) break;
    X = r * 10 + Number(s[i]);
  }
  return out;
}
const quot = (x: DivData) => Math.floor(x.n / x.d);
export const divpose: ExoType<DivData, (number | null)[]> = {
  id: 'divpose', title: 'Division posée', notion: 'Division posée', levels: ['CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const len = (lv === 'CM1' ? 3 : 4) + (p >= 2 ? 1 : 0);
    for (;;) {
      const d = r.int(p === 1 ? 2 : 3, 9);
      const n = r.int(10 ** (len - 1), 10 ** len - 1);
      const st = steps({ lv, p, n, d });
      const zero = st.some((s, i) => i > 0 && s.q === 0);
      if (p === 3 ? !zero : zero) continue;
      return { lv, p, n, d };
    }
  },
  solution: (x) => steps(x).flatMap((s) => [s.q, s.r]),
  check(x, a) {
    const st = steps(x);
    for (let i = 0; i < st.length; i++) {
      const s = st[i], q = a[2 * i], r = a[2 * i + 1], u = UNITS[s.k].many;
      if (q === s.q && r === s.r) continue;
      if (q === null || r === null) return { ok: false, bad: [2 * i, 2 * i + 1], msg: 'Remplis chaque étape.' };
      if (s.q === 0 && q !== 0) return { ok: false, bad: [2 * i], msg: `Il y a ${s.X} ${u} : c’est moins que ${x.d}. On ne peut pas partager : mets 0 au quotient.` };
      if (q * x.d > s.X) return { ok: false, bad: [2 * i], msg: `${q} × ${x.d} = ${q * x.d} : c’est plus que ${s.X} ${u}. Prends un nombre plus petit.` };
      if (q === s.q) return { ok: false, bad: [2 * i + 1], msg: `Le reste : ${s.X} − ${q} × ${x.d} = ${s.X} − ${q * x.d} = ?` };
      if (s.X - q * x.d >= x.d) return { ok: false, bad: [2 * i, 2 * i + 1], msg: `Avec ${q}, il resterait ${s.X - q * x.d} ${u} : c’est encore ${x.d} ou plus. Tu peux donner plus à chacun.` };
      return { ok: false, bad: [2 * i, 2 * i + 1], msg: `Étape ${i + 1} : combien de fois ${x.d} dans ${s.X} ? Cherche dans la table de ${x.d}.` };
    }
    return { ok: true };
  },
  hint: (x) => { const s = steps(x)[0]; return `Commence par les ${UNITS[s.k].many} : ${s.X} ${UNITS[s.k].many} partagées en ${x.d}. Cherche dans la table de ${x.d} le nombre le plus proche de ${s.X}, sans le dépasser.`; },
  correction: (x) => `<p>${steps(x).map((s, i) => `Étape ${i + 1} : ${s.X} ${UNITS[s.k].many} ÷ ${x.d} → ${s.q}, il reste ${s.r}`).join('<br>')}</p><p><b>${fmt(x.n)} = ${x.d} × ${fmt(quot(x))} + ${x.n % x.d}</b></p>`,
  mount(el, x) {
    const st = steps(x);
    const specs = st.flatMap((s, i) => [
      { label: i === 0 ? `1. ${s.X} ${UNITS[s.k].many} ÷ ${x.d} :` : `${i + 1}. les ${UNITS[s.k].many} ÷ ${x.d} :`, aria: `Étape ${i + 1}, ${UNITS[s.k].many} : combien de fois ${x.d}` },
      { label: 'il reste', aria: `Étape ${i + 1}, reste` },
    ]);
    el.innerHTML = `<p class="q">Divise <b>${fmt(x.n)}</b> par <b>${x.d}</b>, étape par étape.</p><p class="tip">À chaque étape : combien de fois ${x.d} ? Puis le reste. Le reste s’échange : 1 centaine = 10 dizaines, et on ajoute le chiffre suivant.</p><div class="w-ln"></div><p class="fact w-q"></p>`;
    const L = lineFields(el.querySelector('.w-ln')!, specs, '', 2);
    el.querySelector('.ln-bar')?.remove();
    return { answer: () => L.values(), ready: () => (L.values().some((v) => v === null) ? 'Remplis toutes les étapes avant de vérifier.' : null), lock: () => L.lock(), showBad: (b) => L.showBad(b) };
  },
};
