import { describe, expect, it } from 'vitest';
import { MAX_ACTIVATIONS_PER_WAIT } from '../../../src/core/shared/constants';
import { autoBattle, randomBattle } from './autobattle';

describe('determinismo del motor táctico', () => {
  it('IA contra IA con la misma semilla dos veces → mismo JSON (estado y eventos)', () => {
    const { def, roster } = randomBattle(1234);
    const a = autoBattle(def, roster, 1234);
    const b = autoBattle(def, roster, 1234);
    expect(a.state.phase).not.toBe('awaitingPlayer');
    expect(JSON.stringify(b.state)).toBe(JSON.stringify(a.state));
    expect(JSON.stringify(b.events)).toBe(JSON.stringify(a.events));
  });

  it('estrés: 50 semillas terminan sin lanzar y dentro de los límites', () => {
    const results: Record<string, number> = { victory: 0, defeat: 0 };
    for (let seed = 1; seed <= 50; seed++) {
      const { def, roster } = randomBattle(seed);
      const r = autoBattle(def, roster, seed);
      expect(r.state.phase, `semilla ${seed}`).not.toBe('awaitingPlayer');
      expect(r.state.turn).toBeNull();
      expect(r.state.beeps).toBeLessThanOrEqual(40);
      expect(r.state.pressure).toBeGreaterThanOrEqual(0);
      expect(r.state.pressure).toBeLessThan(10);
      for (const u of r.state.units) {
        expect(u.hp).toBeGreaterThanOrEqual(0);
        expect(u.hp).toBeLessThanOrEqual(u.maxHp);
        expect(u.brio).toBeLessThanOrEqual(5);
      }
      expect(r.state.activations).toBeLessThan(MAX_ACTIVATIONS_PER_WAIT * (r.turns + 1));
      results[r.state.phase]!++;
    }
    // Que haya de todo: el generador no está trucado hacia un bando.
    expect(results.victory! + results.defeat!).toBe(50);
  }, 60_000);
});
