import type Phaser from 'phaser';
import type { Ambiente, Pos } from '../../core/tactics/types';
import { asegurarProp } from '../../game/placeholders';
import { CAPA, depthOf } from '../iso/proyeccion';
import { rngVisual } from './claves';

/** Suelo mínimo donde apoyar props (TableroIso o un adaptador de exploración). */
export interface SueloProps {
  tileToWorld(p: Pos): { x: number; y: number };
  alturaDe(p: Pos): number;
}

export type PropDecl = Ambiente['props'][number];

/**
 * Props del escenario con spritesheet en bucle («Mundo vivo», capa 1):
 * engranajes, estandartes, faroles, chimeneas, el Coso...
 *
 * Cada prop arranca en un frame y a una velocidad ligeramente distintos
 * (desfase SEMBRADO: dos ejecuciones se ven igual, pero no van al unísono).
 * Sin arte, usa una caja de relleno con farol de 2 frames que también parpadea.
 */
export class PropsAnimados {
  readonly items: Phaser.GameObjects.Sprite[] = [];

  constructor(
    private scene: Phaser.Scene,
    props: PropDecl[],
    suelo: SueloProps,
    semilla = 0xc050,
  ) {
    const rnd = rngVisual(semilla);
    for (const p of props) {
      const w = suelo.tileToWorld(p.pos);
      const { textura, anim } = this.resolver(p.sprite);
      const spr = scene.add
        .sprite(w.x, w.y + 2, textura)
        .setOrigin(0.5, 1)
        .setDepth(depthOf(p.pos.x, p.pos.y, suelo.alturaDe(p.pos), CAPA.prop));
      const r1 = rnd();
      const r2 = rnd();
      if (p.animated && anim) {
        const n = scene.anims.get(anim)?.frames.length ?? 1;
        spr.play({ key: anim, startFrame: Math.floor(r1 * n) % Math.max(1, n), timeScale: 0.85 + r2 * 0.3 });
      }
      this.items.push(spr);
    }
    scene.events.once('shutdown', () => this.destroy());
  }

  /** Busca animación real `${sprite}` o `${sprite}_idle`; si hay hoja sin animación, la crea; si no, relleno. */
  private resolver(sprite: string): { textura: string; anim: string | null } {
    const { anims, textures } = this.scene;
    for (const k of [sprite, `${sprite}_idle`]) {
      if (anims.exists(k)) {
        const f = anims.get(k)?.frames[0];
        return { textura: f?.textureKey ?? sprite, anim: k };
      }
    }
    if (textures.exists(sprite)) {
      const tex = textures.get(sprite);
      if (tex.frameTotal > 2) {
        anims.create({ key: sprite, frames: anims.generateFrameNumbers(sprite, {}), frameRate: 8, repeat: -1 });
        return { textura: sprite, anim: sprite };
      }
      return { textura: sprite, anim: null };
    }
    const ph = asegurarProp(this.scene, sprite);
    const key = `${ph}_loop`;
    if (!anims.exists(key)) {
      anims.create({
        key,
        frames: [
          { key: ph, frame: 'a', duration: 900 },
          { key: ph, frame: 'b', duration: 140 },
          { key: ph, frame: 'a', duration: 300 },
          { key: ph, frame: 'b', duration: 90 },
        ],
        frameRate: 10,
        repeat: -1,
      });
    }
    return { textura: ph, anim: key };
  }

  destroy(): void {
    for (const s of this.items) s.destroy();
    this.items.length = 0;
  }
}
