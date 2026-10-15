/**
 * Chapitre 9 — géométrie (léger) : figures, angles, symétrie, solides, repérage.
 */
import { rng } from '../../engine/rng';
import { type ExoType, type Level, type Palier } from '../../engine/types';
import { pickCards } from '../../ui/pick';
import { keypad } from '../../ui/keypad';

/* ---------- figures ---------- */
type Fig = 'carré' | 'rectangle' | 'triangle' | 'cercle' | 'losange';
const FIGS: { name: Fig; ok: (f: Fig) => boolean; why: string }[] = [
  { name: 'carré', ok: (f) => f === 'carré', why: '4 côtés égaux et 4 angles droits' },
  { name: 'rectangle', ok: (f) => f === 'rectangle' || f === 'carré', why: '4 angles droits (un carré est un rectangle particulier)' },
  { name: 'triangle', ok: (f) => f === 'triangle', why: '3 côtés' },
  { name: 'cercle', ok: (f) => f === 'cercle', why: 'tous les points à égale distance du centre' },
];
export interface FiData { lv: Level; p: Palier; ask: Fig; cards: { label: string; fig: Fig; tilted: boolean }[]; good: number[] }
export const figures: ExoType<FiData, number[]> = {
  id: 'figures', title: 'Reconnaître les figures', notion: 'Figures', levels: ['CE1', 'CE2', 'CM1'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const ask = r.pick(FIGS).name;
    const pool: Fig[] = ['carré', 'rectangle', 'triangle', 'cercle', 'losange'];
    const cards = r.shuffle(pool).slice(0, 4).map((fig) => ({ label: fig === 'carré' && r.next() < 0.5 ? 'carré penché' : fig, fig, tilted: fig === 'carré' && r.next() < 0.4 }));
    // ensure at least one good
    const def = FIGS.find((x) => x.name === ask)!;
    if (!cards.some((c) => def.ok(c.fig))) cards[0] = { label: ask === 'carré' ? 'carré penché' : ask, fig: ask, tilted: ask === 'carré' };
    const good = cards.map((c, i) => (def.ok(c.fig) ? i : -1)).filter((i) => i >= 0);
    return { lv, p, ask, cards, good };
  },
  solution: (d) => d.good,
  check(d, a) {
    const g = new Set(d.good), got = new Set(a);
    if (g.size === got.size && [...g].every((i) => got.has(i))) return { ok: true };
    const bad = a.filter((i) => !g.has(i));
    if (bad.length && d.cards[bad[0]].label.includes('penché') === false && d.ask === 'carré' && d.cards[bad[0]].fig !== 'carré')
      return { ok: false, bad, msg: `Ce n’est pas un carré.` };
    if (a.some((i) => d.cards[i].tilted) && d.ask === 'carré' && !a.includes(d.cards.findIndex((c) => c.tilted)))
      return { ok: false, msg: `Un carré penché reste un carré !` };
    if (bad.length) return { ok: false, bad, msg: d.cards[bad[0]].tilted && d.ask === 'carré' ? `Attends : un carré penché EST un carré.` : `Relis la définition : ${FIGS.find((x) => x.name === d.ask)!.why}.` };
    return { ok: false, bad: d.good.filter((i) => !got.has(i)), msg: `Il manque une figure. Pense aussi aux figures tournées.` };
  },
  hint: (d) => FIGS.find((x) => x.name === d.ask)!.why + '. Tourner ne change rien.',
  correction: (d) => `<p>Les ${d.ask}s : ${d.good.map((i) => d.cards[i].label).join(', ') || '(aucun)'}.</p><p>${FIGS.find((x) => x.name === d.ask)!.why}.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Quelles figures sont des <b>${d.ask}s</b> ? (touche toutes les bonnes)</p><div class="w-pk"></div>`;
    const pk = pickCards(el.querySelector('.w-pk')!, d.cards.map((c) => c.label));
    return { answer: () => pk.chosen(), ready: () => (pk.chosen().length ? null : 'Choisis au moins une carte.'), lock: () => pk.lock(), showBad: (b) => pk.showBad(b) };
  },
};

