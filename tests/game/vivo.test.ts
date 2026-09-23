import { describe, expect, it } from 'vitest';
import { claveAnim, faseDeCasilla, resolverClaveAnim, rngVisual } from '../../src/ui/vivo/claves';
import { frameEn, indiceFrameEn, parseTiledAnimations } from '../../src/ui/vivo/LosetasAnimadas';

/** Tileset de Tiled con un canal de 3 frames de duraciones distintas. */
const TILESET = {
  tiles: [
    {
      id: 4,
      animation: [
        { tileid: 4, duration: 100 },
        { tileid: 5, duration: 300 },
        { tileid: 6, duration: 100 },
      ],
    },
    { id: 9 }, // sin animación
    { id: 12, animation: [{ tileid: 12, duration: 250 }] },
    { id: 20, animation: [{ tileid: 20, duration: 0 }, { tileid: 21, duration: 200 }] },
  ],
};

describe('LosetasAnimadas: parseo de Tiled', () => {
  it('lee solo las losetas con animación y suma la duración del ciclo', () => {
    const anims = parseTiledAnimations(TILESET);
    expect(anims.map((a) => a.tileId)).toEqual([4, 12, 20]);
    expect(anims[0]?.total).toBe(500);
    expect(anims[0]?.frames.map((f) => f.tileid)).toEqual([4, 5, 6]);
  });

  it('descarta frames con duración ≤ 0', () => {
    const a = parseTiledAnimations(TILESET).find((x) => x.tileId === 20);
    expect(a?.frames).toEqual([{ tileid: 21, duration: 200 }]);
  });

  it('tileset sin tiles no rompe', () => {
    expect(parseTiledAnimations({})).toEqual([]);
  });
});

describe('LosetasAnimadas: qué frame toca', () => {
  const canal = parseTiledAnimations(TILESET)[0];
  if (!canal) throw new Error('falta la animación del canal');

  it('respeta la duración de CADA frame', () => {
    expect(frameEn(canal, 0)).toBe(4);
    expect(frameEn(canal, 99)).toBe(4);
    expect(frameEn(canal, 100)).toBe(5);
    expect(frameEn(canal, 399)).toBe(5);
    expect(frameEn(canal, 400)).toBe(6);
    expect(frameEn(canal, 499)).toBe(6);
  });

  it('el ciclo se repite', () => {
    expect(frameEn(canal, 500)).toBe(4);
    expect(frameEn(canal, 500 * 7 + 150)).toBe(5);
    expect(indiceFrameEn(canal, 1000 + 450)).toBe(2);
  });

  it('tiempos negativos (desfases) se envuelven bien', () => {
    expect(frameEn(canal, -1)).toBe(6);
    expect(frameEn(canal, -200)).toBe(5);
  });

  it('una animación de un solo frame siempre muestra ese frame', () => {
    const quieta = parseTiledAnimations(TILESET)[1];
    expect(quieta && frameEn(quieta, 123456)).toBe(12);
  });
});

describe('PersonajeVivo: resolución de animaciones por dirección', () => {
  const completas = new Set(
    ['idle', 'walk', 'attack'].flatMap((a) => ['S', 'SE', 'E', 'NE', 'N'].map((d) => claveAnim('ingeniera', a as 'idle', d as 'S'))),
  );
  const existe = (k: string) => completas.has(k);

  it('usa la dirección dibujada tal cual', () => {
    expect(resolverClaveAnim('ingeniera', 'walk', 'NE', existe)).toEqual({ key: 'ingeniera_walk_NE', flipX: false, anim: 'walk' });
  });

  it('espeja SW/W/NW', () => {
    expect(resolverClaveAnim('ingeniera', 'idle', 'SW', existe)).toEqual({ key: 'ingeniera_idle_SE', flipX: true, anim: 'idle' });
    expect(resolverClaveAnim('ingeniera', 'idle', 'W', existe)?.key).toBe('ingeniera_idle_E');
    expect(resolverClaveAnim('ingeniera', 'attack', 'NW', existe)).toEqual({ key: 'ingeniera_attack_NE', flipX: true, anim: 'attack' });
  });

  it('si falta la animación cae a idle', () => {
    expect(resolverClaveAnim('ingeniera', 'celebrate', 'SE', existe)).toEqual({ key: 'ingeniera_idle_SE', flipX: false, anim: 'idle' });
  });

  it('enemigos solo en diagonales: cae a la dirección más cercana', () => {
    const diag = new Set(['golem_idle_SE', 'golem_idle_NE']);
    const e = (k: string) => diag.has(k);
    expect(resolverClaveAnim('golem', 'idle', 'S', e)?.key).toBe('golem_idle_SE');
    expect(resolverClaveAnim('golem', 'idle', 'N', e)?.key).toBe('golem_idle_NE');
    expect(resolverClaveAnim('golem', 'idle', 'NW', e)).toEqual({ key: 'golem_idle_NE', flipX: true, anim: 'idle' });
  });

  it('sin ningún arte devuelve null (se anima el peón por código)', () => {
    expect(resolverClaveAnim('nadie', 'walk', 'SE', () => false)).toBeNull();
  });
});

describe('desfases visuales sembrados', () => {
  it('rngVisual es determinista por semilla', () => {
    const a = rngVisual(42);
    const b = rngVisual(42);
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    for (const x of xs) expect(x).toBeGreaterThanOrEqual(0);
    for (const x of xs) expect(x).toBeLessThan(1);
    expect(rngVisual(43)()).not.toBe(xs[0]);
  });

  it('faseDeCasilla es estable y reparte desfases', () => {
    expect(faseDeCasilla(3, 4, 1000)).toBe(faseDeCasilla(3, 4, 1000));
    const fases = new Set<number>();
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) fases.add(faseDeCasilla(x, y, 1000));
    expect(fases.size).toBeGreaterThan(20);
    for (const f of fases) expect(f).toBeLessThan(1000);
  });
});
