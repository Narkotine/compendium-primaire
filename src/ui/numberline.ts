/**
 * Demi-droite graduée : 10 intervalles, quelques graduations étiquetées, un curseur à placer sur une graduation.
 * Doigt/souris : toucher la droite ou glisser le curseur (aimanté). Clavier : flèches ← →, ou boutons.
 */
import { say } from './drag';

export function numberLine(el: HTMLElement, o: { ticks: number; labels: Record<number, string>; marked?: number }) {
  const N = o.ticks; // nombre d'intervalles
  let pos: number | null = null;
  let locked = false;
  const W = 340, X0 = 20, X1 = 320, dx = (X1 - X0) / N;
  const x = (k: number) => X0 + k * dx;
  el.innerHTML = `<div class="nl"><svg class="nl-svg" viewBox="0 0 ${W} 110" role="slider" tabindex="0" aria-label="Demi-droite graduée : place le curseur" aria-valuemin="0" aria-valuemax="${N}" aria-valuenow="0">
    <line x1="${X0 - 12}" y1="50" x2="${X1 + 14}" y2="50" class="nl-axis"/><path d="M${X1 + 14} 44 L${X1 + 22} 50 L${X1 + 14} 56" class="nl-axis" fill="none"/>
    ${Array.from({ length: N + 1 }, (_, k) => `<line x1="${x(k)}" y1="${o.labels[k] !== undefined ? 38 : 42}" x2="${x(k)}" y2="${o.labels[k] !== undefined ? 62 : 58}" class="nl-tick"/>${o.labels[k] !== undefined ? `<text x="${x(k)}" y="86" class="nl-lab">${o.labels[k]}</text>` : ''}`).join('')}
    ${o.marked !== undefined ? `<circle cx="${x(o.marked)}" cy="50" r="7" class="nl-mark"/><text x="${x(o.marked)}" y="24" class="nl-q">?</text>` : ''}
    <g class="nl-cur" visibility="hidden"><path d="M0 46 L-11 22 L11 22 Z"/><circle r="22" cy="20" fill="transparent"/></g>
  </svg><div class="nl-btns"><button type="button" class="ob" data-d="-1" aria-label="Curseur à gauche">←</button><span class="nl-help">Touche la droite pour placer la flèche.</span><button type="button" class="ob" data-d="1" aria-label="Curseur à droite">→</button></div></div>`;
  const svg = el.querySelector<SVGSVGElement>('svg')!;
  const cur = el.querySelector<SVGGElement>('.nl-cur')!;
  const set = (k: number) => {
    if (locked) return;
    pos = Math.max(0, Math.min(N, k));
    cur.setAttribute('visibility', 'visible');
    cur.setAttribute('transform', `translate(${x(pos)} 0)`);
    svg.setAttribute('aria-valuenow', String(pos));
    svg.setAttribute('aria-valuetext', `graduation ${pos}`);
  };
  const fromEvent = (e: PointerEvent) => {
    const r = svg.getBoundingClientRect();
    return Math.round(((e.clientX - r.left) * (W / r.width) - X0) / dx);
  };
  svg.style.touchAction = 'none';
  svg.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    set(fromEvent(e));
    try { svg.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const mv = (ev: PointerEvent) => set(fromEvent(ev));
    const up = () => { svg.removeEventListener('pointermove', mv); svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', up); };
    svg.addEventListener('pointermove', mv); svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  });
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); set((pos ?? -1) + (e.key === 'ArrowRight' ? 1 : -1)); say(`graduation ${pos}`); }
  });
  el.querySelectorAll<HTMLButtonElement>('[data-d]').forEach((b) => b.addEventListener('click', () => set((pos ?? (Number(b.dataset.d) > 0 ? -1 : 1)) + Number(b.dataset.d))));
  return {
    pos: () => pos,
    lock: () => { locked = true; el.querySelectorAll('button').forEach((b) => (b.disabled = true)); },
    showAt: (k: number, cls: string) => { svg.insertAdjacentHTML('beforeend', `<circle cx="${x(k)}" cy="50" r="8" class="${cls}"/>`); },
  };
}
