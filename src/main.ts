import '@fontsource/atkinson-hyperlegible-next/400.css';
import '@fontsource/atkinson-hyperlegible-next/700.css';
import './styles/base.css';
import './styles/app.css';
import { COURS } from './content/cours';
import { EXOS } from './exos';
import { LEVELS, type Level, type Palier, type Mounted } from './engine/types';
import { newSeed } from './engine/rng';
import { getSettings, setSettings, applySettings, getMastery, stars, record, palierFor, GOAL, type Theme } from './store';
import { setupPWA } from './pwa';
import { esc } from './util';

const app = document.getElementById('app')!;
const starStr = (n: number) => `<span class="stars" aria-label="${n} étoile${n > 1 ? 's' : ''} sur 3">${'★'.repeat(n)}<span class="off">${'★'.repeat(3 - n)}</span></span>`;
const NOTIONS: { t: string; lv: Level[] }[] = [
  { t: 'Faire des paquets de 10', lv: ['CE1'] },
  { t: 'La valeur d’un chiffre dépend de sa place', lv: ['CE1', 'CE2'] },
  { t: 'Échanger et décomposer', lv: ['CE1', 'CE2'] },
  { t: 'Comparer et ranger', lv: ['CE1', 'CE2'] },
  { t: 'La demi-droite graduée', lv: ['CE1', 'CE2'] },
];
const lvTag = (l: string) => `<span class="lv lv-${l}">${l}</span>`;

function shell(title: string, body: string, back?: string) {
  app.innerHTML = `<header class="bar">${back ? `<a class="ib" href="${back}" aria-label="Retour">←</a>` : '<span class="logo" aria-hidden="true"></span>'}
    <h1 class="bar-t">${title}</h1><button type="button" class="ib" id="theme" aria-label="Changer le thème (${getSettings().theme})">◐</button></header>
    <main id="main" tabindex="-1">${body}</main>`;
  app.querySelector('#theme')!.addEventListener('click', () => {
    const order: Theme[] = ['auto', 'light', 'dark'];
    setSettings({ theme: order[(order.indexOf(getSettings().theme) + 1) % 3] });
    (app.querySelector('#theme') as HTMLElement).setAttribute('aria-label', `Changer le thème (${getSettings().theme})`);
  });
  scrollTo(0, 0);
}
function exoList() {
  return Object.values(EXOS).map((e) => `<div class="exo-row"><div class="exo-t">${e.title}<small>${e.notion}</small></div><div class="exo-lv">${e.levels.map((l) =>
    `<a class="btn-lv" href="#/exo/${e.id}/${l}">${lvTag(l)} ${starStr(stars(getMastery(e.id, l)))}</a>`).join('')}</div></div>`).join('');
}
function home() {
  shell('Maths Primaire', `<section class="card ch">
    <h2><span class="ch-n">1</span> Les nombres : comment ils marchent</h2>
    <ol class="notions">${NOTIONS.map((n) => `<li>${n.t} ${n.lv.map(lvTag).join(' ')}</li>`).join('')}</ol>
    <a class="btn" href="#/cours/numeration">Lire le cours</a></section>
    <section class="card"><h2>S’entraîner</h2>${exoList()}
    <p class="small">Une étoile quand tu essaies. Deux étoiles après ${GOAL} bonnes réponses de suite du premier coup. Trois étoiles si tu réussis encore une semaine plus tard.</p></section>
    <p class="small muted">Les autres chapitres arrivent bientôt. Tout reste ouvert : tu peux commencer où tu veux.</p>`);
}
function cours(slug: string) {
  shell('Les nombres', `<article class="prose">${COURS[slug] ?? '<p>Cours introuvable.</p>'}</article><section class="card"><h2>S’entraîner</h2>${exoList()}</section>`, '#/');
}

function exo(id: string, lv: Level, pForced?: Palier, seedForced?: number) {
  const E = EXOS[id];
  if (!E || !LEVELS.includes(lv)) return home();
  const m0 = getMastery(id, lv);
  const p = pForced ?? palierFor(m0);
  const seed = seedForced ?? newSeed();
  const d = E.generate(lv, p, seed);
  const dots = (s: number) => `<span class="dots" aria-label="Série : ${s} sur ${GOAL}">${Array.from({ length: GOAL }, (_, i) => `<i class="${i < s ? 'on' : ''}"></i>`).join('')}</span>`;
  shell(E.title, `<div class="exo-head">${lvTag(lv)} ${starStr(stars(m0))} ${m0.masteredAt ? '<span class="small">Maîtrisé ! Continue pour réviser.</span>' : dots(m0.streak)}</div>
    <section class="card exo" data-exo="${id}" data-seed="${seed}" data-p="${p}"><div class="w"></div>
    <div class="fb" role="status" aria-live="polite"></div>
    <div class="actions"><button type="button" class="btn" id="check">Vérifier</button></div></section>`, '#/');
  const w: Mounted<unknown> = E.mount(app.querySelector('.w')!, d);
  const fb = app.querySelector<HTMLElement>('.fb')!;
  const actions = app.querySelector<HTMLElement>('.actions')!;
  let tries = 0;
  const finish = (firstTry: boolean, html: string) => {
    w.lock();
    const { m, gained } = record(id, lv, firstTry);
    fb.innerHTML = html + (gained > 0 ? `<p class="gain">Nouvelle étoile ! ${starStr(stars(m))}</p>` : '');
    const head = app.querySelector('.exo-head')!;
    head.innerHTML = `${lvTag(lv)} ${starStr(stars(m))} ${m.masteredAt ? '<span class="small">Maîtrisé !</span>' : dots(m.streak)}`;
    actions.innerHTML = `<button type="button" class="btn" id="next">${firstTry ? 'Exercice suivant' : 'Un exercice jumeau'}</button>`;
    const nx = actions.querySelector<HTMLButtonElement>('#next')!;
    nx.onclick = () => exo(id, lv, firstTry ? undefined : p);
    nx.focus();
  };
  app.querySelector<HTMLButtonElement>('#check')!.onclick = () => {
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
  if (h[0] === 'cours' && h[1]) cours(h[1]);
  else if (h[0] === 'exo' && h[1]) exo(h[1], h[2] as Level, h[3] ? (Number(h[3]) as Palier) : undefined, h[4] ? Number(h[4]) : undefined);
  else home();
  (document.getElementById('main') as HTMLElement | null)?.focus({ preventScroll: true });
}
applySettings();
addEventListener('hashchange', route);
route();
setupPWA();
