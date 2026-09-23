import type Phaser from 'phaser';
import { dur } from '../../game/anim';

/**
 * Promesas de tiempo para la cola de eventos. Todas las duraciones pasan por
 * dur() (ANIM_SCALE = 0 en modo test): con duración 0 se resuelven al
 * instante aplicando el estado final, sin esperar a un frame.
 */

export function esperar(scene: Phaser.Scene, ms: number): Promise<void> {
  const d = dur(ms);
  if (d <= 0) return Promise.resolve();
  return new Promise((res) => scene.time.delayedCall(d, () => res()));
}

export type Easing = (t: number) => number;

export const easeOutQuad: Easing = (t) => 1 - (1 - t) * (1 - t);
export const easeInQuad: Easing = (t) => t * t;
export const easeInOutSine: Easing = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * Anima un progreso t ∈ [0,1] durante `ms` (escalado por dur) llamando a
 * `aplicar(easing(t))`. Resuelve al terminar; con duración 0 aplica t=1 y
 * resuelve en el acto.
 */
export function animar(scene: Phaser.Scene, ms: number, aplicar: (t: number) => void, ease: Easing = (t) => t): Promise<void> {
  const d = dur(ms);
  if (d <= 0) {
    aplicar(ease(1));
    return Promise.resolve();
  }
  return new Promise((res) => {
    const prog = { t: 0 };
    scene.tweens.add({
      targets: prog,
      t: 1,
      duration: d,
      onUpdate: () => aplicar(ease(prog.t)),
      onComplete: () => {
        aplicar(ease(1));
        res();
      },
    });
  });
}
