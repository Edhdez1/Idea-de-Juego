/**
 * B0 «Taller Embargado» (tutorial del Prólogo): 8×8 con alturas. La
 * Ingeniera tiene que llegar a la puerta del taller (7,0) mientras el Gremio
 * ejecuta el embargo. Enseña a moverse, la altura y el empuje (el canal de
 * desagüe saca de la batalla a quien caiga dentro).
 *
 * Leyenda: l losa, t tarima, c chatarra, w canal, v respiradero, p puerta.
 */

import type { BattleDef } from '../../../core/tactics/types';

export const PROLOGO_TALLER: BattleDef = {
  id: 'prologo_taller',
  name: 'Taller Embargado',
  heights: [
    '00001122', //
    '00001122',
    '00000112',
    '11000011',
    '21100000',
    '22100000',
    '33200000',
    '33200000',
  ],
  terrain: [
    'lllltttp', //
    'llvlttll',
    'llllcltl',
    'tlllllll',
    'tlwwllll',
    'ttlwllvl',
    'ttllllll',
    'ttllllll',
  ],
  legend: { l: 'losa', t: 'tarima', c: 'chatarra', w: 'canal', v: 'respiradero', p: 'puerta' },
  interactables: [
    { pos: { x: 1, y: 1 }, id: 'valvula' },
    { pos: { x: 7, y: 0 }, id: 'puerta' },
  ],
  goteras: [{ pos: { x: 4, y: 6 }, cycle: ['medieval', 'steampunk', 'futurista', 'cyberpunk'], everyBeeps: 3 }],
  deploy: [
    { x: 0, y: 7 },
    { x: 1, y: 7 },
    { x: 0, y: 6 },
    { x: 1, y: 6 },
  ],
  units: [
    { defId: 'aprendiz_explotado', team: 'enemy', pos: { x: 5, y: 3 }, facing: 'SW' },
    { defId: 'aprendiz_explotado', team: 'enemy', pos: { x: 6, y: 1 }, facing: 'SW' },
  ],
  objectives: [{ kind: 'reach', tiles: [{ x: 7, y: 0 }] }],
  defeat: [{ kind: 'partyWiped' }],
  triggers: [
    { when: { kind: 'start' }, script: 'b0_inicio' },
    { when: { kind: 'hpBelow', unitId: 'ingeniera', pct: 50 }, script: 'b0_ingeniera_herida' },
    { when: { kind: 'beep', n: 3 }, script: 'b0_primer_cambio_de_era' },
  ],
  ambiente: {
    emitters: [
      { kind: 'vapor', at: { x: 2, y: 1 }, rate: 4 },
      { kind: 'vapor', at: { x: 6, y: 5 }, rate: 4 },
      { kind: 'chispas', at: { x: 4, y: 2 }, rate: 1 },
      { kind: 'hollin', rate: 2 },
    ],
    props: [
      { sprite: 'prop_engranaje', pos: { x: 0, y: 0 }, animated: true },
      { sprite: 'prop_caldera', pos: { x: 3, y: 0 }, animated: true },
      { sprite: 'prop_sello_embargo', pos: { x: 6, y: 0 }, animated: false },
      { sprite: 'prop_farol', pos: { x: 0, y: 4 }, animated: true },
    ],
    parallax: 'parallax_piramide',
  },
  music: 'taller',
};
