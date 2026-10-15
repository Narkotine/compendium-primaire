/**
 * Chapitre 6 — écriture : fractions décimales ↔ virgule, tableau étendu.
 */
import { rng } from '../../engine/rng';
import { type ExoType, type Level, type Palier } from '../../engine/types';
import { type Dec, fmtDec, fromParts, maxS, parseDec } from '../../engine/dec';
import { dectable, type DecCol } from '../../ui/dectable';
import { keypad } from '../../ui/keypad';
import { pickCards } from '../../ui/pick';

const LV = (lv: Level) => (lv === 'CM2' ? 'CM2' : 'CM1') as 'CM1' | 'CM2';

/* ---------- fracvirgule : passer d'une écriture à l'autre ---------- */
export type FvKind = 'frac→virgule' | 'virgule→frac' | 'somme→virgule' | 'egalite';
export interface FvData { lv: Level; p: Palier; kind: FvKind; d: Dec; /** pour egalite : cartes */ cards?: { t: string; ok: boolean }[] }
function mkDec(r: ReturnType<typeof rng>, lv: 'CM1' | 'CM2', p: Palier): Dec {
  const s = p === 1 ? 1 : r.int(1, maxS(lv));
  const intp = r.int(p === 3 ? 0 : 1, p === 1 ? 9 : 99);
  const frac: number[] = [];
  for (let i = 0; i < s; i++) frac.push(r.int(i === s - 1 ? 1 : 0, 9));
  if (p === 2 && s >= 2 && r.next() < 0.4) frac[0] = 0; // 2,05
  return fromParts(intp, frac);
}
function fracHtml(d: Dec) {
  const den = 10 ** d.s;
  return `<span class="fr"><span class="fr-n">${Math.abs(d.n)}</span><span class="fr-d">${den}</span></span>`;
}
function sommeHtml(d: Dec) {
  const s = String(Math.abs(d.n)).padStart(d.s + 1, '0');
  const intp = Number(s.slice(0, -d.s) || '0');
  const parts: string[] = [];
  if (intp) parts.push(String(intp));
  for (let i = 0; i < d.s; i++) {
    const dig = Number(s[s.length - d.s + i]);
    if (dig) parts.push(`<span class="fr"><span class="fr-n">${dig}</span><span class="fr-d">${10 ** (i + 1)}</span></span>`);
  }
  return parts.join(' + ') || '0';
}
export const fracvirgule: ExoType<FvData, string | number[]> = {
  id: 'fracvirgule', title: 'Fraction décimale et virgule', notion: 'Du dixième à la virgule', levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed); const L = LV(lv);
    const d = mkDec(r, L, p);
    if (p === 3 && r.next() < 0.4) {
      // égalités : quelle écriture représente le même nombre ?
      const den = 10 ** d.s;
      const cards = [
        { t: fmtDec(d), ok: true },
        { t: `${Math.abs(d.n)}/${den}`, ok: true },
        { t: fmtDec({ n: d.n + (d.n % 10 === 9 ? -1 : 1), s: d.s }), ok: false },
        { t: fmtDec({ n: Math.trunc(d.n / 10) * 10 + ((d.n % 10) || 1), s: Math.max(1, d.s - 1) }), ok: false },
      ];
      // piège classique : lire la partie décimale comme un entier collé
      if (d.s >= 2) cards.push({ t: fmtDec({ n: Math.trunc(d.n / 10 ** d.s) * 10 + (d.n % 10 ** d.s), s: 0 }), ok: false });
      while (cards.length < 4) cards.push({ t: fmtDec(mkDec(r, L, 1)), ok: false });
      const shuffled = r.shuffle(cards.slice(0, 4));
      // ensure at least one ok
      if (!shuffled.some((c) => c.ok)) shuffled[0] = { t: fmtDec(d), ok: true };
      return { lv, p, kind: 'egalite', d, cards: shuffled };
    }
    const kinds: FvKind[] = p === 1 ? ['frac→virgule', 'virgule→frac'] : ['frac→virgule', 'virgule→frac', 'somme→virgule'];
    return { lv, p, kind: r.pick(kinds), d };
  },
  solution(d) {
    if (d.kind === 'egalite') return d.cards!.map((c, i) => (c.ok ? i : -1)).filter((i) => i >= 0);
    if (d.kind === 'virgule→frac') return `${Math.abs(d.d.n)}/${10 ** d.d.s}`;
    return fmtDec(d.d);
  },
  check(d, a) {
    if (d.kind === 'egalite') {
      const good = new Set(d.cards!.map((c, i) => (c.ok ? i : -1)).filter((i) => i >= 0));
      const got = new Set(a as number[]);
      const bad = [...got].filter((i) => !good.has(i));
      if (got.size === good.size && [...got].every((i) => good.has(i))) return { ok: true };
      if (bad.length) return { ok: false, bad, msg: `Cette écriture ne vaut pas ${fmtDec(d.d)}. Relis la virgule : ce sont des dixièmes et des centièmes.` };
      return { ok: false, bad: [...good].filter((i) => !got.has(i)), msg: `Il manque une écriture égale à ${fmtDec(d.d)}.` };
    }
    const raw = String(a);
    if (d.kind === 'virgule→frac') {
      const den = 10 ** d.d.s;
      const ok = raw.replace(/\s/g, '') === `${Math.abs(d.d.n)}/${den}`;
      if (ok) return { ok: true };
      if (raw === `${Math.abs(d.d.n)}/10` && d.d.s !== 1) return { ok: false, msg: `Le dénominateur dépend du nombre de chiffres après la virgule. Ici : ${den}.` };
      return { ok: false, msg: `${fmtDec(d.d)} = ${Math.abs(d.d.n)}/${den} (on lit les chiffres sans la virgule, sur ${den}).` };
    }
    const got = parseDec(raw);
    if (got && got.n * 10 ** d.d.s === d.d.n * 10 ** got.s) return { ok: true }; // equal value
    // compare via scale
    if (got) {
      const s = Math.max(got.s, d.d.s);
      if (got.n * 10 ** (s - got.s) === d.d.n * 10 ** (s - d.d.s)) return { ok: true };
    }
    // trap: wrote digits without placing comma
    if (got && got.s === 0 && got.n === Math.abs(d.d.n)) return { ok: false, msg: `Tu as écrit les chiffres, mais sans la virgule. La virgule sépare les unités des dixièmes.` };
    return { ok: false, msg: `La virgule se place juste après les unités. Relis : ${d.kind === 'somme→virgule' ? 'additionne les parts' : 'regarde le dénominateur'}.` };
  },
  hint(d) {
    if (d.kind === 'egalite') return `Cherche toutes les façons d’écrire ${fmtDec(d.d)} : avec une virgule, ou en fraction sur ${10 ** d.d.s}.`;
    if (d.kind === 'virgule→frac') return `Compte les chiffres après la virgule : c’est le nombre de zéros du dénominateur (1 → /10, 2 → /100).`;
    return `Le chiffre des unités va avant la virgule ; ensuite les dixièmes, puis les centièmes.`;
  },
  correction(d) {
    if (d.kind === 'egalite') return `<p><b>${fmtDec(d.d)}</b> = ${fracHtml(d.d)} = ${sommeHtml(d.d)}.</p>`;
    if (d.kind === 'virgule→frac') return `<p>${fmtDec(d.d)} = <b>${fracHtml(d.d)}</b>.</p>`;
    return `<p>${d.kind === 'somme→virgule' ? sommeHtml(d.d) : fracHtml(d.d)} = <b>${fmtDec(d.d)}</b>.</p>`;
  },
  mount(el, d) {
    if (d.kind === 'egalite') {
      el.innerHTML = `<p class="q">Quelles écritures valent <b>${fmtDec(d.d)}</b> ? (touche toutes les bonnes)</p><div class="w-pk"></div>`;
      const pk = pickCards(el.querySelector('.w-pk')!, d.cards!.map((c) => c.t));
      return { answer: () => pk.chosen(), ready: () => (pk.chosen().length ? null : 'Choisis au moins une carte.'), lock: () => pk.lock(), showBad: (b) => pk.showBad(b) };
    }
    if (d.kind === 'virgule→frac') {
      el.innerHTML = `<p class="q">Écris <b>${fmtDec(d.d)}</b> sous forme de fraction décimale.</p><p class="tip">Numérateur puis dénominateur, séparés par /.</p><div class="w-kp"></div>`;
      // use a simple text-like keypad: digits + we need "/" — reuse comma slot? Better: two keypads via fracin style, or type as string with a slash button.
      // Minimal: keypad digits + custom slash
      const wrap = el.querySelector('.w-kp')!;
      let v = '';
      wrap.innerHTML = `<div class="kp kp-dec"><div class="kp-out" tabindex="0"><span class="kp-v"></span><span class="kp-caret"></span></div>
        <div class="kp-keys">${[1,2,3,4,5,6,7,8,9].map((x)=>`<button type="button" class="kp-k" data-k="${x}">${x}</button>`).join('')}
        <button type="button" class="kp-k" data-k="/">/</button><button type="button" class="kp-k" data-k="0">0</button><button type="button" class="kp-k kp-del" data-k="del">⌫</button></div></div>`;
      const out = wrap.querySelector('.kp-v')!;
      let locked = false;
      const press = (k: string) => { if (locked) return; if (k === 'del') v = v.slice(0, -1); else if (k === '/' && !v.includes('/') && v) v += '/'; else if (/^\d$/.test(k) && v.length < 8) v += k; out.textContent = v; };
      wrap.querySelectorAll<HTMLButtonElement>('.kp-k').forEach((b) => b.addEventListener('click', () => press(b.dataset.k!)));
      return { answer: () => (v.includes('/') ? v : null), ready: () => (v.includes('/') ? null : 'Écris une fraction (avec /).'), lock: () => { locked = true; wrap.querySelectorAll('button').forEach((b) => (b.disabled = true)); } };
    }
    const prompt = d.kind === 'somme→virgule' ? sommeHtml(d.d) : fracHtml(d.d);
    el.innerHTML = `<p class="q">Écris avec une virgule : <b>${prompt}</b></p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le nombre à virgule', 4, { comma: true, maxDec: maxS(LV(d.lv)) });
    return { answer: () => k.value() as string | null, ready: () => (k.value() === null ? 'Écris le nombre.' : null), lock: () => k.lock() };
  },
};

/* ---------- dectableau ---------- */
export interface DtData { lv: Level; p: Palier; d: Dec; cols: DecCol[]; digits: number[]; pool: number[]; form: 'unites' | 'virgule' }
function colsFor(lv: 'CM1' | 'CM2', needC: boolean): DecCol[] {
  const c: DecCol[] = [];
  if (needC) c.push({ key: 'c', label: 'centaines', k: -2 });
  c.push({ key: 'd', label: 'dizaines', k: -1 });
  c.push({ key: 'u', label: 'unités', k: 0 });
  c.push({ key: 'dx', label: 'dixièmes', k: 1 });
  c.push({ key: 'cx', label: 'centièmes', k: 2 });
  if (lv === 'CM2') c.push({ key: 'mx', label: 'millièmes', k: 3 });
  return c;
}
export const dectableau: ExoType<DtData, number[]> = {
  id: 'dectableau', title: 'Tableau de numération décimal', notion: 'Du dixième à la virgule', levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed); const L = LV(lv);
    const d = mkDec(r, L, p);
    const needC = Math.abs(d.n) >= 100 * 10 ** d.s || (p >= 2 && r.next() < 0.3);
    // bump to have hundreds sometimes
    let D = d;
    if (needC && Math.trunc(Math.abs(d.n) / 10 ** d.s) < 100) {
      D = fromParts(r.int(100, 499), String(Math.abs(d.n)).padStart(d.s, '0').slice(-d.s).split('').map(Number));
    }
    const cols = colsFor(L, Math.trunc(Math.abs(D.n) / 10 ** D.s) >= 100);
    // digits for each col
    const abs = Math.abs(D.n);
    const padded = String(abs).padStart(D.s + 1, '0');
    const intStr = padded.slice(0, -D.s) || '0';
    const fracStr = padded.slice(-D.s);
    const digits = cols.map((c) => {
      if (c.k <= 0) {
        const idx = intStr.length - 1 + c.k; // k=0 → last of int
        return idx >= 0 ? Number(intStr[idx]) : 0;
      }
      return c.k <= D.s ? Number(fracStr[c.k - 1] ?? '0') : 0;
    });
    // ensure we have the right scale columns filled
    const pool = [...digits];
    if (!pool.includes(0)) pool.push(0);
    while (pool.length < cols.length + 2) pool.push(r.int(1, 9));
    r.shuffle(pool);
    return { lv, p, d: D, cols, digits, pool, form: p === 1 ? 'virgule' : r.pick(['virgule', 'unites'] as const) };
  },
  solution: (d) => d.digits,
  check(d, a) {
    const bad = d.digits.map((x, i) => (x !== a[i] ? i : -1)).filter((i) => i >= 0);
    if (!bad.length) return { ok: true };
    // trap: wrote digits in reading order ignoring place
    const shown = fmtDec(d.d).replace(',', '').replace(/\u202f/g, '');
    if (a.filter((x) => x !== 0).join('') === shown.replace(/^0+/, '')) {
      // maybe comma ignored
    }
    const u = d.cols.findIndex((c) => c.k === 0);
    if (bad.length === 1 && bad[0] === u + 1) return { ok: false, bad, msg: `Regarde la case des dixièmes : c’est le premier chiffre APRÈS la virgule.` };
    return { ok: false, bad, msg: bad.length === 1 ? `Presque ! Regarde la case des ${d.cols[bad[0]].label}.` : `Chaque chiffre va dans la colonne de son rang. La barre rouge, c’est la virgule.` };
  },
  hint: (d) => `Dans ${fmtDec(d.d)}, le chiffre juste avant la barre (virgule) est celui des unités. Juste après : les dixièmes.`,
  correction(d) {
    return `<p>${fmtDec(d.d)} :</p><ul>${d.cols.map((c, i) => `<li>${c.label} : <b>${d.digits[i]}</b></li>`).join('')}</ul>`;
  },
  mount(el, d) {
    const stmt = d.form === 'virgule'
      ? `<b class="big">${fmtDec(d.d)}</b>`
      : d.cols.map((c, i) => d.digits[i] > 0 ? `${d.digits[i]} ${c.label}` : '').filter(Boolean).join(', ');
    el.innerHTML = `<p class="q">Place les chiffres de ${stmt} dans le tableau.</p><p class="tip">La barre colorée marque la virgule. Glisse chaque étiquette, ou touche puis la case.</p><div class="w-nt"></div>`;
    const t = dectable(el.querySelector('.w-nt')!, d.cols, d.pool);
    return { answer: () => t.digits(), ready: () => (t.digits() === null ? 'Remplis toutes les cases (mets 0 si besoin).' : null), lock: () => t.lock(), showBad: (b) => t.showBad(b) };
  },
};
