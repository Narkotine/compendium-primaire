/** Petit pavé numérique : 0–9 et effacer. Le clavier physique marche aussi (chiffres, Retour arrière). */
export function keypad(el: HTMLElement, label: string, max = 5) {
  let v = '';
  el.innerHTML = `<div class="kp"><div class="kp-out" role="textbox" aria-readonly="true" aria-label="${label}" tabindex="0"><span class="kp-v"></span><span class="kp-caret"></span></div>
  <div class="kp-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" class="kp-k" data-k="${d}">${d}</button>`).join('')}
  <button type="button" class="kp-k kp-del" data-k="del" aria-label="Effacer">⌫</button><button type="button" class="kp-k" data-k="0">0</button></div></div>`;
  const out = el.querySelector<HTMLElement>('.kp-v')!;
  let locked = false;
  const set = (s: string) => { v = s; out.textContent = v.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f'); };
  const press = (k: string) => {
    if (locked) return;
    if (k === 'del') set(v.slice(0, -1));
    else if (v.length < max) set(v === '0' ? k : v + k);
  };
  el.querySelectorAll<HTMLButtonElement>('.kp-k').forEach((b) => b.addEventListener('click', () => press(b.dataset.k!)));
  el.querySelector('.kp-out')!.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (/^\d$/.test(k)) press(k);
    else if (k === 'Backspace') press('del');
  });
  return {
    value: () => (v === '' ? null : Number(v)),
    lock: () => { locked = true; el.querySelectorAll('button').forEach((b) => (b.disabled = true)); },
  };
}
