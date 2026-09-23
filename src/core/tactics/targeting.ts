/**
 * Alcance, áreas y a quién afecta una habilidad.
 *
 * - Distancia Manhattan min..max. highGroundBonus: +1 al máximo si el
 *   atacante está ≥ 2 niveles por encima de la casilla objetivo.
 * - maxDh: |dh| máximo; por defecto 2 si range.max ≤ 1 (cuerpo a cuerpo).
 * - Áreas: single, cross (radio en las 4 direcciones), diamond (Manhattan ≤ radio),
 *   line (el objetivo y `radius` casillas más en la dirección atacante→objetivo).
 */

import {
  DIR_VEC,
  dirTo,
  heightAt,
  hostile,
  idxOf,
  inBounds,
  isDown,
  livingUnitAt,
  manhattan,
  posEq,
  prototypeAt,
  sortedIds,
  tileOf,
} from './board';
import type { AreaShape, BattleState, Board, Pos, SkillDef, TacticsRegistry, UnitState } from './types';

export function areaTiles(b: Board, origin: Pos, center: Pos, area: { shape: AreaShape; radius: number }): Pos[] {
  const out: Pos[] = [];
  const push = (p: Pos) => {
    if (inBounds(b, p) && !out.some((q) => posEq(q, p))) out.push(p);
  };
  const R = Math.max(0, area.radius);
  switch (area.shape) {
    case 'single':
      push(center);
      break;
    case 'cross':
      push(center);
      for (let i = 1; i <= R; i++) {
        push({ x: center.x + i, y: center.y });
        push({ x: center.x, y: center.y + i });
        push({ x: center.x - i, y: center.y });
        push({ x: center.x, y: center.y - i });
      }
      break;
    case 'diamond':
      for (let dy = -R; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++)
          if (Math.abs(dx) + Math.abs(dy) <= R) push({ x: center.x + dx, y: center.y + dy });
      break;
    case 'line': {
      push(center);
      const d = dirTo(origin, center);
      if (d) {
        const v = DIR_VEC[d];
        for (let i = 1; i <= R; i++) push({ x: center.x + v.x * i, y: center.y + v.y * i });
      }
      break;
    }
  }
  return out.sort((a, c) => idxOf(b, a) - idxOf(b, c));
}

/** ¿`target` está al alcance de la habilidad lanzada desde `from`? (solo geometría) */
export function inSkillRange(s: BattleState, skill: SkillDef, from: Pos, target: Pos): boolean {
  if (!inBounds(s.board, target)) return false;
  if (skill.target === 'self') return posEq(from, target);
  const d = manhattan(from, target);
  const dh = heightAt(s, from) - heightAt(s, target);
  const max = skill.range.max + (skill.range.highGroundBonus && dh >= 2 ? 1 : 0);
  if (d < skill.range.min || d > max) return false;
  const maxDh = skill.range.maxDh ?? (skill.range.max <= 1 ? 2 : undefined);
  if (maxDh !== undefined && Math.abs(dh) > maxDh) return false;
  return true;
}

/** Objetivo válido para `u` (desde su posición actual). */
export function isValidTarget(s: BattleState, r: TacticsRegistry, u: UnitState, skill: SkillDef, target: Pos): boolean {
  if (!inSkillRange(s, skill, u.pos, target)) return false;
  const single = skill.area.shape === 'single';
  const occupant = livingUnitAt(s, target);
  switch (skill.target) {
    case 'self':
      return true;
    case 'hostile':
      if (!single) return true;
      return (!!occupant && hostile(u.team, occupant.team)) || !!prototypeAt(s, target);
    case 'friendly':
      if (!single) return true;
      return !!occupant && !hostile(u.team, occupant.team);
    case 'tile': {
      if (occupant || prototypeAt(s, target)) return false;
      const t = tileOf(s.board, target)!;
      return Number.isFinite(r.terrain(t.terrain).moveCost) && !r.terrain(t.terrain).pushedInto;
    }
  }
}

export function targetsFor(s: BattleState, r: TacticsRegistry, u: UnitState, skill: SkillDef): Pos[] {
  const out: Pos[] = [];
  if (skill.target === 'self') return [{ ...u.pos }];
  const R = skill.range.max + (skill.range.highGroundBonus ? 1 : 0);
  for (let y = u.pos.y - R; y <= u.pos.y + R; y++)
    for (let x = u.pos.x - R; x <= u.pos.x + R; x++) {
      const p = { x, y };
      if (isValidTarget(s, r, u, skill, p)) out.push(p);
    }
  return out;
}

/**
 * Unidades afectadas (orden estable por id):
 * - self/friendly: solo las no hostiles del área (incluida la propia).
 * - hostile de área single: solo hostiles.
 * - resto (áreas hostiles, 'tile'): TODAS las del área (fuego amigo).
 */
export function affectedUnits(s: BattleState, u: UnitState, skill: SkillDef, area: Pos[]): UnitState[] {
  const inArea = s.units.filter((o) => !isDown(o) && area.some((p) => posEq(p, o.pos)));
  let list: UnitState[];
  if (skill.target === 'self' || skill.target === 'friendly') list = inArea.filter((o) => !hostile(u.team, o.team));
  else if (skill.target === 'hostile' && skill.area.shape === 'single') list = inArea.filter((o) => hostile(u.team, o.team));
  else list = inArea;
  return sortedIds(list);
}
