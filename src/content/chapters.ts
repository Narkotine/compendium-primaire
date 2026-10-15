import type { Level } from '../engine/types';
export interface Chapter { slug: string; n: number; title: string; short: string; notions: { t: string; lv: Level[] }[]; exos: string[] }
/** Sommaire (ordre pédagogique du référentiel). */
export const CHAPTERS: Chapter[] = [
  {
    slug: 'numeration', n: 1, title: 'Les nombres : comment ils marchent', short: 'Les nombres',
    notions: [
      { t: 'Faire des paquets de 10', lv: ['CE1'] },
      { t: 'La valeur d’un chiffre dépend de sa place', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: 'Échanger et décomposer', lv: ['CE1', 'CE2'] },
      { t: 'Comparer et ranger', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: 'La demi-droite graduée', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: 'Les grands nombres', lv: ['CM1', 'CM2'] },
      { t: 'Compter de n en n', lv: ['CE1', 'CE2'] },
    ],
    exos: ['echanger', 'tableau', 'dizaines', 'ranger', 'droite', 'grands', 'suites'],
  },
];
