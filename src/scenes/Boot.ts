import Phaser from 'phaser';

/** Config mínima previa al preloader (aquí irá la carga del logo/barra). */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.scene.start('Preload');
  }
}
