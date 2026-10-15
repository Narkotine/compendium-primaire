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
    exos: ['echanger', 'tableau', 'dizaines', 'ranger', 'droite', 'lire', 'grands', 'suites'],
  },
  {
    slug: 'addition', n: 2, title: 'Ajouter et enlever', short: 'Addition, soustraction',
    notions: [
      { t: 'Ajouter, enlever, comparer : choisir l’opération', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: 'Les compléments et les égalités à trou', lv: ['CE1', 'CE2'] },
      { t: 'Calcul mental malin', lv: ['CE1', 'CE2', 'CM1'] },
      { t: 'L’addition posée et la retenue', lv: ['CE1', 'CE2', 'CM1'] },
      { t: 'La soustraction posée : casser ou compenser', lv: ['CE1', 'CE2', 'CM1'] },
    ],
    exos: ['probadd', 'complements', 'mental', 'addpose', 'subpose'],
  },
  {
    slug: 'multiplication', n: 3, title: 'Multiplier', short: 'Multiplication',
    notions: [
      { t: 'Le sens : des paquets pareils, un rectangle', lv: ['CE1', 'CE2'] },
      { t: 'Tourner le rectangle : 3 × 4 = 4 × 3', lv: ['CE1', 'CE2'] },
      { t: 'Les tables, comprises et retenues', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: 'Doubles et moitiés', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: '× 10, × 100, × 1 000', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: 'La multiplication posée', lv: ['CE2', 'CM1', 'CM2'] },
      { t: 'Les multiples', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
    ],
    exos: ['probmul', 'rectangle', 'tables', 'doubles', 'fois10', 'mulpose', 'multiples'],
  },
  {
    slug: 'division', n: 4, title: 'Partager et diviser', short: 'Division',
    notions: [
      { t: 'Deux sens : partager, faire des groupes', lv: ['CE1', 'CE2'] },
      { t: 'La division et les tables', lv: ['CE2', 'CM1', 'CM2'] },
      { t: 'Le reste', lv: ['CE2', 'CM1', 'CM2'] },
      { t: 'La division posée', lv: ['CM1', 'CM2'] },
      { t: 'Divisible par 2, 5, 10', lv: ['CM1', 'CM2'] },
    ],
    exos: ['probdiv', 'partage', 'famille', 'reste', 'divpose', 'divisible'],
  },
  {
    slug: 'fractions', n: 5, title: 'Les fractions', short: 'Fractions',
    notions: [
      { t: 'Des parts égales d’un tout', lv: ['CE1', 'CE2'] },
      { t: 'Lire et écrire une fraction', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: 'Comparer des fractions', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: 'Ajouter et enlever des fractions', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: 'Fractions égales', lv: ['CE2', 'CM1', 'CM2'] },
      { t: 'La fraction est un nombre : la demi-droite', lv: ['CE2', 'CM1', 'CM2'] },
      { t: 'Plus grand que 1 : entier + fraction', lv: ['CM1', 'CM2'] },
      { t: 'Fraction d’une quantité', lv: ['CM1', 'CM2'] },
    ],
    exos: ['fracpb', 'probfrac', 'partsegales', 'colorier', 'lirefrac', 'fraccomp', 'fracsomme', 'egales', 'fracdroite', 'fraclire', 'entierfrac', 'fracquant'],
  },
  {
    slug: 'decimaux', n: 6, title: 'Les nombres décimaux', short: 'Décimaux',
    notions: [
      { t: 'Du dixième à l’écriture à virgule', lv: ['CM1', 'CM2'] },
      { t: 'Comparer, ranger, encadrer', lv: ['CM1', 'CM2'] },
      { t: 'La demi-droite graduée décimale', lv: ['CM1', 'CM2'] },
      { t: 'Addition et soustraction de décimaux', lv: ['CM1', 'CM2'] },
      { t: '× 10, × 100, ÷ 10', lv: ['CM2'] },
      { t: 'Décimal × entier', lv: ['CM1', 'CM2'] },
    ],
    exos: ['fracvirgule', 'dectableau', 'deccomp', 'decranger', 'decencadrer', 'decarrondi', 'decdroite', 'declire', 'decpose', 'decfois', 'decmul', 'probdec'],
  },
  {
    slug: 'proportionnalite', n: 7, title: 'La proportionnalité', short: 'Proportionnalité',
    notions: [
      { t: 'Le prix de plusieurs objets pareils', lv: ['CE2', 'CM1', 'CM2'] },
      { t: 'Proportionnel ou pas ?', lv: ['CM1', 'CM2'] },
      { t: 'Fois plus, fois moins', lv: ['CM1', 'CM2'] },
      { t: 'Ajouter deux situations', lv: ['CM1', 'CM2'] },
    ],
    exos: ['probprop', 'propoupas', 'linmul', 'linadd'],
  },
];
