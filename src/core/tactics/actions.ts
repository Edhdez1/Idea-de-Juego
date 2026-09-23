/**
 * Resolución de habilidades (ACT) y previsión de daño con desglose.
 *
 * Orden: coste de brío → SkillUsed → Sobremarcha (+OVERCLOCK_PRESSURE, puede
 * provocar Sobrecarga) → efectos en orden de la definición → el atacante
 * mira al objetivo (Faced).
 *
 * Sobremarcha dobla los efectos numéricos: poder de daño, curación,
 * blindaje, stacks de estado, blindaje por punto de la válvula y retraso.
 * NO dobla la distancia de empuje ni la Presión añadida por efectos.
 */

import { OVERCLOCK_PRESSURE, OVERLOAD_DAMAGE, PRESSURE_MAX } from '../shared/constants';
import { absorb, computeDamage, type FacingRel } from '../shared/damage';
import { DIR_VEC, dirTo, heightAt, isDown, posEq, prototypeAt, sortedIds } from './board';
import { damageUnit, emit, gainBlock, giveStatus, healUnit, setBrio, type Ctx } from './ctx';
import { addPressure, setPressure } from './pressure';
import { placePrototype, queueDetonation, resolveDetonations } from './prototypes';
import { pushPrototype, pushUnit } from './push';
import { affectedUnits, areaTiles } from './targeting';
import type { BattleState, DamageMod, DamagePreview, Dir, Pos, SkillDef, TacticsRegistry, UnitState } from './types';

/** Frente/lado/espalda del objetivo según desde dónde le llega el golpe. */
export function facingRel(targetFacing: Dir, attackerPos: Pos, targetPos: Pos): FacingRel {
  const f = DIR_VEC[targetFacing];
  const vx = attackerPos.x - targetPos.x;
  const vy = attackerPos.y - targetPos.y;
  if (vx === 0 && vy === 0) return 'front';
  const along = f.x * vx + f.y * vy;
  const perp = Math.abs(f.x * vy - f.y * vx);
  if (along > 0 && along >= perp) return 'front';
  if (-along > perp) return 'back';
  return 'side';
}

export function attackHit(
  s: BattleState,
  r: TacticsRegistry,
  attacker: UnitState,
  target: UnitState,
  power: number,
  steam: boolean,
  pressure: number,
): { amount: number; breakdown: DamageMod[] } {
  return computeDamage({
    power,
    attacker,
    atk: r.unit(attacker.defId).atk,
    target,
    def: r.unit(target.defId).def,
    steam,
    pressure,
    dh: heightAt(s, attacker.pos) - heightAt(s, target.pos),
    facing: facingRel(target.facing, attacker.pos, target.pos),
  });
}

function pressureAfter(p: number, add: number): number {
  const v = Math.max(0, Math.min(PRESSURE_MAX, p + add));
  return v >= PRESSURE_MAX ? 0 : v;
}

/** Previsión analítica del daño de ataque (sin cadenas de explosiones). */
export function previewSkill(
  s: BattleState,
  r: TacticsRegistry,
  u: UnitState,
  skill: SkillDef,
  target: Pos,
  overclock = false,
): DamagePreview[] {
  const m = overclock ? 2 : 1;
  let p = s.pressure;
  const area = areaTiles(s.board, u.pos, target, skill.area);
  const affected = affectedUnits(s, u, skill, area);
  const sim = new Map(affected.map((v) => [v.id, { hp: v.hp, block: v.block, amount: 0, blocked: 0, breakdown: null as DamageMod[] | null }]));
  if (overclock) {
    const before = p;
    p = pressureAfter(p, OVERCLOCK_PRESSURE);
    if (before + OVERCLOCK_PRESSURE >= PRESSURE_MAX) {
      for (const st of sim.values()) {
        const a = absorb(st.block, OVERLOAD_DAMAGE);
        st.block -= a.blocked;
        st.hp = Math.max(0, st.hp - a.hpLoss);
      }
    }
  }
  for (const eff of skill.effects) {
    switch (eff.kind) {
      case 'pressure':
        p = pressureAfter(p, eff.amount);
        break;
      case 'vent':
        p = 0;
        break;
      case 'block':
        for (const st of sim.values()) st.block += eff.amount * m;
        break;
      case 'damage':
        for (const v of affected) {
          const st = sim.get(v.id)!;
          for (let t = 0; t < (eff.times ?? 1); t++) {
            if (st.hp <= 0) break;
            const hit = attackHit(s, r, u, v, eff.power * m, !!skill.steam, p);
            const a = absorb(st.block, hit.amount);
            st.block -= a.blocked;
            const lost = Math.min(st.hp, a.hpLoss);
            st.hp -= lost;
            st.amount += lost;
            st.blocked += a.blocked;
            st.breakdown ??= hit.breakdown;
          }
        }
        break;
      default:
        break;
    }
  }
  const out: DamagePreview[] = [];
  for (const v of affected) {
    const st = sim.get(v.id)!;
    if (!st.breakdown) continue;
    out.push({ unitId: v.id, amount: st.amount, blocked: st.blocked, breakdown: st.breakdown, ko: st.hp <= 0 });
  }
  return out;
}

