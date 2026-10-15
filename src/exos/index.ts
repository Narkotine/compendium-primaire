import { echanger } from './echanger';
import { tableau } from './tableau';
import type { ExoType } from '../engine/types';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EXOS: Record<string, ExoType<any, any>> = { tableau, echanger };
