import Phaser from 'phaser';
import type { Ambiente as AmbienteDecl, Pos } from '../../core/tactics/types';
import { GAME_HEIGHT, GAME_WIDTH } from '../../game/constants';
import { asegurarParallax, asegurarParticulas, PARALLAX_H } from '../../game/placeholders';
import { CAPA, depthOf } from '../iso/proyeccion';
import { PropsAnimados, type SueloProps } from './PropsAnimados';

export type TipoEmisor = AmbienteDecl['emitters'][number]['kind'];

/** Tope de partículas vivas por tipo de emisor (se reparte el tope global). */
const TOPE: Record<TipoEmisor, number> = { vapor: 24, chispas: 18, polvo: 30, hollin: 40 };
const RITMO: Record<TipoEmisor, number> = { vapor: 6, chispas: 3, polvo: 3, hollin: 8 };

const PROFUNDIDAD_FONDO = -10000;
const PROFUNDIDAD_AIRE = 8000;
const PROFUNDIDAD_LUZ = 9000;

export interface OpcionesAmbiente {
  /** Suelo para emisores con `at` y para los props (sin suelo, se ignoran). */
  suelo?: SueloProps;
  /** Tope global de partículas vivas (rendimiento). */
  maxParticulas?: number;
  /** Semilla visual para desfases de props. */
  semilla?: number;
  /** Luz que respira (velo cálido que oscila). */
  luz?: boolean;
}

interface CapaParallax {
  obj: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
  factor: number;
  x0: number;
  y0: number;
}

/**
 * Ambiente por código de una pantalla («Mundo vivo», capa 2), construido a
 * partir de la declaración `ambiente` de cada BattleDef o mapa:
 *  - parallax de 3 capas (cielo, horizonte de la pirámide-ciudad con el faro
 *    del Coso pulsando, nubes a la deriva);
 *  - emisores de partículas (vapor, chispas, polvo, hollín) con tope;
 *  - props animados;
 *  - luz que respira.
 */
export class Ambiente {
  readonly emisores: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  readonly props?: PropsAnimados;
  private capas: CapaParallax[] = [];
  private nubes?: Phaser.GameObjects.TileSprite;
  private faro?: Phaser.GameObjects.Image;
  private tweens: Phaser.Tweens.Tween[] = [];
  private objetos: Phaser.GameObjects.GameObject[] = [];
  private ref?: { x: number; y: number };

  constructor(
    private scene: Phaser.Scene,
    decl: AmbienteDecl,
    opts: OpcionesAmbiente = {},
  ) {
    this.crearParallax(decl.parallax);
    this.crearEmisores(decl.emitters, opts);
    if (opts.suelo && decl.props.length > 0) this.props = new PropsAnimados(scene, decl.props, opts.suelo, opts.semilla);
    if (opts.luz ?? true) this.crearLuz();
    scene.events.on('update', this.update, this);
    scene.events.once('shutdown', () => this.destroy());
  }

  /** Partículas vivas ahora mismo (para test hooks / medir rendimiento). */
  get particulasVivas(): number {
    return this.emisores.reduce((s, e) => s + e.getAliveParticleCount(), 0);
  }

  /** Tope total configurado (suma de maxAliveParticles). */
  get topeParticulas(): number {
    return this.emisores.reduce((s, e) => s + e.maxAliveParticles, 0);
  }

  update(_t: number, delta: number): void {
    const cam = this.scene.cameras.main;
    if (!this.ref) this.ref = { x: cam.scrollX, y: cam.scrollY };
    const dx = cam.scrollX - this.ref.x;
    const dy = cam.scrollY - this.ref.y;
    for (const c of this.capas) {
      c.obj.setPosition(c.x0 - Phaser.Math.Clamp(dx * c.factor, -40, 40), c.y0 - Phaser.Math.Clamp(dy * c.factor, -20, 20));
    }
    if (this.nubes) this.nubes.tilePositionX += delta * 0.004;
    if (this.faro) {
      const ciudad = this.capas[1];
      if (ciudad) this.faro.setPosition(ciudad.obj.x, ciudad.obj.y + this.faroDy);
    }
  }

  destroy(): void {
    this.scene.events.off('update', this.update, this);
    for (const t of this.tweens) t.stop();
    this.tweens = [];
    for (const e of this.emisores) e.destroy();
    this.emisores.length = 0;
    for (const o of this.objetos) o.destroy();
    this.objetos = [];
    this.capas = [];
    this.props?.destroy();
  }

