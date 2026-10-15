import { echanger } from './echanger';
import { tableau } from './tableau';
import { dizaines } from './dizaines';
import { ranger } from './ranger';
import { droite } from './droite';
import type { ExoType } from '../engine/types';
/** Exercices du chapitre 1, dans l'ordre des notions du cours. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EXOS: Record<string, ExoType<any, any>> = { echanger, tableau, dizaines, ranger, droite };
