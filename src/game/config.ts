import Phaser from 'phaser';
import { BootScene } from '../scenes/Boot';
import { CombatScene } from '../scenes/Combat';
import { GameOverScene } from '../scenes/GameOver';
import { HUDScene } from '../scenes/HUD';
import { IntroScene } from '../scenes/Intro';
import { MainMenuScene } from '../scenes/MainMenu';
import { MapScene } from '../scenes/Map';
import { PreloadScene } from '../scenes/Preload';
import { RestScene } from '../scenes/Rest';
import { RewardScene } from '../scenes/Reward';
import { ShopScene } from '../scenes/Shop';
import { VictoryScene } from '../scenes/Victory';
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
    MapScene,
    CombatScene,
    RewardScene,
    ShopScene,
    RestScene,
    GameOverScene,
    VictoryScene,
    HUDScene,
  ],
};
