import { describe, expect, it } from 'vitest';
import { applyMods, computeDamage } from '../../../src/core/shared/damage';
import { previewDamage } from '../../../src/core/tactics/queries';
import type { BattleState, Dir } from '../../../src/core/tactics/types';
import { act, mkDef, ofType, R, start, unit } from './helpers';

/** Probador en (2,2) contra un muñeco en (3,2) que le mira de frente. */
function duel(opts: { heights?: string[]; facing?: Dir; enemy?: string } = {}): BattleState {
  return start(
    mkDef({
      heights: opts.heights,
      deploy: [{ x: 2, y: 2 }],
      units: [{ defId: opts.enemy ?? 'muneco', team: 'enemy', pos: { x: 3, y: 2 }, facing: opts.facing ?? 'NW', id: 'blanco' }],
    }),
  ).state;
}

function hit(s: BattleState, skillId = 't_golpe', target = { x: 3, y: 2 }, overclock = false) {
  const preview = previewDamage(s, 'probador', skillId, target, R, overclock);
  const res = act(s, { type: 'ACT', skillId, target, overclock });
  const dmg = ofType(res.events, 'Damaged').filter((e) => e.source === 'attack');
  return { preview, dmg, res, first: dmg[0]! };
}

describe('daño: pipeline con desglose', () => {
  it('base = poder + ataque − defensa, mínimo 1', () => {
    expect(hit(duel()).first.amount).toBe(10);
    const s = duel({ enemy: 'golem_defectuoso' });
    unit(s, 'probador').brio = 3;
    expect(hit(s, 't_caro').first.amount).toBe(1); // 1 + 0 − 2 → 1
  });

  it('la fuerza suma plano', () => {
    const s = duel();
    unit(s, 'probador').statuses.strength = 3;
    const { first } = hit(s);
    expect(first.amount).toBe(13);
    expect(first.breakdown).toContainEqual({ label: 'Fuerza', value: 3, add: true });
  });

  it('caldera: ×1,25 con Presión ≥ 4 solo en habilidades de vapor', () => {
    const s = duel();
    s.pressure = 4;
    expect(hit(s, 't_vapor').first.amount).toBe(12);
    expect(hit(s, 't_golpe').first.amount).toBe(10);
    s.pressure = 3;
    expect(hit(s, 't_vapor').first.amount).toBe(10);
  });

  it('altura: ±10 % por nivel, con tope ±3', () => {
    expect(hit(duel({ heights: ['000000', '000000', '002000', '000000', '000000', '000000'] })).first.amount).toBe(12);
    expect(hit(duel({ heights: ['000000', '000000', '000200', '000000', '000000', '000000'] })).first.amount).toBe(8);
    // A distancia desde 5 niveles: tope ×1,3 → 5 · 1,3 = 6,5 → 6.
    const s = start(
      mkDef({
        heights: ['500000', '000000', '000000', '000000', '000000', '000000'],
        units: [{ defId: 'muneco', team: 'enemy', pos: { x: 2, y: 0 }, facing: 'NW', id: 'blanco' }],
      }),
    ).state;
    const r = hit(s, 't_bomba', { x: 2, y: 0 });
    expect(r.first.breakdown).toContainEqual({ label: 'Altura', value: 1.3 });
    expect(r.first.amount).toBe(6);
  });

  it('orientación: frente ×1, flanco ×1,25, espalda ×1,5', () => {
    expect(hit(duel({ facing: 'NW' })).first.amount).toBe(10);
    expect(hit(duel({ facing: 'SW' })).first.amount).toBe(12);
    expect(hit(duel({ facing: 'NE' })).first.amount).toBe(12);
    expect(hit(duel({ facing: 'SE' })).first.amount).toBe(15);
  });

  it('débil (atacante) ×0,75 y vulnerable (objetivo) ×1,5', () => {
    const a = duel();
    unit(a, 'probador').statuses.weak = 1;
    expect(hit(a).first.amount).toBe(7);
    const b = duel();
    unit(b, 'blanco').statuses.vulnerable = 1;
    expect(hit(b).first.amount).toBe(15);
  });

  it('el blindaje absorbe y el desglose = lo aplicado = la previsión', () => {
    const s = duel({ facing: 'SE', heights: ['000000', '000000', '001000', '000000', '000000', '000000'] });
    s.pressure = 5;
    unit(s, 'probador').statuses.strength = 2;
    unit(s, 'probador').statuses.weak = 1;
    unit(s, 'blanco').statuses.vulnerable = 2;
    unit(s, 'blanco').block = 5;
    const { preview, first, res } = hit(s, 't_vapor');
    // (10 + 2) · 1,25 · 1,1 · 1,5 · 0,75 · 1,5 = 27,84… → 27; el blindaje absorbe 5.
    expect(first.breakdown!.map((m) => m.label)).toEqual(['Base', 'Fuerza', 'Caldera', 'Altura', 'Espalda', 'Débil', 'Vulnerable']);
    expect(applyMods(first.breakdown!)).toBe(27);
    expect(first.blocked).toBe(5);
    expect(first.amount).toBe(22);
    expect(unit(res.state, 'blanco').hp).toBe(60 - 22);
    expect(preview).toEqual([{ unitId: 'blanco', amount: 22, blocked: 5, breakdown: first.breakdown, ko: false }]);
  });

  it('golpes múltiples: cada uno pasa por la pipeline; la previsión suma', () => {
    const s = start(
      mkDef({ deploy: [{ x: 0, y: 0 }], units: [{ defId: 'muneco', team: 'enemy', pos: { x: 3, y: 0 }, facing: 'NW', id: 'blanco' }] }),
      ['ingeniera'],
    ).state;
    unit(s, 'ingeniera').brio = 5;
    const preview = previewDamage(s, 'ingeniera', 'pistola_de_remaches', { x: 3, y: 0 }, R);
    const res = act(s, { type: 'ACT', skillId: 'pistola_de_remaches', target: { x: 3, y: 0 } });
    const dmg = ofType(res.events, 'Damaged');
    expect(dmg).toHaveLength(2);
    expect(dmg.map((d) => d.amount)).toEqual([7, 7]); // 3 + 4 − 0
    expect(preview[0]!.amount).toBe(14);
  });

  it('computeDamage es pura y aplica en el orden documentado', () => {
    const u = { id: 'a', defId: 'x', team: 'player', pos: { x: 0, y: 0 }, facing: 'SE', hp: 1, maxHp: 1, block: 0, brio: 0, statuses: {}, ko: false } as const;
    const r = computeDamage({ power: 3, attacker: { ...u, statuses: {} }, atk: 2, target: { ...u, statuses: {} }, def: 9, steam: false, pressure: 0, dh: 0, facing: 'front' });
    expect(r).toEqual({ amount: 1, breakdown: [{ label: 'Base', value: 1, add: true }] });
  });
});
