/**
 * Generador de batallas aleatorias (con el Rng del proyecto) y autobatalla
 * IA contra IA: las unidades del jugador las juega autoPlayTurn.
 */

import { Rng } from '../../../src/core/rng';
import { autoPlayTurn } from '../../../src/core/tactics/autoplay';
import { createBattle } from '../../../src/core/tactics/battle';
import type { BattleDef, BattleState, GoteraDef, Pos, TacticalEvent, Team } from '../../../src/core/tactics/types';
import { HEROES, TACTICS_REGISTRY } from '../../../src/data/tactico';

const FOES = ['aprendiz_explotado', 'golem_defectuoso', 'cobrador_cuotas', 'inquisidor_patentes', 'gran_maestre', 'maton_gallego', 'boticaria_chilanga'];
const ERAS = ['medieval', 'steampunk', 'futurista', 'cyberpunk'] as const;

export function randomBattle(seed: number): { def: BattleDef; roster: string[] } {
  const rng = new Rng(seed);
  const w = 8;
  const h = 8;
  const heights: string[] = [];
  const terrain: string[] = [];
  for (let y = 0; y < h; y++) {
    let hr = '';
    let tr = '';
    for (let x = 0; x < w; x++) {
      hr += String(rng.int(3));
      const roll = rng.int(20);
      const safeRow = y <= 1 || y >= 6;
      tr += safeRow ? 'l' : roll === 0 ? 'w' : roll === 1 ? 'v' : roll === 2 ? 'c' : roll === 3 ? 'p' : 'l';
    }
    heights.push(hr);
    terrain.push(tr);
  }
  const roster = rng.shuffle(HEROES).slice(0, 1 + rng.int(4));
  const deploy: Pos[] = [0, 1, 2, 3].map((i) => ({ x: i * 2, y: rng.int(2) }));
  const nFoes = 1 + rng.int(4);
  const cols = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7]);
  const units = Array.from({ length: nFoes }, (_, i) => ({
    defId: rng.pick(FOES),
    team: (rng.int(6) === 0 ? 'third' : 'enemy') as Team,
    pos: { x: cols[i]!, y: 6 + rng.int(2) },
    facing: 'NE' as const,
  }));
  const goteras: GoteraDef[] = rng.int(2) === 0 ? [{ pos: { x: rng.int(8), y: 3 + rng.int(2) }, cycle: rng.shuffle([...ERAS]), everyBeeps: 1 + rng.int(3) }] : [];
  const prototypes = rng.int(2) === 0 ? [{ defId: 'prototipo_inestable', pos: { x: 3 + rng.int(2), y: 4 } }] : [];
  // Las Goteras y prototipos no pueden caer en canal: fuerza losa.
  for (const p of [...goteras.map((g) => g.pos), ...prototypes.map((p) => p.pos)]) {
    const row = terrain[p.y]!;
    terrain[p.y] = row.slice(0, p.x) + 'l' + row.slice(p.x + 1);
  }
  const def: BattleDef = {
    id: `aleatoria_${seed}`,
    name: 'Aleatoria',
    heights,
    terrain,
    legend: { l: 'losa', w: 'canal', v: 'respiradero', c: 'chatarra', p: 'paja' },
    deploy,
    units,
    goteras,
    prototypes: prototypes.filter((p) => !goteras.some((g) => g.pos.x === p.pos.x && g.pos.y === p.pos.y)),
    objectives: [{ kind: 'rout' }],
    defeat: [{ kind: 'partyWiped' }, { kind: 'beepLimit', beeps: 40 }],
    ambiente: { emitters: [{ kind: 'polvo' }], props: [], parallax: 'parallax_piramide' },
  };
  return { def, roster };
}

export function autoBattle(def: BattleDef, roster: string[], seed: number, maxTurns = 400) {
  let { state, events } = createBattle(def, { roster: roster.map((defId) => ({ defId })), seed, registry: TACTICS_REGISTRY });
  const log: TacticalEvent[] = [...events];
  let turns = 0;
  while (state.phase === 'awaitingPlayer' && turns < maxTurns) {
    const r = autoPlayTurn(state, TACTICS_REGISTRY);
    state = r.state;
    log.push(...r.events);
    turns++;
  }
  return { state: state as BattleState, events: log, turns };
}
