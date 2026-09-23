import Phaser from 'phaser';
import type { Team } from '../core/tactics/types';
import { alturaCaras, TH, TW } from '../ui/iso/proyeccion';

/**
 * Texturas de relleno generadas por código (Canvas 2D, píxel a píxel) para
 * toda clave de arte que falte. El juego NUNCA espera al arte: si no hay
 * sprite, hay peón; si no hay loseta, hay rombo; si no hay fondo, hay cielo.
 *
 * Las claves de relleno llevan prefijo `ph_` (o `ov_`/`fx_`/`ico_` para UI)
 * para no pisar nunca una clave de arte real que se cargue más tarde.
 * Todas las funciones `asegurar*` son idempotentes y baratas (caché por clave).
 */

// ---------- Paleta ----------

export const COLOR_EQUIPO: Record<Team, number> = {
  player: 0x3d7dd8,
  ally: 0x4fae5a,
  enemy: 0xc8463c,
  third: 0xd8a23d,
};

export const COLOR_ESTADO: Record<string, number> = {
  vulnerable: 0xd86a3c,
  weak: 0x8a7fb8,
  poison: 0x6fbf3a,
  strength: 0xe0b040,
};

export type OverlayKind = 'move' | 'attack' | 'area' | 'danger' | 'path' | 'gotera';

/** Color + patrón de cada capa (pensado para daltonismo: nunca solo color). */
export const ESTILO_OVERLAY: Record<OverlayKind, { color: number; patron: 'puntos' | 'rayas' | 'cuadros' | 'horizontal' | 'anillo' | 'damero' }> = {
  move: { color: 0x4aa3ff, patron: 'puntos' },
  attack: { color: 0xff4a3d, patron: 'rayas' },
  area: { color: 0xffa42e, patron: 'cuadros' },
  danger: { color: 0xc03cff, patron: 'horizontal' },
  path: { color: 0xfff0a0, patron: 'anillo' },
  gotera: { color: 0x3cffc8, patron: 'damero' },
};

// ---------- Utilidades de color ----------

function rgb(c: number): [number, number, number] {
  return [(c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff];
}

export function escalarColor(c: number, f: number): number {
  const [r, g, b] = rgb(c);
  const k = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return (k(r) << 16) | (k(g) << 8) | k(b);
}

function css(c: number, a = 1): string {
  const [r, g, b] = rgb(c);
  return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
}

export function hex(c: number): string {
  return c.toString(16).padStart(6, '0');
}

/** Ruido determinista por píxel (para texturas con grano sin Math.random). */
function hash2(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------- Fuente pixel 3×5 ----------

const GLIFOS: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111',
  '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110',
  '6': '011100110101010', '7': '111001010010010', '8': '010101010101010', '9': '010101011001110',
  '?': '110001010000010',
};

/** Dibuja texto con la fuente pixel 3×5 (escala entera, sin antialias). */
export function pintarTextoPixel(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, escala: number, color: string): void {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of texto.toUpperCase()) {
    const g = GLIFOS[ch] ?? GLIFOS['?'] ?? '';
    for (let i = 0; i < 15; i++) {
      if (g[i] === '1') ctx.fillRect(cx + (i % 3) * escala, y + Math.floor(i / 3) * escala, escala, escala);
    }
    cx += 4 * escala;
  }
}

// ---------- Primitivas raster ----------

/** Rombo relleno por filas (bordes en escalera 2:1 nítidos). */
function rombo(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  for (let j = 0; j < h; j++) {
    const yc = j + 0.5 - h / 2;
    const half = Math.round((w / 2) * (1 - Math.abs(yc) / (h / 2)));
    if (half > 0) ctx.fillRect(cx - half, cy - h / 2 + j, half * 2, 1);
  }
}

/** ¿El píxel (i, j) está dentro del rombo w×h con esquina en (0,0)? */
function dentroRombo(i: number, j: number, w: number, h: number): boolean {
  const dx = Math.abs(i + 0.5 - w / 2) / (w / 2);
  const dy = Math.abs(j + 0.5 - h / 2) / (h / 2);
  return dx + dy <= 1;
}

function lienzo(scene: Phaser.Scene, key: string, w: number, h: number): { tex: Phaser.Textures.CanvasTexture; ctx: CanvasRenderingContext2D } | null {
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return null;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  return { tex, ctx };
}

// ---------- Losetas ----------

