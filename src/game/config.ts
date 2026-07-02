import Phaser from 'phaser';
import { BootScene } from '../scenes/Boot';
import { CombatScene } from '../scenes/Combat';
import { HUDScene } from '../scenes/HUD';
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
  scene: [BootScene, PreloadScene, MainMenuScene, CombatScene, HUDScene],
};