export function resolveSkill(ctx: Ctx, u: UnitState, skill: SkillDef, target: Pos, overclock: boolean): void {
  const s = ctx.s;
  if (skill.cost > 0) setBrio(ctx, u, u.brio - skill.cost);
  const origin = { ...u.pos };
  const area = areaTiles(s.board, origin, target, skill.area);
  emit(ctx, { type: 'SkillUsed', unitId: u.id, skillId: skill.id, target: { ...target }, area, overclock });
  if (overclock) addPressure(ctx, OVERCLOCK_PRESSURE);
  const m = overclock ? 2 : 1;
  const inArea = (p: Pos) => area.some((a) => posEq(a, p));
  const hostileSkill = skill.target === 'hostile' || skill.target === 'tile';

  for (const eff of skill.effects) {
    if (isDown(u) || s.phase !== 'awaitingPlayer' || ctx.forcedDefeat) break;
    const affected = affectedUnits(s, u, skill, area);
    switch (eff.kind) {
      case 'damage':
        for (const v of affected) {
          for (let t = 0; t < (eff.times ?? 1); t++) {
            if (isDown(v)) break;
            const hit = attackHit(s, ctx.r, u, v, eff.power * m, !!skill.steam, s.pressure);
            damageUnit(ctx, v, hit.amount, 'attack', hit.breakdown);
          }
        }
        if (hostileSkill) {
          for (const q of s.prototypes) if (inArea(q.pos)) queueDetonation(ctx, q.id);
          resolveDetonations(ctx);
        }
        break;
      case 'heal':
        for (const v of affected) healUnit(ctx, v, eff.amount * m);
        break;
      case 'block':
        for (const v of affected) gainBlock(ctx, v, eff.amount * m);
        break;
      case 'status':
        for (const v of affected) giveStatus(ctx, v, eff.status, eff.stacks * m);
        break;
      case 'push':
        for (const v of affected) {
          if (isDown(v)) continue;
          const d = dirTo(origin, v.pos);
          if (d) pushUnit(ctx, v, DIR_VEC[d], eff.distance);
        }
        if (hostileSkill) {
          for (const q of sortedIds(s.prototypes.filter((q) => inArea(q.pos)))) {
            const d = dirTo(origin, q.pos);
            if (d) pushPrototype(ctx, q, DIR_VEC[d], eff.distance);
          }
        }
        break;
      case 'pressure':
        addPressure(ctx, eff.amount);
        break;
      case 'vent': {
        const purged = s.pressure;
        setPressure(ctx, 0);
        gainBlock(ctx, u, purged * eff.blockPerPoint * m);
        break;
      }
      case 'placePrototype':
        if (!prototypeAt(s, target) && !s.units.some((v) => !isDown(v) && posEq(v.pos, target))) {
          placePrototype(ctx, eff.prototypeId, target, u.id);
        }
        break;
      case 'delay':
        for (const v of affected) {
          if (v.id === u.id) continue;
          const e = s.timeline.find((x) => x.ref.kind === 'unit' && x.ref.id === v.id);
          if (e) e.ct = Math.max(0, e.ct - eff.ct * m);
        }
        break;
    }
  }

  if (!isDown(u)) {
    const d = dirTo(u.pos, target);
    if (d && d !== u.facing) {
      u.facing = d;
      emit(ctx, { type: 'Faced', unitId: u.id, dir: d });
    }
  }
}
