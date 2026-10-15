/** Division et multiplication : la même famille (7 × 13 = 91, donc 91 ÷ 7 = 13). Chercher 24 ÷ 4, c'est chercher ? × 4 = 24. */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../engine/types';
import { keypad } from '../ui/keypad';

export interface FamData { lv: Level; p: Palier; a: number; b: number; kind: 'donne' | 'table' | 'dividende' }
const ans = (d: FamData) => (d.kind === 'dividende' ? d.a * d.b : d.b);
export const famille: ExoType<FamData, number> = {
  id: 'famille', title: 'Diviser avec les tables', notion: 'Division et multiplication', levels: ['CE2', 'CM1', 'CM2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const kind = p === 1 ? 'donne' : p === 2 ? 'table' : r.pick(['table', 'dividende'] as const);
    const a = r.int(2, 9), b = kind === 'donne' ? r.int(11, lv === 'CE2' ? 30 : 99) : r.int(2, 10);
    return { lv, p, a, b, kind };
  },
  solution: ans,
  check(d, x) {
    const c = d.a * d.b;
    if (x === ans(d)) return { ok: true };
    if (d.kind === 'dividende') return { ok: false, msg: x === d.a + d.b ? `Tu as ajouté. ? ÷ ${d.a} = ${d.b} veut dire : ${d.b} fois ${d.a}.` : `? ÷ ${d.a} = ${d.b}, donc ? = ${d.b} × ${d.a}.` };
    if (x === c - d.a) return { ok: false, msg: `Tu as soustrait. Diviser, c’est chercher combien de fois ${d.a} il y a dans ${fmt(c)}.` };
    if (x === c * d.a) return { ok: false, msg: `Tu as multiplié. Le résultat d’une division est plus petit que ${fmt(c)}.` };
    return { ok: false, msg: `Vérifie avec la multiplication : ${fmt(x)} × ${d.a} = ${fmt(x * d.a)}. Est-ce ${fmt(c)} ?` };
  },
  hint: (d) => (d.kind === 'dividende' ? `Si on partage le nombre en ${d.a} et qu’on trouve ${d.b}, c’est que le nombre est ${d.a} fois ${d.b}.` : `Cherche dans la table de ${d.a} : ${d.a} × ? = ${fmt(d.a * d.b)}.`),
  correction: (d) => `<p>${d.a} × ${fmt(d.b)} = ${fmt(d.a * d.b)}, donc <b>${fmt(d.a * d.b)} ÷ ${d.a} = ${fmt(d.b)}</b> et ${fmt(d.a * d.b)} ÷ ${fmt(d.b)} = ${d.a}.</p>`,
  mount(el, d) {
    const c = d.a * d.b, h = '<span class="hole">?</span>';
    const pre = d.kind === 'donne' ? `<p class="fact">On sait que ${d.a} × ${fmt(d.b)} = ${fmt(c)}.</p>` : '';
    const eq = d.kind === 'dividende' ? `${h} ÷ ${d.a} = ${d.b}` : `${fmt(c)} ÷ ${d.a} = ${h}`;
    el.innerHTML = `${pre}<p class="q">Complète :</p><p class="eq">${eq}</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Le nombre qui manque', 4);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
