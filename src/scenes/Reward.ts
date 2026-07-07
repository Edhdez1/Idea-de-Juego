import Phaser from 'phaser';
import { Rng, deriveSeed, type CardDef } from '../core';
import { sonar } from '../game/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { guardarRun, obtenerRun, type RunState } from '../game/run';
import { INGENIERA_CARDS } from '../data/cards/ingeniera';
import { CajaDialogo } from '../ui/CajaDialogo';
import { CardSprite } from '../ui/CardSprite';

interface RewardInitData {
  nodoId: number;
}

/**
 * Recompensa tras la victoria: elige 1 de 3 cartas (pool no-starter,
 * duplicados permitidos, rng derivado del seed de la run y el nodo)
 * o salta. Después decide el destino: intro parte 2 tras la primera
 * victoria, o de vuelta al mapa.
 */
export class RewardScene extends Phaser.Scene {
  private nodoId = 0;

  constructor() {
    super('Reward');
  }

  init(data: Partial<RewardInitData>): void {
    this.nodoId = data.nodoId ?? 0;
  }

  create(): void {
    const run = obtenerRun();
    if (!run) {
      this.scene.start('MainMenu');
      return;
    }

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x14100f);
    this.add
      .text(GAME_WIDTH / 2, 34, 'BOTÍN DEL COMBATE', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e8c170',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 56, 'elige una carta (o sigue con lo puesto)', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#a08662',
      })
      .setOrigin(0.5);

    const rng = new Rng(deriveSeed(run.seed, `reward${this.nodoId}`));
    const pool = INGENIERA_CARDS.filter((c) => c.rarity !== 'starter');
    const ofertas: CardDef[] = [rng.pick(pool), rng.pick(pool), rng.pick(pool)];

    ofertas.forEach((def, i) => {
      const inst = { instanceId: `botin${i}`, defId: def.id };
      const carta = new CardSprite(this, def, inst, i);
      carta.fijarBase(GAME_WIDTH / 2 + (i - 1) * 120, 150);
      carta.on('pointerdown', () => this.elegir(run, def.id));
    });

    const saltar = this.add
      .text(GAME_WIDTH / 2, 236, '[ SALTAR ]', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#a08662',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    saltar.on('pointerover', () => saltar.setColor('#e8c170'));
    saltar.on('pointerout', () => saltar.setColor('#a08662'));
    saltar.on('pointerdown', () => {
      sonar(this, 'sfx_click');
      this.continuar(run);
    });

    // Coherencia narrativa: contexto del Narrador al presentar la pantalla.
    new CajaDialogo(this, [
      {
        nombre: 'El Narrador',
        color: '#e8c170',
        texto: 'El Gremio suelta papeles al perder. Algunos, milagrosamente, hasta sirven.',
      },
    ]);
  }

  private elegir(run: RunState, cartaId: string): void {
    sonar(this, 'sfx_carta');
    run.deck.push(cartaId);
    this.continuar(run);
  }

  private continuar(run: RunState): void {
    if (!run.primeraVictoria) {
      run.primeraVictoria = true;
      if (!run.intro2Vista) {
        run.intro2Vista = true;
        guardarRun(run);
        this.scene.start('Intro', { parte: 2, luego: { escena: 'Map' } });
        return;
      }
    }
    guardarRun(run);
    this.scene.start('Map');
  }
}