  // ---------- Parallax ----------

  private faroDy = 0;

  private clave(nombre: string, capa: 'cielo' | 'ciudad' | 'nubes' | 'faro', relleno: string): string {
    const t = this.scene.textures;
    for (const k of [`${nombre}_${capa}`, `parallax_${nombre}_${capa}`, `parallax_${capa}`]) if (t.exists(k)) return k;
    return relleno;
  }

  private crearParallax(nombre: string): void {
    const ph = asegurarParallax(this.scene);
    const escala = 2.25; // 320×180 → cubre 640×360 con margen para el desplazamiento
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const cielo = this.scene.add.image(cx, cy, this.clave(nombre, 'cielo', ph.cielo)).setScale(escala);
    const ciudad = this.scene.add.image(cx, cy, this.clave(nombre, 'ciudad', ph.ciudad)).setScale(escala);
    const nubesKey = this.clave(nombre, 'nubes', ph.nubes);
    const nubesTex = this.scene.textures.get(nubesKey).getSourceImage();
    const nubes = this.scene.add
      .tileSprite(cx, cy - GAME_HEIGHT * 0.22, GAME_WIDTH / escala + 40, nubesTex.height, nubesKey)
      .setScale(escala);
    this.nubes = nubes;
    [cielo, nubes, ciudad].forEach((o, i) => {
      o.setScrollFactor(0).setDepth(PROFUNDIDAD_FONDO + i);
      this.objetos.push(o);
    });
    this.capas = [
      { obj: cielo, factor: 0.02, x0: cielo.x, y0: cielo.y },
      { obj: ciudad, factor: 0.12, x0: ciudad.x, y0: ciudad.y },
      { obj: nubes, factor: 0.05, x0: nubes.x, y0: nubes.y },
    ];

    // Faro del Coso en la cúspide de la pirámide (solo con el horizonte de relleno o si se aporta).
    const faroKey = this.clave(nombre, 'faro', ph.faro);
    if (ciudad.texture.key === ph.ciudad || faroKey !== ph.faro) {
      // Cúspide del relleno: x = centro, y = 36 px desde arriba en la textura 320×180.
      this.faroDy = (36 - PARALLAX_H / 2) * escala;
      const faro = this.scene.add
        .image(ciudad.x, ciudad.y + this.faroDy, faroKey)
        .setScrollFactor(0)
        .setDepth(PROFUNDIDAD_FONDO + 3)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(escala);
      this.faro = faro;
      this.objetos.push(faro);
      // Bucle ambiental (no pasa por dur()): latido del Coso.
      this.tweens.push(
        this.scene.tweens.add({ targets: faro, alpha: { from: 1, to: 0.35 }, scale: { from: escala * 1.15, to: escala * 0.85 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      );
    }
  }

  // ---------- Partículas ----------

  private crearEmisores(decl: AmbienteDecl['emitters'], opts: OpcionesAmbiente): void {
    if (decl.length === 0) return;
    const { punto, humo } = asegurarParticulas(this.scene);
    const maxTotal = opts.maxParticulas ?? 150;
    const topes = decl.map((e) => Math.max(4, Math.round(TOPE[e.kind] * ((e.rate ?? RITMO[e.kind]) / RITMO[e.kind]))));
    const suma = topes.reduce((a, b) => a + b, 0);
    const factor = suma > maxTotal ? maxTotal / suma : 1;

    decl.forEach((e, i) => {
      const tope = Math.max(2, Math.floor((topes[i] ?? 4) * factor));
      const rate = e.rate ?? RITMO[e.kind];
      const frequency = Math.max(16, Math.round(1000 / rate));
      const enCasilla = e.at && opts.suelo ? e.at : null;
      const em = enCasilla ? this.emisorEnCasilla(e.kind, enCasilla, opts.suelo as SueloProps, punto, humo, frequency, tope) : this.emisorAire(e.kind, punto, humo, frequency, tope);
      this.emisores.push(em);
    });
  }

  private emisorEnCasilla(
    kind: TipoEmisor,
    at: Pos,
    suelo: SueloProps,
    punto: string,
    humo: string,
    frequency: number,
    tope: number,
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const w = suelo.tileToWorld(at);
    const depth = depthOf(at.x, at.y, suelo.alturaDe(at), CAPA.unidad + 0.2);
    let cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;
    switch (kind) {
      case 'vapor':
        cfg = {
          speedY: { min: -38, max: -18 },
          speedX: { min: -6, max: 6 },
          lifespan: 1700,
          scale: { start: 0.6, end: 1.8 },
          alpha: { start: 0.55, end: 0 },
          tint: 0xe8e0d8,
        };
        break;
      case 'chispas':
        cfg = {
          speed: { min: 30, max: 80 },
          angle: { min: 220, max: 320 },
          gravityY: 160,
          lifespan: 600,
          scale: { start: 1, end: 0.5 },
          alpha: { start: 1, end: 0 },
          tint: [0xffd27a, 0xff9a3c, 0xfff4c8],
          blendMode: Phaser.BlendModes.ADD,
          quantity: 2,
        };
        break;
      case 'polvo':
        cfg = { speedX: { min: -8, max: 8 }, speedY: { min: -10, max: -3 }, lifespan: 1400, alpha: { start: 0.5, end: 0 }, tint: 0xc9a86a };
        break;
      case 'hollin':
        cfg = { speedX: { min: -6, max: 6 }, speedY: { min: -30, max: -12 }, lifespan: 2000, alpha: { start: 0.8, end: 0 }, tint: 0x2a2027 };
        break;
    }
    const tex = kind === 'vapor' ? humo : punto;
    return this.scene.add
      .particles(w.x, w.y - 4, tex, { ...cfg, frequency, maxAliveParticles: tope })
      .setDepth(depth);
  }

  private emisorAire(kind: TipoEmisor, punto: string, humo: string, frequency: number, tope: number): Phaser.GameObjects.Particles.ParticleEmitter {
    // Zona rectangular en coordenadas locales del emisor (centrado en x).
    // Aleatoriedad solo visual: Phaser.Math.RND (nunca afecta a reglas).
    const zonaPantalla = (y: number, h: number): Phaser.Types.GameObjects.Particles.ParticleEmitterRandomZoneConfig => ({
      type: 'random',
      source: {
        getRandomPoint: (p: Phaser.Types.Math.Vector2Like) => {
          p.x = (Phaser.Math.RND.frac() - 0.5) * GAME_WIDTH;
          p.y = y + Phaser.Math.RND.frac() * h;
        },
      },
    });
    let cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;
    let tex = punto;
    switch (kind) {
      case 'hollin':
        cfg = { emitZone: zonaPantalla(-10, 10), speedY: { min: 10, max: 24 }, speedX: { min: -8, max: 14 }, lifespan: 16000, alpha: { start: 0.9, end: 0.2 }, tint: 0x2a2027 };
        break;
      case 'polvo':
        cfg = { emitZone: zonaPantalla(40, GAME_HEIGHT - 60), speedX: { min: 4, max: 12 }, speedY: { min: -4, max: 4 }, lifespan: 6000, alpha: { start: 0, end: 0.5 }, tint: 0xe0c89a };
        break;
      case 'vapor':
        tex = humo;
        cfg = { emitZone: zonaPantalla(GAME_HEIGHT - 10, 10), speedY: { min: -20, max: -8 }, lifespan: 5000, scale: { start: 1, end: 3 }, alpha: { start: 0.25, end: 0 }, tint: 0xe8e0d8 };
        break;
      case 'chispas':
        cfg = { emitZone: zonaPantalla(GAME_HEIGHT - 20, 20), speedY: { min: -60, max: -25 }, lifespan: 1800, alpha: { start: 1, end: 0 }, tint: [0xffd27a, 0xff9a3c], blendMode: Phaser.BlendModes.ADD };
        break;
    }
    return this.scene.add
      .particles(GAME_WIDTH / 2, 0, tex, { ...cfg, frequency, maxAliveParticles: tope })
      .setScrollFactor(0)
      .setDepth(PROFUNDIDAD_AIRE);
  }

  // ---------- Luz ----------

  private crearLuz(): void {
    const velo = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffb060, 0)
      .setScrollFactor(0)
      .setDepth(PROFUNDIDAD_LUZ);
    this.objetos.push(velo);
    this.tweens.push(this.scene.tweens.add({ targets: velo, fillAlpha: 0.06, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
  }
}
