import { describe, expect, it } from 'vitest';
import type { Board } from '../../src/core/tactics/types';
import {
  alturaCaras,
  boardBounds,
  CAPA,
  deltaDeDir,
  depthOf,
  dir8FromVector,
  dirFromDelta,
  LH,
  pickTile,
  spriteDir,
  TH,
  toScreen,
  TW,
} from '../../src/ui/iso/proyeccion';

function tablero(alturas: string[]): Board {
  const h = alturas.length;
  const w = alturas[0]?.length ?? 0;
  const tiles = alturas.flatMap((fila) => [...fila].map((c) => ({ h: Number(c), terrain: 'piedra' })));
  return { w, h, tiles };
}

const O = { ox: 320, oy: 60 };

describe('proyección isométrica', () => {
  it('constantes 64×32 con escalones de 16', () => {
    expect([TW, TH, LH]).toEqual([64, 32, 16]);
  });

  it('toScreen sigue la fórmula del plan', () => {
    expect(toScreen(0, 0, 0, O)).toEqual({ sx: 320, sy: 60 });
    expect(toScreen(1, 0, 0, O)).toEqual({ sx: 352, sy: 76 }); // +x = SE
    expect(toScreen(0, 1, 0, O)).toEqual({ sx: 288, sy: 76 }); // +y = SW
    expect(toScreen(3, 2, 2, O)).toEqual({ sx: 320 + 32, sy: 60 + 80 - 32 });
  });

  it('cada nivel de altura sube LH píxeles', () => {
    const a = toScreen(4, 4, 0, O);
    const b = toScreen(4, 4, 3, O);
    expect(b.sx).toBe(a.sx);
    expect(a.sy - b.sy).toBe(3 * LH);
  });

  it('profundidad: más adelante en diagonal siempre tapa, aunque sea más baja', () => {
    expect(depthOf(1, 1, 0)).toBeGreaterThan(depthOf(1, 0, 6, CAPA.unidad));
    expect(depthOf(2, 2, 0)).toBe(4 * 64);
    expect(depthOf(2, 2, 3, CAPA.overlay)).toBe(4 * 64 + 6 + 1);
  });

  it('profundidad: en la misma casilla, loseta < capa de color < unidad', () => {
    const l = depthOf(3, 1, 2, CAPA.loseta);
    const o = depthOf(3, 1, 2, CAPA.overlay);
    const u = depthOf(3, 1, 2, CAPA.unidad);
    expect(l).toBeLessThan(o);
    expect(o).toBeLessThan(u);
    // y la unidad más alta de una diagonal no invade la siguiente
    expect(depthOf(0, 0, 6, CAPA.unidad)).toBeLessThan(depthOf(1, 0, 0, CAPA.loseta));
  });
});

