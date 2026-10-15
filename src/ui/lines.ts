/**
 * Opération posée « en lignes » (multiplication) : plusieurs cases-nombres alignées à droite, un seul pavé.
 * On touche une ligne, puis on tape. Chaque ligne est un nombre entier.
 */
export interface LineSpec { label: string; aria: string }
export function lineFields(el: HTMLElement, specs: LineSpec[], head: string, max = 7) {
  const v: string[] = specs.map(() => '');
  let act = 0, locked = false, bad: number[] = [];
  const f = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  function render() {
    el.innerHTML = `<div class="ln">${head}${specs.map((s, i) => `${i === specs.length - 1 && specs.length > 1 ? '<div class="ln-bar"></div>' : ''}<div class="ln-r"><span class="ln-l">${s.label}</span><button type="button" class="ln-f ${i === act && !locked ? 'act' : ''} ${bad.includes(i) ? 'bad' : ''}" data-i="${i}" aria-label="${s.aria}">${f(v[i])}</button></div>`).join('')}
      <div class="kp-keys co-kp">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" class="kp-k" data-key="${d}">${d}</button>`).join('')}<button type="button" class="kp-k kp-del" data-key="del" aria-label="Effacer">⌫</button><button type="button" class="kp-k" data-key="0">0</button></div></div>`;
    el.querySelectorAll<HTMLButtonElement>('.ln-f').forEach((b) => b.addEventListener('click', () => { if (!locked) { act = Number(b.dataset.i); render(); } }));
    el.querySelectorAll<HTMLButtonElement>('[data-key]').forEach((b) => b.addEventListener('click', () => press(b.dataset.key!)));
    if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
  function press(k: string) {
    if (locked) return;
    if (k === 'del') v[act] = v[act].slice(0, -1);
    else if (v[act].length < max) v[act] = v[act] === '0' ? k : v[act] + k;
    bad = bad.filter((x) => x !== act);
    render();
  }
  render();
  el.addEventListener('keydown', (e) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); });
  return {
    values: () => v.map((x) => (x === '' ? null : Number(x))),
    lock: () => { locked = true; render(); },
    showBad: (b: number[]) => { bad = b; render(); },
  };
}
