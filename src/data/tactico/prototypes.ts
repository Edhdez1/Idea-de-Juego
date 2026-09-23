/** Prototipos (mechas en la barra de turnos). Solo datos. */

import type { PrototypeDef } from '../../core/tactics/types';

export const PROTOTYPES: PrototypeDef[] = [
  {
    id: 'prototipo_inestable',
    name: 'Prototipo Inestable',
    fuse: 3,
    speed: 10,
    area: { shape: 'diamond', radius: 1 },
    damage: 8,
    pressure: 2,
    pushOut: true,
    sprite: 'prototipo_inestable',
  },
  {
    id: 'desmontadora',
    name: 'La Desmontadora (patente en trámite)',
    fuse: 8,
    speed: 8,
    area: { shape: 'single', radius: 0 },
    damage: 0,
    pressure: 0,
    pushOut: false,
    onExplode: 'defeat',
    sprite: 'desmontadora',
  },
];
