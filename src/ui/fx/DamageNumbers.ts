import Phaser from 'phaser';
import { dur } from '../../game/anim';

/** Números flotantes de daño/bloqueo, con pool para no crear textos por golpe. */
export class DamageNumbers {
  private pool: Phaser.GameObjects.Text[] = [];

  constructor(private scene: Phaser.Scene) {}

  mostrar(x: number, y: number, texto: string, color: string): void {
    const t =
      this.pool.pop() ??
      this.scene.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold' });
    t.setText(texto).setColor(color).setPosition(x, y).setAlpha(1).setActive(true).setVisible(true).setDepth(500);
    this.scene.tweens.add({
      targets: t,
      y: y - 26,
      alpha: 0,
      duration: dur(600),
      ease: 'Quad.easeOut',
      onComplete: () => {
        t.setVisible(false).setActive(false);
        this.pool.push(t);
      },
    });
  }
}
