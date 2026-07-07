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

/**
 * Presentación de cada tipo de nodo: placa de latón con icono pixel propio.
 * (Identidad del juego: se ASCIENDE la pirámide-ciudad por andamios y
 * tuberías, no un mapa flotante — ver fondo bg_mapa_distrito.)
 */
const ESTILO_NODO: Record<TipoNodo, { color: number; icono: string; letra: string }> = {
  combate: { color: 0x51302a, icono: 'icono_combate', letra: 'X' },
  elite: { color: 0x4a3356, icono: 'icono_elite', letra: 'E' },
  taberna: { color: 0x2e4a62, icono: 'icono_taberna', letra: 'T' },
  descanso: { color: 0x6e4a1e, icono: 'icono_descanso', letra: 'D' },
  jefe: { color: 0x8a6a1e, icono: 'icono_jefe', letra: 'J' },
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

    // La pirámide-ciudad de fondo: el mapa ES la subida al distrito
    if (this.textures.exists('bg_mapa_distrito')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_mapa_distrito').setScale(2).setAlpha(0.9);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d0a0c, 0.55);
    }

    // Cornisas de la pirámide: una plataforma por piso del ascenso
    const cornisas = this.add.graphics().setDepth(0);
    const filas = new Set(this.filasDe());
    for (const fila of filas) {
      const y = FILA_Y0 - fila * FILA_ALTO + 16;
      const medio = GAME_WIDTH / 2;
      const ancho = 380 - fila * 28; // la pirámide se estrecha al subir
      cornisas.fillStyle(0x241a20, 0.9).fillRect(medio - ancho / 2, y, ancho, 4);
      cornisas.fillStyle(0x4a3a30, 1).fillRect(medio - ancho / 2, y, ancho, 1);
    }

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

    // Tuberías remachadas entre pisos (identidad steampunk del ascenso)
    const lineas = this.add.graphics().setDepth(1);
    for (const nodo of run.nodos) {
      const desde = this.posicionDe(run.nodos, nodo);
      for (const destinoId of nodo.conexiones) {
        const destino = run.nodos[destinoId];
        if (!destino) continue;
        const hasta = this.posicionDe(run.nodos, destino);
        lineas.lineStyle(4, 0x3a2c26, 1).lineBetween(desde.x, desde.y, hasta.x, hasta.y);
        lineas.lineStyle(2, 0x6e5a42, 1).lineBetween(desde.x, desde.y, hasta.x, hasta.y);
        // remaches a lo largo del tubo
        const largo = Phaser.Math.Distance.Between(desde.x, desde.y, hasta.x, hasta.y);
        const pasos = Math.max(2, Math.floor(largo / 16));
        for (let i = 1; i < pasos; i++) {
          const t = i / pasos;
          lineas.fillStyle(0x8a7350, 1).fillCircle(
            desde.x + (hasta.x - desde.x) * t,
            desde.y + (hasta.y - desde.y) * t,
            1.5,
          );
        }
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
    const radio = nodo.tipo === 'jefe' ? 21 : 16;

    // Placa de latón con el icono pixel del nodo
    const circulo = this.add
      .circle(x, y, radio, estilo.color)
      .setStrokeStyle(2, esActual ? 0xffe08a : alcanzable ? 0xe8c170 : 0x4a3a30)
      .setDepth(2);
    let icono: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
    if (this.textures.exists(estilo.icono)) {
      icono = this.add
        .image(x, y, estilo.icono)
        .setDepth(3)
        .setScale(nodo.tipo === 'jefe' ? 1 : 0.8);
    } else {
      icono = this.add
        .text(x, y, estilo.letra, { fontFamily: 'monospace', fontSize: '12px', color: '#f4e4c1' })
        .setOrigin(0.5)
        .setDepth(3);
    }

    if (nodo.completado) {
      circulo.setAlpha(0.35);
      icono.setAlpha(0.3);
      // sello de "tramitado": una marca de cera sobre lo ya resuelto
      this.add.circle(x + radio - 4, y - radio + 4, 4, 0x8a2a1e).setDepth(4).setAlpha(0.9);
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
        targets: [circulo, icono],
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

  private filasDe(): number[] {
    const run = obtenerRun();
    return run ? run.nodos.map((n) => n.fila) : [];
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
