/**
 * Tableau de numération étendu : [C] D U | d c [m]
 * On glisse des étiquettes-chiffres. La barre verticale marque la virgule.
 */
import { draggable, say } from './drag';

export type DecCol = { key: string; label: string; /** rang : 0 = unités, >0 après virgule, <0 avant */ k: number };

export function dectable(el: HTMLElement, cols: DecCol[], pool: number[]) {
  const cells: (number | null)[] = Array(cols.length).fill(null);
  let sel: number | null = null;
  let locked = false;
  let bad: number[] = [];
  const used = () => new Set(cells.filter((x): x is number => x !== null));
  const place = (tok: number, col: number) => {
    if (locked) return;
    const prev = cells.indexOf(tok);
    if (prev >= 0) cells[prev] = null;
    cells[col] = tok; sel = null; bad = [];
    render();
    say(`${pool[tok]} dans ${cols[col].label}.`);
  };
  function render() {
    const u = used();
    // render left-to-right: highest k first among integers, then decimals
    // Display: integer cols descending k (C D U), then |, then decimal ascending
    const intCols = cols.map((c, i) => ({ c, i })).filter((x) => x.c.k <= 0).sort((a, b) => a.c.k - b.c.k); // -2,-1,0
    const decCols = cols.map((c, i) => ({ c, i })).filter((x) => x.c.k > 0).sort((a, b) => a.c.k - b.c.k);
    const show = [...intCols.reverse(), ...decCols];
    const cellHtml = (i: number, c: DecCol) =>
      `<div class="nt-col nt-${c.key}"><div class="nt-h" aria-hidden="true">${c.label}</div>
        <button type="button" class="nt-cell ${bad.includes(i) ? 'bad' : ''}" data-drop="cell" data-col="${i}" aria-label="Case des ${c.label} : ${cells[i] === null ? 'vide' : pool[cells[i]!]}">${cells[i] === null ? '' : `<span class="tok tok-in" data-tok="${cells[i]}">${pool[cells[i]!]}</span>`}</button></div>`;
    let grid = '';
    for (const { c, i } of show) {
      if (c.k === 1) grid += `<div class="nt-sep" aria-hidden="true" title="virgule"></div>`;
      grid += cellHtml(i, c);
    }
    el.innerHTML = `<div class="nt"><div class="nt-grid nt-dec" role="group" aria-label="Tableau de numération décimal" style="display:flex;gap:0;align-items:stretch">${grid}</div>
      <div class="nt-pool" aria-label="Étiquettes">${pool.map((d, i) => `<button type="button" class="tok ${sel === i ? 'sel' : ''}" data-tok="${i}" aria-pressed="${sel === i}" ${u.has(i) ? 'hidden' : ''}>${d}</button>`).join('')}</div></div>`;
    el.querySelectorAll<HTMLElement>('.nt-pool .tok, .tok-in').forEach((t) => {
      const i = Number(t.dataset.tok);
      draggable(t, {
        onDrop: (target) => { if (target.dataset.col) place(i, Number(target.dataset.col)); },
        onTap: () => {
          if (locked) return;
          if (t.classList.contains('tok-in')) { cells[cells.indexOf(i)] = null; render(); return; }
          sel = sel === i ? null : i; render();
          if (sel !== null) say(`${pool[i]} choisi. Touche une case.`);
        },
      });
    });
    el.querySelectorAll<HTMLButtonElement>('.nt-cell').forEach((c) => c.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.tok-in')) return;
      const k = Number(c.dataset.col);
      if (sel !== null) place(sel, k);
      else if (cells[k] !== null && !locked) { cells[k] = null; render(); }
    }));
    if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
  render();
  return {
    /** Chiffres par index de colonne (même ordre que cols). */
    digits: () => (cells.some((x) => x === null) ? null : cells.map((x) => pool[x!])),
    lock: () => { locked = true; render(); },
    showBad: (b: number[]) => { bad = b; render(); },
  };
}
