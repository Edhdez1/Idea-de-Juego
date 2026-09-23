import { describe, expect, it } from 'vitest';
import type { BattleState, TacticalEvent } from '../../../src/core/tactics/types';
import { act, mkDef, ofType, start, unit } from './helpers';

/** Espera turnos hasta que ocurra un evento del tipo dado (o se acabe la batalla). */
function waitUntil(s: BattleState, type: TacticalEvent['type'], max = 20) {
  const all: TacticalEvent[] = [];
  let st = s;
  for (let i = 0; i < max && st.phase === 'awaitingPlayer'; i++) {
    const r = act(st, { type: 'WAIT', facing: st.units.find((u) => u.id === st.turn!.unitId)!.facing });
    st = r.state;
    all.push(...r.events);
    if (r.events.some((e) => e.type === type)) break;
  }
  return { state: st, events: all };
}

describe('Prototipos', () => {
  it('colocar un prototipo lo añade al tablero y al Reloj de Vapor', () => {
    const s = start(mkDef({})).state;
    const r = act(s, { type: 'ACT', skillId: 't_proto', target: { x: 2, y: 0 } });
    expect(ofType(r.events, 'PrototypePlaced')).toEqual([
      { type: 'PrototypePlaced', id: 'prototipo_inestable#1', defId: 'prototipo_inestable', pos: { x: 2, y: 0 }, fuse: 3 },
    ]);
    expect(r.state.prototypes).toEqual([{ id: 'prototipo_inestable#1', defId: 'prototipo_inestable', pos: { x: 2, y: 0 }, owner: 'probador', remaining: 3 }]);
    expect(r.state.timeline.some((e) => e.ref.kind === 'prototype')).toBe(true);
    expect(() => act(r.state, { type: 'MOVE', to: { x: 2, y: 0 } })).toThrow();
  });

  it('cada instancia tiene su propia mecha', () => {
    const s = start(
      mkDef({
        w: 8,
        prototypes: [
          { defId: 'prototipo_inestable', pos: { x: 7, y: 0 } },
          { defId: 'prototipo_inestable', pos: { x: 7, y: 5 } },
        ],
      }),
    ).state;
    s.prototypes[1]!.remaining = 1;
    const r = waitUntil(s, 'PrototypeExploded');
    expect(ofType(r.events, 'PrototypeExploded').map((e) => e.id)).toEqual(['prototipo_inestable#2']);
    expect(r.state.prototypes.map((p) => p.id)).toEqual(['prototipo_inestable#1']);
    expect(r.state.prototypes[0]!.remaining).toBeLessThan(3);
    const ticks = ofType(r.events, 'FuseTicked');
    expect(ticks.find((t) => t.id === 'prototipo_inestable#2')!.remaining).toBe(0);
  });

  it('la explosión daña a todos los del área (fuego amigo), empuja hacia fuera y sube la Presión', () => {
    const s = start(
      mkDef({
        w: 8,
        h: 8,
        prototypes: [{ defId: 'prototipo_inestable', pos: { x: 4, y: 4 } }],
        units: [
          { defId: 'muneco', team: 'enemy', pos: { x: 5, y: 4 }, facing: 'NW', id: 'enemigo' },
          { defId: 'muneco', team: 'ally', pos: { x: 4, y: 3 }, facing: 'NW', id: 'aliado' },
        ],
      }),
    ).state;
    s.prototypes[0]!.remaining = 1;
    const r = waitUntil(s, 'PrototypeExploded');
    const ex = ofType(r.events, 'PrototypeExploded')[0]!;
    expect(ex.pos).toEqual({ x: 4, y: 4 });
    expect(ex.area).toHaveLength(5);
    expect(unit(r.state, 'enemigo').hp).toBe(60 - 8);
    expect(unit(r.state, 'aliado').hp).toBe(60 - 8);
    expect(unit(r.state, 'enemigo').pos).toEqual({ x: 6, y: 4 });
    expect(unit(r.state, 'aliado').pos).toEqual({ x: 4, y: 2 });
    expect(r.state.pressure).toBe(2);
    expect(r.state.prototypes).toHaveLength(0);
  });

  it('un prototipo atacado detona al instante (y a quien esté al lado le toca)', () => {
    const s = start(mkDef({ deploy: [{ x: 2, y: 2 }], prototypes: [{ defId: 'prototipo_inestable', pos: { x: 3, y: 2 } }] })).state;
    const r = act(s, { type: 'ACT', skillId: 't_golpe', target: { x: 3, y: 2 } });
    expect(ofType(r.events, 'PrototypeExploded')).toHaveLength(1);
    expect(unit(r.state, 'probador').hp).toBe(40 - 8);
    expect(unit(r.state, 'probador').pos).toEqual({ x: 1, y: 2 });
  });

  it('reacción en cadena en orden estable de id', () => {
    const s = start(
      mkDef({
        w: 8,
        deploy: [{ x: 0, y: 3 }],
        prototypes: [
          { defId: 'prototipo_inestable', pos: { x: 4, y: 3 } },
          { defId: 'prototipo_inestable', pos: { x: 3, y: 2 } },
          { defId: 'prototipo_inestable', pos: { x: 3, y: 4 } },
          { defId: 'prototipo_inestable', pos: { x: 6, y: 3 } },
        ],
      }),
    ).state;
    // La bomba en rombo sobre (3,3) alcanza a #1, #2 y #3; #4 queda lejos.
    const r = act(s, { type: 'ACT', skillId: 't_bomba', target: { x: 3, y: 3 } });
    expect(ofType(r.events, 'PrototypeExploded').map((e) => e.id)).toEqual([
      'prototipo_inestable#1',
      'prototipo_inestable#2',
      'prototipo_inestable#3',
    ]);
    expect(r.state.prototypes.map((p) => p.id)).toEqual(['prototipo_inestable#4']);
  });

  it('la cadena alcanza prototipos que solo toca otra explosión', () => {
    const s = start(
      mkDef({
        w: 8,
        deploy: [{ x: 0, y: 0 }],
        prototypes: [
          { defId: 'prototipo_inestable', pos: { x: 2, y: 0 } },
          { defId: 'prototipo_inestable', pos: { x: 3, y: 0 } },
          { defId: 'prototipo_inestable', pos: { x: 4, y: 0 } },
        ],
      }),
    ).state;
    const r = act(s, { type: 'ACT', skillId: 't_bomba', target: { x: 2, y: 1 } });
    expect(ofType(r.events, 'PrototypeExploded').map((e) => e.id)).toEqual([
      'prototipo_inestable#1',
      'prototipo_inestable#2',
      'prototipo_inestable#3',
    ]);
  });

  it('si explota la Desmontadora, la batalla se pierde (por mecha o por ataque)', () => {
    const def = mkDef({
      deploy: [{ x: 2, y: 2 }],
      prototypes: [{ defId: 'desmontadora', pos: { x: 3, y: 2 } }],
      objectives: [{ kind: 'survive', beeps: 99 }],
    });
    const s = start(def).state;
    const r = act(s, { type: 'ACT', skillId: 't_golpe', target: { x: 3, y: 2 } });
    expect(r.state.phase).toBe('defeat');
    expect(r.state.turn).toBeNull();
    expect(r.events.at(-1)).toEqual({ type: 'BattleEnded', result: 'defeat' });
    const s2 = start(def).state;
    s2.prototypes[0]!.remaining = 1;
    const w = waitUntil(s2, 'BattleEnded');
    expect(w.state.phase).toBe('defeat');
    expect(() => act(w.state, { type: 'WAIT', facing: 'SE' })).toThrow(/terminado/);
  });
});
