/**
 * API pública del motor de reglas.
 * Regla del proyecto: nada bajo src/core/ importa Phaser (verificado por test).
 */

export * from './types';
export * from './rng';
export { createCombat, playCard, endTurn, makeRegistry, pressureMultiplier } from './combat/resolve';
export type { Registry } from './combat/resolve';
export { STATUSES, computeAttackDamage, tickTurnStart, decayStatuses } from './combat/statuses';
export type { StatusDef } from './combat/statuses';
