/**
 * Datos del modo táctico: registro de definiciones, batallas y roster.
 */

import { makeTacticsRegistry } from '../../core/tactics/registry';
import type { BattleDef } from '../../core/tactics/types';
import { PROLOGO_TALLER } from './battles/prologo_taller';
import { PRUEBA_SMOKE } from './battles/prueba_smoke';
import { PROTOTYPES } from './prototypes';
import { SKILLS } from './skills';
import { TERRAINS } from './terrains';
import { UNITS } from './units';

export { PROTOTYPES, SKILLS, TERRAINS, UNITS };
export { GREMIO_UNITS, HERO_UNITS, MERCENARY_UNITS } from './units';

export const TACTICS_REGISTRY = makeTacticsRegistry({
  units: UNITS,
  skills: SKILLS,
  prototypes: PROTOTYPES,
  terrains: TERRAINS,
});

export const BATTLES: Record<string, BattleDef> = {
  [PRUEBA_SMOKE.id]: PRUEBA_SMOKE,
  [PROLOGO_TALLER.id]: PROLOGO_TALLER,
};

/** Orden del roster de héroes. */
export const HEROES: string[] = ['ingeniera', 'clerigo', 'historiadora', 'reparador'];
