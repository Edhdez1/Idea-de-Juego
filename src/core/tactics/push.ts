/**
 * Empuje casilla a casilla.
 *
 * - Borde del mapa → choque 'edge'; muro (terreno impasable) o subida > 1
 *   nivel → choque 'wall'; unidad o prototipo → choque 'unit'.
 *   Un choque hace COLLISION_DAMAGE al empujado y a la otra unidad (no al prototipo).
 * - Caída de más de 1 nivel: (niveles − 1) · FALL_DAMAGE_PER_LEVEL, salvo terreno que amortigua (paja).
 * - Terreno con pushedInto 'removeFromBattle' (canal): la unidad sale de la batalla.
 * - Inmunes al empuje (immunities: ['push']): no se mueven.
 * - Los prototipos se empujan igual pero no reciben daño y el canal los frena como un muro.
 */

import { COLLISION_DAMAGE, FALL_DAMAGE_PER_LEVEL } from '../shared/constants';
import { addPos, inBounds, livingUnitAt, posEq, prototypeAt, tileOf } from './board';
import { damageUnit, emit, removeUnit, type Ctx } from './ctx';
import type { BattleState, Pos, PrototypeState, TacticsRegistry, UnitState } from './types';

export interface PushOutcome {
  final: Pos;
  moved: boolean;
  hit?: 'wall' | 'unit' | 'edge';
  otherId?: string;
  /** La otra pieza del choque es una unidad (recibe daño). */
  otherIsUnit: boolean;
  falls: { levels: number; damage: number }[];
  removed: boolean;
}

export function simulatePush(
  s: BattleState,
  r: TacticsRegistry,
  from: Pos,
  dir: Pos,
  distance: number,
  selfId: string,
  isPrototype: boolean,
): PushOutcome {
  const out: PushOutcome = { final: { ...from }, moved: false, otherIsUnit: false, falls: [], removed: false };
  let cur = { ...from };
  for (let i = 0; i < distance; i++) {
    const np = addPos(cur, dir);
    if (!inBounds(s.board, np)) {
      out.hit = 'edge';
      break;
    }
    const other = livingUnitAt(s, np);
    if (other && other.id !== selfId) {
      out.hit = 'unit';
      out.otherId = other.id;
      out.otherIsUnit = true;
      break;
    }
    const proto = prototypeAt(s, np);
    if (proto && proto.id !== selfId) {
      out.hit = 'unit';
      out.otherId = proto.id;
      break;
    }
    const nt = tileOf(s.board, np)!;
    const terr = r.terrain(nt.terrain);
    const sink = terr.pushedInto === 'removeFromBattle';
    if ((!Number.isFinite(terr.moveCost) && !sink) || (sink && isPrototype)) {
      out.hit = 'wall';
      break;
    }
    const dh = nt.h - tileOf(s.board, cur)!.h;
    if (dh > 1) {
      out.hit = 'wall';
      break;
    }
    cur = np;
    out.moved = true;
    if (sink) {
      out.removed = true;
      break;
    }
    if (-dh > 1) {
      out.falls.push({ levels: -dh, damage: terr.cushionsFall ? 0 : (-dh - 1) * FALL_DAMAGE_PER_LEVEL });
    }
  }
  out.final = cur;
  return out;
}

export function pushUnit(ctx: Ctx, u: UnitState, dir: Pos, distance: number): void {
  const def = ctx.r.unit(u.defId);
  if (def.immunities?.includes('push') || distance <= 0) return;
  const o = simulatePush(ctx.s, ctx.r, u.pos, dir, distance, u.id, false);
  const from = { ...u.pos };
  u.pos = { ...o.final };
  emit(ctx, {
    type: 'Pushed',
    unitId: u.id,
    from,
    to: { ...o.final },
    ...(o.hit ? { hit: o.hit } : {}),
    ...(o.otherId ? { otherId: o.otherId } : {}),
  });
  if (o.removed) {
    removeUnit(ctx, u);
    return;
  }
  for (const f of o.falls) {
    emit(ctx, { type: 'Fell', unitId: u.id, levels: f.levels });
    if (f.damage > 0) damageUnit(ctx, u, f.damage, 'fall');
  }
  if (o.hit) {
    damageUnit(ctx, u, COLLISION_DAMAGE, 'collision');
    if (o.otherIsUnit && o.otherId) {
      const other = ctx.s.units.find((x) => x.id === o.otherId);
      if (other) damageUnit(ctx, other, COLLISION_DAMAGE, 'collision');
    }
  }
}

export function pushPrototype(ctx: Ctx, p: PrototypeState, dir: Pos, distance: number): void {
  if (distance <= 0) return;
  const o = simulatePush(ctx.s, ctx.r, p.pos, dir, distance, p.id, true);
  if (!o.moved || posEq(o.final, p.pos)) return;
  const from = { ...p.pos };
  p.pos = { ...o.final };
  emit(ctx, { type: 'PrototypePushed', id: p.id, from, to: { ...o.final } });
}