/**
 * Columna isométrica de altura h: rombo superior + cara izquierda (más oscura)
 * + cara derecha (más oscura aún), con juntas por nivel.
 * Ancla: el centro del rombo superior está en (TW/2, TH/2) → origen (0.5, 16/alto).
 */
export function asegurarLoseta(scene: Phaser.Scene, color: number, h: number): string {
  const key = `ph_loseta_${hex(color)}_${h}`;
  if (scene.textures.exists(key)) return key;
  const caras = alturaCaras(h);
  const alto = TH + caras;
  const l = lienzo(scene, key, TW, alto);
  if (!l) return key;
  const { tex, ctx } = l;
  const izq = escalarColor(color, 0.68);
  const der = escalarColor(color, 0.48);
  // Caras: por columna de píxel, desde el borde inferior del rombo hacia abajo.
  for (let i = 0; i < TW; i++) {
    const dx = Math.abs(i + 0.5 - TW / 2);
    const borde = Math.round(TH / 2 + (TH / 2) * (1 - dx / (TW / 2)));
    const base = i < TW / 2 ? izq : der;
    for (let j = 0; j < caras; j++) {
      const y = borde + j;
      const junta = j > 0 && j % 16 === 0;
      const n = hash2(i, y, color) < 0.12 ? 0.9 : 1;
      ctx.fillStyle = css(escalarColor(base, junta ? 0.8 : n));
      ctx.fillRect(i, y - 1, 1, 1);
    }
  }
  // Rombo superior con grano y canto iluminado.
  for (let j = 0; j < TH; j++) {
    for (let i = 0; i < TW; i++) {
      if (!dentroRombo(i, j, TW, TH)) continue;
      const borde = !dentroRombo(i, j - 1, TW, TH) || !dentroRombo(i - 1, j, TW, TH) || !dentroRombo(i + 1, j, TW, TH);
      const r = hash2(i, j, color);
      const f = borde ? 1.25 : r < 0.08 ? 1.12 : r > 0.93 ? 0.9 : 1;
      ctx.fillStyle = css(escalarColor(color, f));
      ctx.fillRect(i, j, 1, 1);
    }
  }
  tex.refresh();
  return key;
}

/** Brillo que pulsa sobre losetas animadas sin arte (agua, vapor...). */
export function asegurarBrillo(scene: Phaser.Scene): string {
  const key = 'ph_brillo';
  if (scene.textures.exists(key)) return key;
  const l = lienzo(scene, key, TW, TH);
  if (!l) return key;
  for (let j = 0; j < TH; j++) {
    for (let i = 0; i < TW; i++) {
      if (!dentroRombo(i, j, TW, TH)) continue;
      // Ondas diagonales: se ven como reflejo al pulsar.
      if ((i + j * 2) % 12 < 3) {
        l.ctx.fillStyle = 'rgba(255,255,255,0.9)';
        l.ctx.fillRect(i, j, 1, 1);
      }
    }
  }
  l.tex.refresh();
  return key;
}

// ---------- Capas de color (overlays) ----------

function patronOn(p: (typeof ESTILO_OVERLAY)[OverlayKind]['patron'], i: number, j: number): boolean {
  switch (p) {
    case 'puntos':
      return i % 6 === 0 && j % 4 === 0;
    case 'rayas':
      return (i + j * 2) % 8 < 2;
    case 'cuadros':
      return i % 8 === 0 || j % 4 === 0;
    case 'horizontal':
      return j % 4 === 0;
    case 'anillo': {
      const dx = (i + 0.5 - TW / 2) / (TW / 2);
      const dy = (j + 0.5 - TH / 2) / (TH / 2);
      const d = Math.abs(dx) + Math.abs(dy);
      return d > 0.28 && d < 0.46;
    }
    case 'damero':
      return (Math.floor(i / 4) + Math.floor(j / 2)) % 2 === 0;
  }
}

export function asegurarOverlay(scene: Phaser.Scene, kind: OverlayKind): string {
  const key = `ov_${kind}`;
  if (scene.textures.exists(key)) return key;
  const l = lienzo(scene, key, TW, TH);
  if (!l) return key;
  const { color, patron } = ESTILO_OVERLAY[kind];
  const relleno = kind === 'path' ? 0.12 : 0.32;
  for (let j = 0; j < TH; j++) {
    for (let i = 0; i < TW; i++) {
      if (!dentroRombo(i, j, TW, TH)) continue;
      const borde = !dentroRombo(i, j - 1, TW, TH) || !dentroRombo(i, j + 1, TW, TH) || !dentroRombo(i - 1, j, TW, TH) || !dentroRombo(i + 1, j, TW, TH);
      const pat = patronOn(patron, i, j);
      const a = borde ? 0.95 : pat ? 0.8 : relleno;
      l.ctx.fillStyle = css(pat && !borde ? escalarColor(color, 1.3) : color, a);
      l.ctx.fillRect(i, j, 1, 1);
    }
  }
  l.tex.refresh();
  return key;
}

