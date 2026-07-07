import Phaser from 'phaser';
import { detenerMusica, sonar } from '../game/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { borrarRun } from '../game/run';

/** Fin del Acto 1: el Gran Maestre cayó y su explicación del Coso con él. */
export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  create(): void {
    // La run terminó: el save se borra (el acto 2 llegará con su propio hito).
    borrarRun();
    detenerMusica();
    sonar(this, 'sfx_victoria');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x120c10);
    this.add
      .text(GAME_WIDTH / 2, 100, 'ACTO 1 SUPERADO', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#e8c170',
      })
      .setOrigin(0.5);
    this.add
      .text(
        GAME_WIDTH / 2,
        166,
        '«Desmentiste al Gremio. Su explicación era mentira...\nla de la Iglesia es peor. Continuará.»\n— el Narrador',
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#a08662',
          align: 'center',
          wordWrap: { width: 460 },
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5);

    const volver = this.add
      .text(GAME_WIDTH / 2, 244, '[ VOLVER AL MENÚ ]', {
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
