/** Doubles et moitiés (programme CE1 : listes précises ; ensuite nombres plus grands, décomposés). */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, fmt } from '../engine/types';
import { keypad } from '../ui/keypad';

export interface DouData { lv: Level; p: Palier; n: number; kind: 'double' | 'moitie' }
const POOL: Record<Level, [number[], number[]][]> = {
  CE1: [
    [[...Array(10).keys()].map((i) => i + 1), [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]],
    [[11, 12, 13, 14, 15, 20, 25, 30, 35, 40, 45, 50], [22, 24, 26, 28, 30, 40, 50, 60, 70, 80, 90, 100]],
    [[100, 150, 200, 250, 300, 500, 25, 35, 45], [200, 300, 400, 500, 600, 1000, 50, 70, 90, 30]],
  ],
  CE2: [[[16, 18, 23, 24, 32, 41], [32, 36, 42, 46, 64, 82]], [[36, 47, 55, 68, 75, 120], [56, 72, 74, 90, 110, 150]], [[125, 240, 350, 1500, 2500], [130, 250, 350, 700, 1500, 5000]]],
  CM1: [[[36, 47, 55, 68, 75], [56, 72, 74, 90, 110]], [[125, 240, 350, 460], [130, 250, 350, 700]], [[1500, 2500, 1250, 3600], [1500, 5000, 2700, 7000]]],
  CM2: [[[36, 47, 55, 68, 75], [56, 72, 74, 90, 110]], [[125, 240, 350, 460], [130, 250, 350, 700]], [[1500, 2500, 1250, 3600], [1500, 5000, 2700, 7000]]],
  '6e': [[[12500, 24000, 35000], [13000, 25000, 70000]], [[125000, 240000], [130000, 700000]], [[1500000, 2500000], [1500000, 5000000]]],
};
const ans = (d: DouData) => (d.kind === 'double' ? d.n * 2 : d.n / 2);
export const doubles: ExoType<DouData, number> = {
  id: 'doubles', title: 'Doubles et moitiés', notion: 'Doubles et moitiés', levels: ['CE1', 'CE2', 'CM1', 'CM2', '6e'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const [D, M] = POOL[lv][p - 1];
    const kind = r.next() < 0.5 ? 'double' : 'moitie';
    return { lv, p, n: r.pick(kind === 'double' ? D : M), kind };
  },
  solution: ans,
  check(d, x) {
    const g = ans(d);
    if (x === g) return { ok: true };
    if (d.kind === 'moitie' && x === d.n * 2) return { ok: false, msg: `Tu as pris le double. La moitié, c’est plus petit : on partage en deux parts égales.` };
    if (d.kind === 'double' && x === d.n / 2) return { ok: false, msg: `Tu as pris la moitié. Le double, c’est deux fois le nombre.` };
    if (d.kind === 'moitie' && x * 2 !== d.n) return { ok: false, msg: `Vérifie : ${fmt(x)} + ${fmt(x)} = ${fmt(2 * x)}. Il faut trouver ${fmt(d.n)}.` };
    return { ok: false, msg: `Vérifie : ${fmt(d.n)} + ${fmt(d.n)} = ? Fais les dizaines, puis les unités.` };
  },
  hint(d) {
    if (d.kind === 'double') { const t = Math.floor(d.n / 10) * 10, u = d.n - t; return t && u ? `Coupe ${d.n} en ${t} et ${u}. Double de ${t} = ${2 * t}, double de ${u} = ${2 * u}.` : `Le double de ${fmt(d.n)}, c’est ${fmt(d.n)} + ${fmt(d.n)}.`; }
    const n = d.n; const t = Math.floor(n / 20) * 20, u = n - t;
    return t && u ? `Coupe ${fmt(n)} en ${fmt(t)} et ${fmt(u)} (deux nombres faciles à partager). Moitié de ${fmt(t)} = ${fmt(t / 2)}, moitié de ${fmt(u)} = ${fmt(u / 2)}.` : `Quel nombre, ajouté à lui-même, donne ${fmt(n)} ?`;
  },
  correction: (d) => (d.kind === 'double' ? `<p>Le double de ${fmt(d.n)} : <b>${fmt(d.n)} + ${fmt(d.n)} = ${fmt(2 * d.n)}</b></p>` : `<p>La moitié de ${fmt(d.n)} : <b>${fmt(d.n / 2)}</b>, car ${fmt(d.n / 2)} + ${fmt(d.n / 2)} = ${fmt(d.n)}.</p>`),
  mount(el, d) {
    el.innerHTML = `<p class="q">Quel est ${d.kind === 'double' ? 'le <b>double</b>' : 'la <b>moitié</b>'} de <b class="big">${fmt(d.n)}</b> ?</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Ta réponse', 5);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};
