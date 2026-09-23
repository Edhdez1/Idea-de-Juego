/**
 * Inicio y fin del turno de una unidad.
 *
 * Inicio: el blindaje caduca → brío +1 (máx. BRIO_MAX) → estados (veneno)
 * → terreno (daño, estado, Presión).
 * Fin: débil/vulnerable −1 → CT = (movió ? 0 : CT_WAIT_BONUS) + (actuó ? 0 : CT_WAIT_BONUS).
 */

import { tickTurnStart, decayStatuses } from '../shared/statuses';
import { isDown, tileOf } from './board';
import { checkKo, damageUnit, emit, giveStatus, setBrio, type Ctx } from './ctx';
import { addPressure } from './pressure';
import { ctAfterTurn } from './timeline';
import type { UnitState } from './types';

/** Devuelve false si la unidad cae antes de poder actuar. */
export function startUnitTurn(ctx: Ctx, u: UnitState): boolean {
  u.block = 0;
  setBrio(ctx, u, u.brio + 1);
  for (const e of tickTurnStart(u)) emit(ctx, e);
  checkKo(ctx, u);
  if (isDown(u)) return false;
  const terr = ctx.r.terrain(tileOf(ctx.s.board, u.pos)!.terrain);
  const eff = terr.onTurnStart;
  if (eff) {
    if (eff.damage) damageUnit(ctx, u, eff.damage, 'terrain');
    if (eff.status && !isDown(u)) giveStatus(ctx, u, eff.status.id, eff.status.stacks);
    if (eff.pressure) addPressure(ctx, eff.pressure);
  }
  return !isDown(u);
}

export function endUnitTurn(ctx: Ctx, u: UnitState, moved: boolean, acted: boolean): void {
  if (isDown(u)) return;
  for (const e of decayStatuses(u)) emit(ctx, e);
  const entry = ctx.s.timeline.find((e) => e.ref.kind === 'unit' && e.ref.id === u.id);
  if (entry) entry.ct = ctAfterTurn(moved, acted);
}
