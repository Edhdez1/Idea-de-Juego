import Phaser from 'phaser';
import { PRESSURE_MAX } from '../core';
import { dur } from '../game/anim';
import { GAME_WIDTH } from '../game/constants';
import { controller } from '../game/controller';

const BARRA_W = 120;
const BARRA_X = GAME_WIDTH / 2 - BARRA_W / 2;

/**
 * Overlay de UI (escena aparte para que el screen-shake del combate
 * no sacuda la interfaz). Lee el estado vía controller y se refresca
 * con el evento global 'hud:refresh'.
 */
export class HUDScene extends Phaser.Scene {
  private energiaTxt!: Phaser.GameObjects.Text;
  private turnoTxt!: Phaser.GameObjects.Text;
  private pilasTxt!: Phaser.GameObjects.Text;
  private presionTxt!: Phaser.GameObjects.Text;
  private aguja!: Phaser.GameObjects.Rectangle;
  private zonaRoja!: Phaser.GameObjects.Rectangle;
  private pulso?: Phaser.Tweens.Tween;
  private finBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('HUD');
  }

  create(): void {
    const estilo = { fontFamily: 'monospace', fontSize: '11px', color: '#e8c170' };

    this.energiaTxt = this.add.text(12, 8, '', estilo);
    this.turnoTxt = this.add.text(12, 24, '', { ...estilo, color: '#a08662' });
    this.pilasTxt = this.add.text(12, 40, '', { ...estilo, color: '#a08662' });

    // Manómetro de Presión: barra con zona roja desde 8 y aguja
    this.add.text(GAME_WIDTH / 2, 8, 'PRESION', { ...estilo, fontSize: '9px' }).setOrigin(0.5, 0);
    this.add.rectangle(BARRA_X, 24, BARRA_W, 10, 0x2a2027).setOrigin(0, 0.5).setStrokeStyle(1, 0xc9a86a);
    this.zonaRoja = this.add
      .rectangle(BARRA_X + BARRA_W * 0.8, 24, BARRA_W * 0.2, 10, 0x8a2a1e)
      .setOrigin(0, 0.5);
    this.aguja = this.add.rectangle(BARRA_X, 24, 3, 16, 0xf4e4c1).setOrigin(0.5);
    this.presionTxt = this.add
      .text(BARRA_X + BARRA_W + 8, 24, '', { ...estilo, fontSize: '10px' })
      .setOrigin(0, 0.5);

    this.finBtn = this.add
      .text(GAME_WIDTH - 12, 296, '[ FIN DE TURNO ]', { ...estilo, fontSize: '13px' })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    this.finBtn.on('pointerdown', () => {
      if (this.finBtn.alpha === 1) this.game.events.emit('combat:endturn');
    });

    this.game.events.on('hud:refresh', this.refrescar, this);
    this.game.events.on('hud:bloqueo', this.setBloqueado, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('hud:refresh', this.refrescar, this);
      this.game.events.off('hud:bloqueo', this.setBloqueado, this);
    });

    this.refrescar();
  }

  private setBloqueado(on: boolean): void {
    this.finBtn.setAlpha(on ? 0.4 : 1);
  }

  private refrescar(): void {
    const s = controller.getState();
    this.energiaTxt.setText(`ENERGIA ${s.energy}/${s.maxEnergy}`);
    this.turnoTxt.setText(`TURNO ${s.turn}`);
    this.pilasTxt.setText(`ROBO ${s.drawPile.length}  DESC ${s.discardPile.length}`);
    this.presionTxt.setText(`${s.pressure}/${PRESSURE_MAX}`);

    const destino = BARRA_X + (BARRA_W * s.pressure) / PRESSURE_MAX;
    this.tweens.add({ targets: this.aguja, x: destino, duration: dur(150), ease: 'Quad.easeOut' });

    const peligro = s.pressure >= 8;
    if (peligro && !this.pulso) {
      this.pulso = this.tweens.add({
        targets: this.zonaRoja,
        alpha: 0.35,
        duration: dur(220),
        yoyo: true,
        repeat: -1,
      });
    } else if (!peligro && this.pulso) {
      this.pulso.stop();
      this.pulso = undefined;
      this.zonaRoja.setAlpha(1);
    }
  }
}
