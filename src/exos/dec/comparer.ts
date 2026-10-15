/**
 * Chapitre 6 — comparer, ranger, encadrer, arrondir.
 */
import { rng } from '../../engine/rng';
import { type ExoType, type Level, type Palier } from '../../engine/types';
import { type Dec, fmtDec, fromParts, maxS, cmp, parseDec, roundInt, intPart } from '../../engine/dec';
import { orderList } from '../../ui/order';
import { keypad } from '../../ui/keypad';

const LV = (lv: Level) => (lv === 'CM2' ? 'CM2' : 'CM1') as 'CM1' | 'CM2';
function mk(r: ReturnType<typeof rng>, lv: 'CM1' | 'CM2', s?: number): Dec {
  const S = s ?? r.int(1, maxS(lv));
  return fromParts(r.int(0, 20), Array.from({ length: S }, (_, i) => r.int(i === S - 1 ? 1 : 0, 9)));
}

/* ---------- deccomp ---------- */
export interface DcData { lv: Level; p: Palier; a: Dec; b: Dec }
export const deccomp: ExoType<DcData, '<' | '=' | '>'> = {
  id: 'deccomp', title: 'Comparer des décimaux', notion: 'Comparer, ranger, encadrer', levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed); const L = LV(lv);
    for (;;) {
      let a = mk(r, L), b = mk(r, L);
      if (p === 1) { // même nombre de décimales, parties entières parfois égales
        const s = r.int(1, maxS(L));
        a = fromParts(r.int(1, 9), Array.from({ length: s }, () => r.int(0, 9)));
        b = fromParts(a.n === 0 ? r.int(1, 9) : intPart(a) === intPart({ n: a.n, s: a.s }) ? intPart(a) : r.int(1, 9), Array.from({ length: s }, () => r.int(0, 9)));
        // force same int part often
        const ip = r.int(1, 15);
        a = fromParts(ip, Array.from({ length: s }, (_, i) => r.int(i === s - 1 ? 1 : 0, 9)));
        b = fromParts(ip, Array.from({ length: s }, (_, i) => r.int(i === s - 1 ? 1 : 0, 9)));
      } else if (p === 2) {
        // classic trap: 2,15 vs 2,9 or 2,37 vs 2,5
        const ip = r.int(1, 9);
        if (r.next() < 0.5) {
          a = fromParts(ip, [r.int(1, 4), r.int(1, 9)]); // fewer tenths, more digits
          b = fromParts(ip, [r.int(5, 9)]); // more tenths, 1 decimal
        } else {
          a = fromParts(ip, [r.int(1, 3), r.int(0, 9)]);
          b = fromParts(ip, [r.int(4, 9)]);
        }
      } else {
        // equal with trailing zeros, or close
        if (r.next() < 0.4) {
          a = mk(r, L, 1);
          b = { n: a.n * 10, s: a.s + 1 }; // 2,5 = 2,50
        } else {
          a = mk(r, L); b = mk(r, L);
        }
      }
      if (fmtDec(a) === fmtDec(b) && p < 3) continue;
      if (p < 3 && cmp(a, b) === 0) continue;
      return { lv, p, a, b };
    }
  },
  solution: (d) => { const c = cmp(d.a, d.b); return c < 0 ? '<' : c > 0 ? '>' : '='; },
  check(d, a) {
    const g = deccomp.solution(d);
    if (a === g) return { ok: true };
    // trap diagnosis: compared fractional parts as integers
    const fa = Math.abs(d.a.n) % 10 ** d.a.s;
    const fb = Math.abs(d.b.n) % 10 ** d.b.s;
    if (d.a.s !== d.b.s && intPart(d.a) === intPart(d.b)) {
      const wrong = fa > fb ? '>' : fa < fb ? '<' : '=';
      if (a === wrong && a !== g) return { ok: false, msg: `Tu as comparé ${fa} et ${fb} comme des entiers. Ce n’est pas la même taille de part : compare d’abord les dixièmes.` };
    }
    return { ok: false, msg: `Même partie entière ? Alors compare les dixièmes, puis les centièmes.` };
  },
  hint: (d) => `Écris ${fmtDec(d.a)} et ${fmtDec(d.b)} avec le même nombre de chiffres après la virgule, puis compare.`,
  correction(d) {
    const g = deccomp.solution(d);
    const s = Math.max(d.a.s, d.b.s);
    return `<p><b>${fmtDec(d.a)} ${g} ${fmtDec(d.b)}</b></p><p>Avec ${s} décimale${s > 1 ? 's' : ''} : ${fmtDec({ n: d.a.n * 10 ** (s - d.a.s), s })} et ${fmtDec({ n: d.b.n * 10 ** (s - d.b.s), s })}.</p>`;
  },
  mount(el, d) {
    el.innerHTML = `<p class="q">Compare : <b class="big">${fmtDec(d.a)}</b> … <b class="big">${fmtDec(d.b)}</b></p><div class="cmp" role="group">${(['<', '=', '>'] as const).map((s) => `<button type="button" class="tok" data-s="${s}" aria-label="${s === '<' ? 'plus petit' : s === '>' ? 'plus grand' : 'égal'}">${s}</button>`).join('')}</div>`;
    let choice: '<' | '=' | '>' | null = null; let locked = false;
    const render = () => el.querySelectorAll<HTMLButtonElement>('.cmp .tok').forEach((b) => { b.classList.toggle('sel', b.dataset.s === choice); b.disabled = locked; });
    el.querySelectorAll<HTMLButtonElement>('.cmp .tok').forEach((b) => b.addEventListener('click', () => { if (locked) return; choice = b.dataset.s as typeof choice; render(); }));
    return { answer: () => choice, ready: () => (choice ? null : 'Choisis <, = ou >.'), lock: () => { locked = true; render(); } };
  },
};

