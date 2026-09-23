import { describe, expect, it } from 'vitest';
import * as api from '../../../src/core/tactics';
import { act, mkDef, R, start } from './helpers';

describe('API del motor táctico', () => {
  it('exporta el contrato', () => {
    for (const fn of ['createBattle', 'dispatch', 'makeTacticsRegistry', 'reachable', 'validTargets', 'areaOf', 'previewDamage', 'predictOrder', 'forecast', 'dangerZone', 'unitAt', 'tileAt', 'activeUnit']) {
      expect(typeof (api as Record<string, unknown>)[fn], fn).toBe('function');
    }
  });

  it('dispatch no muta el estado de entrada', () => {
    const s = start(mkDef({ deploy: [{ x: 2, y: 2 }], units: [{ defId: 'muneco', team: 'enemy', pos: { x: 3, y: 2 }, facing: 'NW' }] })).state;
    const before = JSON.stringify(s);
    act(s, { type: 'ACT', skillId: 't_bomba', target: { x: 3, y: 2 } });
    act(s, { type: 'MOVE', to: { x: 0, y: 0 } });
    act(s, { type: 'WAIT', facing: 'NE' });
    expect(JSON.stringify(s)).toBe(before);
  });

  it('los intents inválidos lanzan errores en español', () => {
    const s = start(mkDef({ deploy: [{ x: 2, y: 2 }], units: [{ defId: 'muneco', team: 'enemy', pos: { x: 5, y: 5 }, facing: 'NW' }] })).state;
    expect(() => act(s, { type: 'MOVE', to: { x: 9, y: 9 } })).toThrow(/fuera del tablero/);
    expect(() => act(s, { type: 'MOVE', to: { x: 2, y: 2 } })).toThrow(/ya está en esa casilla/);
    expect(() => act(s, { type: 'ACT', skillId: 'golpe_de_llave', target: { x: 3, y: 2 } })).toThrow(/no conoce/);
    expect(() => act(s, { type: 'ACT', skillId: 't_golpe', target: { x: 5, y: 5 } })).toThrow(/fuera de alcance/);
    expect(() => act(s, { type: 'ACT', skillId: 't_golpe', target: { x: 3, y: 2 } })).toThrow(/no válido/);
    expect(() => act(s, { type: 'ACT', skillId: 't_caro', target: { x: 3, y: 2 } })).toThrow(/Brío insuficiente/);
    expect(() => act(s, { type: 'UNDO_MOVE' })).toThrow(/No hay movimiento/);
  });

  it('consultas: validTargets, areaOf, unitAt, tileAt, activeUnit', () => {
    const s = start(mkDef({ deploy: [{ x: 2, y: 2 }], units: [{ defId: 'muneco', team: 'enemy', pos: { x: 3, y: 2 }, facing: 'NW' }] })).state;
    expect(api.validTargets(s, 'probador', 't_golpe', R)).toEqual([{ x: 3, y: 2 }]);
    expect(api.areaOf(s, 'probador', 't_bomba', { x: 4, y: 2 }, R)).toHaveLength(5);
    expect(api.unitAt(s, { x: 3, y: 2 })!.id).toBe('muneco');
    expect(api.tileAt(s, { x: 0, y: 0 })).toEqual({ h: 0, terrain: 'losa' });
    expect(api.tileAt(s, { x: -1, y: 0 })).toBeUndefined();
    expect(api.activeUnit(s)!.id).toBe('probador');
    expect(api.predictOrder(s, 3)).toHaveLength(3);
  });

  it('áreas: casilla, línea (dirección atacante → objetivo) y cruz', () => {
    const s = start(mkDef({ w: 8, h: 8, deploy: [{ x: 1, y: 1 }] })).state;
    expect(api.areaOf(s, 'probador', 't_golpe', { x: 1, y: 2 }, R)).toEqual([{ x: 1, y: 2 }]);
    const line = api.areaOf(start(mkDef({ w: 8, h: 8, deploy: [{ x: 1, y: 1 }] }), ['historiadora']).state, 'historiadora', 'cita_textual', { x: 2, y: 1 }, R);
    expect(line).toEqual([
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ]);
    const sermon = api.areaOf(start(mkDef({ w: 8, h: 8, deploy: [{ x: 1, y: 1 }] }), ['clerigo']).state, 'clerigo', 'sermon_interminable', { x: 3, y: 3 }, R);
    expect(sermon).toEqual([
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
    ]);
  });

  it('ataque desde lo alto: +1 de alcance máximo con highGroundBonus', () => {
    const mk = (h: string) =>
      start(
        mkDef({ w: 8, h: 1, heights: [h], deploy: [{ x: 0, y: 0 }], units: [{ defId: 'muneco', team: 'enemy', pos: { x: 5, y: 0 }, facing: 'NW' }] }),
        ['ingeniera'],
      ).state;
    expect(api.validTargets(mk('00000000'), 'ingeniera', 'pistola_de_remaches', R)).toEqual([]);
    expect(api.validTargets(mk('20000000'), 'ingeniera', 'pistola_de_remaches', R)).toEqual([{ x: 5, y: 0 }]);
  });

  it('cuerpo a cuerpo exige |dh| ≤ 2', () => {
    const s = start(
      mkDef({ w: 3, h: 1, heights: ['030'], deploy: [{ x: 0, y: 0 }], units: [{ defId: 'muneco', team: 'enemy', pos: { x: 1, y: 0 }, facing: 'NW' }] }),
    ).state;
    expect(api.validTargets(s, 'probador', 't_golpe', R)).toEqual([]);
  });
});
