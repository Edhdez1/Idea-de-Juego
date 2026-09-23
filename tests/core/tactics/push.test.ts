import { describe, expect, it } from 'vitest';
import { COLLISION_DAMAGE, FALL_DAMAGE_PER_LEVEL } from '../../../src/core/shared/constants';
import type { BattleDef } from '../../../src/core/tactics/types';
import { act, mkDef, ofType, start, unit } from './helpers';

/** Probador en (2,2) empuja 3 casillas hacia +x al muñeco de (3,2). */
function pushScene(extra: Partial<BattleDef> & { w?: number } = {}, enemy = 'muneco') {
  const def = mkDef({
    deploy: [{ x: 2, y: 2 }],
    ...extra,
    units: [{ defId: enemy, team: 'enemy', pos: { x: 3, y: 2 }, facing: 'NW', id: 'blanco' }, ...(extra.units ?? [])],
  });
  const s = start(def).state;
  return act(s, { type: 'ACT', skillId: 't_empuje', target: { x: 3, y: 2 } });
}

const row2 = (r: string) => ['llllll', 'llllll', r, 'llllll', 'llllll', 'llllll'];
const h2 = (r: string) => ['000000', '000000', r, '000000', '000000', '000000'];

describe('empuje', () => {
  it('sin obstáculos recorre toda la distancia', () => {
    const { state, events } = pushScene({ w: 8 });
    expect(unit(state, 'blanco').pos).toEqual({ x: 6, y: 2 });
    expect(ofType(events, 'Pushed')).toEqual([{ type: 'Pushed', unitId: 'blanco', from: { x: 3, y: 2 }, to: { x: 6, y: 2 } }]);
    expect(ofType(events, 'Damaged')).toHaveLength(0);
  });

  it('contra un muro: se para delante y recibe daño de choque', () => {
    const { state, events } = pushScene({ terrain: row2('lllllm') });
    expect(unit(state, 'blanco').pos).toEqual({ x: 4, y: 2 });
    expect(ofType(events, 'Pushed')[0]!.hit).toBe('wall');
    expect(unit(state, 'blanco').hp).toBe(60 - COLLISION_DAMAGE);
  });

  it('contra otra unidad: daño de choque a ambas', () => {
    const { state, events } = pushScene({
      units: [{ defId: 'muneco', team: 'enemy', pos: { x: 5, y: 2 }, facing: 'NW', id: 'otro' }],
    });
    const p = ofType(events, 'Pushed')[0]!;
    expect(p).toMatchObject({ to: { x: 4, y: 2 }, hit: 'unit', otherId: 'otro' });
    expect(unit(state, 'blanco').hp).toBe(60 - COLLISION_DAMAGE);
    expect(unit(state, 'otro').hp).toBe(60 - COLLISION_DAMAGE);
  });

  it('contra el borde del mapa: choque', () => {
    const { state, events } = pushScene();
    expect(unit(state, 'blanco').pos).toEqual({ x: 5, y: 2 });
    expect(ofType(events, 'Pushed')[0]!.hit).toBe('edge');
    expect(unit(state, 'blanco').hp).toBe(60 - COLLISION_DAMAGE);
  });

  it('una subida de más de 1 nivel frena como un muro; de 1 nivel se sube', () => {
    const a = pushScene({ heights: h2('000002') });
    expect(unit(a.state, 'blanco').pos).toEqual({ x: 4, y: 2 });
    expect(ofType(a.events, 'Pushed')[0]!.hit).toBe('wall');
    const b = pushScene({ w: 8, heights: ['00000000', '00000000', '00001000', '00000000', '00000000', '00000000'], terrain: Array(6).fill('llllllll') });
    expect(unit(b.state, 'blanco').pos).toEqual({ x: 6, y: 2 });
  });

  it('caída de más de 1 nivel: (niveles − 1) × 3 de daño; la paja la amortigua', () => {
    const def = (terrain?: string[]) =>
      mkDef({
        deploy: [{ x: 1, y: 2 }],
        heights: h2('013000'),
        ...(terrain ? { terrain } : {}),
        units: [{ defId: 'muneco', team: 'enemy', pos: { x: 2, y: 2 }, facing: 'NW', id: 'blanco' }],
      });
    const s = start(def()).state;
    const r = act(s, { type: 'ACT', skillId: 't_empuje', target: { x: 2, y: 2 } });
    expect(unit(r.state, 'blanco').pos).toEqual({ x: 5, y: 2 });
    expect(ofType(r.events, 'Fell')).toEqual([{ type: 'Fell', unitId: 'blanco', levels: 3 }]);
    expect(ofType(r.events, 'Damaged')).toMatchObject([{ amount: 2 * FALL_DAMAGE_PER_LEVEL, source: 'fall' }]);
    const s2 = start(def(row2('lllpll'))).state;
    const r2 = act(s2, { type: 'ACT', skillId: 't_empuje', target: { x: 2, y: 2 } });
    expect(ofType(r2.events, 'Fell')).toHaveLength(1);
    expect(ofType(r2.events, 'Damaged')).toHaveLength(0);
  });

  it('al canal: baja administrativa (sale de la batalla y del reloj)', () => {
    const { state, events } = pushScene({ terrain: row2('llllwl') });
    const b = unit(state, 'blanco');
    expect(b.removed).toBe(true);
    expect(b.pos).toEqual({ x: 4, y: 2 });
    expect(ofType(events, 'UnitRemoved')).toEqual([{ type: 'UnitRemoved', unitId: 'blanco' }]);
    expect(state.timeline.some((e) => e.ref.id === 'blanco')).toBe(false);
  });

  it('los jefes son inmunes al empuje', () => {
    const { state, events } = pushScene({ terrain: row2('llllwl') }, 'jefe_muneco');
    expect(unit(state, 'blanco').pos).toEqual({ x: 3, y: 2 });
    expect(ofType(events, 'Pushed')).toHaveLength(0);
  });

  it('empujar un prototipo lo mueve (sin detonarlo)', () => {
    const def = mkDef({ deploy: [{ x: 2, y: 2 }], prototypes: [{ defId: 'prototipo_inestable', pos: { x: 3, y: 2 } }] });
    const s = start(def).state;
    const r = act(s, { type: 'ACT', skillId: 't_empuje', target: { x: 3, y: 2 } });
    expect(ofType(r.events, 'PrototypePushed')).toEqual([
      { type: 'PrototypePushed', id: 'prototipo_inestable#1', from: { x: 3, y: 2 }, to: { x: 5, y: 2 } },
    ]);
    expect(r.state.prototypes[0]!.pos).toEqual({ x: 5, y: 2 });
    expect(ofType(r.events, 'PrototypeExploded')).toHaveLength(0);
  });

  it('una unidad empujada contra un prototipo choca (y el prototipo no sufre)', () => {
    const { state, events } = pushScene({ prototypes: [{ defId: 'prototipo_inestable', pos: { x: 5, y: 2 } }] });
    expect(ofType(events, 'Pushed')[0]).toMatchObject({ to: { x: 4, y: 2 }, hit: 'unit', otherId: 'prototipo_inestable#1' });
    expect(unit(state, 'blanco').hp).toBe(60 - COLLISION_DAMAGE);
    expect(state.prototypes).toHaveLength(1);
  });
});
