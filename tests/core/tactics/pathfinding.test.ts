import { describe, expect, it } from 'vitest';
import { reachable } from '../../../src/core/tactics/queries';
import { act, mkDef, R, start } from './helpers';

const reachSet = (s: Parameters<typeof reachable>[0], id = 'probador') =>
  new Set(reachable(s, id, R).map((t) => `${t.pos.x},${t.pos.y}`));

describe('pathfinding: salto y caída', () => {
  it('sube si dh ≤ salto (2) y no si dh = 3', () => {
    const a = start(mkDef({ w: 3, h: 1, heights: ['020'] })).state;
    expect(reachSet(a).has('1,0')).toBe(true);
    const b = start(mkDef({ w: 3, h: 1, heights: ['030'] })).state;
    expect(reachSet(b).has('1,0')).toBe(false);
    expect(reachSet(b).has('2,0')).toBe(false);
  });

  it('baja si −dh ≤ salto + 2 (4) y no si son 5', () => {
    const a = start(mkDef({ w: 3, h: 1, heights: ['400'] })).state;
    expect(reachSet(a).has('1,0')).toBe(true);
    const b = start(mkDef({ w: 3, h: 1, heights: ['500'] })).state;
    expect(reachSet(b).has('1,0')).toBe(false);
  });

  it('la antigravedad de la casilla de salida suma +2 al salto', () => {
    const s = start(mkDef({ w: 2, h: 1, heights: ['04'], terrain: ['al'] })).state;
    expect(reachSet(s).has('1,0')).toBe(true);
  });
});

describe('pathfinding: coste y obstáculos', () => {
  it('la chatarra cuesta 2 y el muro es impasable', () => {
    const a = start(mkDef({ w: 5, h: 1, terrain: ['lcccl'] })).state;
    const tiles = reachable(a, 'probador', R);
    expect(tiles.find((t) => t.pos.x === 2)?.cost).toBe(4);
    expect(tiles.some((t) => t.pos.x === 3)).toBe(false); // coste 6 > movimiento 5
    const b = start(mkDef({ w: 5, h: 1, terrain: ['lmlll'] })).state;
    expect(reachSet(b)).toEqual(new Set(['0,0']));
  });

  it('las unidades hostiles bloquean el paso', () => {
    const s = start(
      mkDef({ w: 5, h: 1, units: [{ defId: 'muneco', team: 'enemy', pos: { x: 2, y: 0 }, facing: 'NW' }] }),
    ).state;
    const set = reachSet(s);
    expect(set.has('1,0')).toBe(true);
    expect(set.has('2,0')).toBe(false);
    expect(set.has('3,0')).toBe(false);
  });

  it('los aliados se atraviesan pero no se puede terminar encima', () => {
    const s = start(
      mkDef({ w: 5, h: 1, units: [{ defId: 'muneco', team: 'ally', pos: { x: 2, y: 0 }, facing: 'NW' }] }),
    ).state;
    const set = reachSet(s);
    expect(set.has('2,0')).toBe(false);
    expect(set.has('3,0')).toBe(true);
    expect(() => act(s, { type: 'MOVE', to: { x: 2, y: 0 } })).toThrow(/No se puede llegar/);
  });

  it('los prototipos ocupan su casilla', () => {
    const s = start(mkDef({ w: 5, h: 1, prototypes: [{ defId: 'prototipo_inestable', pos: { x: 2, y: 0 } }] })).state;
    expect(reachSet(s).has('3,0')).toBe(false);
  });
});

describe('pathfinding: caminos', () => {
  it('el camino empieza en el origen, es contiguo y termina en el destino', () => {
    const s = start(mkDef({})).state;
    const dest = reachable(s, 'probador', R).find((t) => t.pos.x === 2 && t.pos.y === 3)!;
    expect(dest.cost).toBe(5);
    expect(dest.path[0]).toEqual({ x: 0, y: 0 });
    expect(dest.path.at(-1)).toEqual({ x: 2, y: 3 });
    expect(dest.path).toHaveLength(6);
    for (let i = 1; i < dest.path.length; i++) {
      const a = dest.path[i - 1]!;
      const b = dest.path[i]!;
      expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
    }
    const moved = act(s, { type: 'MOVE', to: { x: 2, y: 3 } });
    const ev = moved.events.find((e) => e.type === 'UnitMoved');
    expect(ev).toEqual({ type: 'UnitMoved', unitId: 'probador', path: dest.path });
  });

  it('es determinista (mismo resultado en dos llamadas) e incluye la casilla propia con coste 0', () => {
    const s = start(mkDef({ heights: ['012210', '012210', '000000', '333000', '000000', '000000'] })).state;
    const a = reachable(s, 'probador', R);
    expect(a).toEqual(reachable(s, 'probador', R));
    expect(a[0]).toEqual({ pos: { x: 0, y: 0 }, cost: 0, path: [{ x: 0, y: 0 }] });
  });

  it('mover una vez por turno; deshacer solo si no ha actuado', () => {
    const s0 = start(mkDef({ units: [{ defId: 'muneco', team: 'enemy', pos: { x: 3, y: 0 }, facing: 'NW' }] })).state;
    const s1 = act(s0, { type: 'MOVE', to: { x: 2, y: 0 } }).state;
    expect(() => act(s1, { type: 'MOVE', to: { x: 1, y: 0 } })).toThrow(/ya se ha movido/);
    expect(reachable(s1, 'probador', R)).toHaveLength(1);
    const undone = act(s1, { type: 'UNDO_MOVE' });
    expect(undone.state.units[0]!.pos).toEqual({ x: 0, y: 0 });
    expect(undone.state.turn!.moved).toBe(false);
    const s2 = act(s1, { type: 'ACT', skillId: 't_golpe', target: { x: 3, y: 0 } }).state;
    expect(() => act(s2, { type: 'UNDO_MOVE' })).toThrow(/después de actuar/);
    // Actuar y luego mover también vale.
    const s3 = act(s0, { type: 'ACT', skillId: 't_bomba', target: { x: 3, y: 0 } }).state;
    expect(act(s3, { type: 'MOVE', to: { x: 0, y: 3 } }).state.units[0]!.pos).toEqual({ x: 0, y: 3 });
  });
});