/* ---------- decranger ---------- */
export interface DrData { lv: Level; p: Palier; nums: Dec[]; dir: 'asc' | 'desc' }
const sorted = (d: DrData) => d.nums.map((_, i) => i).sort((a, b) => cmp(d.nums[a], d.nums[b]) * (d.dir === 'asc' ? 1 : -1));
export const decranger: ExoType<DrData, number[]> = {
  id: 'decranger', title: 'Ranger des décimaux', notion: 'Comparer, ranger, encadrer', levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed); const L = LV(lv);
    const k = p === 1 ? 3 : 4;
    for (;;) {
      const set: Dec[] = [];
      const ip = r.int(1, 9);
      if (p >= 2) {
        // include the classic trap pair
        set.push(fromParts(ip, [r.int(1, 3), r.int(1, 9)]));
        set.push(fromParts(ip, [r.int(5, 9)]));
      }
      while (set.length < k) {
        const x = mk(r, L);
        if (set.every((y) => cmp(x, y) !== 0)) set.push(x);
      }
      const nums = r.shuffle(set.slice(0, k));
      const d: DrData = { lv, p, nums, dir: r.next() < 0.5 ? 'asc' : 'desc' };
      if (sorted(d).every((x, i) => x === i)) continue;
      return d;
    }
  },
  solution: sorted,
  check(d, a) {
    const good = sorted(d);
    const bad = a.map((x, i) => (x !== good[i] ? i : -1)).filter((i) => i >= 0);
    if (!bad.length) return { ok: true };
    if (a.every((x, i) => x === good[good.length - 1 - i])) return { ok: false, bad, msg: `Tu as rangé dans l’autre sens.` };
    for (let i = 0; i < a.length - 1; i++) {
      const x = d.nums[a[i]], y = d.nums[a[i + 1]];
      const order = cmp(x, y);
      if ((d.dir === 'asc' && order > 0) || (d.dir === 'desc' && order < 0)) {
        if (x.s !== y.s && intPart(x) === intPart(y))
          return { ok: false, bad: [i, i + 1], msg: `Compare ${fmtDec(x)} et ${fmtDec(y)} : regarde d’abord les dixièmes (pas le « nombre » après la virgule).` };
        return { ok: false, bad: [i, i + 1], msg: `${fmtDec(x)} et ${fmtDec(y)} ne sont pas dans le bon ordre.` };
      }
    }
    return { ok: false, bad, msg: 'Ce n’est pas encore rangé.' };
  },
  hint: (d) => `Cherche d’abord le ${d.dir === 'asc' ? 'plus petit' : 'plus grand'}. Même partie entière → compare les dixièmes.`,
  correction: (d) => `<p><b>${sorted(d).map((i) => fmtDec(d.nums[i])).join(d.dir === 'asc' ? ' < ' : ' > ')}</b></p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Range du <b>${d.dir === 'asc' ? 'plus petit au plus grand' : 'plus grand au plus petit'}</b>.</p><div class="w-ord"></div>`;
    const o = orderList(el.querySelector('.w-ord')!, d.nums.map((x) => fmtDec(x)), d.dir === 'asc' ? '▲ le plus petit' : '▲ le plus grand', d.dir === 'asc' ? '▼ le plus grand' : '▼ le plus petit');
    return { answer: () => o.order(), lock: () => o.lock(), showBad: (b) => o.showBad(b) };
  },
};

