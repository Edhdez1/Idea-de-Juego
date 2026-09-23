/**
 * Batalla de humo (E2E y tests): 6×6 casi plano, la Ingeniera contra un
 * Aprendiz Explotado a tiro de piedra. La Ingeniera actúa primero.
 */

import type { BattleDef } from '../../../core/tactics/types';

export const PRUEBA_SMOKE: BattleDef = {
  id: 'prueba_smoke',
  name: 'Prueba de Humo',
  heights: ['000000', '000000', '001100', '001100', '000000', '000000'],
  terrain: ['llllll', 'llllll', 'lltlll', 'lltlll', 'llllll', 'llllll'],
  legend: { l: 'losa', t: 'tarima' },
  deploy: [
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: 0 },
  ],
  units: [{ defId: 'aprendiz_explotado', team: 'enemy', pos: { x: 3, y: 1 }, facing: 'NW' }],
  objectives: [{ kind: 'rout' }],
  defeat: [{ kind: 'partyWiped' }],
  ambiente: {
    emitters: [{ kind: 'polvo', rate: 2 }],
    props: [{ sprite: 'prop_engranaje', pos: { x: 5, y: 0 }, animated: true }],
    parallax: 'parallax_piramide',
  },
};
