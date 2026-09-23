/**
 * Piloto automático: juega el turno de la unidad del jugador en curso con la
 * IA de utilidad (perfil de su definición; por defecto 'agresivo'). Usa solo
 * dispatch, así que sirve para tests (IA contra IA) y para un botón «Auto».
 */

import { faceNearestHostile, planFor } from './ai';
import { dispatch } from './battle';
import { mustUnit, posEq } from './board';
import type { BattleState, TacticalEvent, TacticsRegistry } from './types';

export function autoPlayTurn(state: BattleState, r: TacticsRegistry): { state: BattleState; events: TacticalEvent[] } {
  if (!state.turn || state.phase !== 'awaitingPlayer') throw new Error('No hay turno del jugador que jugar');
  const unitId = state.turn.unitId;
  const plan = planFor(state, r, unitId);
  let s = state;
  const events: TacticalEvent[] = [];
  const stillMine = () => s.phase === 'awaitingPlayer' && s.turn?.unitId === unitId;
  const step = (res: { state: BattleState; events: TacticalEvent[] }) => {
    s = res.state;
    events.push(...res.events);
  };
  if (!posEq(plan.moveTo, mustUnit(s, unitId).pos) && !s.turn!.moved) step(dispatch(s, { type: 'MOVE', to: plan.moveTo }, r));
  if (stillMine() && plan.skillId && plan.target) {
    step(dispatch(s, { type: 'ACT', skillId: plan.skillId, target: plan.target }, r));
  }
  if (stillMine()) {
    const u = mustUnit(s, unitId);
    const facing = s.turn!.acted ? u.facing : (faceNearestHostile(s, u) ?? u.facing);
    step(dispatch(s, { type: 'WAIT', facing }, r));
  }
  return { state: s, events };
}
