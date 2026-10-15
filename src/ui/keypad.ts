/** Petit pavé numérique : 0–9 et effacer. Option virgule pour les décimaux (chapitre 6). Le clavier physique marche aussi. */
export function keypad(el: HTMLElement, label: string, max?: number): { value: () => number | null; raw: () => string; lock: () => void };
export function keypad(el: HTMLElement, label: string, max: number, opts: { comma: true; maxDec?: number }): { value: () => string | null; raw: () => string; lock: () => void };
export function keypad(el: HTMLElement, label: string, max = 5, opts?: { comma?: boolean; maxDec?: number }): { value: () => number | string | null; raw: () => string; lock: () => void } {
  let v = '';
  const comma = !!opts?.comma;
  const maxDec = opts?.maxDec ?? 3;
  const keys = comma
    ? `<button type="button" class="kp-k" data-k="1">1</button><button type="button" class="kp-k" data-k="2">2</button><button type="button" class="kp-k" data-k="3">3</button>
       <button type="button" class="kp-k" data-k="4">4</button><button type="button" class="kp-k" data-k="5">5</button><button type="button" class="kp-k" data-k="6">6</button>
       <button type="button" class="kp-k" data-k="7">7</button><button type="button" class="kp-k" data-k="8">8</button><button type="button" class="kp-k" data-k="9">9</button>
       <button type="button" class="kp-k kp-comma" data-k="," aria-label="Virgule">,</button><button type="button" class="kp-k" data-k="0">0</button><button type="button" class="kp-k kp-del" data-k="del" aria-label="Effacer">⌫</button>`
    : `${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" class="kp-k" data-k="${d}">${d}</button>`).join('')}
  <button type="button" class="kp-k kp-del" data-k="del" aria-label="Effacer">⌫</button><button type="button" class="kp-k" data-k="0">0</button>`;
  el.innerHTML = `<div class="kp${comma ? ' kp-dec' : ''}"><div class="kp-out" role="textbox" aria-readonly="true" aria-label="${label}" tabindex="0"><span class="kp-v"></span><span class="kp-caret"></span></div>
  <div class="kp-keys">${keys}</div></div>`;
  const out = el.querySelector<HTMLElement>('.kp-v')!;
  let locked = false;
  const display = (s: string) => {
    if (!comma) return s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
    const [a, b] = s.split(',');
    return (a ? a.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') : '') + (s.includes(',') ? ',' + (b ?? '') : '');
  };
  const set = (s: string) => { v = s; out.textContent = display(v); };
  const press = (k: string) => {
    if (locked) return;
    if (k === 'del') { set(v.slice(0, -1)); return; }
    if (k === ',') {
      if (!comma || v.includes(',') || v === '') return;
      set(v + ','); return;
    }
    if (comma) {
      const [a, b] = v.split(',');
      if (v.includes(',')) { if ((b ?? '').length < maxDec) set(v + k); }
      else if ((a || '').length < max) set(v === '0' ? k : v + k);
    } else if (v.length < max) set(v === '0' ? k : v + k);
  };
  el.querySelectorAll<HTMLButtonElement>('.kp-k').forEach((b) => b.addEventListener('click', () => press(b.dataset.k!)));
  el.querySelector('.kp-out')!.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (/^\d$/.test(k)) press(k);
    else if (k === 'Backspace') press('del');
    else if (comma && (k === ',' || k === '.')) press(',');
  });
  return {
    value: () => (v === '' || v === ',' ? null : comma ? v : Number(v)),
    raw: () => v,
    lock: () => { locked = true; el.querySelectorAll('button').forEach((b) => (b.disabled = true)); },
  };
}
