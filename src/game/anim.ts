/**
 * Escala global de duración de animaciones.
 * En modo test (?test=1) se pone a 0 para que el smoke E2E no espere tweens.
 */

let ANIM_SCALE = 1;

export function setAnimScale(escala: number): void {
  ANIM_SCALE = escala;
}

/** Duración escalada en ms; 0 en modo test. */
export function dur(ms: number): number {
  return Math.round(ms * ANIM_SCALE);
}
