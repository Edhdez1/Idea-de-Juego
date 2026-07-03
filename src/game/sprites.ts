import Phaser from 'phaser';

/** Mapeo defId → key de textura (los archivos viven en public/assets/sprites). */
const SPRITE_KEYS: Record<string, string> = {
  ingeniera: 'ingeniera',
  aprendiz_explotado: 'aprendiz_explotado',
  golem_laton_defectuoso: 'golem_defectuoso',
  recaudador: 'recaudador',
  inquisidor_patentes: 'inquisidor_patentes',
};

export function spriteKeyDe(defId: string): string {
  return SPRITE_KEYS[defId] ?? defId;
}

/**
 * Sprites cuyo dibujo original mira al lado contrario del que le toca en
 * combate (héroe → derecha, enemigos → izquierda): se voltean al crearse.
 */
const FLIP_X: Record<string, boolean> = {
  ingeniera: true,
};

export const SPRITE_FILES: { key: string; file: string }[] = [
  { key: 'ingeniera', file: 'assets/sprites/ingeniera.png' },
  { key: 'aprendiz_explotado', file: 'assets/sprites/aprendiz_explotado.png' },
  { key: 'golem_defectuoso', file: 'assets/sprites/golem_defectuoso.png' },
  { key: 'recaudador', file: 'assets/sprites/recaudador.png' },
  { key: 'inquisidor_patentes', file: 'assets/sprites/inquisidor_patentes.png' },
];

/** Fondos de combate por encuentro (320×180, se muestran a escala 2). */
export const BG_FILES: { key: string; file: string }[] = [
  { key: 'bg_taller_gremio', file: 'assets/bg/taller_gremio.png' },
];

/** Arte propio de cada carta (key = card_<defId>). */
export const CARD_ART_FILES: { key: string; file: string }[] = [
  'golpe_de_llave',
  'plancha_remachada',
  'motor_a_presion',
  'valvula_de_escape',
  'prototipo_inestable',
  'pistola_de_remaches',
  'turbina_de_taller',
].map((id) => ({ key: `card_${id}`, file: `assets/cards/${id}.png` }));

/**
 * Crea el visual de una unidad a escala 1 (pixel-perfect).
 * Si la textura falta, cae a un rectángulo con el nombre: el juego nunca
 * se rompe por un asset ausente.
 */
export function crearUnidad(
  scene: Phaser.Scene,
  x: number,
  y: number,
  defId: string,
  nombre: string,
): Phaser.GameObjects.Container {
  const cont = scene.add.container(x, y);
  const key = spriteKeyDe(defId);
  if (scene.textures.exists(key)) {
    const spr = scene.add.image(0, 0, key).setOrigin(0.5, 1);
    if (FLIP_X[key]) spr.setFlipX(true);
    cont.add(spr);
    cont.setData('sprite', spr);
    cont.setSize(spr.width, spr.height);
  } else {
    const rect = scene.add.rectangle(0, -48, 72, 96, 0x5a4632).setOrigin(0.5, 0.5);
    const label = scene.add
      .text(0, -48, nombre, { fontFamily: 'monospace', fontSize: '9px', color: '#e8c170', wordWrap: { width: 68 } })
      .setOrigin(0.5);
    cont.add([rect, label]);
    cont.setData('sprite', rect);
    cont.setSize(72, 96);
  }
  return cont;
}
