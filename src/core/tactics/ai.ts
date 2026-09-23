/**
 * IA determinista por utilidad entera. Evalúa (casilla alcanzable × habilidad
 * pagable × objetivo válido) y se queda con la mayor puntuación; en empate,
 * la primera en orden (casillas por índice, habilidades en orden de la
 * definición, objetivos por índice), con +1 por quedarse quieta.
 *
 * Perfiles: agresivo (acercarse y pegar), cobarde (con < 50 % de vida huye y
 * sus acciones valen la cuarta parte), guardian (defiende su posición),
 * kamikaze (no teme la Presión ni la Sobrecarga), jefe (agresivo con más
 * premio por KO), inmovil (no se mueve).
 */

import { COLLISION_DAMAGE, OVERLOAD_DAMAGE, PRESSURE_MAX, PRESSURE_SWEET_SPOT } from '../shared/constants';
import { absorb } from '../shared/damage';
import {
  DIR_VEC,
  dirTo,
  hostile,
  idxOf,
  isDown,
  manhattan,
  mustUnit,
  posEq,
  tileOf,
} from './board';
import { makeCtx } from './ctx';
import { previewSkill } from './actions';
import { computeReach } from './pathfinding';
import { explosionArea } from './prototypes';
import { simulatePush } from './push';
import { affectedUnits, areaTiles, targetsFor } from './targeting';
import { startUnitTurn } from './turn';
import type { AiPlan, AiProfile, BattleState, Dir, Pos, SkillDef, TacticsRegistry, Team, UnitState } from './types';

const W = {
  dmgHostile: 10,
  dmgFriendly: 15,
  koHostile: 60,
  koHostileJefe: 90,
  koFriendly: 120,
  height: 2,
  explosionDanger: 40,
  approach: 3,
  flee: 10,
  guard: 4,
  goal: 6,
  goalReached: 200,
  stay: 1,
};

export interface Danger {
  /** Casillas de explosiones telegrafiadas (prototipos con mecha ≤ 1). */
  explosion: Set<number>;
  /** Casillas con terreno que daña al empezar turno. */
  terrain: Set<number>;
}

export function computeDanger(s: BattleState, r: TacticsRegistry): Danger {
  const explosion = new Set<number>();
  const terrain = new Set<number>();
  for (const p of s.prototypes) {
    if (p.remaining > 1) continue;
    for (const t of explosionArea({ s, r }, p)) explosion.add(idxOf(s.board, t));
  }
  s.board.tiles.forEach((t, i) => {
    if ((r.terrain(t.terrain).onTurnStart?.damage ?? 0) > 0) terrain.add(i);
  });
  return { explosion, terrain };
}

function profileOf(r: TacticsRegistry, u: UnitState): AiProfile {
  return r.unit(u.defId).ai ?? 'agresivo';
}

function withUnitAt(s: BattleState, id: string, p: Pos): { hs: BattleState; hu: UnitState } {
  let hu: UnitState | undefined;
  const units = s.units.map((v) => {
    if (v.id !== id) return v;
    hu = { ...v, pos: { ...p } };
    return hu;
  });
  return { hs: { ...s, units }, hu: hu! };
}

function livingHostiles(s: BattleState, team: Team): UnitState[] {
  return s.units.filter((v) => !isDown(v) && hostile(team, v.team));
}

function nearestDist(p: Pos, list: Pos[]): number {
  let d = Infinity;
  for (const q of list) d = Math.min(d, manhattan(p, q));
  return d;
}

function overloadValue(s: BattleState, hu: UnitState, profile: AiProfile): number {
  let sc = 0;
  for (const v of s.units) {
    if (isDown(v)) continue;
    const a = absorb(v.block, OVERLOAD_DAMAGE);
    const lost = Math.min(v.hp, a.hpLoss);
    const ko = lost >= v.hp;
    if (hostile(hu.team, v.team)) sc += lost * W.dmgHostile + (ko ? W.koHostile : 0);
    else if (profile !== 'kamikaze') sc -= lost * W.dmgFriendly + (ko ? W.koFriendly : 0);
  }
  return sc;
}

function unitsIn(s: BattleState, area: Pos[]): UnitState[] {
  return s.units.filter((v) => !isDown(v) && area.some((a) => posEq(a, v.pos)));
}

