import { makeProblemExo } from './pb/engine';
import { FRACPB } from './pb/fractions';
export const probfrac = makeProblemExo('probfrac', 'Problèmes : fraction ou nombre ?', 'Problèmes', ['CM1', 'CM2', '6e'], FRACPB, [0.3, 0.3, 0.35]);
