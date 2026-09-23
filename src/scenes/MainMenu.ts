import Phaser from 'phaser';
import { musica, sonar } from '../game/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { BATALLA_TEST, MODO_TEST, SEMILLA_TEST } from '../game/test-hooks';
import type { BatallaInit } from './Batalla';

/** Semilla fija del Prólogo: la campaña es escrita, no aleatoria. */
const SEMILLA_PROLOGO = 20260923;

/**
 * Menú principal: NUEVA PARTIDA arranca el Prólogo (B0 «Taller Embargado»).
 * En modo test (?test=1&batalla=<id>) va directo a esa batalla.
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create(): void {
    if (MODO_TEST) {
      this.scene.start('Batalla', { battleId: BATALLA_TEST, seed: SEMILLA_TEST } satisfies BatallaInit);
      return;
    }

    musica(this, 'musica_taberna', { volume: 0.5 });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'EL COSO DEL REY', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#e8c170',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25, 'RPG táctico político · Prólogo jugable', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#a08662',
      })
      .setOrigin(0.5);

    this.boton(GAME_HEIGHT / 2 + 30, '[ NUEVA PARTIDA ]', () =>
      this.scene.start('Batalla', { battleId: 'prologo_taller', seed: SEMILLA_PROLOGO } satisfies BatallaInit),
    );

    const verIntro = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, 'ver intro', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#a08662',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    verIntro.on('pointerover', () => verIntro.setColor('#e8c170'));
    verIntro.on('pointerout', () => verIntro.setColor('#a08662'));
    verIntro.on('pointerdown', () => {
      sonar(this, 'sfx_click');
      this.scene.start('Intro');
    });
  }

  private boton(y: number, texto: string, alPulsar: () => void): void {
    const btn = this.add
      .text(GAME_WIDTH / 2, y, texto, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#f4e4c1',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#ffe08a'));
    btn.on('pointerout', () => btn.setColor('#f4e4c1'));
    btn.on('pointerdown', () => {
      sonar(this, 'sfx_click');
      alPulsar();
    });
  }
}
