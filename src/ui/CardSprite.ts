import Phaser from 'phaser';
import type { CardDef, CardInstance } from '../core';

export const CARD_W = 90;
export const CARD_H = 120;

const COLOR_POR_TIPO: Record<string, number> = {
  attack: 0x7a2a1e,
  skill: 0x2e4a62,
  power: 0x5a3a6e,
  curse: 0x3a3a3a,
};

/**
 * Carta visual (contenedor): marco por tipo, coste, nombre, texto de reglas,
 * fusible visible en Prototipos y marca de Overclock.
 */
export class CardSprite extends Phaser.GameObjects.Container {
  readonly def: CardDef;
  readonly inst: CardInstance;
  handIndex: number;

  private marco: Phaser.GameObjects.Rectangle;
  private baseY = 0;

  constructor(scene: Phaser.Scene, def: CardDef, inst: CardInstance, handIndex: number) {
    super(scene, 0, 0);
    this.def = def;
    this.inst = inst;
    this.handIndex = handIndex;

    this.marco = scene.add
      .rectangle(0, 0, CARD_W, CARD_H, COLOR_POR_TIPO[def.type] ?? 0x444444)
      .setStrokeStyle(2, 0xc9a86a);
    this.add(this.marco);

    // Coste en "válvula" superior izquierda
    const coste = scene.add.circle(-CARD_W / 2 + 12, -CARD_H / 2 + 12, 10, 0x1a1017).setStrokeStyle(1, 0xe8c170);
    const costeTxt = scene.add
      .text(-CARD_W / 2 + 12, -CARD_H / 2 + 12, String(def.cost), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#e8c170',
      })
      .setOrigin(0.5);
    this.add([coste, costeTxt]);

    const nombre = scene.add
      .text(6, -CARD_H / 2 + 11, def.name, {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#f4e4c1',
        align: 'center',
        wordWrap: { width: CARD_W - 28 },
      })
      .setOrigin(0.5, 0.5);
    this.add(nombre);

    // Arte propio de la carta (estilo StS: ventana en la mitad superior)
    const arteKey = `card_${def.id}`;
    if (scene.textures.exists(arteKey)) {
      const marcoArte = scene.add
        .rectangle(0, -8, CARD_W - 8, 50, 0x1a1017)
        .setStrokeStyle(1, 0x8a7350);
      const arte = scene.add.image(0, -8, arteKey);
      this.add([marcoArte, arte]);
    }

    const descripcion = scene.add
      .text(0, 38, def.description, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#d8c8a8',
        align: 'center',
        wordWrap: { width: CARD_W - 10 },
      })
      .setOrigin(0.5, 0.5);
    this.add(descripcion);

    if (inst.fuseRemaining !== undefined) {
      const mecha = scene.add
        .text(-CARD_W / 2 + 6, CARD_H / 2 - 14, `FUSIBLE ${inst.fuseRemaining}`, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: inst.fuseRemaining <= 1 ? '#ff5a3c' : '#ffb347',
        })
        .setOrigin(0, 0.5);
      this.add(mecha);
    }

    if (def.keywords?.includes('overclock')) {
      const oc = scene.add
        .text(CARD_W / 2 - 6, CARD_H / 2 - 14, 'OC', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#e8c170',
        })
        .setOrigin(1, 0.5);
      this.add(oc);
    }

    this.setSize(CARD_W, CARD_H);
    this.setInteractive({ useHandCursor: true });
    scene.add.existing(this);
  }

  fijarBase(x: number, y: number): void {
    this.baseY = y;
    this.setPosition(x, y);
  }

  setSeleccionada(on: boolean): void {
    this.y = on ? this.baseY - 56 : this.baseY;
    this.marco.setStrokeStyle(2, on ? 0xffe08a : 0xc9a86a);
    this.setDepth(on ? 100 : this.handIndex);
  }

  /** Atenúa la carta cuando no hay energía suficiente. */
  setJugable(on: boolean): void {
    this.setAlpha(on ? 1 : 0.55);
  }
}
