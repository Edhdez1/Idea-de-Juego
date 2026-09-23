// STUB del contrato: el agente del motor lo implementa (ver docs/diseno/reglas-tacticas.md).
import type { BattleDef, BattleState, RosterEntry, TacticalEvent, TacticalIntent, TacticsRegistry } from './types';

export function createBattle(
  _def: BattleDef,
  _opts: { roster: RosterEntry[]; flags?: string[]; seed: number; registry: TacticsRegistry },
): { state: BattleState; events: TacticalEvent[] } {
  throw new Error('createBattle: sin implementar');
}

export function dispatch(
  _state: BattleState,
  _intent: TacticalIntent,
  _registry: TacticsRegistry,
): { state: BattleState; events: TacticalEvent[] } {
  throw new Error('dispatch: sin implementar');
}
