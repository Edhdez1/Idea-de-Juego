import Phaser from 'phaser';

/** Cargará atlas, fuentes bitmap y audio. De momento no hay assets. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
