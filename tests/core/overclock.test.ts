import { describe, expect, it } from 'vitest';
import {
  OVERLOAD_DAMAGE,
  createCombat,
  makeRegistry,
  playCard,
  type CombatState,
  type EnemyDef,
} from '../../src/core';
import { INGENIERA_CARDS } from '../../src/data/cards/ingeniera';

const DUMMY: EnemyDef = {
  id: 'dummy',
  name: 'Recaudador de Prueba',
  hp: [50, 50],
  patron: 'secuencial',
  moves: [{ id: 'espera', name: 'Espera Burocrática', intent: 'unknown', effects: [] }],
};

const registry = makeRegistry(INGENIERA_CARDS, [DUMMY]);

function setup(deck: string[]): CombatState {
  const { state } = createCombat({ playerHp: 70, deck, enemies: ['dummy'], registry, runSeed: 1 });
  return state;
}

describe('Overclock: la micro-apuesta de cada turno', () => {
  it('sin overclock la carta funciona normal y no toca la presión', () => {
    const s0 = setup(Array(10).fill('pistola_de_remaches'));
    const { state } = playCard(s0, registry, 0, 0); // 4 × 2 golpes
    expect(state.enemies[0]!.hp).toBe(50 - 8);
    expect(state.pressure).toBe(0);
  });

  it('con overclock sube +2 de Presión ANTES de resolver y dobla el daño', () => {
    const s0 = setup(Array(10).fill('pistola_de_remaches'));
    const { state, events } = playCard(s0, registry, 0, 0, true);
    expect(state.pressure).toBe(2);
    // 4 → 8 por golpe, 2 golpes = 16 (presión 2 < sweet spot, sin bonus).
    expect(state.enemies[0]!.hp).toBe(50 - 16);
    // La presión sube antes del primer golpe.
    const pressureIdx = events.findIndex((e) => e.type === 'PressureChanged');
    const damageIdx = events.findIndex((e) => e.type === 'DamageDealt');
    expect(pressureIdx).toBeGreaterThan(-1);
    expect(pressureIdx).toBeLessThan(damageIdx);
  });

  it('overclock también dobla el bloqueo', () => {
    const s0 = setup(Array(10).fill('turbina_de_taller'));
    const { state } = playCard(s0, registry, 0, undefined, true);
    expect(state.player.block).toBe(12); // 6 × 2
    expect(state.pressure).toBe(2);
  });

  it('rechaza overclockear cartas sin el keyword', () => {
    const s0 = setup(Array(10).fill('golpe_de_llave'));
    expect(() => playCard(s0, registry, 0, 0, true)).toThrow(/no admite Overclock/);
  });

  it('overclock puede provocar la Sobrecarga (y aun así la carta se resuelve)', () => {
    const s0 = setup(Array(10).fill('pistola_de_remaches'));
    s0.pressure = 8;
    const { state, events } = playCard(s0, registry, 0, 0, true); // 8 + 2 = 10 → BOOM
    expect(events.some((e) => e.type === 'Overload')).toBe(true);
    expect(state.player.hp).toBe(70 - OVERLOAD_DAMAGE);
    // La presión se purga y los golpes doblados salen a presión 0: 8 × 2 = 16.
    expect(state.pressure).toBe(0);
    expect(state.enemies[0]!.hp).toBe(50 - OVERLOAD_DAMAGE - 16);
  });

  it('overclock con presión alta apila el bonus de la caldera', () => {
    const s0 = setup(Array(10).fill('pistola_de_remaches'));
    s0.pressure = 2;
    const { state } = playCard(s0, registry, 0, 0, true); // presión 2 → 4: la caldera canta
    // 4 × 2 = 8 por golpe, × 1.25 = 10, dos golpes = 20.
    expect(state.enemies[0]!.hp).toBe(50 - 20);
    expect(state.pressure).toBe(4);
  });
});
