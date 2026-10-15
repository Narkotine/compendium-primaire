/**
 * Problèmes intégrés (tous chapitres) en deux temps :
 *  1. MODÉLISER : écrire le calcul avec les étiquettes (les nombres de l'énoncé, y compris inutiles, et les signes) ;
 *  2. CALCULER : donner le résultat au pavé.
 * Pas de schéma imposé. Chaque modèle de problème sait reconnaître les erreurs typiques.
 */
import type { Rng } from '../../engine/rng';
import { rng } from '../../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../../engine/types';
import { exprBuilder, evalExpr } from '../../ui/expr';
import { keypad } from '../../ui/keypad';

export interface PbInst {
  text: string;
  question: string;
  /** nombres utiles (dans l'ordre de l'énoncé) */
  nums: number[];
  /** nombres inutiles cités dans l'énoncé */
  useless: number[];
  slots: number;
  ops: string[];
  answer: number;
  unit: string;
  /** diagnostic d'un calcul faux (nombres utiles bien choisis), ou null */
  diag?: (nums: number[], ops: string[]) => string | null;
  hint: string;
  /** calcul attendu, pour le corrigé (ex. « 83 + 18 − 27 ») */
  model: string;
}
export interface PbTemplate { id: string; levels: Level[]; minP: Palier; make(r: Rng, lv: Level, p: Palier): PbInst | null }
export interface PbData { lv: Level; p: Palier; seed: number; tpl: string; inst: PbInst }
export interface PbAnswer { nums: number[]; ops: string[]; result: number | null }

const NAMES = ['Léa', 'Malo', 'Inès', 'Noé', 'Jade', 'Sami', 'Lina', 'Hugo', 'Aya', 'Tom', 'Zoé', 'Yanis', 'Rose', 'Adam', 'Nina', 'Liam'];
const GIRLS = new Set(['Léa', 'Inès', 'Jade', 'Lina', 'Aya', 'Zoé', 'Rose', 'Nina']);
/** pronom sujet pour un prénom */
export const il = (name: string) => (GIRLS.has(name) ? 'elle' : 'il');
export const lui = (name: string) => (GIRLS.has(name) ? 'elle' : 'lui');
export const names = (r: Rng, k: number) => r.shuffle([...NAMES]).slice(0, k);
const sameMultiset = (a: number[], b: number[]) => a.length === b.length && [...a].sort((x, y) => x - y).join() === [...b].sort((x, y) => x - y).join();

export function makeProblemExo(id: string, title: string, notion: string, levels: Level[], tpls: PbTemplate[]): ExoType<PbData, PbAnswer> & { phase: (d: PbData, a: { nums: number[]; ops: string[] }) => { ok: boolean; msg?: string } } {
  const gen = (lv: Level, p: Palier, seed: number): PbData => {
    const r = rng(seed);
    const pool = tpls.filter((t) => t.levels.includes(lv) && t.minP <= p);
    for (;;) {
      const t = r.pick(pool);
      const inst = t.make(r, lv, p);
      if (inst && inst.answer >= 0 && Number.isInteger(inst.answer)) return { lv, p, seed, tpl: t.id, inst };
    }
  };
  /** phase 1 : le calcul est-il le bon ? */
  const phase = (d: PbData, a: { nums: number[]; ops: string[] }) => {
    const i = d.inst;
    const usedUseless = a.nums.filter((n) => i.useless.includes(n) && !i.nums.includes(n));
    if (usedUseless.length) return { ok: false, msg: `Le nombre ${fmt(usedUseless[0])} ne sert pas à répondre à la question. Relis ce qu’on cherche.` };
    if (!sameMultiset(a.nums, i.nums)) return { ok: false, msg: `Utilise tous les nombres utiles de l’énoncé, chacun une fois.` };
    const v = evalExpr(a.nums, a.ops);
    if (v === i.answer) return { ok: true };
    if (v < 0) return { ok: false, msg: `Ce calcul est impossible : on ne peut pas enlever un grand nombre d’un plus petit. Mets le plus grand en premier.` };
    return { ok: false, msg: i.diag?.(a.nums, a.ops) ?? `Ce calcul ne répond pas à la question. Imagine la situation : la quantité cherchée est-elle plus grande ou plus petite ?` };
  };
  const exo: ExoType<PbData, PbAnswer> & { phase: typeof phase } = {
    id, title, notion, levels,
    generate: gen,
    solution: (d) => ({ nums: d.inst.nums, ops: d.inst.model.match(/ [+−×÷] /g)!.map((x) => x.trim()), result: d.inst.answer }),
    phase,
    check(d, a) {
      const ph = phase(d, a);
      if (!ph.ok) return { ok: false, msg: ph.msg };
      if (a.result === null) return { ok: false, msg: 'Le calcul est juste ! Maintenant, calcule le résultat.' };
      if (a.result === d.inst.answer) return { ok: true };
      return { ok: false, msg: `Ton calcul est bien choisi, mais le résultat n’est pas juste. Refais l’opération (tu peux la poser).` };
    },
    hint: (d) => d.inst.hint,
    correction: (d) => `<p>Calcul : <b>${d.inst.model} = ${fmt(d.inst.answer)}</b></p><p>Réponse : ${fmt(d.inst.answer)} ${d.inst.unit}.</p>${d.inst.useless.length ? `<p class="small">${d.inst.useless.map(fmt).join(', ')} ne servai${d.inst.useless.length > 1 ? 'ent' : 't'} à rien.</p>` : ''}`,
    mount(el, d) {
      const i = d.inst;
      const all = [...new Set([...i.nums, ...i.useless])];
      el.innerHTML = `<p class="pb-text">${i.text}</p><p class="q"><b>${i.question}</b></p>
        <p class="tip">1. Écris le calcul avec les étiquettes.</p><div class="w-ex"></div>
        <p class="tip">2. Calcule le résultat.</p><div class="w-kp"></div>`;
      const ex = exprBuilder(el.querySelector('.w-ex')!, all, i.ops, i.slots, fmt);
      const k = keypad(el.querySelector('.w-kp')!, 'Le résultat', 7);
      return {
        answer: () => { const v = ex.value(); return v ? { ...v, result: k.value() } : null; },
        ready: () => (!ex.value() ? 'Écris d’abord le calcul : remplis toutes les cases.' : k.value() === null ? 'Calcule aussi le résultat avec le pavé.' : null),
        lock: () => { ex.lock(); k.lock(); },
      };
    },
  };
  return exo;
}
/** Plages des nombres des problèmes, par niveau. */
export const RANGE: Record<Level, [number, number]> = { CE1: [10, 600], CE2: [100, 6000], CM1: [1000, 60000], CM2: [1000, 600000] };
