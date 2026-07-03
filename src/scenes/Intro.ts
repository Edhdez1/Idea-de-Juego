import Phaser from 'phaser';
import { HABLANTES, PANELES_INTRO } from '../data/intro';
import { dur } from '../game/anim';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { MODO_TEST } from '../game/test-hooks';

const CAJA_H = 92;

/**
 * Intro cinemática estilo Darkest Dungeon: paneles ilustrados con paneo
 * lento (Ken Burns), narrador con máquina de escribir y cameos de los
 * cuatro héroes. Click/tap avanza; SALTAR va directo al menú.
 */
export class IntroScene extends Phaser.Scene {
  private panelIdx = 0;
  private lineaIdx = 0;
  private imagen?: Phaser.GameObjects.Image;
  private texto!: Phaser.GameObjects.Text;
  private nombre!: Phaser.GameObjects.Text;
  private retrato?: Phaser.GameObjects.Image;
  private marcoRetrato?: Phaser.GameObjects.Rectangle;
  private indicador!: Phaser.GameObjects.Text;
  private escribiendo?: Phaser.Time.TimerEvent;
  private textoCompleto = '';
  private terminada = false;

  constructor() {
    super('Intro');
  }

  create(): void {
    // El smoke E2E va directo al combate
    if (MODO_TEST) {
      this.scene.start('MainMenu');
      return;
    }
    this.panelIdx = 0;
    this.lineaIdx = 0;
    this.terminada = false;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d0a0c);

    // Caja de diálogo inferior con marco
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - CAJA_H / 2, GAME_WIDTH - 8, CAJA_H - 6, 0x14100f, 0.94)
      .setStrokeStyle(2, 0x8a7350)
      .setDepth(100);
    this.marcoRetrato = this.add
      .rectangle(38, GAME_HEIGHT - CAJA_H / 2, 52, 52, 0x1a1017)
      .setStrokeStyle(2, 0xc9a86a)
      .setDepth(101)
      .setVisible(false);
    this.nombre = this.add
      .text(72, GAME_HEIGHT - CAJA_H + 12, '', { fontFamily: 'monospace', fontSize: '10px', color: '#e8c170' })
      .setDepth(101);
    this.texto = this.add
      .text(72, GAME_HEIGHT - CAJA_H + 28, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#f4e4c1',
        wordWrap: { width: GAME_WIDTH - 100 },
        lineSpacing: 3,
      })
      .setDepth(101);
    this.indicador = this.add
      .text(GAME_WIDTH - 18, GAME_HEIGHT - 14, '»', { fontFamily: 'monospace', fontSize: '14px', color: '#e8c170' })
      .setOrigin(1, 1)
      .setDepth(101)
      .setAlpha(0);
    this.tweens.add({ targets: this.indicador, alpha: 1, duration: dur(400), yoyo: true, repeat: -1 });

    const saltar = this.add
      .text(GAME_WIDTH - 10, 10, '[ SALTAR ]', { fontFamily: 'monospace', fontSize: '10px', color: '#a08662' })
      .setOrigin(1, 0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true });
    saltar.on('pointerdown', () => this.irAlMenu());

    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, sobre: Phaser.GameObjects.GameObject[]) => {
      if (!sobre.includes(saltar)) this.avanzar();
    });
    this.input.keyboard?.on('keydown-SPACE', () => this.avanzar());

    this.mostrarPanel();
  }

  private mostrarPanel(): void {
    const panel = PANELES_INTRO[this.panelIdx];
    if (!panel) {
      this.mostrarTitulo();
      return;
    }

    const anterior = this.imagen;
    if (this.textures.exists(panel.key)) {
      const img = this.add.image(GAME_WIDTH / 2, (GAME_HEIGHT - CAJA_H) / 2, panel.key).setDepth(1);
      const base = Math.max((GAME_WIDTH / img.width) * 1.02, ((GAME_HEIGHT - CAJA_H) / img.height) * 1.02);
      img.setScale(base * panel.zoom.from).setAlpha(0);
      this.tweens.add({ targets: img, alpha: 1, duration: dur(500) });
      this.tweens.add({
        targets: img,
        scale: base * panel.zoom.to,
        duration: dur(9000),
        ease: 'Sine.easeInOut',
      });
      this.imagen = img;
    } else {
      this.imagen = undefined;
    }
    if (anterior) {
      this.tweens.add({ targets: anterior, alpha: 0, duration: dur(500), onComplete: () => anterior.destroy() });
    }

    this.lineaIdx = 0;
    this.mostrarLinea();
  }

  private mostrarLinea(): void {
    const panel = PANELES_INTRO[this.panelIdx];
    const linea = panel?.lineas[this.lineaIdx];
    if (!panel || !linea) return;

    const hablante = HABLANTES[linea.hablante];
    this.nombre.setText(hablante.nombre).setColor(hablante.color);

    const retratoKey = hablante.retrato;
    this.retrato?.destroy();
    this.retrato = undefined;
    if (retratoKey && this.textures.exists(retratoKey)) {
      this.retrato = this.add.image(38, GAME_HEIGHT - CAJA_H / 2, retratoKey).setDepth(102);
      const lado = Math.max(this.retrato.width, this.retrato.height);
      this.retrato.setScale(48 / lado);
      this.marcoRetrato?.setVisible(true);
    } else {
      this.marcoRetrato?.setVisible(false);
    }

    // Máquina de escribir
    this.textoCompleto = linea.texto;
    this.texto.setText('');
    this.escribiendo?.remove();
    let i = 0;
    const paso = dur(22);
    if (paso <= 0) {
      this.texto.setText(this.textoCompleto);
      return;
    }
    this.escribiendo = this.time.addEvent({
      delay: paso,
      repeat: this.textoCompleto.length - 1,
      callback: () => {
        i += 1;
        this.texto.setText(this.textoCompleto.slice(0, i));
      },
    });
  }

  /** Click: completa la línea; si ya está completa, pasa a la siguiente. */
  private avanzar(): void {
    if (this.terminada) {
      this.irAlMenu();
      return;
    }
    if (this.texto.text.length < this.textoCompleto.length) {
      this.escribiendo?.remove();
      this.texto.setText(this.textoCompleto);
      return;
    }
    const panel = PANELES_INTRO[this.panelIdx];
    if (!panel) return;
    this.lineaIdx += 1;
    if (this.lineaIdx < panel.lineas.length) {
      this.mostrarLinea();
    } else {
      this.panelIdx += 1;
      this.mostrarPanel();
    }
  }

  private mostrarTitulo(): void {
    this.terminada = true;
    const velo = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d0a0c, 0)
      .setDepth(200);
    this.tweens.add({ targets: velo, fillAlpha: 1, duration: dur(700) });
    const titulo = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16, 'EL COSO DEL REY', {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: '#e8c170',
      })
      .setOrigin(0.5)
      .setDepth(201)
      .setAlpha(0);
    const sub = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 22, 'fríe sin aceite. técnicamente, un milagro.', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#a08662',
      })
      .setOrigin(0.5)
      .setDepth(201)
      .setAlpha(0);
    this.tweens.add({ targets: [titulo, sub], alpha: 1, duration: dur(900), delay: dur(500) });
    this.time.delayedCall(dur(2600), () => this.irAlMenu());
  }

  private irAlMenu(): void {
    this.escribiendo?.remove();
    this.scene.start('MainMenu');
  }
}
