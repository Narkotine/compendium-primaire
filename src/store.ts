/** Réglages et progression, dans localStorage, tous préfixés « compendium-primaire. ». */
export type Theme = 'auto' | 'light' | 'dark';
export interface Settings { theme: Theme; /** chronomètre affiché (désactivé par défaut) */ chrono: boolean }
export interface Mastery {
  /** bonnes réponses de suite au premier essai */
  streak: number;
  best: number;
  done: number;
  /** date de la maîtrise (★★), puis de la révision réussie (★★★) */
  masteredAt?: number;
  /** révisions espacées : étape (0 = maîtrisé, 1 = révisé à J+1, 2 = J+3, 3 = J+7 → ★★★, 4 = J+30) et prochaine date */
  stage?: number;
  nextReview?: number;
}
export const PREFIX = 'compendium-primaire.';
const K_SET = PREFIX + 'settings';
const K_PROG = PREFIX + 'progress';
export const GOAL = 5;

const read = <T>(k: string, f: T): T => { try { const v = localStorage.getItem(k); return v ? { ...f, ...JSON.parse(v) } : f; } catch { return f; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* plein ou désactivé */ } };

let settings = read<Settings>(K_SET, { theme: 'auto', chrono: false });
export const getSettings = () => settings;
export function setSettings(p: Partial<Settings>) { settings = { ...settings, ...p }; write(K_SET, settings); applySettings(); }
export function applySettings() {
  const d = document.documentElement;
  d.dataset.theme = settings.theme;
  const dark = settings.theme === 'dark' || (settings.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector<HTMLMetaElement>('meta[name=theme-color]')?.setAttribute('content', dark ? '#121417' : '#f7f6f2');
}

let prog = read<Record<string, Mastery>>(K_PROG, {});
const key = (exo: string, lv: string) => `${exo}/${lv}`;
export const getMastery = (exo: string, lv: string): Mastery => prog[key(exo, lv)] ?? { streak: 0, best: 0, done: 0 };
/** 0 à 3 étoiles : ★ essayé, ★★ maîtrisé (5 de suite), ★★★ encore réussi au moins 7 jours après. */
const DAY = 24 * 3600 * 1000;
/** Délais entre révisions, après la maîtrise : 1 jour, 3 jours, 1 semaine, 1 mois. */
export const GAPS = [1, 3, 7, 30];
/** 0 à 3 étoiles : ★ essayé, ★★ maîtrisé (5 de suite au 1er essai), ★★★ encore réussi à la révision d'une semaine. */
export function stars(m: Mastery) { return (m.stage ?? 0) >= 3 ? 3 : m.masteredAt ? 2 : m.done > 0 ? 1 : 0; }
export const isDue = (m: Mastery, now = Date.now()) => !!m.masteredAt && m.nextReview !== undefined && now >= m.nextReview;
/**
 * Enregistre un exercice terminé. Seule une réussite au PREMIER essai fait monter la série ;
 * un premier essai faux la fait baisser de 2 (sans repartir de zéro).
 * Après la maîtrise : une révision due réussie au 1er essai fait passer à l'étape suivante, une révision ratée recule d'une étape.
 */
export function record(exo: string, lv: string, firstTry: boolean, now = Date.now()): { m: Mastery; gained: number } {
  const m = { ...getMastery(exo, lv) };
  const before = stars(m);
  m.done++;
  if (!m.masteredAt) {
    m.streak = firstTry ? m.streak + 1 : Math.max(0, m.streak - 2);
    m.best = Math.max(m.best, m.streak);
    if (m.streak >= GOAL) { m.masteredAt = now; m.streak = 0; m.stage = 0; m.nextReview = now + GAPS[0] * DAY; }
  } else if (isDue(m, now)) {
    const st = m.stage ?? 0;
    m.stage = firstTry ? Math.min(st + 1, GAPS.length) : Math.max(0, st - 1);
    // ratée : on revoit dès demain ; réussie : délai de l'étape atteinte
    m.nextReview = now + (firstTry ? GAPS[Math.min(m.stage, GAPS.length - 1)] : 1) * DAY;
  }
  prog = { ...prog, [key(exo, lv)]: m };
  write(K_PROG, prog);
  return { m, gained: stars(m) - before };
}
/** Tout ce qui est à réviser aujourd'hui. */
export function dueList(now = Date.now()) {
  return Object.entries(prog).filter(([, m]) => isDue(m, now)).map(([k]) => { const [exo, lv] = k.split('/'); return { exo, lv }; });
}
/** Palier conseillé : monte avec la série en cours. */
export const palierFor = (m: Mastery): 1 | 2 | 3 => (m.masteredAt ? 3 : m.streak >= 3 ? 3 : m.streak >= 1 ? 2 : 1);
/** Pour les tests : mémoire remise à zéro. */
export function _reset() { prog = {}; write(K_PROG, prog); }
