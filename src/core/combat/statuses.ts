/**
 * Statuses con hooks (registry estático, patrón event-driven del doc de
 * arquitectura §2). En el estado de combate solo viven pares {statusId: stacks};
 * las reglas viven aquí, así el estado sigue siendo JSON serializable.
 *
 * Los hooks aplican por igual a jugador y enemigos: `who` es 'player' o el
 * slot del enemigo.
 */

import {
  VULNERABLE_MULTIPLIER,
  WEAK_MULTIPLIER,
  type CombatState,
  type FighterState,
  type GameEvent,
  type StatusId,
} from '../types';

export interface StatusDef {
  id: StatusId;
  name: string;
  /** Modifica el daño que INFLIGE el dueño (fuerza suma, débil multiplica). */
  modifyDamageDealt?: (amount: number, stacks: number) => number;
  /** Modifica el daño que RECIBE el dueño (vulnerable multiplica). */
  modifyDamageTaken?: (amount: number, stacks: number) => number;
  /** Se dispara al inicio del turno del dueño (p.ej. veneno). Muta `state`. */
  onTurnStart?: (state: CombatState, who: 'player' | number) => GameEvent[];
  /** Pierde 1 stack al final del turno del dueño. */
  decayAtTurnEnd?: boolean;
}

/** Resuelve el FighterState del dueño a partir de su identificador. */
export function ownerOf(state: CombatState, who: 'player' | number): FighterState {
  if (who === 'player') return state.player;
  const enemy = state.enemies[who];
  if (!enemy) throw new Error(`Slot enemigo inválido: ${who}`);
  return enemy;
}

/** Fija stacks; en 0 o menos el status desaparece del estado. */
function setStacks(owner: FighterState, status: StatusId, stacks: number): void {
  if (stacks <= 0) delete owner.statuses[status];
  else owner.statuses[status] = stacks;
}

/** Registry estático: un StatusDef por StatusId, con exhaustividad de TS. */
export const STATUSES: Record<StatusId, StatusDef> = {
  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    modifyDamageTaken: (amount, _stacks) => amount * VULNERABLE_MULTIPLIER,
    decayAtTurnEnd: true,
  },
  weak: {
    id: 'weak',
    name: 'Débil',
    modifyDamageDealt: (amount, _stacks) => amount * WEAK_MULTIPLIER,
    decayAtTurnEnd: true,
  },
  poison: {
    id: 'poison',
    name: 'Veneno',
    // Daño = stacks al inicio del turno del dueño, luego -1.
    // Como en StS, el veneno ignora el bloqueo: pérdida directa de vida.
    onTurnStart(state, who) {
      const owner = ownerOf(state, who);
      const stacks = owner.statuses.poison ?? 0;
      if (stacks <= 0) return [];
      owner.hp = Math.max(0, owner.hp - stacks);
      const events: GameEvent[] = [];
      if (who === 'player') {
        events.push({ type: 'PlayerDamaged', amount: stacks, blocked: 0, source: 'poison' });
      } else {
        events.push({ type: 'DamageDealt', targetSlot: who, amount: stacks, blocked: 0 });
      }
      setStacks(owner, 'poison', stacks - 1);
      events.push({ type: 'StatusTicked', who, status: 'poison', stacks: stacks - 1 });
      return events;
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

/**
 * Pipeline canónica del daño de ataque (cartas del jugador Y golpes enemigos):
 * base + fuerza → ×presión (solo cartas del jugador) → ×débil (atacante)
 * → ×vulnerable (objetivo), con Math.floor al final.
 */
export function computeAttackDamage(opts: {
  base: number;
  attacker: FighterState;
  target: FighterState;
  /** Multiplicador de Presión; los enemigos no tienen caldera (omite = 1). */
  pressureMult?: number;
}): number {
  let dmg = opts.base;
  const strength = opts.attacker.statuses.strength ?? 0;
  if (strength !== 0) dmg = STATUSES.strength.modifyDamageDealt!(dmg, strength);
  dmg *= opts.pressureMult ?? 1;
  const weak = opts.attacker.statuses.weak ?? 0;
  if (weak > 0) dmg = STATUSES.weak.modifyDamageDealt!(dmg, weak);
  const vulnerable = opts.target.statuses.vulnerable ?? 0;
  if (vulnerable > 0) dmg = STATUSES.vulnerable.modifyDamageTaken!(dmg, vulnerable);
  return Math.floor(dmg);
}

/** Dispara los hooks de inicio de turno del dueño (veneno, etc.). Muta `state`. */
export function tickTurnStart(state: CombatState, who: 'player' | number): GameEvent[] {
  const owner = ownerOf(state, who);
  const events: GameEvent[] = [];
  for (const status of Object.keys(owner.statuses) as StatusId[]) {
    const hook = STATUSES[status].onTurnStart;
    if (hook) events.push(...hook(state, who));
  }
  return events;
}

/** Decaimiento de fin de turno del dueño: -1 stack a los statuses de duración. */
export function decayStatuses(state: CombatState, who: 'player' | number): GameEvent[] {
  const owner = ownerOf(state, who);
  const events: GameEvent[] = [];
  for (const status of Object.keys(owner.statuses) as StatusId[]) {
    if (!STATUSES[status].decayAtTurnEnd) continue;
    const stacks = (owner.statuses[status] ?? 0) - 1;
    setStacks(owner, status, stacks);
    events.push({ type: 'StatusTicked', who, status, stacks: Math.max(0, stacks) });
  }
  return events;
}
