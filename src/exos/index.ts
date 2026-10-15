import { echanger } from './echanger';
import { tableau } from './tableau';
import { dizaines } from './dizaines';
import { ranger } from './ranger';
import { droite, lire } from './droite';
import { grands } from './grands';
import { suites } from './suites';
import { complements } from './complements';
import { mental } from './mental';
import { addpose, subpose } from './pose';
import { probadd } from './probadd';
import { rectangle } from './rectangle';
import { tables } from './tables';
import { doubles } from './doubles';
import { fois10 } from './fois10';
import { mulpose } from './mulpose';
import { multiples } from './multiples';
import { probmul } from './probmul';
import type { ExoType } from '../engine/types';
/** Exercices du chapitre 1, dans l'ordre des notions du cours. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EXOS: Record<string, ExoType<any, any>> = { echanger, tableau, dizaines, ranger, droite, lire, grands, suites, complements, mental, addpose, subpose, probadd, rectangle, tables, doubles, fois10, mulpose, multiples, probmul };
