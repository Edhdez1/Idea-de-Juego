/**
 * Tablero y utilidades geométricas/de equipo compartidas por el motor táctico.
 */

import type { BattleDef, BattleState, Board, Dir, Pos, PrototypeState, TacticsRegistry, Team, Tile, UnitState } from './types';

export const DIR_VEC: Record<Dir, Pos> = {
  SE: { x: 1, y: 0 },
  SW: { x: 0, y: 1 },
  NW: { x: -1, y: 0 },
  NE: { x: 0, y: -1 },
};

/** Orden fijo de vecinos (determinismo): +x, +y, −x, −y. */
export const NEIGHBORS: Pos[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

export function buildBoard(def: BattleDef, r: TacticsRegistry): Board {
  const h = def.heights.length;
  if (h === 0) throw new Error(`Batalla ${def.id}: tablero vacío`);
  const w = def.heights[0]!.length;
  if (def.terrain.length !== h) throw new Error(`Batalla ${def.id}: filas de terreno (${def.terrain.length}) ≠ filas de altura (${h})`);
  const tiles: Tile[] = [];
  for (let y = 0; y < h; y++) {
    const hr = def.heights[y]!;
    const tr = def.terrain[y]!;
    if (hr.length !== w || tr.length !== w) throw new Error(`Batalla ${def.id}: la fila ${y} no mide ${w}`);
    for (let x = 0; x < w; x++) {
      const hv = Number(hr[x]);
      if (!Number.isInteger(hv) || hv < 0 || hv > 6) throw new Error(`Batalla ${def.id}: altura inválida en (${x},${y})`);
      const ch = tr[x]!;
      const terrain = def.legend[ch];
      if (!terrain) throw new Error(`Batalla ${def.id}: el carácter «${ch}» no está en la leyenda`);
      r.terrain(terrain); // valida que exista
      tiles.push({ h: hv, terrain });
    }
  }
  const board: Board = { w, h, tiles };
  for (const it of def.interactables ?? []) {
    const t = tileOf(board, it.pos);
    if (!t) throw new Error(`Batalla ${def.id}: interactuable fuera del tablero`);
    t.interact = it.id;
  }
  return board;
}

export function inBounds(b: Board, p: Pos): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < b.w && p.y < b.h;
}

export function tileOf(b: Board, p: Pos): Tile | undefined {
  return inBounds(b, p) ? b.tiles[p.y * b.w + p.x] : undefined;
}

export function idxOf(b: Board, p: Pos): number {
  return p.y * b.w + p.x;
}

export function posOfIdx(b: Board, i: number): Pos {
  return { x: i % b.w, y: Math.floor(i / b.w) };
}

export const posEq = (a: Pos, b: Pos): boolean => a.x === b.x && a.y === b.y;
export const posKey = (p: Pos): string => `${p.x},${p.y}`;
export const manhattan = (a: Pos, b: Pos): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const addPos = (a: Pos, b: Pos): Pos => ({ x: a.x + b.x, y: a.y + b.y });

/** Dirección dominante de un vector (empate → eje x). null si es nulo. */
export function dirFromDelta(dx: number, dy: number): Dir | null {
  if (dx === 0 && dy === 0) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'SE' : 'NW';
  return dy > 0 ? 'SW' : 'NE';
}

export function dirTo(from: Pos, to: Pos): Dir | null {
  return dirFromDelta(to.x - from.x, to.y - from.y);
}

export function isDown(u: UnitState): boolean {
  return u.ko || !!u.removed;
}

/** player+ally contra enemy; 'third' es hostil a todos los demás. */
export function hostile(a: Team, b: Team): boolean {
  if (a === b) return false;
  if (a === 'third' || b === 'third') return true;
  const side = (t: Team) => (t === 'enemy' ? 1 : 0);
  return side(a) !== side(b);
}

/** Comparación natural estable de ids ('x#2' < 'x#10'). */
export function compareIds(a: string, b: string): number {
  const re = /(\d+)|(\D+)/g;
  const pa = a.match(re) ?? [];
  const pb = b.match(re) ?? [];
  for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
    const x = pa[i]!;
    const y = pb[i]!;
    if (x === y) continue;
    const nx = /^\d/.test(x);
    const ny = /^\d/.test(y);
    if (nx && ny) return Number(x) - Number(y) || (x < y ? -1 : 1);
    return x < y ? -1 : 1;
  }
  return pa.length - pb.length;
}

export function unitById(s: BattleState, id: string): UnitState | undefined {
  return s.units.find((u) => u.id === id);
}

export function mustUnit(s: BattleState, id: string): UnitState {
  const u = unitById(s, id);
  if (!u) throw new Error(`Unidad desconocida: ${id}`);
  return u;
}

/** Unidad en pie en esa casilla. */
export function livingUnitAt(s: BattleState, p: Pos): UnitState | undefined {
  return s.units.find((u) => !isDown(u) && posEq(u.pos, p));
}

export function prototypeAt(s: BattleState, p: Pos): PrototypeState | undefined {
  return s.prototypes.find((q) => posEq(q.pos, p));
}

export function heightAt(s: BattleState, p: Pos): number {
  return tileOf(s.board, p)?.h ?? 0;
}

export function sortedIds<T extends { id: string }>(list: T[]): T[] {
  return list.slice().sort((a, b) => compareIds(a.id, b.id));
}
