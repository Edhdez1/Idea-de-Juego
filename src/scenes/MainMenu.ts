import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';

/**
 * Menú placeholder. El texto de sistema se sustituirá por BitmapText
 * (m6x11) cuando entren las fuentes en la Fase 4.
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'VAPORCRACIA', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#e8c170',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'la caldera aún no canta — Fase 0', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#a08662',
      })
      .setOrigin(0.5);
  }
}
