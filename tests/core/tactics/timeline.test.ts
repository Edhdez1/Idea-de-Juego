import { describe, expect, it } from 'vitest';
import { CT_READY, CT_WAIT_BONUS } from '../../../src/core/shared/constants';
import { predictOrder, reachable } from '../../../src/core/tactics/queries';
import { advanceTimeline, ctAfterTurn } from '../../../src/core/tactics/timeline';
import type { BattleState, Team, TimelineEntry, TimelineRef } from '../../../src/core/tactics/types';
import { act, mkDef, ofType, R, start } from './helpers';

const unitE = (id: string, speed: number, ct = 0): TimelineEntry => ({ ref: { kind: 'unit', id }, ct, speed });
const teams = (id: string): Team => (id.startsWith('p') ? 'player' : 'enemy');

describe('Reloj de Vapor: orden', () => {
  it('actúa primero quien antes llega a CT_READY (más velocidad)', () => {
    const tl = [unitE('e_lento', 8), unitE('e_rapido', 12)];
    expect(advanceTimeline(tl, teams).ref.id).toBe('e_rapido');
    // Avanza el mínimo k: ceil(100/12) = 9 ticks.
    expect(tl.map((e) => e.ct)).toEqual([72, 108]);
  });

  it('empates: más CT, más velocidad, mechas → reloj → unidades, jugador antes que IA, id estable', () => {
    const at = (list: TimelineEntry[]) => advanceTimeline(list, teams).ref;
    expect(at([unitE('e_a', 10, 100), unitE('e_b', 10, 110)]).id).toBe('e_b');
    expect(at([unitE('e_a', 10, 100), unitE('e_b', 12, 100)]).id).toBe('e_b');
    const mixed: TimelineEntry[] = [
      unitE('p_heroe', 10, CT_READY),
      { ref: { kind: 'clock', id: 'coso' }, ct: CT_READY, speed: 10 },
      { ref: { kind: 'prototype', id: 'proto#1' }, ct: CT_READY, speed: 10 },
    ];
    expect(at(mixed).kind).toBe('prototype');
    expect(at(mixed.slice(0, 2)).kind).toBe('clock');
    expect(at([unitE('e_malo', 10, 100), unitE('p_bueno', 10, 100)]).id).toBe('p_bueno');
    expect(at([unitE('e_b#10', 10, 100), unitE('e_b#2', 10, 100)]).id).toBe('e_b#2');
  });

  it('CT al terminar el turno: 0 si movió y actuó, +20 por cada cosa que no hizo', () => {
    expect(ctAfterTurn(true, true)).toBe(0);
    expect(ctAfterTurn(true, false)).toBe(CT_WAIT_BONUS);
    expect(ctAfterTurn(false, true)).toBe(CT_WAIT_BONUS);
    expect(ctAfterTurn(false, false)).toBe(2 * CT_WAIT_BONUS);
  });

  it('esperar sin mover ni actuar adelanta el siguiente turno', () => {
    // Probador (vel. 20) y reloj (vel. 10). Tras el primer turno el reloj va por 50.
    const def = mkDef({ units: [{ defId: 'muneco', team: 'enemy', pos: { x: 5, y: 5 }, facing: 'NW' }] });
    const s0 = start(def).state;
    const clock = (s: BattleState) => s.timeline.find((e) => e.ref.kind === 'clock')!.ct;
    expect(clock(s0)).toBe(50);
    // Sin mover ni actuar: CT 40 → 3 ticks → reloj 80.
    expect(clock(act(s0, { type: 'WAIT', facing: 'SE' }).state)).toBe(80);
    // Solo mover: CT 20 → 4 ticks → reloj 90.
    const moved = act(s0, { type: 'MOVE', to: { x: 1, y: 0 } }).state;
    expect(clock(act(moved, { type: 'WAIT', facing: 'SE' }).state)).toBe(90);
    // Mover y actuar: CT 0 → 5 ticks → reloj a 100, empatado en CT con el
    // Probador, que gana por velocidad (20 > 10): el reloj pitará justo después.
    const both = act(moved, { type: 'ACT', skillId: 't_caldera', target: { x: 1, y: 0 } }).state;
    const after = act(both, { type: 'WAIT', facing: 'SE' });
    expect(clock(after.state)).toBe(100);
    expect(after.state.beeps).toBe(0);
    expect(ofType(after.events, 'TurnStarted').map((e) => e.ref.kind)).toEqual(['unit']);
    expect(predictOrder(after.state, 1)).toEqual([{ kind: 'clock', id: 'coso' }]);
  });
});

describe('Reloj de Vapor: predicción', () => {
  it('predictOrder coincide con lo que pasa de verdad tras varios turnos', () => {
    const def = mkDef({
      w: 8,
      h: 8,
      deploy: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      prototypes: [{ defId: 'prototipo_inestable', pos: { x: 7, y: 7 } }],
    });
    let s = start(def, ['probador', 'ingeniera']).state;
    // Cada turno: mover dentro del rincón y usar la Válvula (autoobjetivo).
    const playTurn = (st: BattleState, withWait: boolean) => {
      const id = st.turn!.unitId;
      const u = st.units.find((x) => x.id === id)!;
      const dest = reachable(st, id, R).find((t) => (t.pos.x !== u.pos.x || t.pos.y !== u.pos.y) && t.pos.x <= 2 && t.pos.y <= 2)!;
      let r = act(st, { type: 'MOVE', to: dest.pos });
      r = act(r.state, { type: 'ACT', skillId: 'valvula_de_escape', target: dest.pos });
      return withWait ? act(r.state, { type: 'WAIT', facing: 'SE' }) : r;
    };
    // Dar brío suficiente a todos (la Válvula cuesta 1).
    for (const u of s.units) u.brio = 5;
    s = playTurn(s, false).state;
    const predicted = predictOrder(s, 20);
    const actual: TimelineRef[] = [];
    let r = act(s, { type: 'WAIT', facing: 'SE' });
    actual.push(...ofType(r.events, 'TurnStarted').map((e) => e.ref));
    while (actual.length < 20) {
      for (const u of r.state.units) u.brio = 5;
      r = playTurn(r.state, true);
      actual.push(...ofType(r.events, 'TurnStarted').map((e) => e.ref));
    }
    expect(actual.slice(0, 20)).toEqual(predicted);
    // La mecha aparece tantas veces como le quedan y luego desaparece.
    expect(predicted.filter((x) => x.kind === 'prototype')).toHaveLength(s.prototypes[0]!.remaining);
    expect(r.state.prototypes).toHaveLength(0);
    expect(predicted.some((x) => x.kind === 'clock')).toBe(true);
  });
});
