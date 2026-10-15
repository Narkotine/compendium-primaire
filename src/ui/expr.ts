/**
 * « Écrire le calcul » : des cases à remplir avec des étiquettes (nombres de l'énoncé, y compris inutiles, et signes).
 * Glisser une étiquette sur une case, ou toucher l'étiquette puis la case. Toucher une case remplie la vide.
 * Modèle : n cases-nombres séparées par n − 1 cases-signes : [a] [op] [b] ( [op] [c] ).
 */
import { draggable, say } from './drag';

export interface Tok { t: 'n' | 'op'; v: string }
export function exprBuilder(el: HTMLElement, nums: number[], ops: string[], slots: number, fmtN: (n: number) => string) {
  const pool: Tok[] = [...nums.map((n) => ({ t: 'n' as const, v: String(n) })), ...ops.map((o) => ({ t: 'op' as const, v: o }))];
  const shape: ('n' | 'op')[] = Array.from({ length: slots * 2 - 1 }, (_, i) => (i % 2 ? 'op' : 'n'));
  const fill: (number | null)[] = shape.map(() => null); // index dans pool
  let sel: number | null = null;
  let locked = false;
  const label = (i: number) => (pool[i].t === 'n' ? fmtN(Number(pool[i].v)) : pool[i].v);
  const put = (tok: number, s: number) => {
    if (locked) return;
    if (pool[tok].t !== shape[s]) { say(pool[tok].t === 'n' ? 'Cette case attend un signe.' : 'Cette case attend un nombre.'); flash(s); return; }
    if (pool[tok].t === 'n') { const prev = fill.indexOf(tok); if (prev >= 0) fill[prev] = null; }
    fill[s] = tok; sel = null; render();
  };
  const flash = (s: number) => { const c = el.querySelector(`.ex-slot[data-s="${s}"]`); c?.classList.add('no'); setTimeout(() => c?.classList.remove('no'), 400); };
  function render() {
    const used = new Set(fill.filter((x, s) => x !== null && shape[s] === 'n') as number[]);
    el.innerHTML = `<div class="ex"><div class="ex-line" aria-label="Le calcul">${shape.map((sh, s) => `<button type="button" class="ex-slot ex-${sh}" data-drop="slot" data-s="${s}" aria-label="${sh === 'n' ? 'Case nombre' : 'Case signe'} : ${fill[s] === null ? 'vide' : label(fill[s]!)}">${fill[s] === null ? '' : `<span class="ex-in" data-tok="${fill[s]}">${label(fill[s]!)}</span>`}</button>`).join('')}</div>
      <div class="ex-pool" aria-label="Étiquettes">${pool.map((p, i) => `<button type="button" class="tok ex-tok ex-${p.t} ${sel === i ? 'sel' : ''}" data-tok="${i}" aria-pressed="${sel === i}" ${used.has(i) ? 'hidden' : ''}>${label(i)}</button>`).join('')}</div></div>`;
    el.querySelectorAll<HTMLElement>('.ex-pool .tok, .ex-in').forEach((t) => {
      const i = Number(t.dataset.tok);
      const inSlot = t.classList.contains('ex-in');
      draggable(t, {
        onDrop: (target) => { if (target.dataset.s !== undefined) { if (inSlot) fill[fill.indexOf(i)] = null; put(i, Number(target.dataset.s)); } },
        onTap: () => {
          if (locked) return;
          if (inSlot) { const s = Number(t.closest<HTMLElement>('.ex-slot')!.dataset.s); fill[s] = null; render(); return; }
          sel = sel === i ? null : i; render();
          el.querySelector<HTMLElement>(`.ex-pool [data-tok="${i}"]`)?.focus();
        },
      });
    });
    el.querySelectorAll<HTMLButtonElement>('.ex-slot').forEach((b) => b.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.ex-in')) return;
      if (sel !== null) put(sel, Number(b.dataset.s));
    }));
    if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
  render();
  return {
    /** [nombres], [signes] ou null si incomplet */
    value: (): { nums: number[]; ops: string[] } | null => {
      if (fill.some((x) => x === null)) return null;
      return { nums: fill.filter((_, s) => shape[s] === 'n').map((i) => Number(pool[i!].v)), ops: fill.filter((_, s) => shape[s] === 'op').map((i) => pool[i!].v) };
    },
    lock: () => { locked = true; render(); },
  };
}
/** Valeur d'un calcul à gauche à droite (+, −, ×, ÷ ; priorités respectées pour × et ÷). */
export function evalExpr(nums: number[], ops: string[]): number {
  const n = [...nums], o = [...ops];
  for (let i = 0; i < o.length; ) {
    if (o[i] === '×' || o[i] === '÷') { n.splice(i, 2, o[i] === '×' ? n[i] * n[i + 1] : n[i] / n[i + 1]); o.splice(i, 1); } else i++;
  }
  return n.slice(1).reduce((a, x, i) => (o[i] === '+' ? a + x : a - x), n[0]);
}
