/**
 * Proyección isométrica del tablero con alturas (módulo PURO: sin Phaser).
 *
 * Convención (igual que src/core/tactics/types.ts): +x va hacia abajo-derecha
 * (SE) y +y hacia abajo-izquierda (SW) en pantalla. Cada nivel de altura sube
 * la casilla LH píxeles.
 *
 *   sx = ox + (x − y)·TW/2
 *   sy = oy + (x + y)·TH/2 − h·LH
 *
 * (sx, sy) es el CENTRO de la cara superior (rombo) de la casilla elevada:
 * ahí pisan las unidades y se dibujan las capas de color.
 */

import type { Board, Dir, Pos } from '../../core/tactics/types';

/** Ancho del rombo. */
export const TW = 64;
/** Alto del rombo. */
export const TH = 32;
/** Píxeles por nivel de altura. */
export const LH = 16;
/** Grosor extra bajo el nivel 0 (para que las casillas bajas tengan canto). */
export const LIP = 8;

/** Capas de profundidad dentro de una misma casilla. */
export const CAPA = { loseta: 0, overlay: 1, unidad: 1.5, prop: 1.5 } as const;

export interface Origen {
  ox: number;
  oy: number;
}

export interface PuntoPantalla {
  sx: number;
  sy: number;
}

export function toScreen(x: number, y: number, h: number, origin: Origen = { ox: 0, oy: 0 }): PuntoPantalla {
  return {
    sx: origin.ox + ((x - y) * TW) / 2,
    sy: origin.oy + ((x + y) * TH) / 2 - h * LH,
  };
}

/** Profundidad de dibujo (algoritmo del pintor): más abajo en pantalla, más delante. */
export function depthOf(x: number, y: number, h: number, layer: number = CAPA.loseta): number {
  return (x + y) * 64 + h * 2 + layer;
}

/** Alto en píxeles de las caras laterales de una columna de altura h. */
export function alturaCaras(h: number): number {
  return h * LH + LIP;
}

/** ¿El punto (dx, dy) relativo al centro del rombo cae dentro de la cara superior? */
export function enRombo(dx: number, dy: number): boolean {
  return Math.abs(dx) / (TW / 2) + Math.abs(dy) / (TH / 2) < 1;
}

/**
 * ¿El punto cae dentro de la silueta de la columna (rombo superior + caras)?
 * La silueta es un hexágono: el rombo extruido hacia abajo `caras` píxeles.
 */
export function enColumna(dx: number, dy: number, caras: number): boolean {
  const ax = Math.abs(dx);
  if (ax >= TW / 2) return false;
  const k = (ax * TH) / TW; // cuánto se estrecha el rombo a esa distancia horizontal
  // Bordes estrictos: un punto justo en la arista es de la casilla de detrás
  // (el centro de una casilla puede coincidir con el vértice de la de delante).
  return dy > -TH / 2 + k && dy < TH / 2 - k + caras;
}

/** Casillas en orden de dibujo DESCENDENTE (la de más delante primero). */
export function casillasPorProfundidad(board: Board): { pos: Pos; h: number; depth: number }[] {
  const out: { pos: Pos; h: number; depth: number }[] = [];
  for (let y = 0; y < board.h; y++) {
    for (let x = 0; x < board.w; x++) {
      const t = board.tiles[y * board.w + x];
      if (!t) continue;
      out.push({ pos: { x, y }, h: t.h, depth: depthOf(x, y, t.h) });
    }
  }
  return out.sort((a, b) => b.depth - a.depth);
}

/**
 * Casilla bajo un punto de pantalla. Recorre de delante hacia atrás y devuelve
 * la primera cuyo rombo elevado contiene el punto. Con `caras` (por defecto)
 * también cuentan las paredes de la columna: si tapan lo de atrás, se elige
 * la columna que se ve.
 */
export function pickTile(
  sx: number,
  sy: number,
  board: Board,
  origin: Origen = { ox: 0, oy: 0 },
  opts: { caras?: boolean } = {},
): Pos | null {
  const caras = opts.caras ?? true;
  for (const c of casillasPorProfundidad(board)) {
    const p = toScreen(c.pos.x, c.pos.y, c.h, origin);
    const dx = sx - p.sx;
    const dy = sy - p.sy;
    if (caras ? enColumna(dx, dy, alturaCaras(c.h)) : enRombo(dx, dy)) return c.pos;
  }
  return null;
}

/** Orientación del tablero a partir de un desplazamiento en casillas. */
export function dirFromDelta(dx: number, dy: number): Dir {
  if (dx === 0 && dy === 0) return 'SE';
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'SE' : 'NW';
  return dy > 0 ? 'SW' : 'NE';
}

/** Vector unitario en casillas de una orientación. */
export function deltaDeDir(dir: Dir): Pos {
  switch (dir) {
    case 'SE':
      return { x: 1, y: 0 };
    case 'NW':
      return { x: -1, y: 0 };
    case 'SW':
      return { x: 0, y: 1 };
    case 'NE':
      return { x: 0, y: -1 };
  }
}

/** Direcciones de sprite (8, en pantalla). Se dibujan S, SE, E, NE, N; el resto en espejo. */
export type Dir8 = 'S' | 'SE' | 'E' | 'NE' | 'N' | 'NW' | 'W' | 'SW';

/** Dirección de sprite dibujada + si hay que voltear en X. */
export function spriteDir(dir: Dir8): { dir: 'S' | 'SE' | 'E' | 'NE' | 'N'; flipX: boolean } {
  switch (dir) {
    case 'SW':
      return { dir: 'SE', flipX: true };
    case 'W':
      return { dir: 'E', flipX: true };
    case 'NW':
      return { dir: 'NE', flipX: true };
    default:
      return { dir, flipX: false };
  }
}

/** Dirección de pantalla (8) a partir de un vector de pantalla (y hacia abajo). */
export function dir8FromVector(vx: number, vy: number): Dir8 {
  if (vx === 0 && vy === 0) return 'S';
  const ang = Math.atan2(vy, vx); // 0 = E, +π/2 = S
  const oct = Math.round(ang / (Math.PI / 4));
  const tabla: Dir8[] = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  return tabla[(oct + 8) % 8] ?? 'S';
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Caja envolvente en pantalla de todo el tablero (para los límites de cámara). */
export function boardBounds(board: Board, origin: Origen = { ox: 0, oy: 0 }, margen = 0): Rect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = 0; y < board.h; y++) {
    for (let x = 0; x < board.w; x++) {
      const t = board.tiles[y * board.w + x];
      if (!t) continue;
      const p = toScreen(x, y, t.h, origin);
      minX = Math.min(minX, p.sx - TW / 2);
      maxX = Math.max(maxX, p.sx + TW / 2);
      minY = Math.min(minY, p.sy - TH / 2);
      maxY = Math.max(maxY, p.sy + TH / 2 + alturaCaras(t.h));
    }
  }
  if (minX === Infinity) return { x: origin.ox, y: origin.oy, width: 0, height: 0 };
  return {
    x: minX - margen,
    y: minY - margen,
    width: maxX - minX + margen * 2,
    height: maxY - minY + margen * 2,
  };
}

/** Altura de la casilla (0 si está fuera del tablero). */
export function alturaEn(board: Board, p: Pos): number {
  if (p.x < 0 || p.y < 0 || p.x >= board.w || p.y >= board.h) return 0;
  return board.tiles[p.y * board.w + p.x]?.h ?? 0;
}