describe('pickTile', () => {
  it('ida y vuelta: el centro de cada rombo elevado devuelve su casilla (sin oclusión)', () => {
    // Alturas que no crecen hacia delante: ninguna columna tapa otro rombo.
    const b = tablero(['4321', '3321', '2210', '1100']);
    for (let y = 0; y < b.h; y++) {
      for (let x = 0; x < b.w; x++) {
        const hh = b.tiles[y * b.w + x]?.h ?? 0;
        const p = toScreen(x, y, hh, O);
        expect(pickTile(p.sx, p.sy, b, O)).toEqual({ x, y });
      }
    }
  });

  it('una casilla tapada por una columna delantera no se puede elegir por su centro', () => {
    const b = tablero(['0120', '3456', '0000', '2101']);
    const p = toScreen(0, 0, 0, O);
    expect(pickTile(p.sx, p.sy, b, O)).toEqual({ x: 2, y: 1 });
  });

  it('fuera del tablero devuelve null', () => {
    const b = tablero(['00', '00']);
    expect(pickTile(0, 0, b, O)).toBeNull();
    expect(pickTile(320, 60 - TH, b, O)).toBeNull();
  });

  it('una columna alta tapa la casilla de detrás: se elige la que se ve', () => {
    // (1,1) es alta; el punto está sobre su cara superior, que en pantalla
    // cae encima del rombo de (0,0) a nivel 0.
    const b = tablero(['00', '02']);
    const alto = toScreen(1, 1, 2, O);
    const bajo = toScreen(0, 0, 0, O);
    expect(Math.abs(alto.sy - bajo.sy)).toBeLessThan(TH / 2);
    expect(pickTile(alto.sx, alto.sy, b, O)).toEqual({ x: 1, y: 1 });
  });

  it('las caras laterales cuentan como la columna (salvo con caras:false)', () => {
    const b = tablero(['3']);
    const p = toScreen(0, 0, 3, O);
    const enCara = { sx: p.sx - 10, sy: p.sy + TH / 2 + alturaCaras(3) / 2 };
    expect(pickTile(enCara.sx, enCara.sy, b, O)).toEqual({ x: 0, y: 0 });
    expect(pickTile(enCara.sx, enCara.sy, b, O, { caras: false })).toBeNull();
  });

  it('borde entre dos rombos vecinos: cada lado elige el suyo', () => {
    const b = tablero(['00']);
    const a = toScreen(0, 0, 0, O);
    const c = toScreen(1, 0, 0, O);
    const mx = (a.sx + c.sx) / 2;
    const my = (a.sy + c.sy) / 2;
    // desplazamiento perpendicular al borde (hacia cada centro)
    expect(pickTile(mx - 4, my - 2, b, O)).toEqual({ x: 0, y: 0 });
    expect(pickTile(mx + 4, my + 2, b, O)).toEqual({ x: 1, y: 0 });
  });
});

describe('direcciones', () => {
  it('dirFromDelta sigue la convención del motor', () => {
    expect(dirFromDelta(1, 0)).toBe('SE');
    expect(dirFromDelta(-1, 0)).toBe('NW');
    expect(dirFromDelta(0, 1)).toBe('SW');
    expect(dirFromDelta(0, -1)).toBe('NE');
    expect(dirFromDelta(3, -1)).toBe('SE');
    expect(dirFromDelta(-1, -4)).toBe('NE');
  });

  it('deltaDeDir es la inversa de dirFromDelta', () => {
    for (const d of ['NE', 'SE', 'SW', 'NW'] as const) {
      const v = deltaDeDir(d);
      expect(dirFromDelta(v.x, v.y)).toBe(d);
    }
  });

  it('las orientaciones del tablero apuntan a su diagonal en pantalla', () => {
    for (const d of ['NE', 'SE', 'SW', 'NW'] as const) {
      const v = deltaDeDir(d);
      const a = toScreen(0, 0, 0);
      const b = toScreen(v.x, v.y, 0);
      expect(dir8FromVector(b.sx - a.sx, b.sy - a.sy)).toBe(d);
    }
  });

  it('espejo: SW, W y NW se dibujan volteando SE, E y NE', () => {
    expect(spriteDir('SW')).toEqual({ dir: 'SE', flipX: true });
    expect(spriteDir('W')).toEqual({ dir: 'E', flipX: true });
    expect(spriteDir('NW')).toEqual({ dir: 'NE', flipX: true });
    expect(spriteDir('S')).toEqual({ dir: 'S', flipX: false });
    expect(spriteDir('NE')).toEqual({ dir: 'NE', flipX: false });
  });
});

describe('boardBounds', () => {
  it('envuelve todos los rombos y columnas', () => {
    const b = tablero(['000', '000', '006']);
    const r = boardBounds(b, O);
    // 3×3: ancho = (w + h) · TW/2
    expect(r.width).toBe(3 * TW);
    const top = toScreen(0, 0, 0, O).sy - TH / 2;
    const bottom = toScreen(2, 2, 0, O).sy + TH / 2 + alturaCaras(0);
    expect(r.y).toBe(Math.min(top, toScreen(2, 2, 6, O).sy - TH / 2));
    expect(r.y + r.height).toBe(bottom);
  });

  it('el margen crece por los cuatro lados', () => {
    const b = tablero(['00', '00']);
    const r0 = boardBounds(b, O);
    const r1 = boardBounds(b, O, 10);
    expect(r1.x).toBe(r0.x - 10);
    expect(r1.width).toBe(r0.width + 20);
  });
});
