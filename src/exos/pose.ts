/**
 * Additions et soustractions posées (CE1 : 2 ou 3 nombres jusqu'à 1 000, soustraction posée dès le CE1 ;
 * CE2 : jusqu'à 10 000 ; CM1–CM2 : jusqu'à 99 999). Soustraction : cassage ou compensation, au choix de l'enfant.
 */
import { rng } from '../engine/rng';
import { type ExoType, type Level, type Palier, UNITS, fmt } from '../engine/types';
import { colop } from '../ui/colop';

export interface PoseData { lv: Level; p: Palier; op: '+' | '−'; rows: number[] }
const MAXP: Record<Level, number> = { CE1: 999, CE2: 9999, CM1: 99999, CM2: 99999 };
const digitsOf = (n: number) => String(n).split('').reverse().map(Number);
const val = (d: PoseData) => (d.op === '+' ? d.rows.reduce((a, b) => a + b, 0) : d.rows[0] - d.rows[1]);
const cols = (d: PoseData) => Math.max(...d.rows.map((x) => String(x).length)) + (d.op === '+' ? 1 : 0);
/** nombre de retenues (addition) ou d'échanges (soustraction) */
export function carries(d: PoseData) {
  let c = 0, k = 0, n = 0;
  const top = Math.max(...d.rows.map((x) => String(x).length));
  for (let i = 0; i < top; i++) {
    const ds = d.rows.map((x) => digitsOf(x)[i] ?? 0);
    if (d.op === '+') { const s = ds.reduce((a, b) => a + b, 0) + c; c = Math.floor(s / 10); if (c) n++; }
    else { const s = ds[0] - ds[1] - k; k = s < 0 ? 1 : 0; if (k) n++; }
  }
  return n;
}
function zeroMiddle(n: number) { const s = String(n); return s.length >= 3 && s.slice(1, -1).includes('0'); }

