import Phaser from 'phaser';
import { BootScene } from '../scenes/Boot';
import { PreloadScene } from '../scenes/Preload';
import { MainMenuScene } from '../scenes/MainMenu';

/** Resolución interna pixel-perfect; ver docs/investigacion/02-arte-pixel.md */
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: '#1a1017',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, MainMenuScene],
};
