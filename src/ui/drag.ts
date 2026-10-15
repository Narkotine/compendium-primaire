/**
 * Glisser-déposer au doigt et à la souris (Pointer Events), avec repli « toucher puis toucher » et clavier.
 * Une source suit le doigt sous forme de fantôme ; la cible est l'élément [data-drop] sous le doigt.
 */
export interface DragOpts {
  onDrop(target: HTMLElement): void;
  /** toucher sans glisser */
  onTap?(): void;
}
let ghost: HTMLElement | null = null;

export function draggable(el: HTMLElement, o: DragOpts) {
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY;
    let moved = false;
    let over: HTMLElement | null = null;
    const r = el.getBoundingClientRect();
    try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
      if (!moved) {
        moved = true;
        ghost = el.cloneNode(true) as HTMLElement;
        ghost.classList.add('ghost');
        ghost.removeAttribute('id');
        Object.assign(ghost.style, { width: r.width + 'px', height: r.height + 'px' });
        document.body.appendChild(ghost);
        el.classList.add('dragging');
      }
      ghost!.style.transform = `translate(${ev.clientX - r.width / 2}px, ${ev.clientY - r.height / 2}px)`;
      const t = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-drop]') ?? null;
      if (t !== over) { over?.classList.remove('over'); t?.classList.add('over'); over = t; }
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      ghost?.remove(); ghost = null;
      el.classList.remove('dragging');
      over?.classList.remove('over');
      if (moved) { if (over) o.onDrop(over); } else o.onTap?.();
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
  // clavier : Entrée/Espace = toucher
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.onTap?.(); }
  });
}
export function say(msg: string) {
  const sr = document.getElementById('sr');
  if (sr) { sr.textContent = ''; setTimeout(() => (sr.textContent = msg), 30); }
}
