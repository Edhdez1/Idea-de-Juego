import { describe, expect, it } from 'vitest';
import { OVERLOAD_DAMAGE } from '../../../src/core/shared/constants';
import { previewDamage } from '../../../src/core/tactics/queries';
import { act, mkDef, ofType, R, start, unit } from './helpers';

function scene() {
  return start(
    mkDef({
      deploy: [{ x: 2, y: 2 }],
      units: [
        { defId: 'muneco', team: 'enemy', pos: { x: 3, y: 2 }, facing: 'NW', id: 'enemigo' },
        { defId: 'muneco', team: 'ally', pos: { x: 0, y: 5 }, facing: 'NW', id: 'aliado' },
      ],
      interactables: [{ pos: { x: 2, y: 3 }, id: 'valvula' }],
    }),
  ).state;
}

describe('Presión y Sobrecarga', () => {
  it('sube con efectos y avisa con PressureChanged', () => {
    const s = scene();
    const r = act(s, { type: 'ACT', skillId: 't_caldera', target: { x: 2, y: 2 } });
    expect(r.state.pressure).toBe(3);
    expect(ofType(r.events, 'PressureChanged')).toEqual([{ type: 'PressureChanged', from: 0, to: 3 }]);
  });

  it('al llegar a 10: Sobrecarga de 8 a TODOS (aliados y uno mismo incluidos) y vuelta a 0', () => {
    const s = scene();
    s.pressure = 8;
    unit(s, 'aliado').block = 5;
    const r = act(s, { type: 'ACT', skillId: 't_caldera', target: { x: 2, y: 2 } });
    expect(r.state.pressure).toBe(0);
    const types = r.events.map((e) => e.type);
    expect(types.slice(types.indexOf('PressureChanged'))).toEqual([
      'PressureChanged',
      'Overload',
      'Damaged',
      'Damaged',
      'Damaged',
      'PressureChanged',
    ]);
    expect(ofType(r.events, 'Overload')[0]).toEqual({ type: 'Overload', damage: OVERLOAD_DAMAGE, hit: ['aliado', 'enemigo', 'probador'] });
    expect(unit(r.state, 'probador').hp).toBe(40 - 8);
    expect(unit(r.state, 'enemigo').hp).toBe(60 - 8);
    expect(unit(r.state, 'aliado').hp).toBe(60 - 3); // el blindaje absorbe 5
  });

  it('Válvula de Escape: Presión a 0 y 2 de blindaje por punto purgado', () => {
    const s = scene();
    s.pressure = 6;
    const r = act(s, { type: 'ACT', skillId: 'valvula_de_escape', target: { x: 2, y: 2 } });
    expect(r.state.pressure).toBe(0);
    expect(unit(r.state, 'probador').block).toBe(12);
  });

  it('interactuar con una válvula del mapa purga 3 y cuenta como acción', () => {
    const s = scene();
    s.pressure = 5;
    const r = act(s, { type: 'INTERACT', tile: { x: 2, y: 3 } });
    expect(r.state.pressure).toBe(2);
    expect(r.state.interacted).toEqual(['2,3']);
    expect(r.state.turn!.acted).toBe(true);
    expect(ofType(r.events, 'Interacted')).toEqual([{ type: 'Interacted', unitId: 'probador', tile: { x: 2, y: 3 }, id: 'valvula' }]);
    expect(() => act(r.state, { type: 'ACT', skillId: 't_golpe', target: { x: 3, y: 2 } })).toThrow(/ya ha actuado/);
    expect(() => act(s, { type: 'INTERACT', tile: { x: 0, y: 0 } })).toThrow(/nada con lo que interactuar/);
  });

  it('Sobremarcha: +2 de Presión antes y efectos numéricos ×2', () => {
    const s = scene();
    const prev = previewDamage(s, 'probador', 't_vapor', { x: 3, y: 2 }, R, true);
    const r = act(s, { type: 'ACT', skillId: 't_vapor', target: { x: 3, y: 2 }, overclock: true });
    expect(r.state.pressure).toBe(2);
    expect(unit(r.state, 'enemigo').hp).toBe(60 - 20);
    expect(prev[0]!.amount).toBe(20);
    expect(() => act(s, { type: 'ACT', skillId: 't_golpe', target: { x: 3, y: 2 }, overclock: true })).toThrow(/Sobremarcha/);
  });

  it('Sobremarcha que provoca Sobrecarga: primero la Sobrecarga, luego el golpe doble (ya sin caldera)', () => {
    const s = scene();
    s.pressure = 8;
    const r = act(s, { type: 'ACT', skillId: 't_vapor', target: { x: 3, y: 2 }, overclock: true });
    const types = r.events.map((e) => e.type);
    expect(types.indexOf('Overload')).toBeLessThan(types.lastIndexOf('Damaged'));
    expect(r.state.pressure).toBe(0);
    expect(unit(r.state, 'enemigo').hp).toBe(60 - 8 - 20);
    expect(unit(r.state, 'probador').hp).toBe(40 - 8);
  });
});
