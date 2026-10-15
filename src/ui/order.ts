/**
 * Rangement de cartes : glisser une carte sur une autre pour la mettre à sa place (doigt, souris),
 * ou boutons ↑ ↓ (clavier, lecteur d'écran). Renvoie l'ordre des index de départ.
 */
import { draggable, say } from './drag';

export function orderList(el: HTMLElement, labels: string[], hiLabel: string, loLabel: string) {
  let order = labels.map((_, i) => i);
  let locked = false;
  let bad: number[] = [];
  const move = (from: number, to: number) => {
    if (locked || to < 0 || to >= order.length || from === to) return;
    const [x] = order.splice(from, 1);
    order.splice(to, 0, x);
    bad = [];
    render();
    say(`${labels[x]} en position ${to + 1}.`);
  };
  function render() {
    el.innerHTML = `<div class="ord"><div class="ord-end">${hiLabel}</div><ol class="ord-l">${order.map((it, k) => `
      <li class="ord-it ${bad.includes(k) ? 'bad' : ''}" data-drop="slot" data-pos="${k}" data-item="${it}">
        <span class="ord-card" data-pos="${k}">${labels[it]}</span>
        <span class="ord-btns"><button type="button" class="ob" data-up="${k}" aria-label="Monter ${labels[it]}" ${k === 0 ? 'disabled' : ''}>↑</button><button type="button" class="ob" data-dn="${k}" aria-label="Descendre ${labels[it]}" ${k === order.length - 1 ? 'disabled' : ''}>↓</button></span>
      </li>`).join('')}</ol><div class="ord-end">${loLabel}</div></div>`;
    el.querySelectorAll<HTMLElement>('.ord-card').forEach((c) => draggable(c, { onDrop: (t) => move(Number(c.dataset.pos), Number(t.dataset.pos)) }));
    el.querySelectorAll<HTMLButtonElement>('[data-up]').forEach((b) => b.addEventListener('click', () => { const k = Number(b.dataset.up); move(k, k - 1); el.querySelector<HTMLButtonElement>(`[data-up="${Math.max(1, k - 1)}"]`)?.focus(); }));
    el.querySelectorAll<HTMLButtonElement>('[data-dn]').forEach((b) => b.addEventListener('click', () => { const k = Number(b.dataset.dn); move(k, k + 1); el.querySelector<HTMLButtonElement>(`[data-dn="${Math.min(order.length - 2, k + 1)}"]`)?.focus(); }));
    if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
  render();
  return { order: () => [...order], lock: () => { locked = true; render(); }, showBad: (b: number[]) => { bad = b; render(); } };
}
