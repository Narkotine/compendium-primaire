/**
 * Chapitre 8 — grandeurs : unité plausible, conversions, monnaie, horloge, durée, périmètre, aire.
 */
import { rng } from '../../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../../engine/types';
import { keypad } from '../../ui/keypad';
import { pickCards } from '../../ui/pick';
import { fmtDec, fromParts, parseDec, type Dec } from '../../engine/dec';

/* ---------- uniteok ---------- */
const ITEMS: { t: string; good: string; bads: string[] }[] = [
  { t: 'la hauteur d’une porte', good: '2 m', bads: ['2 mm', '2 km', '200 m'] },
  { t: 'la masse d’une pomme', good: '200 g', bads: ['200 kg', '2 g', '20 t'] },
  { t: 'la longueur d’un crayon', good: '15 cm', bads: ['15 m', '15 km', '1 mm'] },
  { t: 'la distance Paris–Lyon', good: '400 km', bads: ['400 m', '4 km', '40 cm'] },
  { t: 'la masse d’un enfant', good: '30 kg', bads: ['30 g', '3 t', '300 mg'] },
  { t: 'un verre d’eau', good: '20 cL', bads: ['20 L', '2 hL', '200 L'] },
  { t: 'l’épaisseur d’un cahier', good: '8 mm', bads: ['8 m', '80 cm', '8 km'] },
  { t: 'la masse d’une voiture', good: '1 t', bads: ['1 g', '10 g', '1 mg'] },
];
export interface UoData { lv: Level; p: Palier; i: number; cards: string[]; good: number }
export const uniteok: ExoType<UoData, number[]> = {
  id: 'uniteok', title: 'Choisir une unité plausible', notion: 'Unités et conversions', levels: ['CE1', 'CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const it = r.pick(ITEMS);
    const i = ITEMS.indexOf(it);
    const cards = r.shuffle([it.good, ...r.shuffle([...it.bads]).slice(0, p === 1 ? 2 : 3)]);
    return { lv, p, i, cards, good: cards.indexOf(it.good) };
  },
  solution: (d) => [d.good],
  check(d, a) {
    if (a.length === 1 && a[0] === d.good) return { ok: true };
    if (a.includes(d.good) && a.length > 1) return { ok: false, bad: a.filter((x) => x !== d.good), msg: `Une seule réponse : laquelle est réaliste pour ${ITEMS[d.i].t} ?` };
    return { ok: false, bad: a, msg: `Imagine ${ITEMS[d.i].t} : ${ITEMS[d.i].good} est réaliste, pas ${a.map((i) => d.cards[i]).join(' ni ')}.` };
  },
  hint: (d) => `Pense à un objet que tu connais, proche de ${ITEMS[d.i].t}.`,
  correction: (d) => `<p><b>${ITEMS[d.i].good}</b> pour ${ITEMS[d.i].t}.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Quelle mesure est plausible pour <b>${ITEMS[d.i].t}</b> ?</p><div class="w-pk"></div>`;
    const pk = pickCards(el.querySelector('.w-pk')!, d.cards);
    return { answer: () => pk.chosen(), ready: () => (pk.chosen().length ? null : 'Choisis une carte.'), lock: () => pk.lock(), showBad: (b) => pk.showBad(b) };
  },
};

