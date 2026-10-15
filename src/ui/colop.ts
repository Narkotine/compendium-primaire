/**
 * Opération posée en colonnes (addition, soustraction) avec un pavé intégré.
 * - Ligne résultat : on touche une case puis on tape ; après un chiffre, la case active passe à gauche (on calcule de droite à gauche).
 * - Ligne d'aide facultative (retenues pour l'addition ; « cassage » au-dessus ou « compensation » en dessous pour la soustraction) :
 *   petites cases libres, jamais notées. Seul le résultat est vérifié, donc les deux méthodes de soustraction sont acceptées.
 */
import { UNITS } from '../engine/types';
import { say } from './drag';

export type SubMethod = 'cassage' | 'compensation';
export interface ColopOpts { op: '+' | '−'; rows: number[]; cols: number; method?: SubMethod; onMethod?: (m: SubMethod) => void }

export function colop(el: HTMLElement, o: ColopOpts) {
  const res: (number | null)[] = Array(o.cols).fill(null); // index 0 = unités
  const aux: string[] = Array(o.cols).fill('');
  const aux2: string[] = Array(o.cols).fill(''); // compensation : +1 sous le chiffre du bas
  let active: { row: 'res' | 'aux' | 'aux2'; k: number } = { row: 'res', k: 0 };
  let locked = false;
  let bad: number[] = [];
  let method: SubMethod = o.method ?? 'cassage';
  const digitAt = (n: number, k: number) => { const s = String(n); return k < s.length ? s[s.length - 1 - k] : ''; };
  const cell = (row: 'res' | 'aux' | 'aux2', k: number, txt: string, cls: string, label: string) =>
    `<button type="button" class="co-c ${cls} ${active.row === row && active.k === k && !locked ? 'act' : ''} ${row === 'res' && bad.includes(k) ? 'bad' : ''}" data-row="${row}" data-k="${k}" aria-label="${label}">${txt}</button>`;
  const ks = [...Array(o.cols).keys()].reverse();
  function render() {
    const auxRow = o.op === '+'
      ? `<div class="co-r co-aux"><span class="co-op"></span>${ks.map((k) => (k === 0 ? '<span class="co-c co-void"></span>' : cell('aux', k, aux[k], 'co-small', `Retenue vers les ${UNITS[k].many}`))).join('')}</div>`
      : method === 'cassage'
        ? `<div class="co-r co-aux"><span class="co-op"></span>${ks.map((k) => cell('aux', k, aux[k], 'co-small', `Nouveau chiffre des ${UNITS[k].many} après échange`)).join('')}</div>`
        : `<div class="co-r co-aux"><span class="co-op"></span>${ks.map((k) => cell('aux', k, aux[k], 'co-small', `Dix ${UNITS[k].many} ajoutées en haut`)).join('')}</div>`;
    const rowsHtml = o.rows.map((n, i) => `<div class="co-r"><span class="co-op">${i === o.rows.length - 1 ? o.op : ''}</span>${ks.map((k) => `<span class="co-c co-d ${o.op === '−' && method === 'cassage' && i === 0 && aux[k] ? 'struck' : ''}">${digitAt(n, k)}</span>`).join('')}</div>
      ${o.op === '−' && method === 'compensation' && i === o.rows.length - 1 ? `<div class="co-r co-aux"><span class="co-op"></span>${ks.map((k) => (k === 0 ? '<span class="co-c co-void"></span>' : cell('aux2', k, aux2[k], 'co-small', `Une ${UNITS[k].one} ajoutée en bas`))).join('')}</div>` : ''}`).join('');
    el.innerHTML = `<div class="co">
      ${o.op === '−' ? `<div class="co-meth" role="radiogroup" aria-label="Méthode"><button type="button" role="radio" aria-checked="${method === 'cassage'}" data-m="cassage">Je casse</button><button type="button" role="radio" aria-checked="${method === 'compensation'}" data-m="compensation">Je compense</button></div>` : ''}
      <div class="co-grid" style="--n:${o.cols}">${auxRow}${rowsHtml}<div class="co-line"></div>
      <div class="co-r co-res"><span class="co-op">=</span>${ks.map((k) => cell('res', k, res[k] === null ? '' : String(res[k]), 'co-big', `Résultat, chiffre des ${UNITS[k].many}`)).join('')}</div></div>
      <div class="co-help">Touche une case, puis un chiffre. Les petites cases servent d’aide : tu n’es pas obligé de les remplir.</div>
      <div class="kp-keys co-kp">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" class="kp-k" data-key="${d}">${d}</button>`).join('')}<button type="button" class="kp-k kp-del" data-key="del" aria-label="Effacer">⌫</button><button type="button" class="kp-k" data-key="0">0</button></div></div>`;
    el.querySelectorAll<HTMLButtonElement>('.co-c[data-row]').forEach((b) => b.addEventListener('click', () => { if (locked) return; active = { row: b.dataset.row as 'res', k: Number(b.dataset.k) }; render(); }));
    el.querySelectorAll<HTMLButtonElement>('[data-key]').forEach((b) => b.addEventListener('click', () => press(b.dataset.key!)));
    el.querySelectorAll<HTMLButtonElement>('[data-m]').forEach((b) => b.addEventListener('click', () => { if (locked) return; method = b.dataset.m as SubMethod; aux.fill(''); aux2.fill(''); o.onMethod?.(method); render(); }));
    if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
  function press(key: string) {
    if (locked) return;
    const { row, k } = active;
    if (row === 'res') {
      if (key === 'del') { if (res[k] === null && k > 0) active = { row, k: k - 1 }; res[active.k] = null; }
      else { res[k] = Number(key); bad = bad.filter((x) => x !== k); say(`${key} aux ${UNITS[k].many}`); if (k < o.cols - 1) active = { row, k: k + 1 }; }
    } else {
      const arr = row === 'aux' ? aux : aux2;
      if (key === 'del') arr[k] = arr[k].slice(0, -1);
      else if (arr[k].length < 2) arr[k] += key;
    }
    render();
  }
  render();
  el.addEventListener('keydown', (e) => {
    if (/^\d$/.test(e.key)) { press(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { press('del'); e.preventDefault(); }
  });
  return {
    /** chiffres du résultat (index 0 = unités) ; les cases vides de gauche comptent comme rien, une case vide au milieu = incomplet */
    digits: (): number[] | null => {
      let top = o.cols - 1;
      while (top >= 0 && res[top] === null) top--;
      if (top < 0) return null;
      while (top > 0 && res[top] === 0) top--; // zéros inutiles à gauche
      const out = res.slice(0, top + 1);
      return out.some((x) => x === null) ? null : (out as number[]);
    },
    method: () => method,
    lock: () => { locked = true; render(); },
    showBad: (b: number[]) => { bad = b; render(); },
  };
}
