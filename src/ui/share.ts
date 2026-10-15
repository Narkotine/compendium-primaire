/**
 * Partage équitable : un tas de jetons et k parts. Toucher « + » d'une part y pose un jeton, « − » le reprend.
 * Le bouton « Un à chacun » distribue un jeton à chaque part (comme on distribue des cartes), s'il en reste assez.
 */
import { say } from './drag';
export function share(el: HTMLElement, n: number, k: number, who: string) {
  const c = Array(k).fill(0);
  let locked = false, bad: number[] = [];
  const left = () => n - c.reduce((a, b) => a + b, 0);
  function render() {
    el.innerHTML = `<div class="sh"><div class="sh-pool" aria-live="polite"><span class="sh-n">${left()}</span> jeton${left() > 1 ? 's' : ''} à partager<div class="sh-dots">${'<i></i>'.repeat(Math.min(left(), 60))}</div></div>
      <button type="button" class="btn sh-all" ${left() < k ? 'disabled' : ''}>Un à chacun</button>
      <div class="sh-parts" style="--c:${Math.min(k, 3)}">${c.map((v, i) => `<div class="sh-p ${bad.includes(i) ? 'bad' : ''}"><div class="sh-h">${who} ${i + 1}</div><div class="sh-dots">${'<i></i>'.repeat(v)}</div><div class="sh-v">${v}</div>
        <div class="sh-b"><button type="button" class="mb" data-i="${i}" data-d="-1" aria-label="Reprendre un jeton à ${who} ${i + 1}">−</button><button type="button" class="mb" data-i="${i}" data-d="1" aria-label="Donner un jeton à ${who} ${i + 1}">+</button></div></div>`).join('')}</div></div>`;
    el.querySelectorAll<HTMLButtonElement>('[data-d]').forEach((b) => b.addEventListener('click', () => {
      if (locked) return; const i = Number(b.dataset.i), d = Number(b.dataset.d);
      if (d > 0 && left() === 0) { say('Il n’y a plus de jeton à partager.'); return; }
      if (d < 0 && c[i] === 0) return;
      c[i] += d; bad = []; render(); el.querySelector<HTMLElement>(`[data-i="${i}"][data-d="${d}"]`)?.focus();
    }));
    el.querySelector<HTMLButtonElement>('.sh-all')!.addEventListener('click', () => { if (locked || left() < k) return; for (let i = 0; i < k; i++) c[i]++; bad = []; render(); el.querySelector<HTMLElement>('.sh-all')?.focus(); });
    if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
  render();
  return { counts: () => [...c], left, lock: () => { locked = true; render(); }, showBad: (b: number[]) => { bad = b; render(); } };
}
