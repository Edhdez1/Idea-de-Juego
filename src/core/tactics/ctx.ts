/**
 * Contexto mutable de una resolución (dentro de dispatch/createBattle el
 * estado ya es una copia propia). Primitivas de daño, KO, curación, etc.
 */

import { BRIO_MAX } from '../shared/constants';
import { absorb } from '../shared/damage';
import { applyStatus } from '../shared/statuses';
import { isDown } from './board';
import type { BattleState, DamageMod, DamageSource, StatusId, TacticalEvent, TacticsRegistry, UnitState } from './types';

export interface Ctx {
  s: BattleState;
  r: TacticsRegistry;
  ev: TacticalEvent[];
  /** Una explosión con onExplode 'defeat' ocurrió. */
  forcedDefeat: boolean;
  /** Prototipos pendientes de detonar (cadena). */
  pendingDetonations: string[];
}

export function makeCtx(s: BattleState, r: TacticsRegistry): Ctx {
  return { s, r, ev: [], forcedDefeat: false, pendingDetonations: [] };
}

export function emit(ctx: Ctx, e: TacticalEvent): void {
  ctx.ev.push(e);
}

export function removeTimelineRef(s: BattleState, kind: 'unit' | 'prototype', id: string): void {
  s.timeline = s.timeline.filter((e) => !(e.ref.kind === kind && e.ref.id === id));
}

/** Aplica daño (el blindaje absorbe primero). Devuelve la vida perdida. */
export function damageUnit(ctx: Ctx, u: UnitState, amount: number, source: DamageSource, breakdown?: DamageMod[]): number {
  if (isDown(u) || amount <= 0) return 0;
  const { blocked, hpLoss } = absorb(u.block, amount);
  u.block -= blocked;
  const lost = Math.min(u.hp, hpLoss);
  u.hp -= lost;
  emit(ctx, {
    type: 'Damaged',
    unitId: u.id,
    amount: lost,
    blocked,
    source,
    ...(breakdown ? { breakdown } : {}),
  });
  checkKo(ctx, u);
  return lost;
}

/** Si la vida llegó a 0: KO, fuera del Reloj de Vapor. */
export function checkKo(ctx: Ctx, u: UnitState): void {
  if (u.ko || u.hp > 0) return;
  u.hp = 0;
  u.ko = true;
  u.block = 0;
  removeTimelineRef(ctx.s, 'unit', u.id);
  emit(ctx, { type: 'UnitKO', unitId: u.id });
}

export function removeUnit(ctx: Ctx, u: UnitState): void {
  if (isDown(u)) return;
  u.removed = true;
  u.block = 0;
  removeTimelineRef(ctx.s, 'unit', u.id);
  emit(ctx, { type: 'UnitRemoved', unitId: u.id });
}

export function healUnit(ctx: Ctx, u: UnitState, amount: number): void {
  if (isDown(u)) return;
  const healed = Math.min(amount, u.maxHp - u.hp);
  u.hp += healed;
  emit(ctx, { type: 'Healed', unitId: u.id, amount: healed });
}

export function gainBlock(ctx: Ctx, u: UnitState, amount: number): void {
  if (isDown(u) || amount <= 0) return;
  u.block += amount;
  emit(ctx, { type: 'BlockGained', unitId: u.id, amount });
}

export function giveStatus(ctx: Ctx, u: UnitState, status: StatusId, stacks: number): void {
  if (isDown(u) || stacks === 0) return;
  const total = applyStatus(u, status, stacks);
  emit(ctx, { type: 'StatusApplied', unitId: u.id, status, stacks: total });
}

export function setBrio(ctx: Ctx, u: UnitState, brio: number): void {
  const v = Math.max(0, Math.min(BRIO_MAX, brio));
  if (v === u.brio) return;
  u.brio = v;
  emit(ctx, { type: 'BrioChanged', unitId: u.id, brio: v });
}
