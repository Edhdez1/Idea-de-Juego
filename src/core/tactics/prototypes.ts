/**
 * Prototipos (mechas en la barra de turnos).
 *
 * - Cada activación: mecha −1 (FuseTicked); a 0 explota.
 * - Explosión: daño max(def.damage, FUSE_EXPLOSION_MIN) a TODAS las unidades
 *   del área (fuego amigo; el blindaje absorbe), empuje de 1 hacia fuera si
 *   pushOut, +Presión, y detona los prototipos del área (cadena en orden de id).
 * - Un prototipo atacado detona al instante.
 * - onExplode 'defeat': la batalla se pierde.
 */

import { FUSE_EXPLOSION_MIN } from '../shared/constants';
import { compareIds, dirTo, DIR_VEC, isDown, posEq, sortedIds } from './board';
import { damageUnit, emit, removeTimelineRef, type Ctx } from './ctx';
import { addPressure } from './pressure';
import { pushUnit } from './push';
import { areaTiles } from './targeting';
import type { Pos, PrototypeState } from './types';

export function placePrototype(ctx: Ctx, defId: string, pos: Pos, owner: string): PrototypeState {
  const def = ctx.r.prototype(defId);
  const id = `${defId}#${ctx.s.nextId++}`;
  const p: PrototypeState = { id, defId, pos: { ...pos }, owner, remaining: def.fuse };
  ctx.s.prototypes.push(p);
  ctx.s.timeline.push({ ref: { kind: 'prototype', id }, ct: 0, speed: def.speed });
  emit(ctx, { type: 'PrototypePlaced', id, defId, pos: { ...pos }, fuse: def.fuse });
  return p;
}

export function explosionArea(ctx: Pick<Ctx, 's' | 'r'>, p: PrototypeState): Pos[] {
  const def = ctx.r.prototype(p.defId);
  return areaTiles(ctx.s.board, p.pos, p.pos, def.area);
}

/** Activación de la mecha en el Reloj de Vapor. */
export function tickPrototype(ctx: Ctx, id: string): void {
  const p = ctx.s.prototypes.find((q) => q.id === id);
  if (!p) return;
  p.remaining -= 1;
  emit(ctx, { type: 'FuseTicked', id, remaining: Math.max(0, p.remaining) });
  if (p.remaining <= 0) {
    queueDetonation(ctx, id);
    resolveDetonations(ctx);
  }
}

export function queueDetonation(ctx: Ctx, id: string): void {
  if (!ctx.pendingDetonations.includes(id)) ctx.pendingDetonations.push(id);
}

/** Resuelve la cola de detonaciones (y sus cadenas) en orden estable de id. */
export function resolveDetonations(ctx: Ctx): void {
  while (ctx.pendingDetonations.length > 0) {
    ctx.pendingDetonations.sort(compareIds);
    const id = ctx.pendingDetonations.shift()!;
    const p = ctx.s.prototypes.find((q) => q.id === id);
    if (p) explode(ctx, p);
  }
}

function explode(ctx: Ctx, p: PrototypeState): void {
  const def = ctx.r.prototype(p.defId);
  ctx.s.prototypes = ctx.s.prototypes.filter((q) => q.id !== p.id);
  removeTimelineRef(ctx.s, 'prototype', p.id);
  const area = explosionArea(ctx, p);
  emit(ctx, { type: 'PrototypeExploded', id: p.id, pos: { ...p.pos }, area });
  if (def.onExplode === 'defeat') ctx.forcedDefeat = true;
  const inArea = (pos: Pos) => area.some((a) => posEq(a, pos));
  const victims = sortedIds(ctx.s.units.filter((u) => !isDown(u) && inArea(u.pos)));
  const dmg = Math.max(def.damage, FUSE_EXPLOSION_MIN);
  for (const u of victims) damageUnit(ctx, u, dmg, 'explosion');
  if (def.pushOut) {
    for (const u of victims) {
      if (isDown(u)) continue;
      const d = dirTo(p.pos, u.pos);
      if (d) pushUnit(ctx, u, DIR_VEC[d], 1);
    }
  }
  addPressure(ctx, def.pressure);
  for (const q of ctx.s.prototypes) if (inArea(q.pos)) queueDetonation(ctx, q.id);
}
