/**
 * Utilidades de test del motor táctico: registro con unidades de prueba,
 * constructor de batallas mínimas y acceso cómodo al estado.
 */

import { createBattle, dispatch } from '../../../src/core/tactics/battle';
import { makeTacticsRegistry } from '../../../src/core/tactics/registry';
import type {
  BattleDef,
  BattleState,
  Pos,
  SkillDef,
  TacticalEvent,
  TacticalIntent,
  UnitDef,
  UnitState,
} from '../../../src/core/tactics/types';
import { PROTOTYPES, SKILLS, TERRAINS, UNITS } from '../../../src/data/tactico';

const MELEE = { min: 1, max: 1, maxDh: 2 };
const SINGLE = { shape: 'single', radius: 0 } as const;

export const TEST_SKILLS: SkillDef[] = [
  { id: 't_golpe', name: 'Golpe de prueba', description: '', cost: 0, range: MELEE, area: SINGLE, target: 'hostile', effects: [{ kind: 'damage', power: 10 }] },
  { id: 't_vapor', name: 'Golpe de vapor', description: '', cost: 0, steam: true, overclock: true, range: MELEE, area: SINGLE, target: 'hostile', effects: [{ kind: 'damage', power: 10 }] },
  { id: 't_empuje', name: 'Empuje', description: '', cost: 0, range: MELEE, area: SINGLE, target: 'hostile', effects: [{ kind: 'push', distance: 3 }] },
  { id: 't_bomba', name: 'Bomba', description: '', cost: 0, range: { min: 1, max: 3 }, area: { shape: 'diamond', radius: 1 }, target: 'hostile', effects: [{ kind: 'damage', power: 5 }] },
  { id: 't_caldera', name: 'Caldera', description: '', cost: 0, range: { min: 0, max: 0 }, area: SINGLE, target: 'self', effects: [{ kind: 'pressure', amount: 3 }] },
  { id: 't_proto', name: 'Mecha', description: '', cost: 0, range: { min: 1, max: 3 }, area: SINGLE, target: 'tile', effects: [{ kind: 'placePrototype', prototypeId: 'prototipo_inestable' }] },
  { id: 't_caro', name: 'Caro', description: '', cost: 3, range: MELEE, area: SINGLE, target: 'hostile', effects: [{ kind: 'damage', power: 1 }] },
];

export const TEST_UNITS: UnitDef[] = [
  {
    id: 'probador',
    name: 'Probador',
    hp: 40,
    atk: 0,
    def: 0,
    speed: 20,
    move: 5,
    jump: 2,
    skills: ['t_golpe', 't_vapor', 't_empuje', 't_bomba', 't_caldera', 't_proto', 't_caro', 'valvula_de_escape'],
    sprite: 'probador',
  },
  { id: 'muneco', name: 'Muñeco', hp: 60, atk: 0, def: 0, speed: 1, move: 0, jump: 0, skills: [], ai: 'inmovil', sprite: 'muneco' },
  { id: 'jefe_muneco', name: 'Muñeco Jefe', hp: 60, atk: 0, def: 0, speed: 1, move: 0, jump: 0, skills: [], ai: 'inmovil', sprite: 'muneco', immunities: ['push'] },
];

export const R = makeTacticsRegistry({
  units: [...UNITS, ...TEST_UNITS],
  skills: [...SKILLS, ...TEST_SKILLS],
  prototypes: PROTOTYPES,
  terrains: TERRAINS,
});

/** Batalla mínima: tablero plano de losa w×h (o con alturas/terreno dados). */
export function mkDef(o: Partial<BattleDef> & { w?: number; h?: number }): BattleDef {
  const w = o.w ?? 6;
  const h = o.h ?? 6;
  return {
    id: o.id ?? 'test',
    name: 'Test',
    heights: o.heights ?? Array.from({ length: h }, () => '0'.repeat(w)),
    terrain: o.terrain ?? Array.from({ length: h }, () => 'l'.repeat(w)),
    legend: o.legend ?? { l: 'losa', m: 'muro', c: 'chatarra', w: 'canal', p: 'paja', a: 'antigravedad', v: 'respiradero', n: 'neon' },
    deploy: o.deploy ?? [{ x: 0, y: 0 }],
    units: o.units ?? [],
    objectives: o.objectives ?? [{ kind: 'survive', beeps: 99 }],
    defeat: o.defeat ?? [{ kind: 'partyWiped' }],
    ambiente: { emitters: [], props: [], parallax: 'parallax_piramide' },
    ...(o.interactables ? { interactables: o.interactables } : {}),
    ...(o.goteras ? { goteras: o.goteras } : {}),
    ...(o.prototypes ? { prototypes: o.prototypes } : {}),
    ...(o.triggers ? { triggers: o.triggers } : {}),
  };
}

export function start(def: BattleDef, roster: string[] = ['probador']): { state: BattleState; events: TacticalEvent[] } {
  return createBattle(def, { roster: roster.map((defId) => ({ defId })), seed: 7, registry: R });
}

export function act(s: BattleState, intent: TacticalIntent): { state: BattleState; events: TacticalEvent[] } {
  return dispatch(s, intent, R);
}

export function unit(s: BattleState, id: string): UnitState {
  const u = s.units.find((x) => x.id === id);
  if (!u) throw new Error(`no existe ${id}`);
  return u;
}

export function place(s: BattleState, id: string, pos: Pos, facing?: UnitState['facing']): void {
  const u = unit(s, id);
  u.pos = { ...pos };
  if (facing) u.facing = facing;
  if (s.turn?.unitId === id) s.turn.origin = { ...pos };
}

export function ofType<T extends TacticalEvent['type']>(events: TacticalEvent[], type: T): Extract<TacticalEvent, { type: T }>[] {
  return events.filter((e): e is Extract<TacticalEvent, { type: T }> => e.type === type);
}
