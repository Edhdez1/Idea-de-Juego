import Phaser from 'phaser';
import type { Dir, Pos, StatusId, Team } from '../../core/tactics/types';
import { dur } from '../../game/anim';
import { asegurarIconoEstado, asegurarPeon, COLOR_EQUIPO, escalarColor } from '../../game/placeholders';
import { PersonajeVivo } from '../vivo/PersonajeVivo';
import { animar, easeInOutSine, easeInQuad, easeOutQuad, esperar } from '../vivo/tiempo';
import type { SueloIso } from './TableroIso';
import { CAPA, deltaDeDir, depthOf, dirFromDelta, LH, TH, TW } from './proyeccion';

export interface OpcionesUnidad {
  id: string;
  /** UnitDef.sprite */
  sprite: string;
  team: Team;
  nombre: string;
  pos: Pos;
  facing: Dir;
  hp: number;
  maxHp: number;
  escala?: number;
  /** Semilla visual (desfase de la respiración). */
  semilla?: number;
}

/** Vector en pantalla (px) de medio paso en una orientación del tablero. */
function vectorPantalla(dir: Dir, fraccion: number): { x: number; y: number } {
  const d = deltaDeDir(dir);
  return { x: ((d.x - d.y) * TW) / 2 * fraccion, y: ((d.x + d.y) * TH) / 2 * fraccion };
}

const BARRA_W = 22;

/**
 * Vista de una unidad sobre el tablero isométrico: sombra, flecha de
 * orientación en el suelo, personaje vivo (arte real o peón), mini barra de
 * vida con blindaje y fila de iconos de estado.
 *
 * Todas las acciones devuelven promesas para la cola de eventos y usan dur()
 * (ANIM_SCALE = 0 en modo test → resuelven al instante).
 */
export class UnidadVista {
  readonly cont: Phaser.GameObjects.Container;
  readonly personaje: PersonajeVivo;
  private sombra: Phaser.GameObjects.Ellipse;
  private flecha: Phaser.GameObjects.Graphics;
  private barraFondo: Phaser.GameObjects.Rectangle;
  private barraVida: Phaser.GameObjects.Rectangle;
  private barraBloqueo: Phaser.GameObjects.Rectangle;
  private estados: Phaser.GameObjects.Container;
  private marcador: Phaser.GameObjects.Triangle;
  private marcadorTween?: Phaser.Tweens.Tween;
  private _pos: Pos;
  private _facing: Dir;
  private hp: number;
  private maxHp: number;
  private block = 0;
  private alto: number;

  constructor(
    private scene: Phaser.Scene,
    private suelo: SueloIso,
    readonly opts: OpcionesUnidad,
  ) {
    this._pos = { ...opts.pos };
    this._facing = opts.facing;
    this.hp = opts.hp;
    this.maxHp = Math.max(1, opts.maxHp);

    this.cont = scene.add.container(0, 0);
    this.sombra = scene.add.ellipse(0, 0, 24, 10, 0x000000, 0.35);
    this.flecha = scene.add.graphics();
    this.personaje = new PersonajeVivo(scene, {
      sprite: opts.sprite,
      placeholder: asegurarPeon(scene, opts.team, opts.nombre),
      escala: opts.escala,
      semilla: opts.semilla ?? hashTexto(opts.id),
      dir: opts.facing,
    });
    this.alto = Math.max(24, this.personaje.sprite.displayHeight * 0.92);

    const yBarra = -this.alto - 6;
    this.barraFondo = scene.add.rectangle(0, yBarra, BARRA_W + 2, 4, 0x1a1418).setOrigin(0.5);
    this.barraVida = scene.add.rectangle(-BARRA_W / 2, yBarra, BARRA_W, 2, 0x6fd06f).setOrigin(0, 0.5);
    this.barraBloqueo = scene.add.rectangle(-BARRA_W / 2, yBarra - 3, 0, 1, 0x9ec8ff).setOrigin(0, 0.5);
    this.estados = scene.add.container(0, yBarra - 8);
    const colorEq = COLOR_EQUIPO[opts.team];
    this.marcador = scene.add.triangle(0, yBarra - 16, 0, 0, 8, 0, 4, 5, escalarColor(colorEq, 1.4)).setVisible(false);

    this.cont.add([this.sombra, this.flecha, this.personaje.sprite, this.barraFondo, this.barraVida, this.barraBloqueo, this.estados, this.marcador]);
    this.cont.setData('unitId', opts.id);
    this.setPos(this._pos);
    this.setFacing(this._facing);
    this.pintarBarra();
  }

