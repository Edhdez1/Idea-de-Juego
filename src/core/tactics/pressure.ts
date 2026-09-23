/**
 * Presión de Vapor del campo (0..PRESSURE_MAX). Al llegar a PRESSURE_MAX:
 * Sobrecarga → OVERLOAD_DAMAGE a TODAS las unidades en pie (el blindaje
 * absorbe) y la Presión vuelve a 0.
 *
 * Orden de eventos: PressureChanged(p→10), Overload, Damaged…, PressureChanged(10→0).
 */

import { OVERLOAD_DAMAGE, PRESSURE_MAX } from '../shared/constants';
import { isDown, sortedIds } from './board';
import { damageUnit, emit, type Ctx } from './ctx';

export function setPressure(ctx: Ctx, value: number): void {
  const to = Math.max(0, Math.min(PRESSURE_MAX, value));
  const from = ctx.s.pressure;
  if (to === from) return;
  ctx.s.pressure = to;
  emit(ctx, { type: 'PressureChanged', from, to });
  if (to >= PRESSURE_MAX) overload(ctx);
}

export function addPressure(ctx: Ctx, amount: number): void {
  if (amount === 0) return;
  setPressure(ctx, ctx.s.pressure + amount);
}

function overload(ctx: Ctx): void {
  const victims = sortedIds(ctx.s.units.filter((u) => !isDown(u)));
  emit(ctx, { type: 'Overload', damage: OVERLOAD_DAMAGE, hit: victims.map((u) => u.id) });
  for (const u of victims) damageUnit(ctx, u, OVERLOAD_DAMAGE, 'overload');
  const from = ctx.s.pressure;
  ctx.s.pressure = 0;
  emit(ctx, { type: 'PressureChanged', from, to: 0 });
}
