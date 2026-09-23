/**
 * Resolución de claves de animación por dirección (módulo PURO, sin Phaser).
 *
 * Convención de assets: `${sprite}_${anim}_${dir}` con anim ∈ ANIMS y
 * dir ∈ S, SE, E, NE, N (las dibujadas). SW, W y NW salen en espejo (flipX).
 * Los enemigos a veces solo traen diagonales (SE, NE): se cae a la más cercana.
 */

import { spriteDir, type Dir8 } from '../iso/proyeccion';
import type { Dir } from '../../core/tactics/types';

export const ANIMS = ['idle', 'walk', 'attack', 'hurt', 'ko', 'celebrate'] as const;
export type AnimId = (typeof ANIMS)[number];

export const DIRS_DIBUJADAS = ['S', 'SE', 'E', 'NE', 'N'] as const;
export type DirDibujada = (typeof DIRS_DIBUJADAS)[number];

/** Orden de preferencia si falta la dirección pedida (de la más parecida a la menos). */
const VECINAS: Record<DirDibujada, DirDibujada[]> = {
  S: ['S', 'SE', 'E', 'NE', 'N'],
  SE: ['SE', 'S', 'E', 'NE', 'N'],
  E: ['E', 'SE', 'NE', 'S', 'N'],
  NE: ['NE', 'N', 'E', 'SE', 'S'],
  N: ['N', 'NE', 'E', 'SE', 'S'],
};

export function claveAnim(sprite: string, anim: AnimId, dir: DirDibujada): string {
  return `${sprite}_${anim}_${dir}`;
}

export interface ClaveResuelta {
  key: string;
  flipX: boolean;
  anim: AnimId;
}

/**
 * Busca la mejor animación disponible para (anim, dir). Si la animación no
 * existe en ninguna dirección, cae a `idle` (salvo que ya se pidiera idle).
 * Devuelve null si el personaje no tiene ninguna animación real: entonces
 * se anima por código (peón de relleno).
 */
export function resolverClaveAnim(
  sprite: string,
  anim: AnimId,
  dir: Dir8,
  existe: (key: string) => boolean,
): ClaveResuelta | null {
  const { dir: base, flipX } = spriteDir(dir);
  for (const d of VECINAS[base]) {
    const key = claveAnim(sprite, anim, d);
    if (existe(key)) return { key, flipX, anim };
  }
  if (anim !== 'idle') return resolverClaveAnim(sprite, 'idle', dir, existe);
  return null;
}

/** Orientación del tablero → dirección de sprite en pantalla. */
export function dir8DeDir(dir: Dir): Dir8 {
  return dir;
}

/** Animaciones que se repiten en bucle (el resto se reproducen una vez). */
export const EN_BUCLE: Record<AnimId, boolean> = {
  idle: true,
  walk: true,
  attack: false,
  hurt: false,
  ko: false,
  celebrate: false,
};

/** Fotogramas por segundo por animación (cuando se crean desde una hoja). */
export const FPS: Record<AnimId, number> = {
  idle: 6,
  walk: 10,
  attack: 12,
  hurt: 10,
  ko: 8,
  celebrate: 8,
};

/**
 * Generador determinista para desfases visuales (mulberry32). Solo para
 * presentación: que los props y losetas no vayan todos sincronizados, pero
 * que dos ejecuciones se vean igual (capturas reproducibles).
 */
export function rngVisual(semilla: number): () => number {
  let a = semilla | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Desfase estable por posición (misma casilla → mismo desfase), en [0, periodo). */
export function faseDeCasilla(x: number, y: number, periodo: number, semilla = 0): number {
  const r = rngVisual(((x * 73856093) ^ (y * 19349663) ^ semilla) | 0)();
  return Math.floor(r * periodo);
}
