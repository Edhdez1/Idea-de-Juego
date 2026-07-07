import Phaser from 'phaser';
import { AUDIO_FILES } from '../game/audio';
import { BG_FILES, CARD_ART_FILES, INTRO_FILES, SPRITE_FILES } from '../game/sprites';

/** Carga los sprites pixel art de combate (PixelLab) y el audio. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // Un asset ausente no debe romper el juego (hay fallback de rectángulo
    // para sprites y fallback silencioso para audio): warn, no error.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`Asset no encontrado: ${file.key}`);
    });
    for (const { key, file } of [...SPRITE_FILES, ...CARD_ART_FILES, ...BG_FILES, ...INTRO_FILES]) {
      this.load.image(key, file);
    }
    for (const { key, file } of AUDIO_FILES) {
      this.load.audio(key, file);
    }
  }

  create(): void {
    this.scene.start('Intro');
  }
}
