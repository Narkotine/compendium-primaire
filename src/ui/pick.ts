/** Cartes à cocher (toucher pour choisir / enlever). */
export function pickCards(el: HTMLElement, labels: string[]) {
  const on = labels.map(() => false);
  let locked = false, bad: number[] = [];
  function render() {
    el.innerHTML = `<div class="pk">${labels.map((l, i) => `<button type="button" class="tok pk-c ${on[i] ? 'sel' : ''} ${bad.includes(i) ? 'bad' : ''}" aria-pressed="${on[i]}" data-i="${i}">${l}</button>`).join('')}</div>`;
    el.querySelectorAll<HTMLButtonElement>('.pk-c').forEach((b) => b.addEventListener('click', () => { if (locked) return; const i = Number(b.dataset.i); on[i] = !on[i]; bad = bad.filter((x) => x !== i); render(); el.querySelector<HTMLElement>(`[data-i="${i}"]`)?.focus(); }));
    if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
  render();
  return { chosen: () => on.map((x, i) => (x ? i : -1)).filter((i) => i >= 0), lock: () => { locked = true; render(); }, showBad: (b: number[]) => { bad = b; render(); } };
}
