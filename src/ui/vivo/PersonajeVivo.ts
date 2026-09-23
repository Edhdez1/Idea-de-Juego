import Phaser from 'phaser';
import { dur } from '../../game/anim';
import { PEON_H, PEON_PIES } from '../../game/placeholders';
import type { Dir8 } from '../iso/proyeccion';
import { ANIMS, DIRS_DIBUJADAS, EN_BUCLE, FPS, claveAnim, resolverClaveAnim, rngVisual, type AnimId } from './claves';
import { animar, easeOutQuad } from './tiempo';

/**
 * Máquina de estados de animación de un personaje («Mundo vivo», capa 3).
 *
 * Estados: idle (siempre activo por defecto), walk, attack, hurt, ko, celebrate.
 * Con arte real reproduce `${sprite}_${anim}_${dir}` (espejo para SW/W/NW).
 * Sin arte usa un peón de relleno que TAMBIÉN está vivo: respira en reposo,
 * trota al caminar, se aplasta en KO y da saltitos al celebrar.
 *
 * Lo usan UnidadVista (batalla) y, más adelante, los NPCs de exploración.
 */

export interface OpcionesPersonaje {
  /** Clave base de animaciones (UnitDef.sprite). */
  sprite: string;
  /** Textura del peón de relleno (frames SE/SW/NE/NW), si no hay animaciones reales. */
  placeholder?: string;
  escala?: number;
  /** Semilla para desfasar la respiración (que no respiren todos a la vez). */
  semilla?: number;
  dir?: Dir8;
}

/**
 * Crea las animaciones de un personaje a partir de hojas ya cargadas con la
 * convención `${sprite}_${anim}_${dir}` (una hoja por anim y dirección).
 * Idempotente: no toca animaciones que ya existan.
 */
export function asegurarAnimsPersonaje(scene: Phaser.Scene, sprite: string): number {
  let creadas = 0;
  for (const anim of ANIMS) {
    for (const dir of DIRS_DIBUJADAS) {
      const key = claveAnim(sprite, anim, dir);
      if (scene.anims.exists(key) || !scene.textures.exists(key)) continue;
      const frames = scene.anims.generateFrameNumbers(key, {});
      if (frames.length === 0) continue;
      scene.anims.create({ key, frames, frameRate: FPS[anim], repeat: EN_BUCLE[anim] ? -1 : 0 });
      creadas++;
    }
  }
  return creadas;
}

export class PersonajeVivo {
  readonly sprite: Phaser.GameObjects.Sprite;
  private estado: AnimId = 'idle';
  private dir: Dir8;
  private readonly real: boolean;
  private readonly escala: number;
  private respiracion?: Phaser.Tweens.Tween;
  private readonly fase: number;
  private destruido = false;

  constructor(
    private scene: Phaser.Scene,
    private opts: OpcionesPersonaje,
  ) {
    asegurarAnimsPersonaje(scene, opts.sprite);
    this.dir = opts.dir ?? 'SE';
    this.escala = opts.escala ?? 1;
    this.fase = Math.floor(rngVisual(opts.semilla ?? 1)() * 900);
    this.real = resolverClaveAnim(opts.sprite, 'idle', this.dir, (k) => scene.anims.exists(k)) !== null;

    if (this.real) {
      this.sprite = scene.add.sprite(0, 0, '__DEFAULT').setOrigin(0.5, 0.92);
    } else {
      const key = opts.placeholder && scene.textures.exists(opts.placeholder) ? opts.placeholder : '__DEFAULT';
      this.sprite = scene.add.sprite(0, 0, key, key === '__DEFAULT' ? undefined : 'SE').setOrigin(0.5, PEON_PIES / PEON_H);
    }
    this.sprite.setScale(this.escala);
    this.aplicar();
  }

  get tieneArte(): boolean {
    return this.real;
  }

  get estadoActual(): AnimId {
    return this.estado;
  }

  get direccion(): Dir8 {
    return this.dir;
  }

  setDir(dir: Dir8): void {
    if (dir === this.dir) return;
    this.dir = dir;
    this.aplicar(true);
  }

  /**
   * Cambia de estado. Los estados en bucle (idle, walk) resuelven al instante;
   * los de una vez (attack, hurt, celebrate, ko) resuelven al terminar y
   * vuelven solos a idle, salvo KO, que se queda en el último frame.
   */
  async reproducir(anim: AnimId): Promise<void> {
    if (this.destruido) return;
    if (this.estado === 'ko' && anim !== 'ko' && anim !== 'idle') return;
    this.estado = anim;
    const fin = this.aplicar();
    await fin;
    if (this.destruido) return;
    if (!EN_BUCLE[anim] && anim !== 'ko' && this.estado === anim) {
      this.estado = 'idle';
      this.aplicar();
    }
  }