/* ---------- convertir ---------- */
type Kind = 'L' | 'M' | 'C'; // longueur, masse, contenance
const FACTORS: Record<Kind, { from: string; to: string; f: number }[]> = {
  L: [{ from: 'm', to: 'cm', f: 100 }, { from: 'm', to: 'mm', f: 1000 }, { from: 'km', to: 'm', f: 1000 }, { from: 'cm', to: 'mm', f: 10 }, { from: 'dm', to: 'cm', f: 10 }],
  M: [{ from: 'kg', to: 'g', f: 1000 }, { from: 'g', to: 'mg', f: 1000 }, { from: 't', to: 'kg', f: 1000 }],
  C: [{ from: 'L', to: 'cL', f: 100 }, { from: 'L', to: 'mL', f: 1000 }, { from: 'cL', to: 'mL', f: 10 }],
};
export interface CvData { lv: Level; p: Palier; n: number; from: string; to: string; f: number; dir: 'up' | 'down' }
export const convertir: ExoType<CvData, number> = {
  id: 'convertir', title: 'Convertir des unités', notion: 'Unités et conversions', levels: ['CE1', 'CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const kinds: Kind[] = lv === 'CE1' ? ['L', 'M'] : ['L', 'M', 'C'];
    const pair = r.pick(FACTORS[r.pick(kinds)]);
    const dir: 'up' | 'down' = r.next() < 0.5 ? 'down' : 'up'; // down = vers plus petite unité → ×f
    const n = r.int(p === 1 ? 1 : 2, p === 3 ? 50 : 20);
    return dir === 'down' ? { lv, p, n, from: pair.from, to: pair.to, f: pair.f, dir } : { lv, p, n: n * pair.f, from: pair.to, to: pair.from, f: pair.f, dir };
  },
  solution: (d) => (d.dir === 'down' ? d.n * d.f : d.n / d.f),
  check(d, a) {
    const g = convertir.solution(d);
    if (a === g) return { ok: true };
    if (a === (d.dir === 'down' ? d.n / d.f : d.n * d.f)) return { ok: false, msg: `Tu as multiplié au lieu de diviser (ou l’inverse). Vers une unité plus ${d.dir === 'down' ? 'petite' : 'grande'}, le nombre ${d.dir === 'down' ? 'grossit' : 'diminue'}.` };
    if (a === d.n * 10 || a === d.n / 10) return { ok: false, msg: `Le facteur n’est pas 10 ici : 1 ${d.dir === 'down' ? d.from : d.to} = ${d.f} ${d.dir === 'down' ? d.to : d.from}.` };
    return { ok: false, msg: `1 ${d.dir === 'down' ? d.from : d.to} = ${fmt(d.f)} ${d.dir === 'down' ? d.to : d.from}.` };
  },
  hint: (d) => `1 ${d.dir === 'down' ? d.from : d.to} = ${fmt(d.f)} ${d.dir === 'down' ? d.to : d.from}. ${d.dir === 'down' ? 'Multiplie' : 'Divise'} par ${fmt(d.f)}.`,
  correction: (d) => `<p><b>${fmt(d.n)} ${d.from} = ${fmt(convertir.solution(d))} ${d.to}</b></p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Convertis : <b class="big">${fmt(d.n)} ${d.from}</b> = ? ${d.to}</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le résultat', 8);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};

/* ---------- monnaie ---------- */
export interface MoData { lv: Level; p: Palier; prix: Dec; paye: Dec }
export const monnaie: ExoType<MoData, string> = {
  id: 'monnaie', title: 'Rendre la monnaie', notion: 'Monnaie', levels: ['CE1', 'CE2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const prix = fromParts(r.int(1, p === 1 ? 5 : 20), p === 1 ? [0] : [r.int(0, 9), r.pick([0, 5])]);
    const payeN = Math.ceil((prix.n / 10 ** prix.s) + r.int(1, 5));
    const paye = fromParts(payeN, []);
    return { lv, p, prix, paye };
  },
  solution: (d) => {
    const s = Math.max(d.prix.s, d.paye.s);
    const rendu = d.paye.n * 10 ** (s - d.paye.s) - d.prix.n * 10 ** (s - d.prix.s);
    return fmtDec({ n: rendu, s });
  },
  check(d, a) {
    const got = parseDec(a); const good = parseDec(monnaie.solution(d))!;
    if (!got) return { ok: false, msg: 'Écris le montant rendu (avec une virgule si besoin).' };
    const s = Math.max(got.s, good.s);
    if (got.n * 10 ** (s - got.s) === good.n * 10 ** (s - good.s)) return { ok: true };
    if (got.n * 10 ** (s - got.s) === d.prix.n * 10 ** (s - d.prix.s)) return { ok: false, msg: `Tu as rendu le prix de l’article. On rend : argent donné − prix.` };
    const trop = got.n * 10 ** (s - got.s) - good.n * 10 ** (s - good.s);
    if (Math.abs(trop) === 100 * 10 ** Math.max(0, s - 2) || Math.abs(trop) === 10 ** s)
      return { ok: false, msg: `Tu as rendu 1 € de trop ou de moins. Recalcule ${fmtDec(d.paye)} − ${fmtDec(d.prix)}.` };
    return { ok: false, msg: `Calcule ${fmtDec(d.paye)} − ${fmtDec(d.prix)}.` };
  },
  hint: (d) => `On a donné ${fmtDec(d.paye)} € pour un article à ${fmtDec(d.prix)} €. Combien rend-on ?`,
  correction: (d) => `<p>${fmtDec(d.paye)} − ${fmtDec(d.prix)} = <b>${monnaie.solution(d)} €</b></p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Un article coûte <b>${fmtDec(d.prix)} €</b>. On paie avec <b>${fmtDec(d.paye)} €</b>. Combien rend-on ?</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Monnaie rendue', 4, { comma: true, maxDec: 2 });
    return { answer: () => k.value() as string | null, lock: () => k.lock() };
  },
};