function mkPose(op: '+' | '−'): ExoType<PoseData, number[]> {
  return {
    id: op === '+' ? 'addpose' : 'subpose',
    title: op === '+' ? 'Addition posée' : 'Soustraction posée',
    notion: op === '+' ? 'Addition posée' : 'Soustraction posée',
    levels: ['CE1', 'CE2', 'CM1', 'CM2'],
    generate(lv, p, seed) {
      const r = rng(seed);
      const max = MAXP[lv];
      const len = String(max).length;
      for (;;) {
        let rows: number[];
        if (op === '+') {
          const three = p === 3 && r.next() < 0.5;
          const k = three ? 3 : 2;
          rows = Array.from({ length: k }, (_, i) => r.int(i === 0 ? 10 ** (len - 2) : 1, Math.floor(max / k)));
          if (lv === 'CE1' && p === 1) rows = rows.map((x) => x % 100 + (x >= 100 ? 100 * r.int(1, 3) : 0));
        } else {
          const a = r.int(10 ** (len - 1) + 1, max);
          const b = r.int(1, a - 1);
          rows = [a, b];
          if (p === 3 && !zeroMiddle(a)) continue;
        }
        const d: PoseData = { lv, p, op, rows };
        const c = carries(d);
        if (val(d) > max || val(d) <= 0) continue;
        if (p === 1 && c !== 0) continue;
        if (p === 2 && c !== 1) continue;
        if (p === 3 && c < 2) continue;
        return d;
      }
    },
    solution: (d) => digitsOf(val(d)),
    check(d, a) {
      const g = digitsOf(val(d));
      const bad = [...Array(Math.max(g.length, a.length)).keys()].filter((k) => g[k] !== a[k]);
      if (!bad.length) return { ok: true };
      const k0 = bad[0];
      const ds = (i: number) => d.rows.map((x) => digitsOf(x)[i] ?? 0);
      if (op === '+') {
        // sans retenue : chaque colonne = somme modulo 10
        const noCarry = [...Array(cols(d)).keys()].map((i) => ds(i).reduce((s, x) => s + x, 0) % 10);
        const nc = Number(noCarry.reverse().join(''));
        if (Number([...a].reverse().join('')) === nc) return { ok: false, bad, msg: `Tu as oublié les retenues. Quand une colonne fait 10 ou plus, 10 ${UNITS[k0 > 0 ? k0 - 1 : 0].many} deviennent 1 ${UNITS[k0 > 0 ? k0 : 1].one} : écris-la en haut de la colonne suivante.` };
        if (bad.every((k) => k === g.length - 1) && a.length < g.length) return { ok: false, bad, msg: `La dernière retenue doit s’écrire devant : il manque un chiffre à gauche.` };
        return { ok: false, bad, msg: bad.length === 1 ? `Presque ! Recalcule la colonne des ${UNITS[k0].many} (sans oublier la retenue).` : `Recalcule colonne par colonne, en commençant par les unités.` };
      }
      // soustraction : « le plus petit au plus grand » dans chaque colonne
      const top = String(d.rows[0]).length;
      const absCol = [...Array(top).keys()].map((i) => Math.abs(ds(i)[0] - ds(i)[1]));
      const absN = Number(absCol.reverse().join(''));
      if (Number([...a].reverse().join('')) === absN) return { ok: false, bad, msg: `Dans une colonne, tu as enlevé le chiffre du haut au chiffre du bas. On enlève toujours le bas au haut. S’il n’y a pas assez en haut, on fait un échange (cassage ou compensation).` };
      // échange fait, mais pas reporté sur la colonne suivante : le chiffre suivant est trop grand de 1
      if (bad.length === 1 && a[k0] === g[k0] + 1) return { ok: false, bad, msg: `Dans la colonne des ${UNITS[k0].many}, tu as un de trop. Tu as fait un échange juste avant : ${'il faut en tenir compte (une de moins en haut, ou une de plus en bas).'}` };
      return { ok: false, bad, msg: bad.length === 1 ? `Presque ! Recalcule la colonne des ${UNITS[k0].many}.` : `Recalcule colonne par colonne, en commençant par les unités.` };
    },
    hint(d) {
      const ds = (i: number) => d.rows.map((x) => digitsOf(x)[i] ?? 0);
      if (op === '+') {
        const s = ds(0).reduce((a, b) => a + b, 0);
        return `Commence par les unités : ${ds(0).join(' + ')} = ${s}.${s >= 10 ? ` On écrit ${s % 10} et on retient 1 dizaine.` : ''}`;
      }
      const [x, y] = ds(0);
      return x >= y ? `Unités : ${x} − ${y} = ${x - y}. Puis les dizaines.` : `Unités : ${x} − ${y}, ce n’est pas possible. Échange 1 dizaine contre 10 unités : ${x + 10} − ${y} = ${x + 10 - y}.`;
    },
    correction(d) {
      const ds = (i: number) => d.rows.map((x) => digitsOf(x)[i] ?? 0);
      const lines: string[] = [];
      let c = 0;
      const top = Math.max(...d.rows.map((x) => String(x).length));
      for (let i = 0; i < top; i++) {
        if (op === '+') {
          const s = ds(i).reduce((a, b) => a + b, 0) + c;
          lines.push(`${UNITS[i].many} : ${ds(i).join(' + ')}${c ? ' + 1 (retenue)' : ''} = ${s}${s >= 10 ? ` → j’écris ${s % 10}, je retiens 1` : ''}`);
          c = Math.floor(s / 10);
        } else {
          let [x, y] = ds(i);
          x -= c;
          const ex = x < y;
          lines.push(`${UNITS[i].many} : ${ex ? `${x} − ${y} impossible → échange : ${x + 10} − ${y} = ${x + 10 - y}` : `${x} − ${y} = ${x - y}`}${c ? ' (une a déjà été échangée)' : ''}`);
          c = ex ? 1 : 0;
        }
      }
      if (op === '+' && c) lines.push(`La dernière retenue s’écrit devant : 1.`);
      return `<ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul><p>Résultat : <b>${fmt(val(d))}</b></p>`;
    },
    mount(el, d) {
      el.innerHTML = `<p class="q">Pose et calcule : <b>${d.rows.map(fmt).join(` ${op} `)}</b></p><div class="w-co"></div>`;
      const c = colop(el.querySelector('.w-co')!, { op, rows: d.rows, cols: cols(d) });
      return { answer: () => c.digits(), lock: () => c.lock(), showBad: (b) => c.showBad(b) };
    },
  };
}
export const addpose = mkPose('+');
export const subpose = mkPose('−');
