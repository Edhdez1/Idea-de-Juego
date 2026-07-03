import Phaser from 'phaser';
import { BG_FILES, CARD_ART_FILES, INTRO_FILES, SPRITE_FILES } from '../game/sprites';

/** Carga los sprites pixel art de combate (PixelLab). */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // Un asset ausente no debe romper el juego (hay fallback de rectángulo):
    // warn, no error — el smoke E2E falla ante console.error.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`Asset no encontrado: ${file.key}`);
    });
    for (const { key, file } of [...SPRITE_FILES, ...CARD_ART_FILES, ...BG_FILES, ...INTRO_FILES]) {
      this.load.image(key, file);
    }
  }

  create(): void {
    this.scene.start('Intro');
  }
}