  /** Vuelve a reposo (también saca del KO). */
  reposo(): void {
    if (this.estado === 'ko') {
      this.sprite.clearTint();
      this.sprite.setAngle(0);
    }
    this.estado = 'idle';
    this.aplicar();
  }

  destroy(): void {
    this.destruido = true;
    this.respiracion?.stop();
    this.respiracion = undefined;
    this.sprite.destroy();
  }

  // ---------- Interno ----------

  /** Aplica estado + dirección. Devuelve una promesa que resuelve al terminar un estado de una vez. */
  private aplicar(soloDir = false): Promise<void> {
    if (this.real) return this.aplicarReal(soloDir);
    return this.aplicarPeon(soloDir);
  }

  private aplicarReal(soloDir: boolean): Promise<void> {
    const res = resolverClaveAnim(this.opts.sprite, this.estado, this.dir, (k) => this.scene.anims.exists(k));
    if (!res) return Promise.resolve();
    this.sprite.setFlipX(res.flipX);
    const actual = this.sprite.anims.currentAnim?.key;
    if (soloDir && actual === res.key) return Promise.resolve();
    // Conserva el progreso al girar en un bucle (no reinicia el paso).
    const progreso = soloDir && this.sprite.anims.isPlaying ? this.sprite.anims.getProgress() : 0;
    const bucle = EN_BUCLE[res.anim];
    const nFrames = this.scene.anims.get(res.key)?.frames.length ?? 1;
    this.sprite.play({ key: res.key, startFrame: bucle && !soloDir ? this.fase % Math.max(1, nFrames) : 0 }, false);
    if (progreso > 0) this.sprite.anims.setProgress(progreso);
    if (bucle || soloDir) return Promise.resolve();
    // En modo test (dur=0) no se espera a los frames.
    if (dur(1000) === 0) {
      const anim = this.sprite.anims.currentAnim;
      const ultimo = anim?.frames[anim.frames.length - 1];
      if (ultimo) this.sprite.anims.setCurrentFrame(ultimo);
      this.sprite.anims.stop();
      return Promise.resolve();
    }
    const duracion = this.sprite.anims.currentAnim?.duration ?? 500;
    return new Promise((ok) => {
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, fin);
        this.sprite.off(Phaser.Animations.Events.ANIMATION_STOP, fin);
        ok();
      };
      this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, fin);
      this.sprite.once(Phaser.Animations.Events.ANIMATION_STOP, fin);
      // Red de seguridad: si otra animación la interrumpe sin evento, la cola no se cuelga.
      this.scene.time.delayedCall(duracion + 250, fin);
    });
  }

  private aplicarPeon(soloDir: boolean): Promise<void> {
    const d = this.dir;
    const deEspaldas = d === 'N' || d === 'NE' || d === 'NW';
    const izquierda = d === 'SW' || d === 'W' || d === 'NW';
    // El peón trae los 4 frames dibujados (la inicial no sale en espejo).
    if (this.sprite.texture.key !== '__DEFAULT') this.sprite.setFrame(`${deEspaldas ? 'N' : 'S'}${izquierda ? 'W' : 'E'}`);
    this.sprite.setFlipX(false);
    if (soloDir) return Promise.resolve();

    this.respiracion?.stop();
    this.respiracion = undefined;
    this.sprite.setScale(this.escala);

    switch (this.estado) {
      case 'idle':
      case 'walk': {
        // Bucles ambientales: NO pasan por dur() (no bloquean la cola y con
        // duración 0 un tween infinito no tiene sentido).
        const rapido = this.estado === 'walk';
        this.respiracion = this.scene.tweens.add({
          targets: this.sprite,
          scaleY: this.escala * (rapido ? 0.94 : 1.05),
          scaleX: this.escala * (rapido ? 1.04 : 0.98),
          duration: rapido ? 110 : 760,
          delay: rapido ? 0 : this.fase,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        return Promise.resolve();
      }
      case 'ko':
        this.sprite.setTint(0x777777);
        return animar(
          this.scene,
          260,
          (t) => {
            this.sprite.setScale(this.escala * (1 + 0.15 * t), this.escala * (1 - 0.55 * t));
            this.sprite.setAngle((this.dir === 'SW' || this.dir === 'W' || this.dir === 'NW' ? -1 : 1) * 12 * t);
          },
          easeOutQuad,
        );
      case 'celebrate':
        return animar(this.scene, 700, (t) => {
          const salto = Math.abs(Math.sin(t * Math.PI * 3));
          this.sprite.y = -salto * 8;
          if (t >= 1) this.sprite.y = 0;
        });
      case 'attack':
      case 'hurt':
        // El peón no tiene frames: la embestida y el flash los pone UnidadVista.
        return Promise.resolve();
    }
  }
}
