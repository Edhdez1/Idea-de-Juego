/**
 * Puente único entre el motor táctico y las escenas de batalla.
 * Las escenas NUNCA mutan estado: envían TacticalIntent por aquí y animan los
 * TacticalEvent que devuelve el motor. Este módulo no importa Phaser.
 */

import {
  areaOf,
  autoPlayTurn,
  createBattle,
  dangerZone,
  dispatch,
  forecast,
  predictOrder,
  previewDamage,
  reachable,
  validTargets,
  type AiPlan,
  type BattleDef,
  type BattleState,
  type DamagePreview,
  type Pos,
  type ReachTile,
  type RosterEntry,
  type TacticalEvent,
  type TacticalIntent,
  type TacticsRegistry,
  type TimelineRef,
} from '../../core/tactics';
import { BATTLES, TACTICS_REGISTRY } from '../../data/tactico';

/** Grupo por defecto de cada batalla (hasta que la campaña lo decida). */
const ROSTER_POR_BATALLA: Record<string, string[]> = {
  prueba_smoke: ['ingeniera'],
  prologo_taller: ['ingeniera'],
};

export interface InicioBatalla {
  battleId: string;
  seed: number;
  roster?: RosterEntry[];
  flags?: string[];
}

export class ControladorBatalla {
  readonly registry: TacticsRegistry = TACTICS_REGISTRY;

  /** Aviso de intent inválido (mensaje en español del motor) para la UI. */
  onInvalid: (mensaje: string) => void = () => {};

  private state: BattleState | null = null;
  private inicio: InicioBatalla | null = null;
  private _def: BattleDef | null = null;

  get def(): BattleDef {
    if (!this._def) throw new Error('No hay batalla activa');
    return this._def;
  }

  get activa(): boolean {
    return this.state !== null;
  }

  get datosInicio(): InicioBatalla | null {
    return this.inicio;
  }

  /** Crea la batalla y devuelve los eventos iniciales (prototipos, Goteras, diálogo, primeras activaciones). */
  iniciar(inicio: InicioBatalla): TacticalEvent[] {
    const def = BATTLES[inicio.battleId];
    if (!def) throw new Error(`Batalla desconocida: ${inicio.battleId}`);
    const roster = inicio.roster ?? (ROSTER_POR_BATALLA[def.id] ?? ['ingeniera']).map((defId) => ({ defId }));
    const { state, events } = createBattle(def, { roster, flags: inicio.flags, seed: inicio.seed, registry: this.registry });
    this.inicio = { ...inicio, roster };
    this._def = def;
    this.state = state;
    return events;
  }

  /** Misma batalla, misma semilla, mismo grupo. */
  reintentar(): TacticalEvent[] {
    if (!this.inicio) throw new Error('No hay batalla que reintentar');
    return this.iniciar(this.inicio);
  }

  getState(): BattleState {
    if (!this.state) throw new Error('No hay batalla activa');
    return this.state;
  }

  /** Resuelve el intent al instante; si es inválido avisa por onInvalid y devuelve []. */
  dispatch(intent: TacticalIntent): TacticalEvent[] {
    try {
      const r = dispatch(this.getState(), intent, this.registry);
      this.state = r.state;
      return r.events;
    } catch (e) {
      this.onInvalid(e instanceof Error ? e.message : String(e));
      return [];
    }
  }

  /** Juega el turno del jugador en curso con la IA (botón «Auto» y E2E). */
  autoTurno(): TacticalEvent[] {
    try {
      const r = autoPlayTurn(this.getState(), this.registry);
      this.state = r.state;
      return r.events;
    } catch (e) {
      this.onInvalid(e instanceof Error ? e.message : String(e));
      return [];
    }
  }

  // ---------- Consultas (sin mutar) ----------

  reachable(unitId: string): ReachTile[] {
    return reachable(this.getState(), unitId, this.registry);
  }

  validTargets(unitId: string, skillId: string): Pos[] {
    return validTargets(this.getState(), unitId, skillId, this.registry);
  }

  areaOf(unitId: string, skillId: string, target: Pos): Pos[] {
    return areaOf(this.getState(), unitId, skillId, target, this.registry);
  }

  preview(unitId: string, skillId: string, target: Pos, overclock = false): DamagePreview[] {
    return previewDamage(this.getState(), unitId, skillId, target, this.registry, overclock);
  }

  orden(n = 8): TimelineRef[] {
    return predictOrder(this.getState(), n);
  }

  /** Previsión «si nada cambia» de todas las unidades enemigas vivas. */
  previsionEnemiga(): AiPlan[] {
    const s = this.getState();
    const out: AiPlan[] = [];
    for (const u of s.units) {
      if (u.team !== 'enemy' || u.ko || u.removed) continue;
      try {
        const p = forecast(s, u.id, this.registry);
        if (p) out.push(p);
      } catch {
        // una previsión que falle no rompe la UI
      }
    }
    return out;
  }

  peligro(): Pos[] {
    return dangerZone(this.getState(), 'player', this.registry);
  }
}

/** Instancia única compartida por escenas y test hooks. */
export const batalla = new ControladorBatalla();
