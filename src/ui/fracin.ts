/** Saisie d'une fraction (numérateur sur dénominateur), éventuellement précédée d'un entier « 2 + ». Un seul pavé. */
export function fracInput(el: HTMLElement, o: { whole?: boolean; fixedDen?: number; fixedNum?: number; label?: string } = {}) {
  const keys = ['w', 'n', 'd'].filter((k) => (k !== 'w' || o.whole) && !(k === 'd' && o.fixedDen) && !(k === 'n' && o.fixedNum));
  const v: Record<string, string> = { w: '', n: o.fixedNum ? String(o.fixedNum) : '', d: o.fixedDen ? String(o.fixedDen) : '' };
  let act = keys[0], locked = false, bad: string[] = [];
  const box = (k: string, aria: string) => (keys.includes(k) ? `<button type="button" class="fi-b ${act === k && !locked ? 'act' : ''} ${bad.includes(k) ? 'bad' : ''}" data-k="${k}" aria-label="${aria}">${v[k]}</button>` : `<span class="fi-fixed">${v[k]}</span>`);
  function render() {
    el.innerHTML = `<div class="fi">${o.label ? `<span class="fi-lab">${o.label}</span>` : ''}${o.whole ? `${box('w', 'Nombre entier')}<span class="fi-plus">+</span>` : ''}<span class="fi-frac">${box('n', 'Numérateur (en haut)')}<span class="fi-bar"></span>${box('d', 'Dénominateur (en bas)')}</span></div>
      <div class="kp-keys co-kp">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" class="kp-k" data-key="${d}">${d}</button>`).join('')}<button type="button" class="kp-k kp-del" data-key="del" aria-label="Effacer">⌫</button><button type="button" class="kp-k" data-key="0">0</button></div>`;
    el.querySelectorAll<HTMLButtonElement>('.fi-b').forEach((b) => b.addEventListener('click', () => { if (!locked) { act = b.dataset.k!; render(); } }));
    el.querySelectorAll<HTMLButtonElement>('[data-key]').forEach((b) => b.addEventListener('click', () => press(b.dataset.key!)));
    if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
  function press(k: string) {
    if (locked) return;
    if (k === 'del') v[act] = v[act].slice(0, -1);
    else if (v[act].length < 3) { v[act] = v[act] === '0' ? k : v[act] + k; }
    bad = bad.filter((x) => x !== act);
    render();
  }
  render();
  el.addEventListener('keydown', (e) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { const i = keys.indexOf(act); act = keys[(i + (e.key === 'ArrowDown' ? 1 : keys.length - 1)) % keys.length]; render(); } });
  const num = (k: string) => (v[k] === '' ? null : Number(v[k]));
  return {
    value: (): { w: number; n: number; d: number } | null => { const n = num('n'), d = num('d'), w = o.whole ? num('w') : 0; return n === null || d === null || w === null ? null : { w, n, d }; },
    lock: () => { locked = true; render(); },
    /** 0 = entier, 1 = numérateur, 2 = dénominateur */
    showBad: (b: number[]) => { bad = b.map((i) => ['w', 'n', 'd'][i]); render(); },
  };
}