/* ---------- angle ---------- */
export interface AnData { lv: Level; p: Palier; cards: { t: string; ok: boolean }[] }
export const angle: ExoType<AnData, number[]> = {
  id: 'angle', title: 'Angle droit, perpendiculaire, parallèle', notion: 'Angles et droites', levels: ['CE2', 'CM1'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const all = [
      { t: 'Le coin d’une feuille de cahier', ok: true },
      { t: 'Deux rails de train qui ne se rencontrent pas', ok: false }, // parallèle, pas angle droit
      { t: 'La croix « + » formée par deux droites', ok: true },
      { t: 'L’ouverture d’un livre à plat (presque 180°)', ok: false },
      { t: 'Le coin d’une équerre', ok: true },
      { t: 'Deux côtés d’un triangle équilatéral', ok: false },
    ];
    // For p about parallel vs perpendicular questions - we ask "which show a right angle?"
    const cards = r.shuffle(all).slice(0, 4);
    if (!cards.some((c) => c.ok)) cards[0] = all[0];
    if (!cards.some((c) => !c.ok)) cards[1] = all[1];
    return { lv, p, cards };
  },
  solution: (d) => d.cards.map((c, i) => (c.ok ? i : -1)).filter((i) => i >= 0),
  check(d, a) {
    const g = new Set(angle.solution(d)), got = new Set(a);
    if (g.size === got.size && [...g].every((i) => got.has(i))) return { ok: true };
    const bad = a.filter((i) => !g.has(i));
    if (bad.length && /rail|parallèle|ne se rencontr/.test(d.cards[bad[0]].t))
      return { ok: false, bad, msg: `Des droites qui ne se rencontrent pas sont parallèles : pas d’angle droit entre elles.` };
    return { ok: false, bad: bad.length ? bad : [...g].filter((i) => !got.has(i)), msg: `Un angle droit a la forme du coin d’une feuille (équerre).` };
  },
  hint: () => `Cherche la forme du coin d’une feuille, ou d’une équerre.`,
  correction: (d) => `<p>Angles droits : ${angle.solution(d).map((i) => d.cards[i].t).join(' ; ')}.</p>`,
  mount(el, d) {
    el.innerHTML = `<p class="q">Quelles situations montrent un <b>angle droit</b> ?</p><div class="w-pk"></div>`;
    const pk = pickCards(el.querySelector('.w-pk')!, d.cards.map((c) => c.t));
    return { answer: () => pk.chosen(), ready: () => (pk.chosen().length ? null : 'Choisis au moins une carte.'), lock: () => pk.lock(), showBad: (b) => pk.showBad(b) };
  },
};

/* ---------- symetrie ---------- */
export interface SyData { lv: Level; p: Palier; cells: boolean[][]; axis: 'V' | 'H'; missing: [number, number][] }
export const symetrie: ExoType<SyData, [number, number][]> = {
  id: 'symetrie', title: 'Compléter une symétrie', notion: 'Symétrie axiale', levels: ['CE2', 'CM1'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const N = 6;
    const axis: 'V' | 'H' = r.next() < 0.5 ? 'V' : 'H';
    const cells = Array.from({ length: N }, () => Array(N).fill(false) as boolean[]);
    // paint a few cells on one side
    const painted: [number, number][] = [];
    const count = r.int(2, p === 3 ? 5 : 3);
    while (painted.length < count) {
      const i = r.int(0, N - 1), j = axis === 'V' ? r.int(0, 2) : r.int(0, N - 1);
      const jj = axis === 'V' ? j : r.int(0, 2);
      const ii = axis === 'V' ? i : j;
      const x = axis === 'V' ? ii : jj, y = axis === 'V' ? jj : ii;
      if (cells[x][y]) continue;
      cells[x][y] = true; painted.push([x, y]);
    }
    // mirrors that should exist
    const missing: [number, number][] = painted.map(([i, j]) => axis === 'V' ? [i, N - 1 - j] as [number, number] : [N - 1 - i, j] as [number, number]);
    // at palier 1, show nothing on the other side; at p2/3 leave all missing
    return { lv, p, cells, axis, missing };
  },
  solution: (d) => d.missing,
  check(d, a) {
    const key = (p: [number, number]) => `${p[0]},${p[1]}`;
    const g = new Set(d.missing.map(key)), got = new Set(a.map(key));
    if (g.size === got.size && [...g].every((k) => got.has(k))) return { ok: true };
    const extra = a.filter((p) => !g.has(key(p)));
    if (extra.length) return { ok: false, msg: `Une case de trop. Chaque point a un jumeau à la même distance de l’autre côté de l’axe.` };
    return { ok: false, msg: `Il manque des cases. Compte les cases depuis l’axe, de chaque côté.` };
  },
  hint: (d) => `L’axe est ${d.axis === 'V' ? 'vertical' : 'horizontal'}. Pour chaque case coloriée, colorie son jumeau.`,
  correction: (d) => `<p>Cases à colorier : ${d.missing.map(([i, j]) => `(${i + 1},${j + 1})`).join(', ')}.</p>`,
  mount(el, d) {
    const N = d.cells.length;
    const mid = N / 2;
    let on = d.missing.map(() => false);
    // user toggles missing cells only (the ones to complete); show given cells locked
    el.innerHTML = `<p class="q">Complète la figure pour qu’elle soit symétrique par rapport à l’axe ${d.axis === 'V' ? 'vertical' : 'horizontal'}.</p>
      <div class="sy" style="--n:${N}" role="grid">${d.cells.map((row, i) => row.map((c, j) => {
        const isMiss = d.missing.some(([x, y]) => x === i && y === j);
        // axis line between mid-1 and mid
        return `<button type="button" class="sy-c ${c ? 'on given' : ''} ${isMiss ? 'miss' : ''}" data-i="${i}" data-j="${j}" ${c ? 'disabled' : ''} aria-label="Case ${i + 1},${j + 1}"></button>`;
      }).join('')).join('')}</div>
      <p class="tip">Touche les cases vides du bon côté pour colorier le jumeau.</p>`;
    // draw axis via CSS border on middle
    const grid = el.querySelector('.sy') as HTMLElement;
    if (d.axis === 'V') grid.style.boxShadow = `inset ${mid * 36}px 0 0 0 transparent`; // handled in css with data-axis
    grid.dataset.axis = d.axis;
    const missIdx = (i: number, j: number) => d.missing.findIndex(([x, y]) => x === i && y === j);
    el.querySelectorAll<HTMLButtonElement>('.sy-c.miss').forEach((b) => b.addEventListener('click', () => {
      const k = missIdx(Number(b.dataset.i), Number(b.dataset.j));
      if (k < 0) return;
      on[k] = !on[k];
      b.classList.toggle('on', on[k]);
    }));
    // Also allow clicking wrong empty cells — track extras
    const extras: [number, number][] = [];
    el.querySelectorAll<HTMLButtonElement>('.sy-c:not(.given):not(.miss)').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.i), j = Number(b.dataset.j);
      const k = extras.findIndex(([x, y]) => x === i && y === j);
      if (k >= 0) { extras.splice(k, 1); b.classList.remove('on'); }
      else { extras.push([i, j]); b.classList.add('on'); }
    }));
    return {
      answer: () => [...d.missing.filter((_, k) => on[k]), ...extras],
      ready: () => (on.some(Boolean) || extras.length ? null : 'Colorie au moins une case.'),
      lock: () => el.querySelectorAll('button').forEach((b) => (b.disabled = true)),
    };
  },
};