/** Cursor: marco de rombo con esquinas marcadas. */
export function asegurarCursor(scene: Phaser.Scene): string {
  const key = 'ov_cursor';
  if (scene.textures.exists(key)) return key;
  const l = lienzo(scene, key, TW, TH);
  if (!l) return key;
  for (let j = 0; j < TH; j++) {
    for (let i = 0; i < TW; i++) {
      if (!dentroRombo(i, j, TW, TH)) continue;
      const b1 = !dentroRombo(i, j - 1, TW, TH) || !dentroRombo(i, j + 1, TW, TH) || !dentroRombo(i - 1, j, TW, TH) || !dentroRombo(i + 1, j, TW, TH);
      const b2 = !dentroRombo(i - 2, j, TW, TH) || !dentroRombo(i + 2, j, TW, TH);
      if (b1) l.ctx.fillStyle = '#fff4c8';
      else if (b2) l.ctx.fillStyle = 'rgba(40,24,10,0.8)';
      else continue;
      l.ctx.fillRect(i, j, 1, 1);
    }
  }
  l.tex.refresh();
  return key;
}

// ---------- Peones ----------

export const PEON_W = 32;
export const PEON_H = 44;
/** Fila de los pies dentro del frame del peón (para el origen Y). */
export const PEON_PIES = 40;

/** Frames del peón: de frente (SE, SW) y de espaldas (NE, NW). */
export const FRAMES_PEON = ['SE', 'SW', 'NE', 'NW'] as const;

/**
 * Peón de relleno con color de equipo, inicial y muesca de orientación.
 * Cuatro frames (FRAMES_PEON): de frente con la muesca abajo hacia el lado
 * al que mira, de espaldas con la muesca arriba. Pies en y = PEON_PIES.
 */
export function asegurarPeon(scene: Phaser.Scene, team: Team, nombre: string): string {
  const inicial = (nombre.trim()[0] ?? '?').toUpperCase();
  const key = `ph_peon_${team}_${inicial}`;
  if (scene.textures.exists(key)) return key;
  const l = lienzo(scene, key, PEON_W * FRAMES_PEON.length, PEON_H);
  if (!l) return key;
  const { tex, ctx } = l;
  const base = COLOR_EQUIPO[team];
  FRAMES_PEON.forEach((frame, f) => {
    const ox = f * PEON_W;
    const espalda = frame === 'NE' || frame === 'NW';
    // Frames izquierdos dibujados aparte (no con flipX) para que la inicial se lea bien.
    const mx = (x: number, w: number) => (frame === 'SW' || frame === 'NW' ? PEON_W - x - w : x);
    const cuerpo = espalda ? escalarColor(base, 0.75) : base;
    // (La sombra la pone UnidadVista en el suelo, igual que para el arte real.)
    // Cuerpo trapezoidal con contorno
    for (let j = 0; j < 24; j++) {
      const half = 6 + Math.round(j / 4);
      ctx.fillStyle = css(escalarColor(cuerpo, 0.45));
      ctx.fillRect(ox + 16 - half - 1, 16 + j, half * 2 + 2, 1);
      ctx.fillStyle = css(escalarColor(cuerpo, j < 3 ? 1.2 : 1));
      ctx.fillRect(ox + 16 - half, 16 + j, half * 2, 1);
    }
    // Cabeza
    for (let j = 0; j < 12; j++) {
      for (let i = 0; i < 12; i++) {
        const d = (i - 5.5) ** 2 + (j - 5.5) ** 2;
        if (d > 36) continue;
        ctx.fillStyle = d > 26 ? css(escalarColor(cuerpo, 0.45)) : css(espalda ? escalarColor(0xe0b890, 0.7) : 0xe0b890);
        ctx.fillRect(ox + 10 + i, 5 + j, 1, 1);
      }
    }
    // Muesca de orientación (nariz/hombro hacia donde mira)
    ctx.fillStyle = '#f4e4c1';
    if (espalda) ctx.fillRect(ox + mx(21, 3), 6, 3, 3);
    else {
      ctx.fillRect(ox + mx(21, 3), 12, 3, 2);
      ctx.fillStyle = '#2a2027';
      ctx.fillRect(ox + mx(18, 1), 9, 1, 2); // ojo
    }
    // Inicial en el pecho
    pintarTextoPixel(ctx, inicial, ox + 13, 24, 2, espalda ? 'rgba(244,228,193,0.5)' : '#f4e4c1');
  });
  tex.refresh();
  FRAMES_PEON.forEach((frame, f) => tex.add(frame, 0, f * PEON_W, 0, PEON_W, PEON_H));
  return key;
}

