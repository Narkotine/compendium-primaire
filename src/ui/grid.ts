/** Quadrillage r rangées × c colonnes (SVG), avec un trait tous les 5 pour aider à compter. */
export function gridSvg(r: number, c: number, opts: { cut?: number } = {}) {
  const s = Math.min(28, Math.floor(300 / Math.max(c, 1)));
  const w = c * s + 4, h = r * s + 4;
  let b = '';
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) b += `<rect x="${2 + j * s}" y="${2 + i * s}" width="${s}" height="${s}" class="gr-c${opts.cut !== undefined && j >= opts.cut ? ' gr-b' : ''}"/>`;
  for (let j = 5; j < c; j += 5) b += `<line x1="${2 + j * s}" y1="0" x2="${2 + j * s}" y2="${h}" class="gr-5"/>`;
  for (let i = 5; i < r; i += 5) b += `<line x1="0" y1="${2 + i * s}" x2="${w}" y2="${2 + i * s}" class="gr-5"/>`;
  if (opts.cut !== undefined) b += `<line x1="${2 + opts.cut * s}" y1="0" x2="${2 + opts.cut * s}" y2="${h}" class="gr-cut"/>`;
  return `<svg class="gr" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Un rectangle de ${r} rangées de ${c} carreaux">${b}</svg>`;
}
