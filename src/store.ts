/** Réglages et progression, dans localStorage, tous préfixés « compendium-primaire. ». */
export type Theme = 'auto' | 'light' | 'dark';
export interface Settings { theme: Theme }
export interface Mastery {
  /** bonnes réponses de suite au premier essai */
  streak: number;
  best: number;
  done: number;
  /** date de la maîtrise (★★), puis de la révision réussie (★★★) */
  masteredAt?: number;
  reviewedAt?: number;
}
export const PREFIX = 'compendium-primaire.';
const K_SET = PREFIX + 'settings';
const K_PROG = PREFIX + 'progress';
export const GOAL = 5;
const REVIEW_MS = 7 * 24 * 3600 * 1000;

const read = <T>(k: string, f: T): T => { try { const v = localStorage.getItem(k); return v ? { ...f, ...JSON.parse(v) } : f; } catch { return f; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* plein ou désactivé */ } };

let settings = read<Settings>(K_SET, { theme: 'auto' });
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
export function stars(m: Mastery) { return m.reviewedAt ? 3 : m.masteredAt ? 2 : m.done > 0 ? 1 : 0; }
/**
 * Enregistre un exercice terminé. Seule une réussite au PREMIER essai fait monter la série ;
 * un premier essai faux la fait baisser de 2 (sans repartir de zéro). Renvoie les étoiles gagnées.
 */
export function record(exo: string, lv: string, firstTry: boolean, now = Date.now()): { m: Mastery; gained: number } {
  const m = { ...getMastery(exo, lv) };
  const before = stars(m);
  m.done++;
  m.streak = firstTry ? m.streak + 1 : Math.max(0, m.streak - 2);
  m.best = Math.max(m.best, m.streak);
  if (!m.masteredAt && m.streak >= GOAL) { m.masteredAt = now; m.streak = 0; }
  else if (m.masteredAt && !m.reviewedAt && firstTry && now - m.masteredAt >= REVIEW_MS) m.reviewedAt = now;
  prog = { ...prog, [key(exo, lv)]: m };
  write(K_PROG, prog);
  return { m, gained: stars(m) - before };
}
/** Palier conseillé : monte avec la série en cours. */
export const palierFor = (m: Mastery): 1 | 2 | 3 => (m.masteredAt ? 3 : m.streak >= 3 ? 3 : m.streak >= 1 ? 2 : 1);
/** Pour les tests : mémoire remise à zéro. */
export function _reset() { prog = {}; write(K_PROG, prog); }