/* ---------- horloge ---------- */
export interface HoData { lv: Level; p: Palier; h: number; m: number; mode: 'lire' | 'régler' }
export const horloge: ExoType<HoData, number[] | string> = {
  id: 'horloge', title: 'Lire et régler l’horloge', notion: 'Heure et durées', levels: ['CE1', 'CE2', 'CM1'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const h = r.int(1, 12), m = p === 1 ? r.pick([0, 15, 30, 45]) : r.int(0, 59);
    return { lv, p, h, m, mode: p === 3 ? 'régler' : 'lire' };
  },
  solution: (d) => (d.mode === 'lire' ? `${d.h}h${String(d.m).padStart(2, '0')}` : [d.h, d.m]),
  check(d, a) {
    if (d.mode === 'lire') {
      const t = String(a).toLowerCase().replace(/\s/g, '').replace(':', 'h').replace('min', '');
      const good = `${d.h}h${String(d.m).padStart(2, '0')}`;
      if (t === good || t === `${d.h}h${d.m}`) return { ok: true };
      return { ok: false, msg: `La petite aiguille : les heures. La grande : les minutes (chaque grand trait = 5 min).` };
    }
    const [h, m] = a as number[];
    if (h === d.h && m === d.m) return { ok: true };
    if (h === d.h) return { ok: false, bad: [1], msg: `Les heures sont justes. Chaque grand trait de la grande aiguille vaut 5 minutes.` };
    return { ok: false, bad: [0], msg: `La petite aiguille indique l’heure (ici vers ${d.h}).` };
  },
  hint: (d) => d.mode === 'lire' ? `Où pointe la grande aiguille ? 12 → 0 min, 3 → 15 min, 6 → 30 min.` : `Place d’abord la grande aiguille (minutes), puis la petite.`,
  correction: (d) => `<p><b>${d.h} h ${String(d.m).padStart(2, '0')} min</b></p>`,
  mount(el, d) {
    const angM = d.m * 6, angH = (d.h % 12) * 30 + d.m * 0.5;
    if (d.mode === 'lire') {
      el.innerHTML = `<p class="q">Quelle heure est-il ?</p>
        <svg class="clk" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="90" fill="var(--fig-bg)" stroke="#222" stroke-width="3"/>
        ${[12,1,2,3,4,5,6,7,8,9,10,11].map((n, i) => { const a = (i * 30 - 90) * Math.PI / 180; return `<text x="${100 + 72 * Math.cos(a)}" y="${100 + 72 * Math.sin(a) + 5}" text-anchor="middle" font-size="14" font-weight="700">${n}</text>`; }).join('')}
        <line x1="100" y1="100" x2="${100 + 50 * Math.sin(angH * Math.PI / 180)}" y2="${100 - 50 * Math.cos(angH * Math.PI / 180)}" stroke="#d1495b" stroke-width="4" stroke-linecap="round"/>
        <line x1="100" y1="100" x2="${100 + 70 * Math.sin(angM * Math.PI / 180)}" y2="${100 - 70 * Math.cos(angM * Math.PI / 180)}" stroke="#2a6fbe" stroke-width="3" stroke-linecap="round"/>
        <circle cx="100" cy="100" r="4" fill="#222"/></svg>
        <p class="tip">Écris comme 2h30 ou 14h05.</p><div class="w-kp"></div>`;
      // simple text entry via digits + h button
      const wrap = el.querySelector<HTMLElement>('.w-kp')!;
      let v = '';
      wrap.innerHTML = `<div class="kp kp-dec"><div class="kp-out"><span class="kp-v"></span><span class="kp-caret"></span></div>
        <div class="kp-keys">${[1,2,3,4,5,6,7,8,9].map((x)=>`<button type="button" class="kp-k" data-k="${x}">${x}</button>`).join('')}
        <button type="button" class="kp-k" data-k="h">h</button><button type="button" class="kp-k" data-k="0">0</button><button type="button" class="kp-k kp-del" data-k="del">⌫</button></div></div>`;
      const out = wrap.querySelector('.kp-v')!;
      let locked = false;
      const press = (k: string) => { if (locked) return; if (k === 'del') v = v.slice(0, -1); else if (v.length < 6) v += k; out.textContent = v; };
      wrap.querySelectorAll<HTMLButtonElement>('.kp-k').forEach((b) => b.addEventListener('click', () => press(b.dataset.k!)));
      return { answer: () => (v.includes('h') ? v : null), ready: () => (v.includes('h') ? null : 'Écris l’heure avec « h ».'), lock: () => { locked = true; wrap.querySelectorAll('button').forEach((b) => (b.disabled = true)); } };
    }
    // régler : two number fields
    el.innerHTML = `<p class="q">Règle l’horloge sur <b class="big">${d.h} h ${String(d.m).padStart(2, '0')}</b>.</p>
      <div class="enc-fields"><button type="button" class="st-h enc-h" data-i="0">? h</button><button type="button" class="st-h enc-h" data-i="1">? min</button></div><div class="w-kp"></div>`;
    const vals = [0, 0]; let active = 0; let set = [false, false];
    const fields = () => el.querySelectorAll<HTMLButtonElement>('.enc-h');
    const sync = () => fields().forEach((b, i) => { b.textContent = set[i] ? `${vals[i]} ${i ? 'min' : 'h'}` : `? ${i ? 'min' : 'h'}`; b.classList.toggle('act', i === active); });
    fields().forEach((b) => b.addEventListener('click', () => { active = Number(b.dataset.i); sync(); }));
    const k = keypad(el.querySelector<HTMLElement>('.w-kp')!, 'Valeur', 2);
    el.querySelector('.kp-out') && ((el.querySelector('.kp-out') as HTMLElement).style.display = 'none');
    el.querySelectorAll<HTMLButtonElement>('.kp-k').forEach((b) => b.addEventListener('click', () => {
      const key = b.dataset.k!;
      if (key === 'del') { vals[active] = Math.floor(vals[active] / 10); if (vals[active] === 0) set[active] = false; }
      else { vals[active] = Math.min(active === 0 ? 23 : 59, vals[active] * 10 + Number(key)); set[active] = true; }
      sync();
    }, true));
    sync();
    return { answer: () => (set[0] && set[1] ? vals.slice() : null), ready: () => (set[0] && set[1] ? null : 'Indique les heures et les minutes.'), lock: () => { k.lock(); fields().forEach((b) => (b.disabled = true)); }, showBad: (b) => fields().forEach((f, i) => f.classList.toggle('bad', b.includes(i))) };
  },
};
