// Solo tipos: este módulo se importa en Vitest (Node) sin cargar Phaser.
import type Phaser from 'phaser';

/**
 * Losetas animadas de Tiled («Mundo vivo», capa 1).
 *
 * Phaser carga los tilemaps de Tiled pero NO reproduce las animaciones de
 * losetas (`tileset.tiles[].animation`). Aquí se separa:
 *  - la parte pura (parseo + qué frame toca en cada instante), testeada sin Phaser;
 *  - el ejecutor, que cambia `tile.index` en una capa según el tiempo.
 */

// ---------- Parte pura ----------

export interface FrameTiled {
  /** Id local del tile dentro del tileset. */
  tileid: number;
  /** Duración del frame en ms. */
  duration: number;
}

export interface AnimLoseta {
  /** Id local del tile animado (el que se pinta en el mapa). */
  tileId: number;
  frames: FrameTiled[];
  /** Duración total del ciclo en ms. */
  total: number;
}

/** Forma mínima del JSON de tileset de Tiled que nos interesa. */
export interface TilesetTiledJson {
  tiles?: { id: number; animation?: { tileid: number; duration: number }[] }[];
}

/** Lee las animaciones de un tileset de Tiled. Ignora frames con duración ≤ 0. */
export function parseTiledAnimations(tileset: TilesetTiledJson): AnimLoseta[] {
  const out: AnimLoseta[] = [];
  for (const t of tileset.tiles ?? []) {
    const frames = (t.animation ?? [])
      .filter((f) => Number.isFinite(f.duration) && f.duration > 0)
      .map((f) => ({ tileid: f.tileid, duration: f.duration }));
    if (frames.length === 0) continue;
    out.push({ tileId: t.id, frames, total: frames.reduce((s, f) => s + f.duration, 0) });
  }
  return out;
}

/** Índice del frame que toca a los `ms` transcurridos (el ciclo se repite). */
export function indiceFrameEn(anim: AnimLoseta, ms: number): number {
  if (anim.frames.length <= 1 || anim.total <= 0) return 0;
  let t = ((ms % anim.total) + anim.total) % anim.total;
  for (let i = 0; i < anim.frames.length; i++) {
    const f = anim.frames[i];
    if (!f) break;
    if (t < f.duration) return i;
    t -= f.duration;
  }
  return anim.frames.length - 1;
}

/** Id local del tile que se ve a los `ms` transcurridos. */
export function frameEn(anim: AnimLoseta, ms: number): number {
  return anim.frames[indiceFrameEn(anim, ms)]?.tileid ?? anim.tileId;
}

// ---------- Ejecutor en Phaser ----------

interface Celda {
  tile: Phaser.Tilemaps.Tile;
  anim: AnimLoseta;
  /** Desfase en ms (0 = todos sincronizados, como en Tiled). */
  desfase: number;
}

/**
 * Cambia los índices de las losetas animadas de una capa según el tiempo de
 * la escena. Se engancha al `update` de la escena y se suelta al destruirse
 * o al apagarse la escena.
 */
export class LosetasAnimadas {
  private celdas: Celda[] = [];
  private t = 0;
  private firstgid: number;

  constructor(
    private scene: Phaser.Scene,
    layer: Phaser.Tilemaps.TilemapLayer,
    anims: AnimLoseta[],
    firstgid: number,
  ) {
    const porId = new Map<number, AnimLoseta>();
    for (const a of anims) porId.set(a.tileId + firstgid, a);
    layer.forEachTile((tile) => {
      const anim = porId.get(tile.index);
      if (anim) this.celdas.push({ tile, anim, desfase: 0 });
    });
    this.firstgid = firstgid;
    scene.events.on('update', this.update, this);
    scene.events.once('shutdown', this.destroy, this);
  }

  /**
   * Lee las animaciones que Phaser guarda en `tileset.tileData` al cargar un
   * mapa de Tiled y las aplica a la capa.
   */
  static desdeCapa(scene: Phaser.Scene, layer: Phaser.Tilemaps.TilemapLayer): LosetasAnimadas[] {
    const out: LosetasAnimadas[] = [];
    const tilesets = layer.tilemap.tilesets;
    for (const ts of tilesets) {
      const data = ts.tileData as Record<string, { animation?: { tileid: number; duration: number }[] }>;
      const tiles = Object.entries(data).map(([id, d]) => ({ id: Number(id), animation: d.animation }));
      const anims = parseTiledAnimations({ tiles });
      if (anims.length > 0) out.push(new LosetasAnimadas(scene, layer, anims, ts.firstgid));
    }
    return out;
  }

  get cantidad(): number {
    return this.celdas.length;
  }

  /** Avanza el reloj (lo llama la escena en cada frame). */
  update(_time?: number, delta = 0): void {
    this.t += delta;
    for (const c of this.celdas) {
      const idx = this.firstgid + frameEn(c.anim, this.t + c.desfase);
      if (c.tile.index !== idx) c.tile.index = idx;
    }
  }

  destroy(): void {
    this.scene.events.off('update', this.update, this);
    this.celdas = [];
  }
}
