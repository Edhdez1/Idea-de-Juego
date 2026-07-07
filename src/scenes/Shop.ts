import Phaser from 'phaser';
import { Rng, deriveSeed, type CardDef, type CardRarity } from '../core';
import { musica, sonar } from '../game/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { guardarRun, obtenerRun, type RunState } from '../game/run';
import { crearUnidad } from '../game/sprites';
import { INGENIERA_CARDS } from '../data/cards/ingeniera';
import { CajaDialogo, cajaEstatica, type LineaDialogo } from '../ui/CajaDialogo';
import { CardSprite } from '../ui/CardSprite';

const COLOR_BRAYAN = '#8ae8b0';
const PRECIO_ELIMINAR = 50;

const PRECIO_POR_RAREZA: Record<CardRarity, number> = {
  starter: 55,
  common: 55,
  uncommon: 65,
  rare: 75,
};

/** Saludos de visitas repetidas (spanglish corporativo, GDD §7). */
const SALUDOS_BRAYAN = [
  '¡Bro, welcome back! Hoy hay ofertas súper disruptivas. O sea... las mismas jarras.',
  '¡Qué onda, bro! ¿Buscas value? Aquí todo es win-win. Sobre todo win mío.',
  '¡Bro! Justo pensaba en ti. En mi época eso se llamaba retargeting.',
];

/**
 * La Taberna del Primo Brayan (GDD §7): campesino que pasó dos semanas
 * en el futuro y volvió «olvidando» su idioma. Vende 3 cartas, elimina
 * una carta del mazo por 50 de oro, y cobra cash only.
 */
export class ShopScene extends Phaser.Scene {
  private oroTxt!: Phaser.GameObjects.Text;
  private avisoTxt!: Phaser.GameObjects.Text;

  constructor() {
    super('Shop');
  }