function explosionValue(s: BattleState, r: TacticsRegistry, hu: UnitState, defId: string, at: Pos, profile: AiProfile): number {
  const def = r.prototype(defId);
  if (def.onExplode === 'defeat') return hostile(hu.team, 'player') ? 500 : -100000;
  const dmg = Math.max(def.damage, 6);
  let sc = 0;
  for (const v of unitsIn(s, areaTiles(s.board, at, at, def.area))) {
    const ko = dmg >= v.hp + v.block;
    if (hostile(hu.team, v.team)) sc += dmg * W.dmgHostile + (ko ? W.koHostile : 0);
    else sc -= (profile === 'kamikaze' ? 5 : W.dmgFriendly) * dmg + (ko ? W.koFriendly : 0);
  }
  return sc;
}

function actionScore(
  hs: BattleState,
  r: TacticsRegistry,
  hu: UnitState,
  skill: SkillDef,
  target: Pos,
  profile: AiProfile,
  lowHp: boolean,
): number {
  const area = areaTiles(hs.board, hu.pos, target, skill.area);
  const affected = affectedUnits(hs, hu, skill, area);
  const hostileSkill = skill.target === 'hostile' || skill.target === 'tile';
  const protos = hostileSkill ? hs.prototypes.filter((q) => area.some((a) => posEq(a, q.pos))) : [];
  const isHostile = (v: UnitState) => hostile(hu.team, v.team);
  let sc = 0;
  const hasDamage = skill.effects.some((e) => e.kind === 'damage');
  if (hasDamage) {
    if (affected.length === 0 && protos.length === 0) return 0;
    for (const pv of previewSkill(hs, r, hu, skill, target)) {
      const v = mustUnit(hs, pv.unitId);
      if (isHostile(v)) sc += pv.amount * W.dmgHostile + pv.blocked * 2 + (pv.ko ? (profile === 'jefe' ? W.koHostileJefe : W.koHostile) : 0);
      else sc -= pv.amount * (profile === 'kamikaze' ? 5 : W.dmgFriendly) + (pv.ko ? W.koFriendly : 0);
    }
    for (const q of protos) sc += explosionValue(hs, r, hu, q.defId, q.pos, profile);
  }
  const p0 = hs.pressure;
  const hostilesNear = livingHostiles(hs, hu.team).some((v) => manhattan(v.pos, hu.pos) <= 5);
  for (const eff of skill.effects) {
    switch (eff.kind) {
      case 'heal':
        for (const v of affected) {
          const gain = Math.min(eff.amount, v.maxHp - v.hp);
          sc += (isHostile(v) ? -1 : 1) * gain * 8;
        }
        break;
      case 'block':
        if (hostilesNear) for (const v of affected) sc += (isHostile(v) ? -1 : 1) * eff.amount * 2;
        break;
      case 'status': {
        const debuff = eff.status !== 'strength';
        for (const v of affected) sc += (isHostile(v) === debuff ? 1 : -1) * eff.stacks * 6;
        break;
      }
      case 'push':
        for (const v of affected) {
          if (r.unit(v.defId).immunities?.includes('push')) continue;
          const d = dirTo(hu.pos, v.pos);
          if (!d) continue;
          const o = simulatePush(hs, r, v.pos, DIR_VEC[d], eff.distance, v.id, false);
          let val = o.removed ? 90 : 0;
          for (const f of o.falls) val += f.damage * W.dmgHostile;
          if (o.hit) val += COLLISION_DAMAGE * W.dmgHostile;
          if (o.moved) val += 2;
          if (o.otherIsUnit && o.otherId) {
            const other = mustUnit(hs, o.otherId);
            val += (isHostile(other) ? 1 : -1.5) * COLLISION_DAMAGE * W.dmgHostile;
          }
          sc += isHostile(v) ? val : -1.5 * val;
        }
        break;
      case 'pressure': {
        const np = p0 + eff.amount;
        if (np >= PRESSURE_MAX) sc += overloadValue(hs, hu, profile);
        else if (eff.amount > 0) {
          if (profile === 'kamikaze') sc += eff.amount * 4;
          else if (np >= PRESSURE_SWEET_SPOT && p0 < PRESSURE_SWEET_SPOT) sc += 3;
        }
        break;
      }
      case 'vent':
        if (p0 > 0) sc += p0 * eff.blockPerPoint * 2 + (p0 >= 7 ? 15 : 0);
        break;
      case 'placePrototype':
        sc += Math.floor(explosionValue(hs, r, hu, eff.prototypeId, target, profile) * 0.4);
        break;
      case 'delay':
        for (const v of affected) if (isHostile(v)) sc += Math.floor(eff.ct / 2);
        break;
      default:
        break;
    }
  }
  if (profile === 'cobarde' && lowHp) sc = Math.floor(sc / 4);
  return Math.round(sc);
}

