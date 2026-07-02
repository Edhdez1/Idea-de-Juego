import { describe, expect, it } from 'vitest';
import { Rng, deriveSeed, splitmix32 } from '../../src/core/rng';

describe('splitmix32', () => {
  it('es determinista: mismo estado, misma secuencia', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('devuelve floats en [0, 1)', () => {
    const rng = new Rng(999);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('el estado es serializable y reanudable', () => {
    const rng = new Rng(42);
    rng.next();
    rng.next();
    const saved = rng.state; // esto es lo que iría al save
    const expected = new Rng(saved).next();
    expect(rng.next()).toBe(expected);
  });

  it('la función pura no muta su entrada', () => {
    const r1 = splitmix32(7);
    const r2 = splitmix32(7);
    expect(r1.value).toBe(r2.value);
    expect(r1.next).toBe(r2.next);
  });
});

describe('deriveSeed (streams por dominio)', () => {
  it('dominios distintos producen seeds distintos', () => {
    const seed = 20260702;
    const map = deriveSeed(seed, 'map');
    const shuffle = deriveSeed(seed, 'shuffle');
    const combat = deriveSeed(seed, 'combat');
    expect(new Set([map, shuffle, combat]).size).toBe(3);
  });

  it('es estable entre llamadas', () => {
    expect(deriveSeed(1, 'map')).toBe(deriveSeed(1, 'map'));
  });
});

describe('shuffle', () => {
  it('baraja determinísticamente y conserva los elementos', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];
    const s1 = new Rng(7).shuffle(items);
    const s2 = new Rng(7).shuffle(items);
    expect(s1).toEqual(s2);
    expect([...s1].sort()).toEqual([...items].sort());
    expect(items).toEqual(['a', 'b', 'c', 'd', 'e', 'f']); // no muta la entrada
  });
});