/* ---------- solides ---------- */
export interface SoData { lv: Level; p: Palier; ask: 'faces' | 'aretes' | 'sommets' | 'nom'; solid: string; answer: number | string; cards?: string[] }
const SOLIDS: Record<string, { faces: number; aretes: number; sommets: number }> = {
  cube: { faces: 6, aretes: 12, sommets: 8 },
  pavé: { faces: 6, aretes: 12, sommets: 8 },
  'pyramide à base carrée': { faces: 5, aretes: 8, sommets: 5 },
};
export const solides: ExoType<SoData, number | string | number[]> = {
  id: 'solides', title: 'Compter sur un solide', notion: 'Solides', levels: ['CE2', 'CM1'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const solid = r.pick(Object.keys(SOLIDS));
    const ask = r.pick(p === 3 ? (['faces', 'aretes', 'sommets', 'nom'] as const) : (['faces', 'aretes', 'sommets'] as const));
    if (ask === 'nom') {
      const cards = r.shuffle(['cube', 'pavé', 'pyramide à base carrée', 'cylindre']).slice(0, 4);
      if (!cards.includes(solid)) cards[0] = solid;
      return { lv, p, ask, solid, answer: solid, cards };
    }
    return { lv, p, ask, solid, answer: SOLIDS[solid][ask === 'aretes' ? 'aretes' : ask] };
  },
  solution: (d) => (d.ask === 'nom' ? [d.cards!.indexOf(d.solid as string)] : d.answer),
  check(d, a) {
    if (d.ask === 'nom') {
      const got = a as number[];
      if (got.length === 1 && d.cards![got[0]] === d.solid) return { ok: true };
      return { ok: false, bad: got, msg: `Regarde le nombre et la forme des faces.` };
    }
    if (a === d.answer) return { ok: true };
    if (d.ask === 'faces' && a === SOLIDS[d.solid].aretes) return { ok: false, msg: `Tu as peut-être compté les arêtes. Les faces, ce sont les « côtés plats ».` };
    if (d.ask === 'aretes' && a === SOLIDS[d.solid].faces) return { ok: false, msg: `Tu as compté les faces. Les arêtes sont les segments où deux faces se rejoignent.` };
    return { ok: false, msg: `Pour un ${d.solid} : ${SOLIDS[d.solid].faces} faces, ${SOLIDS[d.solid].aretes} arêtes, ${SOLIDS[d.solid].sommets} sommets.` };
  },
  hint: (d) => d.ask === 'nom' ? `Compte les faces et regarde leur forme.` : `Un cube a 6 faces carrées, 12 arêtes, 8 sommets. Compare.`,
  correction: (d) => d.ask === 'nom' ? `<p>C’est un <b>${d.solid}</b>.</p>` : `<p>Un ${d.solid} a <b>${d.answer}</b> ${d.ask === 'aretes' ? 'arêtes' : d.ask}.</p>`,
  mount(el, d) {
    if (d.ask === 'nom') {
      el.innerHTML = `<p class="q">Ce solide a ${SOLIDS[d.solid].faces} faces, ${SOLIDS[d.solid].aretes} arêtes, ${SOLIDS[d.solid].sommets} sommets. Lequel est-ce ?</p><div class="w-pk"></div>`;
      const pk = pickCards(el.querySelector('.w-pk')!, d.cards!);
      return { answer: () => pk.chosen(), lock: () => pk.lock(), showBad: (b) => pk.showBad(b) };
    }
    const label = d.ask === 'aretes' ? 'arêtes' : d.ask;
    el.innerHTML = `<p class="q">Combien de <b>${label}</b> a un <b>${d.solid}</b> ?</p><div class="w-kp"></div>`;
    const k = keypad(el.querySelector('.w-kp')!, 'Nombre', 2);
    return { answer: () => k.value(), lock: () => k.lock() };
  },
};

