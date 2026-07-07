import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';

/**
 * Caja de diálogo inferior con el mismo estilo visual que la intro
 * (rect oscuro + borde 0x8a7350, texto monospace). Regla narrativa:
 * cada pantalla nueva se presenta con 1-2 líneas de contexto, nunca
 * un salto sin explicación.
 */

export interface LineaDialogo {
  nombre: string;
  color: string;
  texto: string;
  /** Key de textura del retrato (opcional; si falta, no se muestra). */
  retrato?: string;
}

export const CAJA_H = 92;

const ESTILO_NOMBRE = { fontFamily: 'monospace', fontSize: '10px' };
const ESTILO_TEXTO = {
  fontFamily: 'monospace',
  fontSize: '11px',
  color: '#f4e4c1',
  wordWrap: { width: GAME_WIDTH - 100 },
  lineSpacing: 3,
};

/** Dibuja la caja base (marco + nombre + texto) y devuelve sus piezas. */
function dibujarCaja(
  scene: Phaser.Scene,
  profundidad: number,
): {
  piezas: Phaser.GameObjects.GameObject[];
  nombre: Phaser.GameObjects.Text;
  texto: Phaser.GameObjects.Text;
  marcoRetrato: Phaser.GameObjects.Rectangle;
} {
  const caja = scene.add
    .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - CAJA_H / 2, GAME_WIDTH - 8, CAJA_H - 6, 0x14100f, 0.94)
    .setStrokeStyle(2, 0x8a7350)
    .setDepth(profundidad);
  const marcoRetrato = scene.add
    .rectangle(38, GAME_HEIGHT - CAJA_H / 2, 52, 52, 0x1a1017)
    .setStrokeStyle(2, 0xc9a86a)
    .setDepth(profundidad + 1)
    .setVisible(false);
  const nombre = scene.add
    .text(72, GAME_HEIGHT - CAJA_H + 12, '', { ...ESTILO_NOMBRE, color: '#e8c170' })
    .setDepth(profundidad + 1);
  const texto = scene.add
    .text(72, GAME_HEIGHT - CAJA_H + 28, '', ESTILO_TEXTO)
    .setDepth(profundidad + 1);
  return { piezas: [caja, marcoRetrato, nombre, texto], nombre, texto, marcoRetrato };
}

/** Caja estática de una sola línea (contexto del Narrador, saludos). */
export function cajaEstatica(scene: Phaser.Scene, linea: LineaDialogo, profundidad = 500): void {
  const { nombre, texto, marcoRetrato } = dibujarCaja(scene, profundidad);
  nombre.setText(linea.nombre).setColor(linea.color);
  texto.setText(linea.texto);
  if (linea.retrato && scene.textures.exists(linea.retrato)) {
    const img = scene.add
      .image(38, GAME_HEIGHT - CAJA_H / 2, linea.retrato)
      .setDepth(profundidad + 2);
    img.setScale(48 / Math.max(img.width, img.height));
    marcoRetrato.setVisible(true);
  }
}

/**
 * Caja modal secuencial: bloquea el resto de la escena (zona a pantalla
 * completa) y avanza línea a línea con click/tap; al terminar se destruye
 * y llama a onFin.
 */
export class CajaDialogo {
  private idx = 0;
  private piezas: Phaser.GameObjects.GameObject[];
  private nombre: Phaser.GameObjects.Text;
  private texto: Phaser.GameObjects.Text;
  private marcoRetrato: Phaser.GameObjects.Rectangle;
  private retrato?: Phaser.GameObjects.Image;

  constructor(
    private scene: Phaser.Scene,
    private lineas: LineaDialogo[],
    private onFin: () => void = () => {},
  ) {
    const base = dibujarCaja(scene, 800);
    this.piezas = base.piezas;
    this.nombre = base.nombre;
    this.texto = base.texto;
    this.marcoRetrato = base.marcoRetrato;

    const indicador = scene.add
      .text(GAME_WIDTH - 18, GAME_HEIGHT - 14, '»', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#e8c170',
      })
      .setOrigin(1, 1)
      .setDepth(801);
    // Zona modal: captura todos los clicks mientras el diálogo está abierto.
    const zona = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001)
      .setDepth(799)
      .setInteractive({ useHandCursor: true });
    zona.on('pointerdown', () => this.avanzar());
    this.piezas.push(indicador, zona);

    this.mostrar();
  }

  private mostrar(): void {
    const linea = this.lineas[this.idx];
    if (!linea) return;
    this.nombre.setText(linea.nombre).setColor(linea.color);
    this.texto.setText(linea.texto);
    this.retrato?.destroy();
    this.retrato = undefined;
    if (linea.retrato && this.scene.textures.exists(linea.retrato)) {
      this.retrato = this.scene.add
        .image(38, GAME_HEIGHT - CAJA_H / 2, linea.retrato)
        .setDepth(802);
      this.retrato.setScale(48 / Math.max(this.retrato.width, this.retrato.height));
      this.marcoRetrato.setVisible(true);
    } else {
      this.marcoRetrato.setVisible(false);
    }
  }

  private avanzar(): void {
    this.idx += 1;
    if (this.idx < this.lineas.length) {
      this.mostrar();
      return;
    }
    for (const pieza of this.piezas) pieza.destroy();
    this.retrato?.destroy();
    this.onFin();
  }
}
