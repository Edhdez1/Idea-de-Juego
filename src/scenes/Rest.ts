import Phaser from 'phaser';
import { sonar } from '../game/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { descansar, guardarRun, obtenerRun } from '../game/run';
import { cajaEstatica } from '../ui/CajaDialogo';

/**
 * Nodo de descanso: fogata simple, cura el 30% de la vida máxima
 * y de vuelta al mapa. El Narrador presenta la pantalla (coherencia).
 */
export class RestScene extends Phaser.Scene {
  constructor() {
    super('Rest');
  }

  create(): void {
    const run = obtenerRun();
    if (!run) {
      this.scene.start('MainMenu');
      return;
    }

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x120c10);

    // Fogata simple: leños, llama en triángulos y brillo pulsante
    const cx = GAME_WIDTH / 2;
    const cy = 170;
    const brillo = this.add.circle(cx, cy - 14, 46, 0xff8a3c, 0.14);
    this.add.rectangle(cx - 12, cy + 12, 52, 7, 0x5a4632).setRotation(0.35);
    this.add.rectangle(cx + 12, cy + 12, 52, 7, 0x4a3a2a).setRotation(-0.35);
    const llama = this.add.triangle(cx, cy - 6, 0, 34, 17, 0, 34, 34, 0xff8a3c);
    const llamaInterna = this.add.triangle(cx, cy + 2, 0, 22, 11, 0, 22, 22, 0xffd27a);
    this.tweens.add({
      targets: [llama, llamaInterna, brillo],
      scaleX: 1.12,
      scaleY: 0.92,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const curado = descansar(run);
    guardarRun(run);

    this.add
      .text(cx, 60, 'DESCANSO', { fontFamily: 'monospace', fontSize: '18px', color: '#e8c170' })
      .setOrigin(0.5);
    this.add
      .text(cx, cy + 44, `+${curado} HP  (${run.hpActual}/${run.hpMax})`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8ae87a',
      })
      .setOrigin(0.5);

    cajaEstatica(this, {
      nombre: 'El Narrador',
      color: '#e8c170',
      texto: 'Descansas junto a una caldera tibia. En Vaporcracia esto cuenta como sanidad pública.',
    });

    const continuar = this.add
      .text(cx, 240, '[ CONTINUAR ]', { fontFamily: 'monospace', fontSize: '14px', color: '#f4e4c1' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    continuar.on('pointerover', () => continuar.setColor('#ffe08a'));
    continuar.on('pointerout', () => continuar.setColor('#f4e4c1'));
    continuar.on('pointerdown', () => {
      sonar(this, 'sfx_click');
      this.scene.start('Map');
    });
  }
}