/* ---------- decencadrer ---------- */
export interface DeData { lv: Level; p: Palier; d: Dec; prec: 0 | 1 | 2; /** 0 = unité */ }
export const decencadrer: ExoType<DeData, { lo: string; hi: string }> = {
  id: 'decencadrer', title: 'Encadrer un décimal', notion: 'Comparer, ranger, encadrer', levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed); const L = LV(lv);
    const prec = (p === 1 ? 0 : p === 2 ? r.pick([0, 1] as const) : r.pick([0, 1, L === 'CM2' ? 2 : 1] as const)) as 0 | 1 | 2;
    // number has MORE decimals than precision
    const s = Math.min(maxS(L), prec + r.int(1, 2));
    const d = fromParts(r.int(1, 40), Array.from({ length: s }, (_, i) => r.int(i === s - 1 ? 1 : 0, 9)));
    return { lv, p, d, prec };
  },
  solution(d) {
    const s = Math.max(d.d.s, d.prec);
    const n = d.d.n * 10 ** (s - d.d.s);
    const step = 10 ** (s - d.prec);
    const lo = Math.floor(n / step) * step;
    const hi = lo + step;
    return { lo: fmtDec({ n: lo, s }), hi: fmtDec({ n: hi, s }) };
  },
  check(d, a) {
    const lo = parseDec(a.lo), hi = parseDec(a.hi);
    if (!lo || !hi) return { ok: false, msg: 'Écris les deux bornes avec la virgule si besoin.' };
    const gs = decencadrer.solution(d);
    const glo = parseDec(gs.lo)!, ghi = parseDec(gs.hi)!;
    const eq = (x: Dec, y: Dec) => { const s = Math.max(x.s, y.s); return x.n * 10 ** (s - x.s) === y.n * 10 ** (s - y.s); };
    if (eq(lo, glo) && eq(hi, ghi)) return { ok: true };
    // swapped
    if (eq(lo, ghi) && eq(hi, glo)) return { ok: false, msg: 'Tu as inversé : le plus petit à gauche, le plus grand à droite.' };
    // gap too big (used wrong precision)
    return { ok: false, msg: d.prec === 0 ? `Encadre par deux entiers qui se suivent.` : `Les deux bornes doivent être des nombres au ${d.prec === 1 ? 'dixième' : 'centième'}, qui se suivent.` };
  },
  hint: (d) => d.prec === 0 ? `Quel entier est juste en dessous de ${fmtDec(d.d)} ? Et juste au-dessus ?` : `Tronque ${fmtDec(d.d)} au ${d.prec === 1 ? 'dixième' : 'centième'}, puis ajoute un ${d.prec === 1 ? 'dixième' : 'centième'}.`,
  correction: (d) => { const g = decencadrer.solution(d); return `<p><b>${g.lo} < ${fmtDec(d.d)} < ${g.hi}</b></p>`; },
  mount(el, d) {
    const unit = d.prec === 0 ? 'deux entiers qui se suivent' : d.prec === 1 ? 'deux nombres au dixième qui se suivent' : 'deux nombres au centième qui se suivent';
    el.innerHTML = `<p class="q">Encadre <b class="big">${fmtDec(d.d)}</b> par ${unit}.</p>
      <div class="enc-fields"><button type="button" class="st-h enc-h" data-i="0" aria-label="Borne basse">?</button>
      <span class="enc-m">&lt; ${fmtDec(d.d)} &lt;</span>
      <button type="button" class="st-h enc-h" data-i="1" aria-label="Borne haute">?</button></div>
      <div class="w-kp"></div>`;
    // single keypad shared by two fields (réutilise le motif phrase à trous)
    const vals: string[] = ['', ''];
    let active = 0;
    const fields = () => el.querySelectorAll<HTMLButtonElement>('.enc-h');
    const sync = () => fields().forEach((b, i) => { b.textContent = vals[i] || '?'; b.classList.toggle('act', i === active); });
    fields().forEach((b) => b.addEventListener('click', () => { active = Number(b.dataset.i); sync(); }));
    const wrap = el.querySelector<HTMLElement>('.w-kp')!;
    const k = keypad(wrap, 'Chiffre', 3, { comma: true, maxDec: 3 });
    // intercept keypad to write into active field
    wrap.querySelectorAll<HTMLButtonElement>('.kp-k').forEach((b) => {
      b.addEventListener('click', () => {
        const key = b.dataset.k!;
        if (key === 'del') vals[active] = vals[active].slice(0, -1);
        else if (key === ',') { if (!vals[active].includes(',') && vals[active]) vals[active] += ','; }
        else if (vals[active].includes(',')) { if (vals[active].split(',')[1].length < 3) vals[active] += key; }
        else if (vals[active].length < 3) vals[active] = vals[active] === '0' ? key : vals[active] + key;
        // clear internal keypad display; show in field
        sync();
      }, true);
    });
    // hide the keypad's own output (fields are the display)
    const out = wrap.querySelector<HTMLElement>('.kp-out');
    if (out) out.style.display = 'none';
    sync();
    return {
      answer: () => (vals[0] && vals[1] ? { lo: vals[0], hi: vals[1] } : null),
      ready: () => (!vals[0] || !vals[1] ? 'Remplis les deux bornes (touche une case, puis le pavé).' : null),
      lock: () => { k.lock(); fields().forEach((b) => (b.disabled = true)); },
    };
  },
};