  create(): void {
    const run = obtenerRun();
    if (!run) {
      this.scene.start('MainMenu');
      return;
    }

    musica(this, 'musica_taberna', { volume: 0.5 });

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1210);
    this.add
      .text(GAME_WIDTH / 2, 12, 'LA TABERNA DE BRAYAN', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e8c170',
      })
      .setOrigin(0.5, 0);
    this.add
      .text(GAME_WIDTH / 2, 32, '(es de su mamá, pero el branding es suyo)', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#a08662',
      })
      .setOrigin(0.5, 0);

    // Brayan detrás de la barra (sprite con fallback de rectángulo)
    crearUnidad(this, 80, 210, 'brayan', 'El Primo Brayan');
    this.add
      .text(80, 218, 'El Primo Brayan', { fontFamily: 'monospace', fontSize: '8px', color: COLOR_BRAYAN })
      .setOrigin(0.5, 0);

    this.oroTxt = this.add
      .text(GAME_WIDTH - 12, 12, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffd27a' })
      .setOrigin(1, 0);
    this.avisoTxt = this.add
      .text(GAME_WIDTH / 2, 230, '', { fontFamily: 'monospace', fontSize: '10px', color: COLOR_BRAYAN })
      .setOrigin(0.5)
      .setDepth(600)
      .setAlpha(0);
    this.refrescarOro(run);

    // Mercancía: 3 cartas aleatorias (rng derivado de la run y el nodo)
    const rng = new Rng(deriveSeed(run.seed, `tienda${run.nodoActual ?? 0}`));
    const pool = INGENIERA_CARDS.filter((c) => c.rarity !== 'starter');
    for (let i = 0; i < 3; i++) {
      this.crearOferta(run, rng.pick(pool), i);
    }

    // Servicio: eliminar una carta del mazo
    const eliminar = this.boton(
      GAME_WIDTH / 2 - 90,
      252,
      `[ ELIMINAR CARTA — ${PRECIO_ELIMINAR} oro ]`,
    );
    eliminar.on('pointerdown', () => {
      sonar(this, 'sfx_click');
      if (run.oro < PRECIO_ELIMINAR) {
        this.sinCash();
        return;
      }
      this.mostrarMazo(run);
    });

    const salir = this.boton(GAME_WIDTH / 2 + 130, 252, '[ SALIR ]');
    salir.on('pointerdown', () => {
      sonar(this, 'sfx_click');
      this.scene.start('Map');
    });

    // Coherencia narrativa: presentación completa la primera vez.
    if (!run.tabernaVista) {
      run.tabernaVista = true;
      guardarRun(run);
      new CajaDialogo(this, [
        {
          nombre: 'Brayan',
          color: COLOR_BRAYAN,
          retrato: 'retrato_brayan',
          texto: '¡Bro! Bienvenida a mi marketplace, digo... taberna. Es de mi mamá, pero el branding es mío.',
        },
        {
          nombre: 'El Narrador',
          color: '#e8c170',
          texto: 'Es de aquí. Todo el reino lo sabe. Pasó dos semanas en el futuro y volvió "olvidando" su idioma.',
        },
        {
          nombre: 'Brayan',
          color: COLOR_BRAYAN,
          retrato: 'retrato_brayan',
          texto: 'Cash only, porque la blockchain del reino todavía es, uhm... ganado.',
        },
      ]);
    } else {
      const saludo: LineaDialogo = {
        nombre: 'Brayan',
        color: COLOR_BRAYAN,
        retrato: 'retrato_brayan',
        texto: rng.pick(SALUDOS_BRAYAN),
      };
      cajaEstatica(this, saludo);
    }
  }

  private boton(x: number, y: number, texto: string): Phaser.GameObjects.Text {
    const btn = this.add
      .text(x, y, texto, { fontFamily: 'monospace', fontSize: '11px', color: '#f4e4c1' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#ffe08a'));
    btn.on('pointerout', () => btn.setColor('#f4e4c1'));
    return btn;
  }

  private crearOferta(run: RunState, def: CardDef, i: number): void {
    const x = GAME_WIDTH / 2 + (i - 1) * 120 + 60;
    const precio = PRECIO_POR_RAREZA[def.rarity];
    const carta = new CardSprite(this, def, { instanceId: `tienda${i}`, defId: def.id }, i);
    carta.fijarBase(x, 140);
    const precioTxt = this.add
      .text(x, 208, `${precio} oro`, { fontFamily: 'monospace', fontSize: '11px', color: '#ffd27a' })
      .setOrigin(0.5);
    carta.on('pointerdown', () => {
      if (run.oro < precio) {
        this.sinCash();
        return;
      }
      run.oro -= precio;
      run.deck.push(def.id);
      guardarRun(run);
      sonar(this, 'sfx_oro');
      this.refrescarOro(run);
      carta.disableInteractive();
      carta.setAlpha(0.35);
      precioTxt.setText('VENDIDA').setColor('#a08662');
      this.avisar('¡Deal cerrado, bro! Cero devoluciones: política de la casa. Y de mi mamá.');
    });
  }

  private mostrarMazo(run: RunState): void {
    const piezas: Phaser.GameObjects.GameObject[] = [];
    const velo = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d0a0c, 0.9)
      .setDepth(700)
      .setInteractive();
    piezas.push(velo);
    piezas.push(
      this.add
        .text(GAME_WIDTH / 2, 24, 'ELIGE LA CARTA A ELIMINAR', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#e8c170',
        })
        .setOrigin(0.5)
        .setDepth(701),
    );
    const cerrar = (): void => {
      for (const p of piezas) p.destroy();
    };

    run.deck.forEach((cartaId, idx) => {
      const col = idx % 4;
      const fila = Math.floor(idx / 4);
      const nombre = INGENIERA_CARDS.find((c) => c.id === cartaId)?.name ?? cartaId;
      const entrada = this.add
        .text(GAME_WIDTH / 2 + (col - 1.5) * 150, 60 + fila * 26, nombre, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#f4e4c1',
          backgroundColor: '#2a2027',
          padding: { x: 4, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(701)
        .setInteractive({ useHandCursor: true });
      entrada.on('pointerover', () => entrada.setColor('#ff8a5c'));
      entrada.on('pointerout', () => entrada.setColor('#f4e4c1'));
      entrada.on('pointerdown', () => {
        run.oro -= PRECIO_ELIMINAR;
        run.deck.splice(idx, 1);
        guardarRun(run);
        sonar(this, 'sfx_oro');
        this.refrescarOro(run);
        cerrar();
        this.avisar('Optimizamos tu deck, bro. Menos es más. Más oro para mí, digo.');
      });
      piezas.push(entrada);
    });

    const cancelar = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 110, '[ CANCELAR ]', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#a08662',
      })
      .setOrigin(0.5)
      .setDepth(701)
      .setInteractive({ useHandCursor: true });
    cancelar.on('pointerdown', () => {
      sonar(this, 'sfx_click');
      cerrar();
    });
    piezas.push(cancelar);
  }

  private sinCash(): void {
    this.avisar('Sin cash no hay deal, bro. Networking sí, gratis.');
  }

  private avisar(mensaje: string): void {
    this.avisoTxt.setText(`Brayan: «${mensaje}»`).setAlpha(1);
    this.tweens.add({ targets: this.avisoTxt, alpha: 0, delay: 2200, duration: 400 });
  }

  private refrescarOro(run: RunState): void {
    this.oroTxt.setText(`ORO ${run.oro}`);
  }
}
