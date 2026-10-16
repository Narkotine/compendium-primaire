import '@fontsource/atkinson-hyperlegible-next/400.css';
import '@fontsource/atkinson-hyperlegible-next/700.css';
import './styles/base.css';
import './styles/app.css';
import { COURS } from './content/cours';
import { CHAPTERS } from './content/chapters';
import { EXOS } from './exos';
import { type Level, type Palier, type Mounted } from './engine/types';
import { newSeed } from './engine/rng';
import { getSettings, setSettings, applySettings, getMastery, stars, record, palierFor, dueList, isDue, GOAL, type Theme } from './store';
import { setupPWA, hardReset } from './pwa';
import { esc } from './util';

const app = document.getElementById('app')!;
const starStr = (n: number) => `<span class="stars" aria-label="${n} étoile${n > 1 ? 's' : ''} sur 3">${'★'.repeat(n)}<span class="off">${'★'.repeat(3 - n)}</span></span>`;
const lvTag = (l: string) => `<span class="lv lv-${l}">${l}</span>`;
let timer: number | undefined;

function shell(title: string, body: string, back?: string) {
  clearInterval(timer);
  app.innerHTML = `<header class="bar">${back ? `<a class="ib" href="${back}" aria-label="Retour">←</a>` : '<span class="logo" aria-hidden="true"></span>'}
    <h1 class="bar-t">${title}</h1><a class="ib" href="#/sommaire" aria-label="Sommaire" title="Sommaire">☰</a><a class="ib" href="#/reglages" aria-label="Réglages">⚙</a></header>
    <main id="main" tabindex="-1">${body}</main>`;
  scrollTo(0, 0);
}
function exoRows(ids: string[]) {
  return ids.map((id) => EXOS[id]).map((e) => `<div class="exo-row"><div class="exo-t">${e.title}<small>${e.notion}</small></div><div class="exo-lv">${e.levels.map((l: Level) =>
    `<a class="btn-lv" href="#/exo/${e.id}/${l}">${lvTag(l)} ${starStr(stars(getMastery(e.id, l)))}${isDue(getMastery(e.id, l)) ? '<span class="due" title="À réviser">↻</span>' : ''}</a>`).join('')}</div></div>`).join('');
}
/** Parties du cours (titres h2) : texte sans badges + badges de niveau. */
function sections(slug: string) {
  const out: { t: string; lv: string[] }[] = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>/g; let m: RegExpExecArray | null;
  while ((m = re.exec(COURS[slug] ?? ''))) {
    const lv = [...m[1].matchAll(/lv-([A-Za-z0-9]+)/g)].map((x) => x[1]);
    const d = document.createElement('div'); d.innerHTML = m[1].replace(/<span class="lv[^"]*">[^<]*<\/span>/g, '');
    out.push({ t: (d.textContent ?? '').trim(), lv });
  }
  return out;
}
function sommaire() {
  shell('Sommaire', `<p class="small muted">Touche un titre pour aller directement au cours ou à l’exercice.</p>
    <nav aria-label="Sommaire">${CHAPTERS.map((c) => `<section class="card som" id="som-${c.slug}">
    <h2><span class="ch-n">${c.n}</span> <a href="#/cours/${c.slug}">${c.title}</a></h2>
    <h3>📖 Le cours</h3><ol class="som-l">${sections(c.slug).map((x, i) => `<li><a class="som-a" href="#/cours/${c.slug}/${i + 1}">${esc(x.t)} ${x.lv.map(lvTag).join(' ')}</a></li>`).join('')}</ol>
    <h3>✏️ Les exercices</h3><ul class="som-l som-x">${c.exos.map((id) => EXOS[id]).map((e) => `<li><span class="som-xt">${e.title}</span><span class="som-lv">${e.levels.map((l: Level) => `<a class="btn-lv" href="#/exo/${e.id}/${l}" aria-label="${esc(e.title)}, niveau ${l}">${lvTag(l)}</a>`).join('')}</span></li>`).join('')}</ul>
    </section>`).join('')}</nav>`, '#/');
}
function home() {
  const due = dueList();
  shell('Maths Primaire', `<a class="btn som-btn" href="#/sommaire">☰ Sommaire : tous les chapitres</a>${due.length ? `<section class="card due-card"><h2>↻ À réviser aujourd’hui</h2><p class="small">Tu avais réussi ces exercices. On vérifie que tu t’en souviens.</p><div class="due-l">${due.map((x) => `<a class="btn-lv" href="#/exo/${x.exo}/${x.lv}">${EXOS[x.exo]?.title ?? x.exo} ${lvTag(x.lv)}</a>`).join('')}</div></section>` : ''}
    ${CHAPTERS.map((c) => `<section class="card ch">
    <h2><span class="ch-n">${c.n}</span> ${c.title}</h2>
    <ol class="notions">${c.notions.map((n) => `<li>${n.t} ${n.lv.map(lvTag).join(' ')}</li>`).join('')}</ol>
    <a class="btn" href="#/cours/${c.slug}">Lire le cours</a>
    <h3>S’entraîner</h3>${exoRows(c.exos)}</section>`).join('')}
    <p class="small muted">★ tu as essayé · ★★ ${GOAL} bonnes réponses de suite du premier coup · ★★★ encore réussi à la révision d’une semaine. Tout est ouvert : commence où tu veux.</p>`);
}
function cours(slug: string, part?: number) {
  const c = CHAPTERS.find((x) => x.slug === slug);
  if (!c) return home();
  shell(c.short, `<article class="prose">${COURS[slug] ?? ''}</article><section class="card" id="exos"><h2>S’entraîner</h2>${exoRows(c.exos)}</section>`, '#/sommaire');
  app.querySelectorAll('.prose h2').forEach((h, i) => { h.id = `p${i + 1}`; });
  if (part) { const go = () => app.querySelector<HTMLElement>(`#p${part}`)?.scrollIntoView({ block: 'start' }); requestAnimationFrame(go); app.querySelectorAll('.prose img').forEach((im) => im.addEventListener('load', go, { once: true })); setTimeout(go, 350); }
}
function reglages() {
  const s = getSettings();
  const opt = (v: Theme, t: string) => `<label class="opt"><input type="radio" name="th" value="${v}" ${s.theme === v ? 'checked' : ''}> ${t}</label>`;
  shell('Réglages', `<section class="card"><h2>Thème</h2>${opt('auto', 'Comme l’appareil')}${opt('light', 'Clair')}${opt('dark', 'Sombre')}</section>
    <section class="card"><h2>Chronomètre</h2><label class="opt"><input type="checkbox" id="chrono" ${s.chrono ? 'checked' : ''}> Afficher le temps pendant les exercices</label><p class="small muted">Désactivé au départ. Le temps ne compte jamais pour les étoiles.</p></section>
    <section class="card"><h2>Application</h2><button type="button" class="btn btn-2" id="reset">Forcer la mise à jour</button></section>`, '#/');
  app.querySelectorAll<HTMLInputElement>('input[name=th]').forEach((i) => i.addEventListener('change', () => setSettings({ theme: i.value as Theme })));
  app.querySelector<HTMLInputElement>('#chrono')!.addEventListener('change', (e) => setSettings({ chrono: (e.target as HTMLInputElement).checked }));
  app.querySelector('#reset')!.addEventListener('click', () => void hardReset());
}

