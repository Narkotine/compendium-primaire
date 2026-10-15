/**
 * Tableau de numération (M) C D U : on y glisse des étiquettes-chiffres.
 * Doigt/souris : glisser l'étiquette sur une case. Secours : toucher l'étiquette puis la case (aussi au clavier).
 * Toucher une case remplie renvoie son chiffre dans la réserve.
 */
import { UNITS } from '../engine/types';
import { draggable, say } from './drag';

export function numtable(el: HTMLElement, cols: number, pool: number[]) {
  const cells: (number | null)[] = Array(cols).fill(null); // index 0 = unités ; valeur = index dans pool
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
    say(`${pool[tok]} dans la colonne des ${UNITS[col].many}.`);
    el.querySelector<HTMLElement>('.tok:not([hidden])')?.focus();
  };
  function render() {
    const u = used();
    el.innerHTML = `<div class="nt">
      <div class="nt-grid nt-${cols}" role="group" aria-label="Tableau de numération">${[...Array(cols).keys()].reverse().map((k) => `
        <div class="nt-col nt-${UNITS[k].key}"><div class="nt-h" aria-hidden="true">${UNITS[k].many}</div>
        <button type="button" class="nt-cell ${bad.includes(k) ? 'bad' : ''}" data-drop="cell" data-col="${k}" aria-label="Case des ${UNITS[k].many} : ${cells[k] === null ? 'vide' : pool[cells[k]!]}">${cells[k] === null ? '' : `<span class="tok tok-in" data-tok="${cells[k]}">${pool[cells[k]!]}</span>`}</button></div>`).join('')}
      </div>
      <div class="nt-pool" aria-label="Étiquettes">${pool.map((d, i) => `<button type="button" class="tok ${sel === i ? 'sel' : ''}" data-tok="${i}" aria-pressed="${sel === i}" ${u.has(i) ? 'hidden' : ''}>${d}</button>`).join('')}</div></div>`;
    el.querySelectorAll<HTMLElement>('.nt-pool .tok, .tok-in').forEach((t) => {
      const i = Number(t.dataset.tok);
      draggable(t, {
        onDrop: (target) => { if (target.dataset.col) place(i, Number(target.dataset.col)); },
        onTap: () => {
          if (locked) return;
          if (t.classList.contains('tok-in')) { cells[cells.indexOf(i)] = null; render(); return; }
          sel = sel === i ? null : i; render();
          el.querySelector<HTMLElement>(`[data-tok="${i}"]`)?.focus();
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
    digits: () => (cells.some((x) => x === null) ? null : cells.map((x) => pool[x!])),
    lock: () => { locked = true; render(); },
    showBad: (b: number[]) => { bad = b; render(); },
  };
}
