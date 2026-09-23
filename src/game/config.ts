import Phaser from 'phaser';
import { BatallaScene } from '../scenes/Batalla';
import { BatallaHUDScene } from '../scenes/BatallaHUD';
import { BootScene } from '../scenes/Boot';
import { IntroScene } from '../scenes/Intro';
import { MainMenuScene } from '../scenes/MainMenu';
import { PreloadScene } from '../scenes/Preload';
import { GAME_HEIGHT, GAME_WIDTH } from './constants';

export { GAME_HEIGHT, GAME_WIDTH } from './constants';

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
  scene: [
    BootScene,
    PreloadScene,
    IntroScene,
    MainMenuScene,
    BatallaScene,
    BatallaHUDScene,
  ],
};
