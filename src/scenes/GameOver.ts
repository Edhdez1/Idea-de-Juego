import Phaser from 'phaser';
import { detenerMusica, sonar } from '../game/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { borrarRun } from '../game/run';

/** Fin de la run por derrota: burla del Narrador y de vuelta al menú. */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(): void {
    // Doble seguro: el save de la run muere con la run.
    borrarRun();
    detenerMusica();

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x120c10);
    this.add
      .text(GAME_WIDTH / 2, 110, 'DERROTA', {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ff5a3c',
      })
      .setOrigin(0.5);
    this.add
      .text(
        GAME_WIDTH / 2,
        168,
        '«El Gremio ya archivó tu caso: "operario no cualificado".\nNi para morir en su distrito tenías licencia.»\n— el Narrador',
        {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#a08662',
          align: 'center',
          wordWrap: { width: 440 },
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5);

    const volver = this.add
      .text(GAME_WIDTH / 2, 240, '[ VOLVER AL MENÚ ]', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f4e4c1',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    volver.on('pointerover', () => volver.setColor('#ffe08a'));
    volver.on('pointerout', () => volver.setColor('#f4e4c1'));
    volver.on('pointerdown', () => {
      sonar(this, 'sfx_click');
      this.scene.start('MainMenu');
    });
  }
}
