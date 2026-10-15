/**
 * Matériel de numération : cubes (unités), barres (dizaines), plaques (centaines), gros cubes (milliers).
 * On échange au doigt : glisser une pièce vers la colonne de GAUCHE = grouper 10 en 1 ; vers la DROITE = casser 1 en 10.
 * Secours : boutons « Grouper 10 » et « Casser 1 » dans chaque colonne (clavier, lecteur d'écran).
 */
import { UNITS, unitName } from '../engine/types';
import { draggable, say } from './drag';

export function material(el: HTMLElement, start: number[], onChange?: (c: number[]) => void) {
  const c = [...start];
  const n = c.length;
  let locked = false;
  const exchange = (from: number, to: number): string => {
    if (locked) return '';
    if (to === from + 1) {
      if (to >= n) return `Il n'y a pas de colonne plus grande ici.`;
      if (c[from] < 10) return `Il faut 10 ${UNITS[from].many} pour faire 1 ${UNITS[to].one}. Tu n'en as que ${c[from]}.`;
      c[from] -= 10; c[to] += 1;
      render(); onChange?.(c);
      return `10 ${UNITS[from].many} deviennent 1 ${UNITS[to].one}.`;
    }
    if (to === from - 1 && to >= 0 && c[from] > 0) {
      c[from] -= 1; c[to] += 10;
      render(); onChange?.(c);
      return `1 ${UNITS[from].one} devient 10 ${UNITS[to].many}.`;
    }
    return '';
  };
  const piece = (k: number) => `<span class="pc pc-${UNITS[k].key}" aria-hidden="true"></span>`;
  function render() {
    el.innerHTML = `<div class="mat mat-${n}">${[...Array(n).keys()].reverse().map((k) => `
      <div class="mat-col mat-${UNITS[k].key}" data-drop="col" data-col="${k}">
        <div class="mat-h"><b class="mat-n">${c[k]}</b> ${unitName(k, c[k])}</div>
        <div class="mat-pieces" data-col="${k}">${Array.from({ length: Math.min(c[k], 60) }, () => piece(k)).join('')}${c[k] > 60 ? '<span class="pc-more">…</span>' : ''}</div>
        <div class="mat-btns">
          ${k < n - 1 ? `<button type="button" class="mb mb-g" data-g="${k}" ${c[k] < 10 ? 'disabled' : ''} aria-label="Grouper 10 ${UNITS[k].many} en 1 ${UNITS[k + 1].one}">Grouper 10</button>` : ''}
          ${k > 0 ? `<button type="button" class="mb mb-c" data-x="${k}" ${c[k] < 1 ? 'disabled' : ''} aria-label="Casser 1 ${UNITS[k].one} en 10 ${UNITS[k - 1].many}">Casser 1</button>` : ''}
        </div>
      </div>`).join('')}</div>`;
    el.querySelectorAll<HTMLElement>('.pc').forEach((p) => {
      const from = Number(p.closest<HTMLElement>('.mat-col')!.dataset.col);
      draggable(p, {
        onDrop: (t) => {
          const to = Number(t.dataset.col);
          if (to === from) return;
          const m = Math.abs(to - from) === 1 ? exchange(from, to) : 'Échange avec la colonne voisine.';
          say(m); flash(m);
        },
      });
    });
    el.querySelectorAll<HTMLButtonElement>('[data-g]').forEach((b) => b.addEventListener('click', () => { const k = Number(b.dataset.g); say(exchange(k, k + 1)); focusBack(`[data-g="${k}"]`); }));
    el.querySelectorAll<HTMLButtonElement>('[data-x]').forEach((b) => b.addEventListener('click', () => { const k = Number(b.dataset.x); say(exchange(k, k - 1)); focusBack(`[data-x="${k}"]`); }));
    if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
  const focusBack = (sel: string) => {
    const b = el.querySelector<HTMLButtonElement>(sel);
    (b && !b.disabled ? b : el.querySelector<HTMLButtonElement>('.mb:not([disabled])'))?.focus();
  };
  const flash = (m: string) => {
    if (!m) return;
    const f = document.createElement('div');
    f.className = 'mat-flash'; f.textContent = m;
    el.appendChild(f); setTimeout(() => f.remove(), 2200);
  };
  render();
  return { counts: () => [...c], lock: () => { locked = true; render(); }, exchange };
}