function exo(id: string, lv: Level, pForced?: Palier, seedForced?: number) {
  const E = EXOS[id];
  if (!E || !E.levels.includes(lv)) return home();
  const m0 = getMastery(id, lv);
  const review = isDue(m0);
  const p = pForced ?? (review ? 3 : palierFor(m0));
  const seed = seedForced ?? newSeed();
  const d = E.generate(lv, p, seed);
  const dots = (s: number) => `<span class="dots" aria-label="Série : ${s} sur ${GOAL}">${Array.from({ length: GOAL }, (_, i) => `<i class="${i < s ? 'on' : ''}"></i>`).join('')}</span>`;
  const status = (m = m0, rv = review) => `${lvTag(lv)} ${starStr(stars(m))} ${rv ? '<span class="small due">↻ Révision</span>' : m.masteredAt ? '<span class="small">Maîtrisé !</span>' : dots(m.streak)}`;
  shell(E.title, `<div class="exo-head">${status()}${getSettings().chrono ? '<span class="chrono" aria-hidden="true">0 s</span>' : ''}</div>
    <section class="card exo" data-exo="${id}" data-seed="${seed}" data-p="${p}"><div class="w"></div>
    <div class="fb" role="status" aria-live="polite"></div>
    <div class="actions"><button type="button" class="btn" id="check">Vérifier</button></div></section>`, '#/');
  if (getSettings().chrono) { const t0 = Date.now(); timer = window.setInterval(() => { const c = app.querySelector('.chrono'); if (c) c.textContent = `${Math.floor((Date.now() - t0) / 1000)} s`; }, 1000); }
  const w: Mounted<unknown> = E.mount(app.querySelector('.w')!, d);
  const fb = app.querySelector<HTMLElement>('.fb')!;
  const actions = app.querySelector<HTMLElement>('.actions')!;
  let tries = 0;
  const finish = (firstTry: boolean, html: string) => {
    clearInterval(timer);
    w.lock();
    const { m, gained } = record(id, lv, firstTry);
    fb.innerHTML = html + (gained > 0 ? `<p class="gain">Nouvelle étoile ! ${starStr(stars(m))}</p>` : '');
    app.querySelector('.exo-head')!.innerHTML = status(m, false);
    actions.innerHTML = `<button type="button" class="btn" id="next">${firstTry ? 'Exercice suivant' : 'Un exercice jumeau'}</button>`;
    const nx = actions.querySelector<HTMLButtonElement>('#next')!;
    nx.onclick = () => exo(id, lv, firstTry ? undefined : p);
    nx.focus();
  };
  app.querySelector<HTMLButtonElement>('#check')!.onclick = () => {
    const notReady = w.ready?.();
    if (notReady) { fb.innerHTML = `<p class="warn">${esc(notReady)}</p>`; return; }
    const a = w.answer();
    if (a === null) { fb.innerHTML = `<p class="warn">Termine ta réponse avant de vérifier.</p>`; return; }
    const v = E.check(d, a);
    if (v.ok) return finish(tries === 0, `<p class="ok">Bravo, c’est juste !</p>`);
    tries++;
    if (v.bad) w.showBad?.(v.bad);
    if (tries === 1) fb.innerHTML = `<p class="ko">${esc(v.msg ?? 'Ce n’est pas ça.')}</p><p class="small">Essaie encore.</p>`;
    else if (tries === 2) fb.innerHTML = `<p class="ko">${esc(v.msg ?? 'Ce n’est pas ça.')}</p><p class="hint"><b>Indice :</b> ${esc(E.hint(d))}</p>`;
    else finish(false, `<p class="ko">Voici la correction. Lis-la, puis essaie un exercice jumeau.</p><div class="cor">${E.correction(d)}</div>`);
  };
}

function route() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'cours' && h[1]) cours(h[1], h[2] ? Number(h[2]) : undefined);
  else if (h[0] === 'sommaire') sommaire();
  else if (h[0] === 'reglages') reglages();
  else if (h[0] === 'exo' && h[1]) exo(h[1], h[2] as Level, h[3] ? (Number(h[3]) as Palier) : undefined, h[4] ? Number(h[4]) : undefined);
  else home();
  (document.getElementById('main') as HTMLElement | null)?.focus({ preventScroll: true });
}
applySettings();
addEventListener('hashchange', route);
route();
setupPWA();