  get id(): string {
    return this.opts.id;
  }

  get pos(): Pos {
    return { ...this._pos };
  }

  get facing(): Dir {
    return this._facing;
  }

  /** Punto sobre la cabeza (para números de daño, bocadillos...). */
  get cabeza(): { x: number; y: number } {
    return { x: this.cont.x, y: this.cont.y - this.alto - 10 };
  }

  // ---------- Estado instantáneo ----------

  setPos(p: Pos): void {
    this._pos = { ...p };
    const w = this.suelo.tileToWorld(p);
    this.cont.setPosition(w.x, w.y);
    this.cont.setDepth(depthOf(p.x, p.y, this.suelo.alturaDe(p), CAPA.unidad));
  }

  setFacing(dir: Dir): void {
    this._facing = dir;
    this.personaje.setDir(dir);
    this.pintarFlecha();
  }

  setHp(hp: number, maxHp = this.maxHp, block = this.block): Promise<void> {
    const antes = { hp: this.hp, block: this.block };
    this.hp = hp;
    this.maxHp = Math.max(1, maxHp);
    this.block = block;
    return animar(
      this.scene,
      220,
      (t) => this.pintarBarra(antes.hp + (hp - antes.hp) * t, antes.block + (block - antes.block) * t),
      easeOutQuad,
    );
  }

  setEstados(statuses: Partial<Record<StatusId, number>>): void {
    this.estados.removeAll(true);
    const activos = Object.entries(statuses).filter(([, n]) => (n ?? 0) > 0) as [StatusId, number][];
    // Icono + número de cargas a su derecha: [■2 ■1]
    const paso = 14;
    const x0 = -((activos.length - 1) * paso) / 2 - 3;
    activos.forEach(([id, n], i) => {
      const x = x0 + i * paso;
      const ico = this.scene.add.image(x, 0, asegurarIconoEstado(this.scene, id));
      const txt = this.scene.add
        .text(x + 4, 0, String(n), { fontFamily: 'monospace', fontSize: '8px', color: '#f4e4c1' })
        .setOrigin(0, 0.5);
      this.estados.add([ico, txt]);
    });
  }