// ---------- Props ----------

/** Caja/máquina de relleno con farol de 2 frames ('a', 'b') para animar en bucle. */
export function asegurarProp(scene: Phaser.Scene, sprite: string): string {
  const key = `ph_prop_${sprite}`;
  if (scene.textures.exists(key)) return key;
  const w = 24;
  const h = 32;
  const l = lienzo(scene, key, w * 2, h);
  if (!l) return key;
  const { tex, ctx } = l;
  let semilla = 0;
  for (const ch of sprite) semilla = (semilla * 31 + ch.charCodeAt(0)) | 0;
  const color = 0x6a5238 + ((semilla & 0x1f) << 8);
  for (let f = 0; f < 2; f++) {
    const ox = f * w;
    rombo(ctx, ox + 12, h - 3, 22, 6, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = css(escalarColor(color, 0.5));
    ctx.fillRect(ox + 3, 9, 18, 21);
    ctx.fillStyle = css(color);
    ctx.fillRect(ox + 4, 10, 16, 19);
    ctx.fillStyle = css(escalarColor(color, 0.75));
    for (let y = 13; y < 29; y += 4) ctx.fillRect(ox + 4, y, 16, 1);
    // Remaches
    ctx.fillStyle = '#c9a86a';
    ctx.fillRect(ox + 5, 11, 1, 1);
    ctx.fillRect(ox + 18, 11, 1, 1);
    // Farol que parpadea
    ctx.fillStyle = f === 0 ? '#ffd27a' : '#8a5a2a';
    ctx.fillRect(ox + 10, 3, 4, 5);
    if (f === 0) {
      ctx.fillStyle = 'rgba(255,210,122,0.35)';
      ctx.fillRect(ox + 8, 1, 8, 9);
    }
  }
  tex.refresh();
  tex.add('a', 0, 0, 0, w, h);
  tex.add('b', 0, w, 0, w, h);
  return key;
}

// ---------- Prototipos ----------

/** Prototipo con mecha: calderín de latón con remaches y mecha encendida (frames 'a','b'). */
export function asegurarPrototipo(scene: Phaser.Scene): string {
  const key = 'ph_prototipo';
  if (scene.textures.exists(key)) return key;
  const w = 20;
  const h = 26;
  const l = lienzo(scene, key, w * 2, h);
  if (!l) return key;
  const { tex, ctx } = l;
  for (let f = 0; f < 2; f++) {
    const ox = f * w;
    rombo(ctx, ox + 10, h - 3, 18, 6, 'rgba(0,0,0,0.35)');
    for (let j = 0; j < 14; j++) {
      for (let i = 0; i < 14; i++) {
        const d = Math.hypot(i - 6.5, j - 6.5);
        if (d > 7) continue;
        ctx.fillStyle = d > 6 ? '#4a3418' : i + j < 9 ? '#e8c170' : '#b08a3a';
        ctx.fillRect(ox + 3 + i, 9 + j, 1, 1);
      }
    }
    ctx.fillStyle = '#6a4a20';
    ctx.fillRect(ox + 3, 15, 14, 1);
    ctx.fillStyle = '#2a2027';
    ctx.fillRect(ox + 9, 5, 2, 5); // mecha
    ctx.fillStyle = f === 0 ? '#fff4c8' : '#ff9a3c';
    ctx.fillRect(ox + 9 + (f === 0 ? 0 : 1), 2 + f, 2, 3); // chispa
  }
  tex.refresh();
  tex.add('a', 0, 0, 0, w, h);
  tex.add('b', 0, w, 0, w, h);
  return key;
}

// ---------- Partículas ----------

export function asegurarParticulas(scene: Phaser.Scene): { punto: string; humo: string } {
  const punto = 'fx_punto';
  const humo = 'fx_humo';
  if (!scene.textures.exists(punto)) {
    const l = lienzo(scene, punto, 2, 2);
    if (l) {
      l.ctx.fillStyle = '#ffffff';
      l.ctx.fillRect(0, 0, 2, 2);
      l.tex.refresh();
    }
  }
  if (!scene.textures.exists(humo)) {
    const l = lienzo(scene, humo, 8, 8);
    if (l) {
      for (let j = 0; j < 8; j++) {
        for (let i = 0; i < 8; i++) {
          const d = Math.hypot(i - 3.5, j - 3.5);
          if (d > 4) continue;
          // Tramado para que sea pixel art y no un degradado liso
          if (d > 2.5 && (i + j) % 2 === 0) continue;
          l.ctx.fillStyle = '#ffffff';
          l.ctx.fillRect(i, j, 1, 1);
        }
      }
      l.tex.refresh();
    }
  }
  return { punto, humo };
}

// ---------- Iconos de estado y flecha ----------

export function asegurarIconoEstado(scene: Phaser.Scene, estado: string): string {
  const key = `ico_estado_${estado}`;
  if (scene.textures.exists(key)) return key;
  const l = lienzo(scene, key, 7, 7);
  if (!l) return key;
  const c = COLOR_ESTADO[estado] ?? 0x9a9a9a;
  l.ctx.fillStyle = css(escalarColor(c, 0.45));
  l.ctx.fillRect(0, 0, 7, 7);
  l.ctx.fillStyle = css(c);
  l.ctx.fillRect(1, 1, 5, 5);
  pintarTextoPixel(l.ctx, estado[0] ?? '?', 2, 1, 1, '#1a1418');
  l.tex.refresh();
  return key;
}

// ---------- Parallax ----------

export const PARALLAX_W = 320;
export const PARALLAX_H = 180;

/**
 * Tres capas de fondo 320×180 (se muestran a ×2): cielo en degradado por
 * bandas, horizonte de la pirámide-ciudad (con el Coso en la cúspide) y nubes.
 * Devuelve las claves; el faro del Coso es una textura aparte para pulsar.
 */
export function asegurarParallax(scene: Phaser.Scene): { cielo: string; ciudad: string; nubes: string; faro: string } {
  const claves = { cielo: 'ph_parallax_cielo', ciudad: 'ph_parallax_ciudad', nubes: 'ph_parallax_nubes', faro: 'ph_parallax_faro' };
  if (!scene.textures.exists(claves.cielo)) {
    const l = lienzo(scene, claves.cielo, PARALLAX_W, PARALLAX_H);
    if (l) {
      const bandas = [0x1a1230, 0x2a1838, 0x3e1f3c, 0x5a2a3a, 0x7a3a34, 0x9a522e, 0xc0742e, 0xd8a050];
      const bh = PARALLAX_H / bandas.length;
      bandas.forEach((c, i) => {
        l.ctx.fillStyle = css(c);
        l.ctx.fillRect(0, Math.floor(i * bh), PARALLAX_W, Math.ceil(bh) + 1);
        // Tramado entre bandas
        const sig = bandas[i + 1];
        if (sig !== undefined) {
          l.ctx.fillStyle = css(sig);
          const y0 = Math.floor((i + 1) * bh) - 2;
          for (let x = 0; x < PARALLAX_W; x += 2) l.ctx.fillRect(x + ((y0 >> 0) % 2), y0, 1, 1);
        }
      });
      // Estrellas deterministas en la parte alta
      l.ctx.fillStyle = 'rgba(255,240,200,0.8)';
      for (let k = 0; k < 40; k++) {
        const x = Math.floor(hash2(k, 1, 7) * PARALLAX_W);
        const y = Math.floor(hash2(k, 2, 7) * 50);
        l.ctx.fillRect(x, y, 1, 1);
      }
      l.tex.refresh();
    }
  }
  if (!scene.textures.exists(claves.ciudad)) {
    const l = lienzo(scene, claves.ciudad, PARALLAX_W, PARALLAX_H);
    if (l) {
      const { ctx } = l;
      const sil = '#1c1422';
      const luz = 'rgba(255,190,90,0.85)';
      // Pirámide escalonada central
      const cx = PARALLAX_W / 2;
      for (let p = 0; p < 9; p++) {
        const half = 120 - p * 13;
        const y = PARALLAX_H - 20 - p * 12;
        ctx.fillStyle = sil;
        ctx.fillRect(cx - half, y, half * 2, 13);
        // Ventanitas iluminadas por piso
        ctx.fillStyle = luz;
        for (let k = 0; k < half / 6; k++) {
          if (hash2(p, k, 3) < 0.35) ctx.fillRect(cx - half + 4 + k * 12, y + 5, 2, 2);
        }
      }
      // Torre del Coso en la cúspide
      ctx.fillStyle = sil;
      ctx.fillRect(cx - 5, PARALLAX_H - 20 - 9 * 12 - 16, 10, 18);
      // Chimeneas y edificios bajos a los lados
      for (let k = 0; k < 16; k++) {
        const x = Math.floor(hash2(k, 5, 9) * PARALLAX_W);
        if (Math.abs(x - cx) < 110) continue;
        const w = 10 + Math.floor(hash2(k, 6, 9) * 18);
        const h = 16 + Math.floor(hash2(k, 7, 9) * 30);
        ctx.fillStyle = sil;
        ctx.fillRect(x, PARALLAX_H - h, w, h);
        if (k % 3 === 0) ctx.fillRect(x + 2, PARALLAX_H - h - 12, 3, 12);
        ctx.fillStyle = luz;
        if (hash2(k, 8, 9) < 0.6) ctx.fillRect(x + 3, PARALLAX_H - h + 6, 2, 2);
      }
      ctx.fillStyle = sil;
      ctx.fillRect(0, PARALLAX_H - 20, PARALLAX_W, 20);
      l.tex.refresh();
    }
  }
  if (!scene.textures.exists(claves.nubes)) {
    const l = lienzo(scene, claves.nubes, PARALLAX_W, 60);
    if (l) {
      for (let n = 0; n < 7; n++) {
        const x0 = Math.floor(hash2(n, 1, 11) * PARALLAX_W);
        const y0 = 8 + Math.floor(hash2(n, 2, 11) * 40);
        const w = 30 + Math.floor(hash2(n, 3, 11) * 40);
        for (let j = 0; j < 8; j++) {
          const half = Math.round((w / 2) * Math.sqrt(1 - ((j - 4) / 4.5) ** 2));
          l.ctx.fillStyle = j < 3 ? 'rgba(240,200,190,0.55)' : 'rgba(170,120,140,0.45)';
          for (let x = x0 - half; x < x0 + half; x++) l.ctx.fillRect(((x % PARALLAX_W) + PARALLAX_W) % PARALLAX_W, y0 + j, 1, 1);
        }
      }
      l.tex.refresh();
    }
  }
  if (!scene.textures.exists(claves.faro)) {
    const l = lienzo(scene, claves.faro, 16, 16);
    if (l) {
      for (let j = 0; j < 16; j++) {
        for (let i = 0; i < 16; i++) {
          const d = Math.hypot(i - 7.5, j - 7.5);
          if (d > 8) continue;
          l.ctx.fillStyle = d < 2 ? '#fff4c8' : d < 4 ? 'rgba(255,190,90,0.8)' : (i + j) % 2 === 0 ? 'rgba(255,150,60,0.4)' : 'rgba(0,0,0,0)';
          l.ctx.fillRect(i, j, 1, 1);
        }
      }
      l.tex.refresh();
    }
  }
  return claves;
}

// ---------- Todo junto ----------

export interface EspecPlaceholders {
  terrenos?: { color: number }[];
  alturaMax?: number;
  unidades?: { team: Team; nombre: string }[];
  props?: string[];
}

/**
 * Genera de una vez las texturas de relleno comunes (capas, cursor, partículas,
 * parallax, iconos) y las del contenido indicado. Las piezas que no se pidan
 * aquí se generan igual bajo demanda con las funciones `asegurar*`.
 */
export function generarPlaceholders(scene: Phaser.Scene, espec: EspecPlaceholders = {}): void {
  (Object.keys(ESTILO_OVERLAY) as OverlayKind[]).forEach((k) => asegurarOverlay(scene, k));
  asegurarCursor(scene);
  asegurarBrillo(scene);
  asegurarParticulas(scene);
  asegurarParallax(scene);
  Object.keys(COLOR_ESTADO).forEach((e) => asegurarIconoEstado(scene, e));
  const hMax = espec.alturaMax ?? 6;
  for (const t of espec.terrenos ?? []) for (let h = 0; h <= hMax; h++) asegurarLoseta(scene, t.color, h);
  for (const u of espec.unidades ?? []) asegurarPeon(scene, u.team, u.nombre);
  for (const p of espec.props ?? []) asegurarProp(scene, p);
}
