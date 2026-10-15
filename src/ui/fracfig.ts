/**
 * Figures de fractions (SVG, dessinées par le code) : bande, disque, rectangle quadrillé.
 * `cuts` : positions des coupes (0..1) pour la bande — parts inégales possibles ; `shade` : indices des parts grisées.
 */
export type Shape = 'bande' | 'disque' | 'rect';
export function fracFig(shape: Shape, b: number, shade: number[], o: { cuts?: number[]; w?: number; label?: string } = {}) {
  const W = o.w ?? 300;
  const sh = new Set(shade);
  if (shape === 'disque') {
    const R = 70, C = 80;
    const cuts = o.cuts ?? Array.from({ length: b + 1 }, (_, i) => i / b);
    let s = '';
    for (let i = 0; i < b; i++) {
      const a0 = cuts[i] * 2 * Math.PI - Math.PI / 2, a1 = cuts[i + 1] * 2 * Math.PI - Math.PI / 2;
      const p0 = [C + R * Math.cos(a0), C + R * Math.sin(a0)], p1 = [C + R * Math.cos(a1), C + R * Math.sin(a1)];
      const large = a1 - a0 > Math.PI ? 1 : 0;
      s += b === 1 ? `<circle cx="${C}" cy="${C}" r="${R}" class="ff-p ${sh.has(i) ? 'on' : ''}"/>` : `<path d="M${C} ${C} L${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${R} ${R} 0 ${large} 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Z" class="ff-p ${sh.has(i) ? 'on' : ''}"/>`;
    }
    return `<svg class="ff" viewBox="0 0 160 160" width="140" height="140" role="img" aria-label="${o.label ?? 'Disque partagé'}">${s}</svg>`;
  }
  if (shape === 'rect') {
    const cols = b <= 3 ? b : b % 4 === 0 && b > 4 ? 4 : b % 3 === 0 ? 3 : b % 2 === 0 ? b / 2 : b;
    const rows = b / cols;
    const cw = 34, chh = 34;
    let s = '';
    for (let i = 0; i < b; i++) { const r = Math.floor(i / cols), c = i % cols; s += `<rect x="${2 + c * cw}" y="${2 + r * chh}" width="${cw}" height="${chh}" class="ff-p ${sh.has(i) ? 'on' : ''}"/>`; }
    return `<svg class="ff" viewBox="0 0 ${cols * cw + 4} ${rows * chh + 4}" width="${cols * cw + 4}" height="${rows * chh + 4}" role="img" aria-label="${o.label ?? 'Rectangle partagé'}">${s}</svg>`;
  }
  const cuts = o.cuts ?? Array.from({ length: b + 1 }, (_, i) => i / b);
  const H = 50;
  let s = '';
  for (let i = 0; i < b; i++) s += `<rect x="${(2 + cuts[i] * (W - 4)).toFixed(1)}" y="2" width="${((cuts[i + 1] - cuts[i]) * (W - 4)).toFixed(1)}" height="${H}" class="ff-p ${sh.has(i) ? 'on' : ''}"/>`;
  return `<svg class="ff" viewBox="0 0 ${W} ${H + 4}" width="${W}" height="${H + 4}" role="img" aria-label="${o.label ?? 'Bande partagée'}">${s}</svg>`;
}
