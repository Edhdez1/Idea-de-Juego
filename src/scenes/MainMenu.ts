import Phaser from 'phaser';
import { musica, sonar } from '../game/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import {
  borrarRun,
  cargarRun,
  crearRun,
  establecerRun,
  guardarRun,
  nuevaSemilla,
} from '../game/run';
import { MODO_TEST } from '../game/test-hooks';

const COMBATE_INICIAL = { encounterId: 'taller_embargado', seed: 20260702 };

/**
 * Menú principal. Si hay una run guardada ofrece CONTINUAR además de
 * NUEVA RUN (que borra el save y genera semilla desde un contador
 * persistido: nada de Date.now, regla del proyecto).
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

    musica(this, 'musica_taberna', { volume: 0.5 });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'EL COSO DEL REY', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#e8c170',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25, 'la caldera ya silba — alfa jugable', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#a08662',
      })
      .setOrigin(0.5);

    const guardada = cargarRun();
    if (guardada) {
      this.boton(GAME_HEIGHT / 2 + 25, '[ CONTINUAR ]', () => {
        establecerRun(guardada);
        this.scene.start('Map');
      });
      this.boton(GAME_HEIGHT / 2 + 55, '[ NUEVA RUN ]', () => {
        borrarRun();
        this.nuevaRun();
      });
    } else {
      this.boton(GAME_HEIGHT / 2 + 40, '[ JUGAR ]', () => this.nuevaRun());
    }

    const verIntro = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 88, 'ver intro', {
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

  private nuevaRun(): void {
    const run = crearRun(nuevaSemilla());
    establecerRun(run);
    guardarRun(run);
    // El Map presenta el distrito con la bienvenida del Narrador.
    this.scene.start('Map');
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
