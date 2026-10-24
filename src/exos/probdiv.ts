import { makeProblemExo } from './pb/engine';
import { DIVISIFS } from './pb/divisifs';
export const probdiv = makeProblemExo('probdiv', 'Problèmes : diviser ou pas ?', 'Problèmes', ['CE2', 'CM1', 'CM2', '6e'], DIVISIFS, [0.3, 0.35, 0.4]);
