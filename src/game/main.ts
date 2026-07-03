import Phaser from 'phaser';
import { gameConfig } from './config';
import { instalarTestHooks } from './test-hooks';

instalarTestHooks();

new Phaser.Game(gameConfig);
