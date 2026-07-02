/**
 * API pública del motor de reglas.
 * Regla del proyecto: nada bajo src/core/ importa Phaser (verificado por test).
 */

export * from './types';
export * from './rng';
export { createCombat, playCard, makeRegistry, pressureMultiplier } from './combat/resolve';
export type { CardRegistry, EnemySpawn } from './combat/resolve';