  /** Marca la unidad que tiene el turno (flecha que bota sobre la cabeza). */
  setActiva(on: boolean): void {
    this.marcador.setVisible(on);
    this.marcadorTween?.stop();
    this.marcadorTween = undefined;
    if (on) {
      const y0 = -this.alto - 22;
      this.marcador.y = y0;
      this.marcadorTween = this.scene.tweens.add({ targets: this.marcador, y: y0 - 4, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  // ---------- Acciones animadas (promesas para la cola) ----------

  /** Salta casilla a casilla por el camino (el primer paso puede ser la casilla actual). */
  async moverPorCamino(path: Pos[]): Promise<void> {
    const pasos = path.filter((p, i) => !(i === 0 && p.x === this._pos.x && p.y === this._pos.y));
    if (pasos.length === 0) return;
    void this.personaje.reproducir('walk');
    for (const destino of pasos) {
      const origen = this._pos;
      this.setFacing(dirFromDelta(destino.x - origen.x, destino.y - origen.y));
      await this.saltar(origen, destino);
    }
    void this.personaje.reproducir('idle');
  }

  /** Embestida hacia `dir` + animación de ataque. */
  async atacar(dir: Dir): Promise<void> {
    this.setFacing(dir);
    const v = vectorPantalla(dir, 0.35);
    const spr = this.personaje.sprite;
    const anim = this.personaje.reproducir('attack');
    await animar(this.scene, 90, (t) => spr.setPosition(v.x * t, v.y * t), easeInQuad);
    await animar(this.scene, 140, (t) => spr.setPosition(v.x * (1 - t), v.y * (1 - t)), easeOutQuad);
    await anim;
  }

  /** Flash blanco (TintModes.FILL) + retroceso en la dirección del golpe. */
  async recibirGolpe(desde?: Dir): Promise<void> {
    const spr = this.personaje.sprite;
    spr.setTint(0xffffff);
    spr.tintMode = Phaser.TintModes.FILL;
    const anim = this.personaje.reproducir('hurt');
    const v = desde ? vectorPantalla(desde, 0.15) : { x: 0, y: -3 };
    await animar(this.scene, 70, (t) => spr.setPosition(v.x * t, v.y * t), easeOutQuad);
    spr.clearTint();
    spr.tintMode = Phaser.TintModes.MULTIPLY;
    await animar(this.scene, 130, (t) => spr.setPosition(v.x * (1 - t), v.y * (1 - t)), easeOutQuad);
    await anim;
  }

  /**
   * Empujón hasta `to` (deslizando; si la casilla está más baja, cae al final).
   * Con `hit`, tras llegar choca contra algo en la dirección del empujón.
   */
  async empujada(to: Pos, opts: { hit?: 'wall' | 'unit' | 'edge'; dir?: Dir } = {}): Promise<void> {
    const from = this._pos;
    const dir = opts.dir ?? dirFromDelta(to.x - from.x, to.y - from.y);
    if (from.x !== to.x || from.y !== to.y) {
      const a = this.suelo.tileToWorld(from);
      const b = this.suelo.tileToWorld(to);
      const hA = this.suelo.alturaDe(from);
      const hB = this.suelo.alturaDe(to);
      const pasos = Math.max(1, Math.abs(to.x - from.x) + Math.abs(to.y - from.y));
      this.cont.setDepth(Math.max(this.depthDe(from), this.depthDe(to)));
      // Deslizamiento a la altura de salida (o de llegada si sube), y caída después.
      const yPlano = hB < hA ? a.y + (b.y - a.y) - (hA - hB) * LH : b.y;
      const yIni = a.y;
      await animar(this.scene, 110 * pasos, (t) => this.cont.setPosition(a.x + (b.x - a.x) * t, yIni + (yPlano - yIni) * t), easeOutQuad);
      if (hB < hA) await animar(this.scene, 90 + 30 * (hA - hB), (t) => this.cont.setPosition(b.x, yPlano + (b.y - yPlano) * t), easeInQuad);
      this.setPos(to);
    }
    if (opts.hit) await this.choque(dir);
  }

  /** Aterrizaje tras una caída (aplastamiento breve). */
  async aterrizar(niveles: number): Promise<void> {
    const spr = this.personaje.sprite;
    const sx = spr.scaleX;
    const sy = spr.scaleY;
    const k = Math.min(0.35, 0.1 + niveles * 0.06);
    await animar(this.scene, 160, (t) => spr.setScale(sx * (1 + k * Math.sin(Math.PI * t)), sy * (1 - k * Math.sin(Math.PI * t))), easeInOutSine);
    spr.setScale(sx, sy);
  }

  async ko(): Promise<void> {
    this.marcador.setVisible(false);
    this.barraFondo.setVisible(false);
    this.barraVida.setVisible(false);
    this.barraBloqueo.setVisible(false);
    this.estados.setVisible(false);
    this.flecha.setVisible(false);
    await this.personaje.reproducir('ko');
    await animar(this.scene, 200, (t) => this.cont.setAlpha(1 - 0.35 * t));
  }

  /** Sale del tablero (canal: «baja administrativa»): se hunde y desaparece. */
  async retirada(): Promise<void> {
    this.setActiva(false);
    const y0 = this.cont.y;
    await animar(this.scene, 380, (t) => this.cont.setPosition(this.cont.x, y0 + 14 * t).setAlpha(1 - t), easeInQuad);
    this.cont.setVisible(false);
  }

  celebrar(): Promise<void> {
    return this.personaje.reproducir('celebrate');
  }

  destroy(): void {
    this.marcadorTween?.stop();
    this.personaje.destroy();
    this.cont.destroy();
  }

  // ---------- Interno ----------

  private depthDe(p: Pos): number {
    return depthOf(p.x, p.y, this.suelo.alturaDe(p), CAPA.unidad);
  }

  private async saltar(origen: Pos, destino: Pos): Promise<void> {
    const a = this.suelo.tileToWorld(origen);
    const b = this.suelo.tileToWorld(destino);
    const dh = this.suelo.alturaDe(destino) - this.suelo.alturaDe(origen);
    // Profundidad: la mayor de las dos casillas mientras dura el salto.
    this.cont.setDepth(Math.max(this.depthDe(origen), this.depthDe(destino)));
    const arco = 5 + Math.abs(dh) * LH * 0.6 + (dh > 0 ? dh * LH * 0.4 : 0);
    await animar(this.scene, 150 + 35 * Math.abs(dh), (t) => {
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t - arco * Math.sin(Math.PI * t);
      this.cont.setPosition(x, y);
    });
    this.setPos(destino);
    if (dur(1) > 0 && Math.abs(dh) >= 2) await this.aterrizar(Math.abs(dh) - 1);
  }

  private async choque(dir: Dir): Promise<void> {
    const v = vectorPantalla(dir, 0.18);
    const x0 = this.cont.x;
    const y0 = this.cont.y;
    await animar(this.scene, 60, (t) => this.cont.setPosition(x0 + v.x * t, y0 + v.y * t), easeInQuad);
    if (dur(1) > 0) this.scene.cameras.main.shake(dur(120), 0.006);
    await animar(this.scene, 120, (t) => this.cont.setPosition(x0 + v.x * (1 - t), y0 + v.y * (1 - t)), easeOutQuad);
    await esperar(this.scene, 40);
  }

  private pintarBarra(hp = this.hp, block = this.block): void {
    const f = Math.max(0, Math.min(1, hp / this.maxHp));
    this.barraVida.width = Math.round(BARRA_W * f);
    this.barraVida.fillColor = f > 0.5 ? 0x6fd06f : f > 0.25 ? 0xe0b040 : 0xd8463c;
    this.barraBloqueo.width = Math.round(Math.min(BARRA_W, (BARRA_W * block) / this.maxHp));
  }

  private pintarFlecha(): void {
    const d = deltaDeDir(this._facing);
    const p = { x: -d.y, y: d.x };
    const iso = (tx: number, ty: number) => ({ x: ((tx - ty) * TW) / 2, y: ((tx + ty) * TH) / 2 });
    const punta = iso(d.x * 0.5, d.y * 0.5);
    const b1 = iso(d.x * 0.28 + p.x * 0.13, d.y * 0.28 + p.y * 0.13);
    const b2 = iso(d.x * 0.28 - p.x * 0.13, d.y * 0.28 - p.y * 0.13);
    const color = escalarColor(COLOR_EQUIPO[this.opts.team], 1.3);
    this.flecha.clear();
    this.flecha.fillStyle(0x1a1418, 0.7);
    this.flecha.fillTriangle(punta.x, punta.y + 1, b1.x, b1.y + 1, b2.x, b2.y + 1);
    this.flecha.fillStyle(color, 0.95);
    this.flecha.fillTriangle(punta.x, punta.y, b1.x, b1.y, b2.x, b2.y);
  }
}

function hashTexto(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
