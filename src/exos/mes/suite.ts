/** Durées, périmètre, aire, problèmes de mesures. */
import { rng } from '../../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../../engine/types';
import { keypad } from '../../ui/keypad';
import { names, il, uOK } from '../pb/engine';

/* ---------- duree ---------- */
export interface DuData { lv: Level; p: Palier; h1: number; m1: number; h2: number; m2: number }
const toMin = (h: number, m: number) => h * 60 + m;
export const duree: ExoType<DuData, number> = {
  id: 'duree', title: 'Calculer une durée', notion: 'Heure et durées', levels: ['CE1', 'CE2', 'CM1'],
  generate(lv, p, seed) {
    const r = rng(seed);
    if (lv === 'CE1') {
      // CE1 : heures en quarts d’heure ; palier 1 dans la même heure, puis jusqu’à 1 h, puis jusqu’à 2 h.
      for (;;) {
        const h1 = r.int(7, 16), m1 = r.pick([0, 15, 30, 45]), dur = 15 * r.int(1, [3, 4, 8][p - 1]);
        const t2 = toMin(h1, m1) + dur;
        if (p === 1 && m1 + dur >= 60) continue;
        return { lv, p, h1, m1, h2: Math.floor(t2 / 60), m2: t2 % 60 };
      }
    }
    for (;;) {
      const h1 = r.int(7, 16), m1 = p === 1 ? r.pick([0, 15, 30, 45]) : r.int(0, 59);
      const dur = r.int(p === 1 ? 15 : 20, p === 3 ? 150 : 90);
      const t2 = toMin(h1, m1) + dur;
      const h2 = Math.floor(t2 / 60) % 24, m2 = t2 % 60;
      if (p === 1 && m1 + (dur % 60) < 60 && Math.floor(dur / 60) === 0) return { lv, p, h1, m1, h2, m2 }; // same hour
      if (p >= 2) return { lv, p, h1, m1, h2, m2 };
    }
  },
  solution: (d) => toMin(d.h2, d.m2) - toMin(d.h1, d.m1),
  check(d, a) {
    const g = duree.solution(d);
    if (a === g) return { ok: true };
    // treated as base 100
    const fake = (d.h2 - d.h1) * 100 + (d.m2 - d.m1);
    if (a === fake || a === Math.abs((d.h2 * 100 + d.m2) - (d.h1 * 100 + d.m1)))
      return { ok: false, msg: `Une heure = 60 minutes, pas 100. Passe par l’heure pile si besoin.` };
    return { ok: false, msg: `De ${d.h1} h ${String(d.m1).padStart(2,'0')} à ${d.h2} h ${String(d.m2).padStart(2,'0')} : compte les minutes.` };
  },
  hint: (d) => `Va d’abord jusqu’à ${d.h1 + (d.m1 ? 1 : 0)} h 00, puis ajoute le reste.`,
  correction: (d) => `<p>De ${d.h1} h ${String(d.m1).padStart(2,'0')} à ${d.h2} h ${String(d.m2).padStart(2,'0')} : <b>${duree.solution(d)} min</b>${duree.solution(d) >= 60 ? ` (${Math.floor(duree.solution(d)/60)} h${duree.solution(d)%60 ? ` ${duree.solution(d)%60} min` : ''})` : ''}.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Quelle durée entre <b>${d.h1} h ${String(d.m1).padStart(2,'0')}</b> et <b>${d.h2} h ${String(d.m2).padStart(2,'0')}</b> ?</p><p class="tip">Réponds en minutes.</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Durée en minutes', 4);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};

/* ---------- perimetre ---------- */
export interface PeData { lv: Level; p: Palier; sides: number[]; shape: 'rect' | 'poly' }
export const perimetre: ExoType<PeData, number> = {
  id: 'perimetre', title: 'Périmètre', notion: 'Périmètre', levels: ['CE2', 'CM1'],
  generate(lv, p, seed) {
    const r = rng(seed);
    if (p === 1 || r.next() < 0.5) {
      const L = r.int(3, 12), l = r.int(2, L);
      return { lv, p, sides: [L, l, L, l], shape: 'rect' };
    }
    const n = r.int(3, 5);
    const sides = Array.from({ length: n }, () => r.int(2, 10));
    return { lv, p, sides, shape: 'poly' };
  },
  solution: (d) => d.sides.reduce((a, b) => a + b, 0),
  check(d, a) {
    const g = perimetre.solution(d);
    if (a === g) return { ok: true };
    if (d.shape === 'rect' && a === d.sides[0] * d.sides[1]) return { ok: false, msg: `Tu as calculé l’aire (longueur × largeur). Le périmètre, c’est le tour : on additionne les côtés.` };
    if (d.shape === 'rect' && a === d.sides[0] + d.sides[1]) return { ok: false, msg: `Tu n’as additionné que deux côtés. Un rectangle a quatre côtés : 2 longueurs + 2 largeurs.` };
    return { ok: false, msg: `Additionne toutes les longueurs des côtés.` };
  },
  hint: (d) => d.shape === 'rect' ? `Périmètre = ${d.sides[0]} + ${d.sides[1]} + ${d.sides[0]} + ${d.sides[1]}.` : `Additionne les ${d.sides.length} côtés.`,
  correction: (d) => `<p>${d.sides.join(' + ')} = <b>${perimetre.solution(d)}</b></p>`,
  mount(el, d) {
    const desc = d.shape === 'rect' ? `un rectangle de ${d.sides[0]} cm sur ${d.sides[1]} cm` : `un polygone dont les côtés mesurent ${d.sides.join(' cm, ')} cm`;
    el.innerHTML = `<p class="q">Calcule le périmètre de ${desc}.</p><p class="tip">Réponds en cm (nombre seulement).</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Périmètre en cm', 4);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};

/* ---------- aire ---------- */
export interface AiData { lv: Level; p: Palier; L: number; l: number; mode: 'carreaux' | 'formule' }
export const aire: ExoType<AiData, number> = {
  id: 'aire', title: 'Aire d’un rectangle', notion: 'Aire', levels: ['CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const L = r.int(2, p === 3 ? 12 : 8), l = r.int(2, Math.min(L, 6));
    return { lv, p, L, l, mode: p === 1 ? 'carreaux' : 'formule' };
  },
  solution: (d) => d.L * d.l,
  check(d, a) {
    const g = d.L * d.l;
    if (a === g) return { ok: true };
    if (a === 2 * (d.L + d.l) || a === 2 * d.L + 2 * d.l) return { ok: false, msg: `Tu as calculé le périmètre. L’aire, c’est le nombre de carreaux : ${d.L} × ${d.l}.` };
    if (a === d.L + d.l) return { ok: false, msg: `On multiplie le nombre de carreaux par rangée par le nombre de rangées.` };
    return { ok: false, msg: `${d.L} rangées de ${d.l} carreaux.` };
  },
  hint: (d) => `${d.L} rangées de ${d.l} carreaux : ${d.L} × ${d.l}.`,
  correction: (d) => `<p>${d.L} × ${d.l} = <b>${d.L * d.l}</b> carreaux.</p>`,
  mount(el, d) {
    const cells = Array.from({ length: d.L * d.l }, (_, i) => `<rect x="${(i % d.l) * 28}" y="${Math.floor(i / d.l) * 28}" width="28" height="28" fill="${Math.floor(i / d.l) % 2 ? '#6fa8dc' : '#2a6fbe'}" stroke="#222"/>`).join('');
    el.innerHTML = `<p class="q">Quelle est l’aire de ce rectangle${d.mode === 'formule' ? ` (${d.L} sur ${d.l})` : ''} ?</p>
      <svg class="aire-fig" viewBox="0 0 ${d.l * 28} ${d.L * 28}" width="100%" style="max-width:${Math.min(280, d.l * 28)}px">${cells}</svg>
      <p class="tip">Réponds en nombre de carreaux.</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Aire', 4);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};

/* ---------- probmes ---------- */
export interface PmData { lv: Level; p: Palier; kind: 'conv' | 'perim' | 'duree'; text: string; q: string; answer: number; unit: string; hint: string; model: string }
export const probmes: ExoType<PmData, number> = {
  id: 'probmes', title: 'Problèmes de mesures', notion: 'Problèmes', levels: ['CE1', 'CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed); const [P] = names(r, 1);
    const extra = uOK(lv, p) ? ` ${P} a ${r.int(7, 11)} ans.` : '';
    if ((lv === 'CE2' || lv.startsWith('CM')) && r.next() < 0.35) {
      const L = r.int(4, 15), l = r.int(2, 8);
      return { lv, p, kind: 'perim', text: `${P} veut poser un ruban tout autour d’un cadre de ${L} cm sur ${l} cm.${extra}`, q: 'Quelle longueur de ruban faut-il ?', answer: 2 * (L + l), unit: 'cm', hint: 'Le tour du rectangle.', model: `${L} + ${l} + ${L} + ${l}` };
    }
    if (lv !== 'CE1' && r.next() < 0.4) {
      const h1 = r.int(8, 14), m1 = r.pick([0, 10, 20, 30, 40, 50]);
      const dur = r.int(25, 90);
      const t2 = h1 * 60 + m1 + dur;
      return { lv, p, kind: 'duree', text: `${P} est parti·e à ${h1} h ${String(m1).padStart(2,'0')} et arrivé·e à ${Math.floor(t2/60)} h ${String(t2%60).padStart(2,'0')}.${extra}`, q: `Combien de temps ${il(P)} a-t-${il(P)} mis ? (en minutes)`, answer: dur, unit: 'min', hint: 'Calcule la durée entre les deux heures.', model: `durée` };
    }
    const n = r.int(2, lv === 'CE1' ? 9 : 15); // CE1 : réponse ≤ 900 cm (nombres jusqu’à 1 000)
    return { lv, p, kind: 'conv', text: `${P} a une corde de ${n} m.${extra}`, q: 'Quelle est sa longueur en cm ?', answer: n * 100, unit: 'cm', hint: '1 m = 100 cm.', model: `${n} × 100` };
  },
  solution: (d) => d.answer,
  check(d, a) {
    if (a === d.answer) return { ok: true };
    if (d.kind === 'perim' && a === (d.answer / 2) * (d.answer / 2) / ((d.answer / 2) - 2) /* nonsense */) return { ok: false };
    if (d.kind === 'perim' && a < d.answer && d.answer % 2 === 0) {
      // maybe L*l
    }
    if (d.kind === 'conv' && a === d.answer / 100) return { ok: false, msg: `Tu as converti dans l’autre sens. 1 m = 100 cm : le nombre de cm est plus grand.` };
    if (d.kind === 'perim') {
      // extract from text
      const m = d.text.match(/(\d+) cm sur (\d+)/);
      if (m && a === Number(m[1]) * Number(m[2])) return { ok: false, msg: `C’est l’aire. On demande le tour (périmètre).` };
      if (m && a === Number(m[1]) + Number(m[2])) return { ok: false, msg: `Un rectangle a quatre côtés.` };
    }
    return { ok: false, msg: d.hint };
  },
  hint: (d) => d.hint,
  correction: (d) => `<p><b>${d.model} = ${fmt(d.answer)} ${d.unit}</b></p>`,
  mount(el, d) {
    el.innerHTML = `<p class="pb-text">${d.text}</p><p class="q"><b>${d.q}</b></p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Réponse', 6);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
