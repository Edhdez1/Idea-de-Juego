import Phaser from 'phaser';
import { gameConfig } from './config';
import { instalarTestHooks, MODO_TEST } from './test-hooks';

instalarTestHooks();

const game = new Phaser.Game(gameConfig);
// Solo en modo test: acceso al juego para depurar E2E desde la consola.
if (MODO_TEST) (window as unknown as { __phaser?: Phaser.Game }).__phaser = game;
