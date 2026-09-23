import Phaser from 'phaser';
import type { Board, Pos, TerrainDef, Tile } from '../../core/tactics/types';
import {
  asegurarBrillo,
  asegurarCursor,
  asegurarLoseta,
  asegurarOverlay,
  ESTILO_OVERLAY,
  type OverlayKind,
} from '../../game/placeholders';
import { faseDeCasilla } from '../vivo/claves';
import { alturaCaras, alturaEn, boardBounds, CAPA, depthOf, pickTile, TH, toScreen, type Origen, type Rect } from './proyeccion';

/** Lo mínimo que la vista necesita de un terreno. */
export type TerrenoVisual = Pick<TerrainDef, 'color'> & Partial<Pick<TerrainDef, 'animated'>>;

/** Lo que UnidadVista/PropsAnimados/Ambiente necesitan del suelo. */
export interface SueloIso {
  tileToWorld(p: Pos): { x: number; y: number };
  alturaDe(p: Pos): number;
}

/** Orden de las capas de color dentro de la capa `overlay` de una casilla. */
const SUBCAPA: Record<OverlayKind, number> = {
  gotera: 0.0,
  danger: 0.05,
  move: 0.1,
  attack: 0.15,
  area: 0.2,
  path: 0.25,
};

export interface OpcionesOverlay {
  alpha?: number;
  /** Pulso suave de alfa (por defecto: sí, salvo `path`). */
  pulso?: boolean;
}

interface Casilla {
  base: Phaser.GameObjects.Image;
  /** Arte real de la cara superior (`tile_<terreno>`), si existe. */
  arte?: Phaser.GameObjects.Sprite;
  /** Brillo animado de relleno para terrenos animados sin arte. */
  brillo?: Phaser.GameObjects.Image;
  brilloTween?: Phaser.Tweens.Tween;
  terrain: string;
  h: number;
}

/**
 * Tablero isométrico con alturas dibujado como columnas apiladas (una Image
 * por casilla con rombo superior + caras sombreadas), ordenadas con depthOf.
 *
 * Arte: si existe la textura `tile_<terreno>` (o la animación del mismo
 * nombre), se pinta encima de la columna y, si tiene varios frames, se
 * reproduce en bucle. Si no, el relleno de terrenos animados pulsa.
 */
export class TableroIso implements SueloIso {
  readonly origin: Origen;
  private board: Board;
  private casillas: Casilla[] = [];
  private overlays = new Map<OverlayKind, Phaser.GameObjects.Image[]>();
  private overlayTweens = new Map<OverlayKind, Phaser.Tweens.Tween>();
  private cursor: Phaser.GameObjects.Image;
  private cursorTween?: Phaser.Tweens.Tween;
  private cursorPos: Pos | null = null;

  constructor(
    private scene: Phaser.Scene,
    board: Board,
    private terreno: (id: string) => TerrenoVisual,
    opts: { origin?: Origen } = {},
  ) {
    this.board = board;
    this.origin = opts.origin ?? { ox: 0, oy: 0 };
    for (let i = 0; i < board.tiles.length; i++) {
      const t = board.tiles[i];
      if (t) this.casillas.push(this.crearCasilla(i % board.w, Math.floor(i / board.w), t));
    }
    this.cursor = scene.add.image(0, 0, asegurarCursor(scene)).setVisible(false);
    scene.events.once('shutdown', () => this.destroy());
  }

  get tablero(): Board {
    return this.board;
  }

  // ---------- Coordenadas ----------

  /** Centro de la cara superior de la casilla elevada (donde pisan las unidades). */
  tileToWorld(p: Pos): { x: number; y: number } {
    const s = toScreen(p.x, p.y, this.alturaDe(p), this.origin);
    return { x: s.sx, y: s.sy };
  }

  /** Casilla bajo un puntero (usa coordenadas de mundo) o un punto de mundo. */
  worldToTile(p: Phaser.Input.Pointer | { x: number; y: number }): Pos | null {
    const x = 'worldX' in p ? p.worldX : p.x;
    const y = 'worldY' in p ? p.worldY : p.y;
    return pickTile(x, y, this.board, this.origin);
  }

  alturaDe(p: Pos): number {
    return alturaEn(this.board, p);
  }

  depthAt(p: Pos, capa: number): number {
    return depthOf(p.x, p.y, this.alturaDe(p), capa);
  }

  /** Caja del tablero en mundo (para cámara: setBounds). */
  bounds(margen = 32): Rect {
    return boardBounds(this.board, this.origin, margen);
  }

  // ---------- Actualización del tablero (Goteras, etc.) ----------

  /** Redibuja las casillas cuyo terreno o altura cambió. */
  actualizar(board: Board): void {
    this.board = board;
    for (let i = 0; i < board.tiles.length; i++) {
      const t = board.tiles[i];
      const c = this.casillas[i];
      if (!t || !c) continue;
      if (c.terrain === t.terrain && c.h === t.h) continue;
      this.destruirCasilla(c);
      this.casillas[i] = this.crearCasilla(i % board.w, Math.floor(i / board.w), t);
    }
    if (this.cursorPos) this.setCursor(this.cursorPos);
  }

  // ---------- Capas de color ----------

