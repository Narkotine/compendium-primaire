/** Phrase à trous : le raisonnement s'écrit en mots (« 3 fois plus de pains, donc 3 fois plus cher »). Chaque trou est une case ; un seul pavé. */
export function sentence(el: HTMLElement, lines: string[], holes: number, max = 6) {
  const v: string[] = Array(holes).fill('');
  let act = 0, locked = false, bad: number[] = [];
  const f = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  function render() {
    el.innerHTML = `<div class="st">${lines.map((l) => `<p class="st-l">${l.replace(/\{(\d+)\}/g, (_, i) => `<button type="button" class="st-h ${Number(i) === act && !locked ? 'act' : ''} ${bad.includes(Number(i)) ? 'bad' : ''}" data-i="${i}" aria-label="Case ${Number(i) + 1}">${f(v[Number(i)])}</button>`)}</p>`).join('')}</div>
      <div class="kp-keys co-kp">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" class="kp-k" data-key="${d}">${d}</button>`).join('')}<button type="button" class="kp-k kp-del" data-key="del" aria-label="Effacer">⌫</button><button type="button" class="kp-k" data-key="0">0</button></div>`;
    el.querySelectorAll<HTMLButtonElement>('.st-h').forEach((b) => b.addEventListener('click', () => { if (!locked) { act = Number(b.dataset.i); render(); } }));
    el.querySelectorAll<HTMLButtonElement>('[data-key]').forEach((b) => b.addEventListener('click', () => press(b.dataset.key!)));
    if (locked) el.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
  function press(k: string) {
    if (locked) return;
    if (k === 'del') v[act] = v[act].slice(0, -1);
    else if (v[act].length < max) { v[act] = v[act] === '0' ? k : v[act] + k; }
    bad = bad.filter((x) => x !== act);
    render();
  }
  render();
  el.addEventListener('keydown', (e) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); });
  return { values: () => v.map((x) => (x === '' ? null : Number(x))), lock: () => { locked = true; render(); }, showBad: (b: number[]) => { bad = b; render(); } };
}
