export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Minuscule sans accents, longueur conservée (1 caractère → 1 caractère) pour surligner les résultats. */
const FOLD: Record<string, string> = {
  à: 'a', â: 'a', ä: 'a', á: 'a', ã: 'a', å: 'a', ç: 'c', é: 'e', è: 'e', ê: 'e', ë: 'e', î: 'i', ï: 'i', í: 'i', ì: 'i',
  ô: 'o', ö: 'o', ó: 'o', ò: 'o', õ: 'o', ù: 'u', û: 'u', ü: 'u', ú: 'u', ÿ: 'y', ñ: 'n', '’': "'", 'ʼ': "'",
};
export const fold = (s: string) => s.toLowerCase().replace(/[àâäáãåçéèêëîïíìôöóòõùûüúÿñ’ʼ]/g, (c) => FOLD[c] ?? c);

export function throttle<T extends unknown[]>(fn: (...a: T) => void, ms: number) {
  let t = 0;
  let timer: number | undefined;
  return (...a: T) => {
    const now = performance.now();
    clearTimeout(timer);
    if (now - t >= ms) {
      t = now;
      fn(...a);
    } else timer = window.setTimeout(() => {
      t = performance.now();
      fn(...a);
    }, ms - (now - t));
  };
}

export function toast(msg: string, action?: { label: string; run: () => void }, ms = 4500) {
  const box = document.getElementById('toasts')!;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${esc(msg)}</span>`;
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'toast-btn';
    b.textContent = action.label;
    b.onclick = () => {
      action.run();
      el.remove();
    };
    el.appendChild(b);
  }
  box.appendChild(el);
  if (!action) setTimeout(() => el.remove(), ms);
  return el;
}
