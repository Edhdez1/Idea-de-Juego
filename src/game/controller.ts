/**
 * Puente único entre el core y las escenas Phaser.
 * Las escenas NUNCA mutan estado: emiten intents por aquí y animan los
 * GameEvent que el core devuelve. Este módulo tampoco importa Phaser.
 */

import {
  createCombat,
  endTurn,
  makeRegistry,
  playCard,
  type CombatState,
  type GameEvent,
  type Intent,
  type Registry,
} from '../core';
import { INGENIERA_CARDS } from '../data/cards/ingeniera';
import { GREMIO_ENEMIES } from '../data/enemies/gremio';
import { ACTO1_ENCOUNTERS, MAZO_INICIAL_INGENIERA } from '../data/encounters/acto1';

export class GameController {
  readonly registry: Registry = makeRegistry(INGENIERA_CARDS, GREMIO_ENEMIES);

  /** Aviso de jugada inválida (energía insuficiente, etc.) para la UI. */
  onInvalid: (mensaje: string) => void = () => {};

  private state: CombatState | null = null;
  private _seed = 0;

  get seed(): number {
    return this._seed;
  }

  newCombat(encounterId: string, seed: number): GameEvent[] {
    const enc = ACTO1_ENCOUNTERS.find((e) => e.id === encounterId);
    if (!enc) throw new Error(`Encuentro desconocido: ${encounterId}`);
    this._seed = seed;
    const { state, events } = createCombat({
      playerHp: 70,
      deck: MAZO_INICIAL_INGENIERA,
      enemies: enc.enemies,
      registry: this.registry,
      runSeed: seed,
    });
    this.state = state;
    return events;
  }

  getState(): CombatState {
    if (!this.state) throw new Error('No hay combate activo');
    return this.state;
  }

  /** Resuelve el intent al instante; errores de validación van a onInvalid. */
  dispatch(intent: Intent): GameEvent[] {
    const state = this.getState();
    try {
      const result =
        intent.type === 'PLAY_CARD'
          ? playCard(state, this.registry, intent.handIndex, intent.targetSlot, intent.overclock ?? false)
          : endTurn(state, this.registry);
      this.state = result.state;
      return result.events;
    } catch (e) {
      this.onInvalid(e instanceof Error ? e.message : String(e));
      return [];
    }
  }
}

/** Instancia única compartida por escenas y test hooks. */
export const controller = new GameController();
