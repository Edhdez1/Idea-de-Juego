/**
 * Consultas puras sobre BattleState (no mutan nada). Contrato con la UI.
 */

import { previewSkill } from './actions';
import { computeDanger, forecastPlan } from './ai';
import { livingUnitAt, mustUnit, posOfIdx, tileOf } from './board';
import { computeReach } from './pathfinding';
import { areaTiles, targetsFor } from './targeting';
import { predictTimeline } from './timeline';
import type { AiPlan, BattleState, DamagePreview, Pos, ReachTile, TacticsRegistry, Team, Tile, TimelineRef, UnitState } from './types';

/**
 * Casillas alcanzables por la unidad (incluye su casilla actual con cost 0;
 * path empieza en la casilla de origen). Si es la unidad del turno y ya se
 * movió, solo devuelve su casilla.
 */
export function reachable(s: BattleState, unitId: string, r: TacticsRegistry): ReachTile[] {
  const u = mustUnit(s, unitId);
  if (s.turn?.unitId === unitId && s.turn.moved) return [{ pos: { ...u.pos }, cost: 0, path: [{ ...u.pos }] }];
  return computeReach(s, r, u);
}

/** Casillas objetivo válidas para la habilidad desde la posición actual (solo geometría y ocupación; no mira el brío). */
export function validTargets(s: BattleState, unitId: string, skillId: string, r: TacticsRegistry): Pos[] {
  return targetsFor(s, r, mustUnit(s, unitId), r.skill(skillId));
}

/** Casillas afectadas si se usa la habilidad sobre `target`. */
export function areaOf(s: BattleState, unitId: string, skillId: string, target: Pos, r: TacticsRegistry): Pos[] {
  return areaTiles(s.board, mustUnit(s, unitId).pos, target, r.skill(skillId).area);
}

/** Daño previsto (con desglose) sobre cada unidad dañada del área. amount = vida perdida; blocked = absorbido. */
export function previewDamage(
  s: BattleState,
  unitId: string,
  skillId: string,
  target: Pos,
  r: TacticsRegistry,
  overclock?: boolean,
): DamagePreview[] {
  return previewSkill(s, r, mustUnit(s, unitId), r.skill(skillId), target, !!overclock);
}

/** Próximas n activaciones del Reloj de Vapor (sin incluir el turno en curso). */
export function predictOrder(s: BattleState, n: number): TimelineRef[] {
  return predictTimeline(s, n);
}

/** Lo que haría la IA de esa unidad si nada cambia (simula el inicio de su turno). */
export function forecast(s: BattleState, unitId: string, r: TacticsRegistry): AiPlan | null {
  return forecastPlan(s, r, unitId);
}

/**
 * Casillas peligrosas: explosiones de prototipos con mecha ≤ 1 (estallan en
 * su próxima activación) y terreno que daña al empezar turno. Las
 * explosiones dañan a todos los equipos por igual.
 */
export function dangerZone(s: BattleState, _team: Team, r: TacticsRegistry): Pos[] {
  const d = computeDanger(s, r);
  const all = [...new Set([...d.explosion, ...d.terrain])].sort((a, b) => a - b);
  return all.map((i) => posOfIdx(s.board, i));
}

export function unitAt(s: BattleState, p: Pos): UnitState | undefined {
  return livingUnitAt(s, p);
}

export function tileAt(s: BattleState, p: Pos): Tile | undefined {
  return tileOf(s.board, p);
}

/** Unidad del jugador cuyo turno está en curso. */
export function activeUnit(s: BattleState): UnitState | undefined {
  if (!s.turn) return undefined;
  return s.units.find((u) => u.id === s.turn!.unitId);
}


