/**
 * Tipos base del motor de reglas.
 * Este módulo (y todo src/core/) NO importa Phaser: corre en Node puro
 * y se testea con Vitest sin navegador.
 */

import type { RngState } from './rng';

// ---------- Cartas ----------

export type StatusId = 'vulnerable' | 'weak' | 'poison';

export type CardTarget = 'enemy' | 'self' | 'allEnemies' | 'none';

/**
 * Efectos atómicos componibles. Una carta es una lista de estos;
 * el intérprete único vive en combat/resolve.ts (switch exhaustivo).
 */
export type Effect =
  | { kind: 'damage'; amount: number; times?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'draw'; count: number }
  | { kind: 'applyStatus'; status: StatusId; stacks: number; to: 'target' | 'self' | 'allEnemies' }
  | { kind: 'selfDamage'; amount: number }
  | { kind: 'pressure'; amount: number }
  | { kind: 'ventPressure'; blockPerPressure: number };

export type CardType = 'attack' | 'skill' | 'power' | 'curse';
export type CardRarity = 'starter' | 'common' | 'uncommon' | 'rare';
export type Keyword = 'exhaust' | 'overclock' | 'prototype';

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  rarity: CardRarity;
  target: CardTarget;
  effects: Effect[];
  keywords?: Keyword[];
  /** Solo Prototipos: usos antes de explotar (fusible visible). */
  fuse?: number;
  /** Texto de reglas mostrado en la carta (español primero). */
  description: string;
  /** La voz satírica del juego vive aquí. */
  flavor?: string;
}

// ---------- Estado de combate ----------

export interface FighterState {
  hp: number;
  maxHp: number;
  block: number;
  statuses: Partial<Record<StatusId, number>>;
}

export interface EnemyState extends FighterState {
  /** Índice estable dentro del combate. */
  slot: number;
  defId: string;
  name: string;
}

export type CombatPhase = 'player' | 'enemy' | 'victory' | 'defeat';

export interface CombatState {
  player: FighterState;
  enemies: EnemyState[];
  energy: number;
  maxEnergy: number;
  /** Presión de Vapor global 0-10. La mecánica identitaria de caos. */
  pressure: number;
  hand: string[];
  drawPile: string[];
  discardPile: string[];
  exhaustPile: string[];
  turn: number;
  phase: CombatPhase;
  rng: RngState;
}

// ---------- Intents y eventos ----------

/** Lo único que la capa de UI puede enviar al motor. */
export type Intent =
  | { type: 'PLAY_CARD'; handIndex: number; targetSlot?: number }
  | { type: 'END_TURN' };

/**
 * Lo que el motor devuelve tras resolver: la UI los consume en orden
 * con una cola de animaciones. La lógica ya terminó cuando se emiten.
 */
export type GameEvent =
  | { type: 'CardPlayed'; cardId: string; handIndex: number }
  | { type: 'DamageDealt'; targetSlot: number; amount: number; blocked: number }
  | { type: 'PlayerDamaged'; amount: number; blocked: number; source: 'enemy' | 'self' | 'overload' }
  | { type: 'BlockGained'; who: 'player' | number; amount: number }
  | { type: 'CardsDrawn'; cardIds: string[] }
  | { type: 'DeckReshuffled' }
  | { type: 'StatusApplied'; who: 'player' | number; status: StatusId; stacks: number }
  | { type: 'PressureChanged'; from: number; to: number }
  | { type: 'Overload'; damage: number }
  | { type: 'EnemyDied'; slot: number }
  | { type: 'TurnStarted'; turn: number }
  | { type: 'CombatEnded'; result: 'victory' | 'defeat' };

// ---------- Constantes de la Presión de Vapor ----------

export const PRESSURE_MAX = 10;
/** A partir de aquí "la caldera canta": +25% de daño. */
export const PRESSURE_SWEET_SPOT = 4;
/** Multiplicador de daño dentro del sweet spot. */
export const PRESSURE_DAMAGE_BONUS = 1.25;
/** Daño de la Sobrecarga a TODOS los combatientes (jugador incluido). */
export const OVERLOAD_DAMAGE = 8;
