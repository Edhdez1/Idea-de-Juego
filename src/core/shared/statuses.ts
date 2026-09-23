/**
 * Estados con hooks, generalizados desde combat/statuses.ts: ahora actúan
 * sobre cualquier UnitState del tablero táctico. En el estado solo viven
 * pares {statusId: stacks}; las reglas viven aquí (estado JSON serializable).
 */

import type { TacticalEvent, UnitState } from '../tactics/types';
import { VULNERABLE_MULTIPLIER, WEAK_MULTIPLIER, type StatusId } from './constants';

export interface StatusDef {
  id: StatusId;
  name: string;
  /** Modifica el daño que INFLIGE el dueño (fuerza suma, débil multiplica). */
  modifyDamageDealt?: (amount: number, stacks: number) => number;
  /** Modifica el daño que RECIBE el dueño (vulnerable multiplica). */
  modifyDamageTaken?: (amount: number, stacks: number) => number;
  /** Al empezar el turno del dueño (veneno). Muta `unit`; el KO lo gestiona quien llama. */
  onTurnStart?: (unit: UnitState) => TacticalEvent[];
  /** Pierde 1 stack al final del turno del dueño. */
  decayAtTurnEnd?: boolean;
}

/** Fija stacks; en 0 o menos el estado desaparece. */
export function setStacks(unit: UnitState, status: StatusId, stacks: number): void {
  if (stacks <= 0) delete unit.statuses[status];
  else unit.statuses[status] = stacks;
}

export const STATUSES: Record<StatusId, StatusDef> = {
  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    modifyDamageTaken: (amount) => amount * VULNERABLE_MULTIPLIER,
    decayAtTurnEnd: true,
  },
  weak: {
    id: 'weak',
    name: 'Débil',
    modifyDamageDealt: (amount) => amount * WEAK_MULTIPLIER,
    decayAtTurnEnd: true,
  },
  poison: {
    id: 'poison',
    name: 'Veneno',
    // Daño = stacks al empezar el turno del dueño, luego -1. Ignora el blindaje.
    onTurnStart(unit) {
      const stacks = unit.statuses.poison ?? 0;
      if (stacks <= 0) return [];
      const lost = Math.min(unit.hp, stacks);
      unit.hp -= lost;
      setStacks(unit, 'poison', stacks - 1);
      return [
        { type: 'Damaged', unitId: unit.id, amount: lost, blocked: 0, source: 'poison' },
        { type: 'StatusTicked', unitId: unit.id, status: 'poison', stacks: stacks - 1 },
      ];
    },
  },
  strength: {
    id: 'strength',
    name: 'Fuerza',
    modifyDamageDealt: (amount, stacks) => amount + stacks,
    // La fuerza no decae: el interés compuesto tampoco.
    decayAtTurnEnd: false,
  },
};

/** Suma stacks de un estado. Devuelve el total resultante. */
export function applyStatus(unit: UnitState, status: StatusId, stacks: number): number {
  const total = (unit.statuses[status] ?? 0) + stacks;
  setStacks(unit, status, total);
  return Math.max(0, total);
}

/** Hooks de inicio de turno del dueño (veneno...). Muta `unit`. */
export function tickTurnStart(unit: UnitState): TacticalEvent[] {
  const events: TacticalEvent[] = [];
  for (const status of Object.keys(unit.statuses).sort() as StatusId[]) {
    const hook = STATUSES[status].onTurnStart;
    if (hook) events.push(...hook(unit));
  }
  return events;
}

/** Fin de turno del dueño: -1 stack a los estados de duración (débil, vulnerable). */
export function decayStatuses(unit: UnitState): TacticalEvent[] {
  const events: TacticalEvent[] = [];
  for (const status of Object.keys(unit.statuses).sort() as StatusId[]) {
    if (!STATUSES[status].decayAtTurnEnd) continue;
    const stacks = (unit.statuses[status] ?? 0) - 1;
    setStacks(unit, status, stacks);
    events.push({ type: 'StatusTicked', unitId: unit.id, status, stacks: Math.max(0, stacks) });
  }
  return events;
}
