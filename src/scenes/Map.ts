import Phaser from 'phaser';
import { deriveSeed } from '../core';
import { sonar } from '../game/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import {
  guardarRun,
  nodosAlcanzables,
  obtenerRun,
  type NodoMapa,
  type TipoNodo,
} from '../game/run';
import { CajaDialogo } from '../ui/CajaDialogo';

/** Presentación de cada tipo de nodo: forma simple + etiqueta legible. */
const ESTILO_NODO: Record<TipoNodo, { color: number; simbolo: string; etiqueta: string }> = {
  combate: { color: 0x7a2a1e, simbolo: 'X', etiqueta: 'espadas' },
  elite: { color: 0x5a3a6e, simbolo: '☠', etiqueta: 'calavera' },
  taberna: { color: 0x2e4a62, simbolo: 'U', etiqueta: 'jarra' },
  descanso: { color: 0x8a5a1e, simbolo: '∆', etiqueta: 'fogata' },
  jefe: { color: 0x9a7a1e, simbolo: '♛', etiqueta: 'corona' },
};

const FILA_Y0 = 312;
const FILA_ALTO = 44;

/**
 * Mapa de nodos del Acto 1 (pathing visible de antemano, GDD §2).
 * La escena NO decide reglas: lee la run, dibuja, y al elegir nodo lanza
 * la escena que toca. Las mutaciones de la run pasan por src/game/run.ts.
 */
export class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
  }

  create(): void {
    const run = obtenerRun();
    if (!run) {
      this.scene.start('MainMenu');
      return;
    }

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x14100f);

    // HUD del mapa
    const estilo = { fontFamily: 'monospace', fontSize: '11px', color: '#e8c170' };
    this.add
      .text(GAME_WIDTH / 2, 10, 'ACTO 1 — el distrito del Gremio', {
        ...estilo,
        fontSize: '13px',
      })
      .setOrigin(0.5, 0);
    this.add.text(12, 8, `HP ${run.hpActual}/${run.hpMax}`, { ...estilo, color: '#ff8a5c' });
    this.add
      .text(GAME_WIDTH - 12, 8, `ORO ${run.oro}`, { ...estilo, color: '#ffd27a' })
      .setOrigin(1, 0);

    const alcanzables = new Set(nodosAlcanzables(run));

    // Caminos entre filas (debajo de los nodos)
    const lineas = this.add.graphics().setDepth(1);
    lineas.lineStyle(2, 0x4a3a30, 1);
    for (const nodo of run.nodos) {
      const desde = this.posicionDe(run.nodos, nodo);
      for (const destinoId of nodo.conexiones) {
        const destino = run.nodos[destinoId];
        if (!destino) continue;
        const hasta = this.posicionDe(run.nodos, destino);
        lineas.lineBetween(desde.x, desde.y, hasta.x, hasta.y);
      }
    }

    for (const nodo of run.nodos) {
      this.dibujarNodo(run.nodos, nodo, run.nodoActual === nodo.id, alcanzables.has(nodo.id));
    }

    // Coherencia narrativa: el Narrador presenta el distrito la primera vez.
    if (!run.bienvenidaVista) {
      run.bienvenidaVista = true;
      guardarRun(run);
      new CajaDialogo(this, [
        {
          nombre: 'El Narrador',
          color: '#e8c170',
          texto: 'Bienvenida al distrito del Gremio: papeleo armado y calderas con abogados.',
        },
        {
          nombre: 'El Narrador',
          color: '#e8c170',
          texto: 'Sube. El Coso está arriba, y a cada piso las explicaciones empeoran.',
        },
      ]);
    }
  }

  private posicionDe(nodos: NodoMapa[], nodo: NodoMapa): { x: number; y: number } {
    const enFila = nodos.filter((n) => n.fila === nodo.fila).length;
    const x = GAME_WIDTH / 2 + (nodo.columna - (enFila - 1) / 2) * 140;
    const y = FILA_Y0 - nodo.fila * FILA_ALTO;
    return { x, y };
  }

  private dibujarNodo(
    nodos: NodoMapa[],
    nodo: NodoMapa,
    esActual: boolean,
    alcanzable: boolean,
  ): void {
    const { x, y } = this.posicionDe(nodos, nodo);
    const estilo = ESTILO_NODO[nodo.tipo];
    const radio = nodo.tipo === 'jefe' ? 20 : 15;

    const circulo = this.add
      .circle(x, y, radio, estilo.color)
      .setStrokeStyle(2, esActual ? 0xffe08a : alcanzable ? 0xe8c170 : 0x4a3a30)
      .setDepth(2);
    const simbolo = this.add
      .text(x, y, estilo.simbolo, {
        fontFamily: 'monospace',
        fontSize: nodo.tipo === 'jefe' ? '16px' : '12px',
        color: '#f4e4c1',
      })
      .setOrigin(0.5)
      .setDepth(3);
    const etiqueta = this.add
      .text(x, y + radio + 3, estilo.etiqueta, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: alcanzable ? '#e8c170' : '#a08662',
      })
      .setOrigin(0.5, 0)
      .setDepth(3);

    if (nodo.completado) {
      circulo.setAlpha(0.4);
      simbolo.setAlpha(0.4);
      etiqueta.setAlpha(0.4);
    }
    if (esActual) {
      this.tweens.add({
        targets: circulo,
        scale: 1.15,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    if (alcanzable) {
      this.tweens.add({
        targets: [circulo, simbolo],
        alpha: 0.65,
        duration: 450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      circulo.setInteractive({ useHandCursor: true });
      circulo.on('pointerdown', () => this.entrarNodo(nodo));
    }
  }

  private entrarNodo(nodo: NodoMapa): void {
    const run = obtenerRun();
    if (!run) return;
    sonar(this, 'sfx_click');
    run.nodoActual = nodo.id;

    if (nodo.tipo === 'taberna' || nodo.tipo === 'descanso') {
      nodo.completado = true;
      guardarRun(run);
      this.scene.start(nodo.tipo === 'taberna' ? 'Shop' : 'Rest');
      return;
    }

    // combate / élite / jefe: el nodo se completa solo al ganar
    this.scene.start('Combat', {
      encounterId: nodo.encuentroId ?? 'taller_embargado',
      seed: deriveSeed(run.seed, `nodo${nodo.id}`),
    });
  }
}
