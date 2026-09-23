/**
 * Pipeline canónica de daño de ataque (con desglose visible):
 *
 *   base = max(1, poder + ataque − defensa)
 *   + fuerza (atacante)
 *   × caldera (habilidad de vapor y Presión ≥ PRESSURE_SWEET_SPOT)
 *   × altura (1 + 0,1 · clamp(dh, −3, 3)), dh = altura atacante − objetivo
 *   × orientación (frente 1, lado FLANK, espalda BACK)
 *   × débil (atacante) × vulnerable (objetivo)
 *   → floor, mínimo 1. El blindaje absorbe después.
 */

import type { DamageMod, UnitState } from '../tactics/types';
import {
  BACK_MULTIPLIER,
  FLANK_MULTIPLIER,
  HEIGHT_DAMAGE_PER_LEVEL,
  PRESSURE_DAMAGE_BONUS,
  PRESSURE_SWEET_SPOT,
} from './constants';
import { STATUSES } from './statuses';

export type FacingRel = 'front' | 'side' | 'back';

export interface DamageInput {
  power: number;
  attacker: UnitState;
  atk: number;
  target: UnitState;
  def: number;
  steam: boolean;
  pressure: number;
  /** Altura del atacante menos la del objetivo. */
  dh: number;
  facing: FacingRel;
}

/** Aplica un desglose (sumas y multiplicadores en orden) → daño entero ≥ 1. */
export function applyMods(mods: DamageMod[]): number {
  let v = 0;
  for (const m of mods) v = m.add ? v + m.value : v * m.value;
  // Épsilon: 1,1 · 10 no debe dar 10,999… → 10.
  return Math.max(1, Math.floor(v + 1e-9));
}

export function computeDamage(inp: DamageInput): { amount: number; breakdown: DamageMod[] } {
  const mods: DamageMod[] = [];
  mods.push({ label: 'Base', value: Math.max(1, inp.power + inp.atk - inp.def), add: true });
  const strength = inp.attacker.statuses.strength ?? 0;
  if (strength !== 0) {
    // Hook de fuerza: suma plana por stack.
    mods.push({ label: 'Fuerza', value: STATUSES.strength.modifyDamageDealt!(0, strength), add: true });
  }
  if (inp.steam && inp.pressure >= PRESSURE_SWEET_SPOT) {
    mods.push({ label: 'Caldera', value: PRESSURE_DAMAGE_BONUS });
  }
  const dh = Math.max(-3, Math.min(3, inp.dh));
  if (dh !== 0) {
    mods.push({ label: dh > 0 ? 'Altura' : 'Desde abajo', value: Math.round((1 + HEIGHT_DAMAGE_PER_LEVEL * dh) * 100) / 100 });
  }
  if (inp.facing === 'side') mods.push({ label: 'Flanco', value: FLANK_MULTIPLIER });
  if (inp.facing === 'back') mods.push({ label: 'Espalda', value: BACK_MULTIPLIER });
  if ((inp.attacker.statuses.weak ?? 0) > 0) {
    mods.push({ label: 'Débil', value: STATUSES.weak.modifyDamageDealt!(1, inp.attacker.statuses.weak ?? 0) });
  }
  if ((inp.target.statuses.vulnerable ?? 0) > 0) {
    mods.push({ label: 'Vulnerable', value: STATUSES.vulnerable.modifyDamageTaken!(1, inp.target.statuses.vulnerable ?? 0) });
  }
  return { amount: applyMods(mods), breakdown: mods };
}

/** Reparte un golpe entre blindaje y vida. */
export function absorb(block: number, amount: number): { blocked: number; hpLoss: number } {
  const blocked = Math.min(block, amount);
  return { blocked, hpLoss: amount - blocked };
}
