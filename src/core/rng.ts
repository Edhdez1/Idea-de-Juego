/**
 * RNG determinista basado en splitmix32.
 * El estado es un único número serializable: se guarda dentro del save
 * para que replays y daily runs sean reproducibles.
 *
 * Regla del proyecto: TODO lo aleatorio del juego pasa por aquí.
 * La capa de render (Phaser) jamás usa este RNG.
 */

export type RngState = number;

/** Un paso de splitmix32: devuelve un float en [0, 1) y el siguiente estado. */
export function splitmix32(state: RngState): { value: number; next: RngState } {
  let z = (state + 0x9e3779b9) | 0;
  let t = z ^ (z >>> 16);
  t = Math.imul(t, 0x21f0aaad);
  t = t ^ (t >>> 15);
  t = Math.imul(t, 0x735a2d97);
  t = t ^ (t >>> 15);
  // >>> 0 convierte a uint32; dividir por 2^32 da [0, 1)
  return { value: (t >>> 0) / 4294967296, next: z };
}

/**
 * Deriva un seed independiente por dominio ('map', 'shuffle', 'combat', 'rewards')
 * a partir del seed de la run, para que consumir aleatoriedad en un dominio
 * no altere los demás (patrón de Slay the Spire).
 */
export function deriveSeed(runSeed: number, domain: string): RngState {
  let h = runSeed | 0;
  for (let i = 0; i < domain.length; i++) {
    h = Math.imul(h ^ domain.charCodeAt(i), 0x9e3779b1);
    h = (h << 13) | (h >>> 19);
  }
  return h | 0;
}

/** Envoltorio con estado mutable local; el estado se extrae con `.state` para el save. */
export class Rng {
  constructor(public state: RngState) {}

  /** Float en [0, 1). */
  next(): number {
    const { value, next } = splitmix32(this.state);
    this.state = next;
    return value;
  }

  /** Entero en [0, maxExclusive). */
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  /** Fisher-Yates determinista; devuelve una copia barajada. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const a = out[i]!;
      out[i] = out[j]!;
      out[j] = a;
    }
    return out;
  }

  /** Elige un elemento; lanza si la lista está vacía. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: lista vacía');
    return items[this.int(items.length)]!;
  }
}
