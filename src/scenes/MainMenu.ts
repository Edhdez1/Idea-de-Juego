import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { MODO_TEST } from '../game/test-hooks';

const COMBATE_INICIAL = { encounterId: 'taller_embargado', seed: 20260702 };

/**
 * Menú placeholder. El texto de sistema se sustituirá por BitmapText
 * (m6x11) cuando entren las fuentes en la Fase 4.
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create(): void {
    // En modo test el smoke va directo al combate, sin depender de clicks en canvas.
    if (MODO_TEST) {
      this.scene.start('Combat', COMBATE_INICIAL);
      return;
    }

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'EL COSO DEL REY', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#e8c170',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 5, 'la caldera ya silba — Fase 2', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#a08662',
      })
      .setOrigin(0.5);

    const jugar = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, '[ JUGAR ]', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#f4e4c1',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    jugar.on('pointerover', () => jugar.setColor('#ffe08a'));
    jugar.on('pointerout', () => jugar.setColor('#f4e4c1'));
    jugar.on('pointerdown', () => this.scene.start('Combat', COMBATE_INICIAL));

    const verIntro = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 78, 'ver intro', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#a08662',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    verIntro.on('pointerover', () => verIntro.setColor('#e8c170'));
    verIntro.on('pointerout', () => verIntro.setColor('#a08662'));
    verIntro.on('pointerdown', () => this.scene.start('Intro'));
  }
}
