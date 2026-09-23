import { describe, expect, it } from 'vitest';
import { dangerZone, forecast } from '../../../src/core/tactics/queries';
import type { BattleState } from '../../../src/core/tactics/types';
import { act, mkDef, ofType, R, start, unit } from './helpers';

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

describe('IA por utilidad', () => {
  it('remata: prefiere el golpe que deja KO', () => {
    const s = start(
      mkDef({
        w: 8,
        h: 8,
        deploy: [
          { x: 4, y: 2 },
          { x: 2, y: 2 },
        ],
        units: [{ defId: 'cobrador_cuotas', team: 'enemy', pos: { x: 3, y: 2 }, facing: 'NE' }],
      }),
      ['clerigo', 'ingeniera'],
    ).state;
    unit(s, 'ingeniera').hp = 5;
    const plan = forecast(s, 'cobrador_cuotas', R)!;
    expect(plan.skillId).toBe('embargo_preventivo');
    expect(plan.target).toEqual({ x: 2, y: 2 });
  });

  it('evita las casillas de una explosión telegrafiada', () => {
    const def = (remaining: number) => {
      const s = start(
        mkDef({
          w: 8,
          h: 3,
          deploy: [{ x: 0, y: 0 }],
          units: [{ defId: 'cobrador_cuotas', team: 'enemy', pos: { x: 6, y: 0 }, facing: 'NW' }],
          prototypes: [{ defId: 'prototipo_inestable', pos: { x: 3, y: 1 } }],
        }),
      ).state;
      s.prototypes[0]!.remaining = remaining;
      return s;
    };
    const calm = forecast(def(3), 'cobrador_cuotas', R)!;
    expect(calm.moveTo).toEqual({ x: 3, y: 0 });
    const tense = def(1);
    const plan = forecast(tense, 'cobrador_cuotas', R)!;
    const danger = dangerZone(tense, 'enemy', R);
    expect(danger).toContainEqual({ x: 3, y: 0 });
    expect(danger.some((d) => d.x === plan.moveTo.x && d.y === plan.moveTo.y)).toBe(false);
  });

  it('el cobarde huye con menos del 50 % de vida (y ataca si está sano)', () => {
    const mk = () =>
      start(
        mkDef({
          w: 8,
          h: 8,
          deploy: [{ x: 3, y: 3 }],
          units: [{ defId: 'aprendiz_explotado', team: 'enemy', pos: { x: 4, y: 3 }, facing: 'NW' }],
        }),
      ).state;
    const healthy = forecast(mk(), 'aprendiz_explotado', R)!;
    expect(healthy.skillId).not.toBeNull();
    const s = mk();
    unit(s, 'aprendiz_explotado').hp = 6;
    const plan = forecast(s, 'aprendiz_explotado', R)!;
    expect(dist(plan.moveTo, { x: 3, y: 3 })).toBeGreaterThanOrEqual(4);
  });

  it('el guardián no abandona su puesto para perseguir', () => {
    const s = start(
      mkDef({ w: 8, h: 8, deploy: [{ x: 0, y: 0 }], units: [{ defId: 'inquisidor_patentes', team: 'enemy', pos: { x: 7, y: 7 }, facing: 'NW' }] }),
    ).state;
    expect(forecast(s, 'inquisidor_patentes', R)!.moveTo).toEqual({ x: 7, y: 7 });
  });

  it('el kamikaze provoca la Sobrecarga aunque le dañe a él también', () => {
    const s = start(
      mkDef({ w: 8, h: 8, deploy: [{ x: 0, y: 0 }], units: [{ defId: 'golem_defectuoso', team: 'enemy', pos: { x: 7, y: 7 }, facing: 'NW' }] }),
    ).state;
    s.pressure = 8;
    unit(s, 'golem_defectuoso').brio = 4;
    unit(s, 'probador').hp = 5;
    const plan = forecast(s, 'golem_defectuoso', R)!;
    expect(plan.skillId).toBe('control_de_calidad_pendiente');
  });

  it('forecast() coincide con lo que la IA hace de verdad si nada cambia', () => {
    const s: BattleState = start(
      mkDef({
        w: 8,
        h: 8,
        heights: ['00000000', '00110000', '00120000', '00000000', '00000000', '00000000', '00000000', '00000000'],
        deploy: [{ x: 1, y: 1 }],
        units: [
          { defId: 'cobrador_cuotas', team: 'enemy', pos: { x: 4, y: 1 }, facing: 'NW' },
          { defId: 'muneco', team: 'enemy', pos: { x: 7, y: 7 }, facing: 'NW' },
        ],
      }),
    ).state;
    // Que el cobrador sea lo siguiente en el Reloj de Vapor.
    for (const e of s.timeline) e.ct = e.ref.id === 'cobrador_cuotas' ? 99 : 0;
    const plan = forecast(s, 'cobrador_cuotas', R)!;
    const r = act(s, { type: 'WAIT', facing: unit(s, 'probador').facing });
    const started = ofType(r.events, 'TurnStarted');
    expect(started[0]!.ref).toEqual({ kind: 'unit', id: 'cobrador_cuotas' });
    const moved = ofType(r.events, 'UnitMoved').find((e) => e.unitId === 'cobrador_cuotas');
    const used = ofType(r.events, 'SkillUsed').find((e) => e.unitId === 'cobrador_cuotas');
    expect(moved?.path.at(-1) ?? unit(s, 'cobrador_cuotas').pos).toEqual(plan.moveTo);
    expect(used?.skillId ?? null).toBe(plan.skillId);
    expect(used?.target ?? null).toEqual(plan.target);
    expect(used?.area ?? []).toEqual(plan.area);
    expect(plan.skillId).not.toBeNull();
  });
});
