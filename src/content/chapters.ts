import type { Level } from '../engine/types';
export interface Chapter { slug: string; n: number; title: string; short: string; notions: { t: string; lv: Level[] }[]; exos: string[] }
/** Sommaire (ordre pédagogique du référentiel). */
export const CHAPTERS: Chapter[] = [
  {
    slug: 'numeration', n: 1, title: 'Les nombres : comment ils marchent', short: 'Les nombres',
    notions: [
      { t: 'Faire des paquets de 10', lv: ['CE1', '6e'] },
      { t: 'La valeur d’un chiffre dépend de sa place', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Échanger et décomposer', lv: ['CE1', 'CE2', '6e'] },
      { t: 'Comparer et ranger', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
      { t: 'La demi-droite graduée', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Les grands nombres', lv: ['CM1', 'CM2', '6e'] },
      { t: 'Compter de n en n', lv: ['CE1', 'CE2', '6e'] },
    ],
    exos: ['echanger', 'tableau', 'dizaines', 'ranger', 'droite', 'lire', 'grands', 'suites'],
  },
  {
    slug: 'addition', n: 2, title: 'Ajouter et enlever', short: 'Addition, soustraction',
    notions: [
      { t: 'Ajouter, enlever, comparer : choisir l’opération', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Les compléments et les égalités à trou', lv: ['CE1', 'CE2', '6e'] },
      { t: 'Calcul mental malin', lv: ['CE1', 'CE2', 'CM1', '6e'] },
      { t: 'L’addition posée et la retenue', lv: ['CE1', 'CE2', 'CM1', '6e'] },
      { t: 'La soustraction posée : casser ou compenser', lv: ['CE1', 'CE2', 'CM1', '6e'] },
    ],
    exos: ['probadd', 'complements', 'mental', 'addpose', 'subpose'],
  },
  {
    slug: 'multiplication', n: 3, title: 'Multiplier', short: 'Multiplication',
    notions: [
      { t: 'Le sens : des paquets pareils, un rectangle', lv: ['CE1', 'CE2', '6e'] },
      { t: 'Tourner le rectangle : 3 × 4 = 4 × 3', lv: ['CE1', 'CE2', '6e'] },
      { t: 'Les tables, comprises et retenues', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Doubles et moitiés', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
      { t: '× 10, × 100, × 1 000', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
      { t: 'La multiplication posée', lv: ['CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Les multiples', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
    ],
    exos: ['probmul', 'rectangle', 'tables', 'doubles', 'fois10', 'mulpose', 'multiples'],
  },
  {
    slug: 'division', n: 4, title: 'Partager et diviser', short: 'Division',
    notions: [
      { t: 'Deux sens : partager, faire des groupes', lv: ['CE1', 'CE2', '6e'] },
      { t: 'La division et les tables', lv: ['CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Le reste', lv: ['CE2', 'CM1', 'CM2', '6e'] },
      { t: 'La division posée', lv: ['CM1', 'CM2', '6e'] },
      { t: 'Divisible par 2, 5, 10', lv: ['CM1', 'CM2', '6e'] },
    ],
    exos: ['probdiv', 'partage', 'famille', 'reste', 'divpose', 'divisible'],
  },
  {
    slug: 'fractions', n: 5, title: 'Les fractions', short: 'Fractions',
    notions: [
      { t: 'Des parts égales d’un tout', lv: ['CE1', 'CE2', '6e'] },
      { t: 'Lire et écrire une fraction', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Comparer des fractions', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Ajouter et enlever des fractions', lv: ['CE1', 'CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Fractions égales', lv: ['CE2', 'CM1', 'CM2', '6e'] },
      { t: 'La fraction est un nombre : la demi-droite', lv: ['CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Plus grand que 1 : entier + fraction', lv: ['CM1', 'CM2', '6e'] },
      { t: 'Fraction d’une quantité', lv: ['CM1', 'CM2', '6e'] },
    ],
    exos: ['fracpb', 'probfrac', 'partsegales', 'colorier', 'lirefrac', 'fraccomp', 'fracsomme', 'egales', 'fracdroite', 'fraclire', 'entierfrac', 'fracquant'],
  },
  {
    slug: 'decimaux', n: 6, title: 'Les nombres décimaux', short: 'Décimaux',
    notions: [
      { t: 'Du dixième à l’écriture à virgule', lv: ['CM1', 'CM2', '6e'] },
      { t: 'Comparer, ranger, encadrer', lv: ['CM1', 'CM2', '6e'] },
      { t: 'La demi-droite graduée décimale', lv: ['CM1', 'CM2', '6e'] },
      { t: 'Addition et soustraction de décimaux', lv: ['CM1', 'CM2', '6e'] },
      { t: '× 10, × 100, ÷ 10', lv: ['CM2', '6e'] },
      { t: 'Décimal × entier', lv: ['CM1', 'CM2', '6e'] },
      { t: 'Division décimale', lv: ['CM2', '6e'] },
    ],
    exos: ['fracvirgule', 'dectableau', 'deccomp', 'decranger', 'decencadrer', 'decarrondi', 'decdroite', 'declire', 'decpose', 'decfois', 'decmul', 'decdiv', 'probdec'],
  },
  {
    slug: 'proportionnalite', n: 7, title: 'La proportionnalité', short: 'Proportionnalité',
    notions: [
      { t: 'Le prix de plusieurs objets pareils', lv: ['CE2', 'CM1', 'CM2', '6e'] },
      { t: 'Proportionnel ou pas ?', lv: ['CM1', 'CM2', '6e'] },
      { t: 'Fois plus, fois moins', lv: ['CM1', 'CM2', '6e'] },
      { t: 'Ajouter deux situations', lv: ['CM1', 'CM2', '6e'] },
    ],
    exos: ['probprop', 'propoupas', 'linmul', 'linadd'],
  },
  {
    slug: 'mesures', n: 8, title: 'Grandeurs et mesures', short: 'Mesures',
    notions: [
      { t: 'Unités et conversions', lv: ['CE1', 'CE2', 'CM1', 'CM2'] },
      { t: 'La monnaie', lv: ['CE1', 'CE2'] },
      { t: 'L’heure et les durées', lv: ['CE1', 'CE2', 'CM1'] },
      { t: 'Le périmètre', lv: ['CE2', 'CM1'] },
      { t: 'L’aire', lv: ['CM1', 'CM2'] },
    ],
    exos: ['uniteok', 'convertir', 'monnaie', 'horloge', 'duree', 'perimetre', 'aire', 'probmes'],
  },
  {
    slug: 'geometrie', n: 9, title: 'Géométrie', short: 'Géométrie',
    notions: [
      { t: 'Se repérer sur un quadrillage', lv: ['CE1', 'CE2'] },
      { t: 'Les figures', lv: ['CE1', 'CE2', 'CM1'] },
      { t: 'Angle droit, perpendiculaires, parallèles', lv: ['CE2', 'CM1'] },
      { t: 'Symétrie axiale', lv: ['CE2', 'CM1', 'CM2'] },
      { t: 'Les solides', lv: ['CE2', 'CM1'] },
    ],
    exos: ['repere', 'figures', 'angle', 'symetrie', 'solides'],
  },
];
