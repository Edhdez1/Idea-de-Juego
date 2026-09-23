import { describe, expect, it } from 'vitest';
import type { BattleDef, BattleState } from '../../../src/core/tactics/types';
import { act, mkDef, ofType, start, unit } from './helpers';

const enemyAt = (x: number, y: number, id: string, defId = 'muneco') => ({ defId, team: 'enemy' as const, pos: { x, y }, facing: 'NW' as const, id });

function waitUntilEnd(s: BattleState, max = 50) {
  let st = s;
  const events = [];
  for (let i = 0; i < max && st.phase === 'awaitingPlayer'; i++) {
    const r = act(st, { type: 'WAIT', facing: 'SE' });
    st = r.state;
    events.push(...r.events);
  }
  return { state: st, events };
}

describe('objetivos de victoria', () => {
  it('rout: sin hostiles en pie → victoria (turn pasa a null)', () => {
    const s = start(mkDef({ deploy: [{ x: 2, y: 2 }], objectives: [{ kind: 'rout' }], units: [enemyAt(3, 2, 'e')] })).state;
    unit(s, 'e').hp = 5;
    const r = act(s, { type: 'ACT', skillId: 't_golpe', target: { x: 3, y: 2 } });
    expect(r.state.phase).toBe('victory');
    expect(r.state.turn).toBeNull();
    expect(r.events.slice(-3)).toEqual([
      { type: 'UnitKO', unitId: 'e' },
      { type: 'ObjectiveMet', index: 0 },
      { type: 'BattleEnded', result: 'victory' },
    ]);
  });

  it('defeat: basta con derribar a las unidades indicadas', () => {
    const s = start(
      mkDef({ deploy: [{ x: 2, y: 2 }], objectives: [{ kind: 'defeat', unitIds: ['jefe'] }], units: [enemyAt(3, 2, 'jefe'), enemyAt(5, 5, 'esbirro')] }),
    ).state;
    unit(s, 'jefe').hp = 1;
    expect(act(s, { type: 'ACT', skillId: 't_golpe', target: { x: 3, y: 2 } }).state.phase).toBe('victory');
  });

  it('survive: aguantar N pitidos', () => {
    const s = start(mkDef({ objectives: [{ kind: 'survive', beeps: 2 }], units: [enemyAt(5, 5, 'e')] })).state;
    const { state } = waitUntilEnd(s);
    expect(state.phase).toBe('victory');
    expect(state.beeps).toBe(2);
  });

  it('reach: pisar la casilla da la victoria en el mismo MOVE', () => {
    const s = start(mkDef({ objectives: [{ kind: 'reach', tiles: [{ x: 2, y: 2 }] }], units: [enemyAt(5, 5, 'e')] })).state;
    const r = act(s, { type: 'MOVE', to: { x: 2, y: 2 } });
    expect(r.state.phase).toBe('victory');
    expect(ofType(r.events, 'BattleEnded')).toHaveLength(1);
  });

  it('interact y objetivos múltiples: se quedan cumplidos y la victoria llega con el último', () => {
    const def: BattleDef = mkDef({
      objectives: [
        { kind: 'reach', tiles: [{ x: 1, y: 0 }] },
        { kind: 'interact', tile: { x: 2, y: 0 } },
      ],
      interactables: [{ pos: { x: 2, y: 0 }, id: 'archivador' }],
      units: [enemyAt(5, 5, 'e')],
    });
    const s = start(def).state;
    const r1 = act(s, { type: 'MOVE', to: { x: 1, y: 0 } });
    expect(ofType(r1.events, 'ObjectiveMet')).toEqual([{ type: 'ObjectiveMet', index: 0 }]);
    expect(r1.state.phase).toBe('awaitingPlayer');
    const r2 = act(r1.state, { type: 'INTERACT', tile: { x: 2, y: 0 } });
    expect(ofType(r2.events, 'ObjectiveMet')).toEqual([{ type: 'ObjectiveMet', index: 1 }]);
    expect(r2.state.phase).toBe('victory');
  });
});

describe('derrota', () => {
  it('la derrota tiene prioridad sobre la victoria', () => {
    const s = start(
      mkDef({
        deploy: [{ x: 1, y: 2 }],
        objectives: [{ kind: 'rout' }],
        defeat: [{ kind: 'partyWiped' }, { kind: 'unitDown', unitId: 'vendedor' }],
        units: [enemyAt(3, 3, 'e'), { defId: 'muneco', team: 'ally', pos: { x: 3, y: 2 }, facing: 'NW', id: 'vendedor' }],
      }),
    ).state;
    unit(s, 'e').hp = 1;
    unit(s, 'vendedor').hp = 1;
    // Bomba en rombo: mata al último enemigo y al vendedor a la vez.
    const r = act(s, { type: 'ACT', skillId: 't_bomba', target: { x: 3, y: 3 } });
    expect(r.state.phase).toBe('defeat');
    expect(ofType(r.events, 'ObjectiveMet')).toHaveLength(0);
  });

  it('ambos bandos aniquilados (Sobrecarga) → derrota', () => {
    const s = start(mkDef({ objectives: [{ kind: 'rout' }], units: [enemyAt(5, 5, 'e')] })).state;
    s.pressure = 9;
    unit(s, 'probador').hp = 3;
    unit(s, 'e').hp = 3;
    const r = act(s, { type: 'ACT', skillId: 't_caldera', target: { x: 0, y: 0 } });
    expect(r.state.phase).toBe('defeat');
  });

  it('límite de pitidos', () => {
    const s = start(mkDef({ defeat: [{ kind: 'partyWiped' }, { kind: 'beepLimit', beeps: 1 }], units: [enemyAt(5, 5, 'e')] })).state;
    const { state, events } = waitUntilEnd(s);
    expect(state.phase).toBe('defeat');
    expect(state.beeps).toBe(1);
    expect(events.at(-1)).toEqual({ type: 'BattleEnded', result: 'defeat' });
  });
});

describe('disparadores de diálogo', () => {
  it('start, hpBelow y beep se disparan una sola vez', () => {
    const def = mkDef({
      deploy: [{ x: 2, y: 2 }],
      units: [enemyAt(3, 2, 'e')],
      triggers: [
        { when: { kind: 'start' }, script: 'inicio' },
        { when: { kind: 'hpBelow', unitId: 'e', pct: 90 }, script: 'herido' },
        { when: { kind: 'beep', n: 1 }, script: 'pitido' },
      ],
    });
    const c = start(def);
    expect(ofType(c.events, 'Dialogue')).toEqual([{ type: 'Dialogue', script: 'inicio' }]);
    const r1 = act(c.state, { type: 'ACT', skillId: 't_golpe', target: { x: 3, y: 2 } });
    expect(ofType(r1.events, 'Dialogue')).toEqual([{ type: 'Dialogue', script: 'herido' }]);
    let st = r1.state;
    const all = [];
    for (let i = 0; i < 6; i++) {
      const r = act(st, { type: 'WAIT', facing: 'SE' });
      all.push(...r.events);
      st = r.state;
    }
    expect(ofType(all, 'Dialogue')).toEqual([{ type: 'Dialogue', script: 'pitido' }]);
    expect(st.firedTriggers.sort()).toEqual([0, 1, 2]);
  });
});