function positionalScore(
  s: BattleState,
  r: TacticsRegistry,
  u: UnitState,
  T: Pos,
  profile: AiProfile,
  lowHp: boolean,
  danger: Danger,
  hostilePos: Pos[],
): number {
  const tile = tileOf(s.board, T)!;
  const i = idxOf(s.board, T);
  let sc = tile.h * W.height;
  if (danger.explosion.has(i)) sc -= profile === 'kamikaze' ? 10 : W.explosionDanger;
  const ts = r.terrain(tile.terrain).onTurnStart;
  if (ts?.damage) sc -= ts.damage * 8;
  if (ts?.status) sc -= 6;
  const d = hostilePos.length > 0 ? nearestDist(T, hostilePos) : 0;
  switch (profile) {
    case 'agresivo':
    case 'jefe':
    case 'kamikaze':
      sc -= d * W.approach;
      break;
    case 'cobarde':
      sc += lowHp ? d * W.flee : -d * W.approach;
      break;
    case 'guardian':
      sc -= manhattan(T, u.pos) * W.guard;
      break;
    case 'inmovil':
      break;
  }
  if (u.team === 'player') {
    const goals = s.objectives.flatMap((o) => (o.kind === 'reach' ? o.tiles : []));
    if (goals.length > 0) {
      const g = nearestDist(T, goals);
      sc -= g * W.goal;
      if (g === 0) sc += W.goalReached;
    }
  }
  if (posEq(T, u.pos)) sc += W.stay;
  return sc;
}

/**
 * Plan de la IA para `unitId` en el estado dado (sin simular el inicio de
 * turno). Si la unidad es la del turno en curso, respeta moved/acted.
 */
export function planFor(s: BattleState, r: TacticsRegistry, unitId: string): AiPlan & { score: number } {
  const u = mustUnit(s, unitId);
  const def = r.unit(u.defId);
  const profile = profileOf(r, u);
  const turn = s.turn && s.turn.unitId === u.id ? s.turn : null;
  const canMove = profile !== 'inmovil' && !turn?.moved;
  const canAct = !turn?.acted;
  const tiles = canMove ? computeReach(s, r, u).map((t) => t.pos) : [{ ...u.pos }];
  const lowHp = u.hp * 2 < u.maxHp;
  const danger = computeDanger(s, r);
  const hostilePos = livingHostiles(s, u.team).map((v) => v.pos);
  const skills = def.skills.map((id) => r.skill(id));

  let best: (AiPlan & { score: number }) | null = null;
  for (const T of tiles) {
    const { hs, hu } = withUnitAt(s, u.id, T);
    let score = positionalScore(s, r, u, T, profile, lowHp, danger, hostilePos);
    let skillId: string | null = null;
    let target: Pos | null = null;
    if (canAct) {
      let bestAct = 0;
      for (const sk of skills) {
        if (sk.cost > u.brio) continue;
        for (const tg of targetsFor(hs, r, hu, sk)) {
          const a = actionScore(hs, r, hu, sk, tg, profile, lowHp);
          if (a > bestAct) {
            bestAct = a;
            skillId = sk.id;
            target = tg;
          }
        }
      }
      score += bestAct;
    }
    if (!best || score > best.score) {
      const area = skillId && target ? areaTiles(s.board, T, target, r.skill(skillId).area) : [];
      best = { unitId: u.id, moveTo: { ...T }, skillId, target, area, score };
    }
  }
  return best!;
}

/** Orientación final por defecto: hacia la hostil más cercana. */
export function faceNearestHostile(s: BattleState, u: UnitState): Dir | null {
  let bestD = Infinity;
  let dir: Dir | null = null;
  for (const v of livingHostiles(s, u.team)) {
    const d = manhattan(u.pos, v.pos);
    if (d < bestD) {
      bestD = d;
      dir = dirTo(u.pos, v.pos);
    }
  }
  return dir;
}

/** Previsión «si nada cambia»: simula el inicio de su turno y planifica. */
export function forecastPlan(s: BattleState, r: TacticsRegistry, unitId: string): AiPlan | null {
  const u0 = s.units.find((v) => v.id === unitId);
  if (!u0 || isDown(u0)) return null;
  if (s.turn?.unitId === unitId) {
    const { score: _score, ...plan } = planFor(s, r, unitId);
    return plan;
  }
  const clone = structuredClone(s);
  clone.turn = null;
  const ctx = makeCtx(clone, r);
  const u = mustUnit(clone, unitId);
  if (!startUnitTurn(ctx, u)) return null;
  const { score: _score, ...plan } = planFor(clone, r, unitId);
  return plan;
}