/* ---------- repere ---------- */
export interface ReData { lv: Level; p: Palier; path: ('N' | 'S' | 'E' | 'O')[]; start: [number, number]; end: [number, number] }
export const repere: ExoType<ReData, [number, number]> = {
  id: 'repere', title: 'Se déplacer sur un quadrillage', notion: 'Repérage', levels: ['CE1', 'CE2'],
  generate(lv, p, seed) {
    const r = rng(seed);
    const N = 5;
    let x = r.int(1, 3), y = r.int(1, 3);
    const start: [number, number] = [x, y];
    const path: ('N' | 'S' | 'E' | 'O')[] = [];
    const steps = r.int(2, p === 3 ? 4 : 3);
    const dirs: ('N' | 'S' | 'E' | 'O')[] = ['N', 'S', 'E', 'O'];
    for (let i = 0; i < steps; i++) {
      const d = r.pick(dirs);
      const nx = x + (d === 'E' ? 1 : d === 'O' ? -1 : 0);
      const ny = y + (d === 'N' ? 1 : d === 'S' ? -1 : 0);
      if (nx < 0 || nx >= N || ny < 0 || ny >= N) { i--; continue; }
      path.push(d); x = nx; y = ny;
    }
    return { lv, p, path, start, end: [x, y] };
  },
  solution: (d) => d.end,
  check(d, a) {
    if (a[0] === d.end[0] && a[1] === d.end[1]) return { ok: true };
    return { ok: false, msg: `Repars du départ et suis chaque instruction : N = haut, S = bas, E = droite, O = gauche.` };
  },
  hint: (d) => `Départ : colonne ${d.start[0] + 1}, rangée ${d.start[1] + 1}. Puis : ${d.path.join(', ')}.`,
  correction: (d) => `<p>Arrivée : colonne <b>${d.end[0] + 1}</b>, rangée <b>${d.end[1] + 1}</b>.</p>`,
  mount(el, d) {
    const N = 5;
    let sel: [number, number] | null = null;
    const words = d.path.map((x) => ({ N: 'haut', S: 'bas', E: 'droite', O: 'gauche' }[x])).join(', puis ');
    el.innerHTML = `<p class="q">Départ en ★. Suis : <b>${words}</b>. Où arrives-tu ?</p>
      <div class="sy" style="--n:${N}" role="grid">${[...Array(N)].map((_, i) => [...Array(N)].map((_, j) => {
        // display: row 0 at top = y = N-1
        const y = N - 1 - i, x = j;
        const isStart = x === d.start[0] && y === d.start[1];
        return `<button type="button" class="sy-c ${isStart ? 'start' : ''}" data-x="${x}" data-y="${y}" aria-label="Colonne ${x + 1}, rangée ${y + 1}">${isStart ? '★' : ''}</button>`;
      }).join('')).join('')}</div>`;
    el.querySelectorAll<HTMLButtonElement>('.sy-c').forEach((b) => b.addEventListener('click', () => {
      el.querySelectorAll('.sy-c.sel').forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel');
      sel = [Number(b.dataset.x), Number(b.dataset.y)];
    }));
    return { answer: () => sel, ready: () => (sel ? null : 'Touche la case d’arrivée.'), lock: () => el.querySelectorAll('button').forEach((b) => (b.disabled = true)) };
  },
};