/* ---------- decarrondi ---------- */
export interface DaData { lv: Level; p: Palier; d: Dec }
export const decarrondi: ExoType<DaData, number> = {
  id: 'decarrondi', title: 'Partie entière et arrondi', notion: 'Comparer, ranger, encadrer', levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed); const L = LV(lv);
    const d = mk(r, L, r.int(1, maxS(L)));
    // p3: force .5 exactly sometimes
    if (p === 3 && r.next() < 0.4) {
      const ip = r.int(1, 30);
      return { lv, p, d: fromParts(ip, [5]) };
    }
    return { lv, p, d };
  },
  solution: (d) => (d.p === 1 ? intPart(d.d) : roundInt(d.d)),
  check(d, a) {
    const g = decarrondi.solution(d);
    if (a === g) return { ok: true };
    if (d.p > 1 && a === intPart(d.d)) return { ok: false, msg: `C’est la partie entière. Pour l’arrondi, regarde le chiffre des dixièmes : ${Math.floor(Math.abs(d.d.n) / 10 ** (d.d.s - 1)) % 10} ${Math.floor(Math.abs(d.d.n) / 10 ** (d.d.s - 1)) % 10 >= 5 ? '≥ 5 → on monte' : '< 5 → on garde'}.` };
    if (d.p === 1 && a === roundInt(d.d) && a !== intPart(d.d)) return { ok: false, msg: `On te demande la partie entière (ce qui est avant la virgule), pas l’arrondi.` };
    return { ok: false, msg: d.p === 1 ? `La partie entière, c’est le nombre avant la virgule.` : `Regarde le chiffre des dixièmes pour décider si tu montes ou non.` };
  },
  hint: (d) => d.p === 1 ? `Tout ce qui est avant la virgule.` : `Dixièmes ≥ 5 → entier suivant ; sinon on garde la partie entière.`,
  correction: (d) => d.p === 1
    ? `<p>Partie entière de ${fmtDec(d.d)} : <b>${intPart(d.d)}</b>.</p>`
    : `<p>Arrondi de ${fmtDec(d.d)} à l’entier : <b>${roundInt(d.d)}</b>.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">${d.p === 1 ? 'Quelle est la partie entière de' : 'Arrondis à l’entier'} <b class="big">${fmtDec(d.d)}</b> ?</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Ta réponse', 3);
    return { answer: () => k.value() as number | null, lock: () => k.lock() };
  },
};