  /** Muestra una capa (color + patrón) sobre las casillas dadas; reemplaza la anterior del mismo tipo. */
  showOverlay(kind: OverlayKind, tiles: Pos[], opts: OpcionesOverlay = {}): void {
    this.clearOverlay(kind);
    const key = asegurarOverlay(this.scene, kind);
    const alpha = opts.alpha ?? (kind === 'path' ? 1 : 0.85);
    const imgs = tiles
      .filter((p) => p.x >= 0 && p.y >= 0 && p.x < this.board.w && p.y < this.board.h)
      .map((p) => {
        const w = this.tileToWorld(p);
        return this.scene.add
          .image(w.x, w.y, key)
          .setAlpha(alpha)
          .setDepth(this.depthAt(p, CAPA.overlay + SUBCAPA[kind]));
      });
    this.overlays.set(kind, imgs);
    if ((opts.pulso ?? kind !== 'path') && imgs.length > 0) {
      // Bucle ambiental: sin dur() (no bloquea nada).
      this.overlayTweens.set(
        kind,
        this.scene.tweens.add({ targets: imgs, alpha: alpha * 0.55, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      );
    }
  }

  clearOverlay(kind: OverlayKind): void {
    this.overlayTweens.get(kind)?.stop();
    this.overlayTweens.delete(kind);
    for (const img of this.overlays.get(kind) ?? []) img.destroy();
    this.overlays.delete(kind);
  }

  clearOverlays(): void {
    for (const k of Object.keys(ESTILO_OVERLAY) as OverlayKind[]) this.clearOverlay(k);
  }

  /** Casillas que muestra ahora una capa (para test hooks). */
  overlayTiles(kind: OverlayKind): number {
    return this.overlays.get(kind)?.length ?? 0;
  }

  // ---------- Cursor ----------

  setCursor(p: Pos | null): void {
    this.cursorPos = p;
    if (!p || p.x < 0 || p.y < 0 || p.x >= this.board.w || p.y >= this.board.h) {
      this.cursor.setVisible(false);
      this.cursorTween?.stop();
      this.cursorTween = undefined;
      return;
    }
    const w = this.tileToWorld(p);
    this.cursor.setPosition(w.x, w.y).setVisible(true).setDepth(this.depthAt(p, CAPA.overlay + 0.4));
    if (!this.cursorTween) {
      this.cursor.setAlpha(1);
      this.cursorTween = this.scene.tweens.add({ targets: this.cursor, alpha: 0.55, duration: 450, yoyo: true, repeat: -1 });
    }
  }

  get cursorEn(): Pos | null {
    return this.cursorPos;
  }

  destroy(): void {
    this.clearOverlays();
    for (const c of this.casillas) this.destruirCasilla(c);
    this.casillas = [];
    this.cursorTween?.stop();
    this.cursor.destroy();
  }

  // ---------- Interno ----------

  private crearCasilla(x: number, y: number, t: Tile): Casilla {
    const def = this.terreno(t.terrain);
    const s = toScreen(x, y, t.h, this.origin);
    const key = asegurarLoseta(this.scene, def.color, t.h);
    const alto = TH + alturaCaras(t.h);
    const base = this.scene.add
      .image(s.sx, s.sy, key)
      .setOrigin(0.5, TH / 2 / alto)
      .setDepth(depthOf(x, y, t.h, CAPA.loseta));
    const c: Casilla = { base, terrain: t.terrain, h: t.h };

    const arteKey = `tile_${t.terrain}`;
    const conAnim = this.scene.anims.exists(arteKey);
    if (conAnim || this.scene.textures.exists(arteKey)) {
      const tex = conAnim ? undefined : this.scene.textures.get(arteKey);
      // El arte isométrico trae el rombo superior en sus primeros TH píxeles.
      const spr = this.scene.add.sprite(s.sx, s.sy, conAnim ? '__DEFAULT' : arteKey).setDepth(depthOf(x, y, t.h, CAPA.loseta + 0.01));
      if (!conAnim && tex && tex.frameTotal > 2 && def.animated) {
        this.scene.anims.create({ key: arteKey, frames: this.scene.anims.generateFrameNumbers(arteKey, {}), frameRate: 6, repeat: -1 });
      }
      if (this.scene.anims.exists(arteKey)) {
        const n = this.scene.anims.get(arteKey)?.frames.length ?? 1;
        spr.play({ key: arteKey, startFrame: faseDeCasilla(x, y, Math.max(1, n)) });
      }
      spr.setOrigin(0.5, TH / 2 / spr.height);
      c.arte = spr;
    } else if (def.animated) {
      // Relleno vivo: reflejo que pulsa con desfase por casilla.
      const brillo = this.scene.add
        .image(s.sx, s.sy, asegurarBrillo(this.scene))
        .setAlpha(0)
        .setDepth(depthOf(x, y, t.h, CAPA.loseta + 0.01));
      c.brillo = brillo;
      c.brilloTween = this.scene.tweens.add({
        targets: brillo,
        alpha: 0.28,
        duration: 900,
        delay: faseDeCasilla(x, y, 1200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    return c;
  }

  private destruirCasilla(c: Casilla): void {
    c.brilloTween?.stop();
    c.brillo?.destroy();
    c.arte?.destroy();
    c.base.destroy();
  }
}
