/**
 * Tipos base del motor de reglas.
 * Este módulo (y todo src/core/) NO importa Phaser: corre en Node puro
 * y se testea con Vitest sin navegador.
 */

import type { RngState } from './rng';

// ---------- Cartas ----------

export type StatusId = 'vulnerable' | 'weak' | 'poison' | 'strength';

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

/**
 * Instancia concreta de una carta dentro de un combate. Dos copias del mismo
 * def son instancias distintas (cada Prototipo lleva SU propio fusible).
 * Los instanceId se generan secuencialmente al crear el combate: deterministas
 * y estables para que la UI pueda seguir a cada carta entre pilas.
 */
export interface CardInstance {
  instanceId: string;
  defId: string;
  /** Solo Prototipos: usos restantes antes de explotar. */
  fuseRemaining?: number;
}

// ---------- Enemigos data-driven ----------

export type EnemyIntentKind = 'attack' | 'defend' | 'buff' | 'debuff' | 'unknown';

/** Efectos atómicos de los movimientos enemigos (espejo reducido de Effect). */
export type EnemyEffect =
  | { kind: 'attack'; amount: number; times?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'applyStatus'; status: StatusId; stacks: number; to: 'self' | 'player' }
  | { kind: 'selfDamage'; amount: number };

export interface EnemyMove {
  id: string;
  /** Nombre mostrado del movimiento; la sátira vive aquí. */
  name: string;
  /** Qué icono de intent telegrafia la UI. */
  intent: EnemyIntentKind;
  effects: EnemyEffect[];
}

export interface EnemyDef {
  id: string;
  name: string;
  /** Rango [min, max]; el hp concreto se elige con el stream rng 'combat'. */
  hp: [number, number];
  moves: EnemyMove[];
  /** 'secuencial': cicla los moves en orden. 'aleatorio': elige con el rng de combate. */
  patron: 'secuencial' | 'aleatorio';
  flavor?: string;
}

/**
 * El próximo movimiento del enemigo, SIEMPRE visible en el estado (regla del
 * GDD: intents no negociables). El daño ya viene modificado por statuses
 * (fuerza/débil del enemigo, vulnerable del jugador) para mostrarse tal cual.
 */
export interface EnemyIntentView {
  moveId: string;
  intent: EnemyIntentKind;
  /** Daño por golpe ya calculado; solo presente si el move ataca. */
  damage?: number;
  times?: number;
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
  /** Índice del próximo movimiento (solo avanza en patrón secuencial). */
  moveIndex: number;
  /** Intent telegrafiado del próximo turno. */
  nextMove: EnemyIntentView;
}

export type CombatPhase = 'player' | 'enemy' | 'victory' | 'defeat';

export interface CombatState {
  player: FighterState;
  enemies: EnemyState[];
  energy: number;
  maxEnergy: number;
  /** Presión de Vapor global 0-10. La mecánica identitaria de caos. */
  pressure: number;
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  /** Contador para generar instanceIds deterministas (nada de Math.random). */
  nextInstanceId: number;
  turn: number;
  phase: CombatPhase;
  /** Stream 'shuffle': barajar y robar. */
  rng: RngState;
  /** Stream 'combat': hp inicial de enemigos y patrón 'aleatorio' de moves. */
  enemyRng: RngState;
}

// ---------- Intents y eventos ----------

/** Lo único que la capa de UI puede enviar al motor. */
export type Intent =
  | { type: 'PLAY_CARD'; handIndex: number; targetSlot?: number; overclock?: boolean }
  | { type: 'END_TURN' };

/**
 * Lo que el motor devuelve tras resolver: la UI los consume en orden
 * con una cola de animaciones. La lógica ya terminó cuando se emiten.
 */
export type GameEvent =
  | { type: 'CardPlayed'; instanceId: string; defId: string; handIndex: number }
  | { type: 'DamageDealt'; targetSlot: number; amount: number; blocked: number }
  | {
      type: 'PlayerDamaged';
      amount: number;
      blocked: number;
      source: 'enemy' | 'self' | 'overload' | 'poison';
    }
  | { type: 'BlockGained'; who: 'player' | number; amount: number }
  | { type: 'CardsDrawn'; instanceIds: string[] }
  | { type: 'DeckReshuffled' }
  | { type: 'StatusApplied'; who: 'player' | number; status: StatusId; stacks: number }
  | { type: 'StatusTicked'; who: 'player' | number; status: StatusId; stacks: number }
  | { type: 'PressureChanged'; from: number; to: number }
  | { type: 'Overload'; damage: number }
  | { type: 'EnemyDied'; slot: number }
  | { type: 'EnemyTurnStarted'; slot: number }
  | { type: 'EnemyIntentChanged'; slot: number; view: EnemyIntentView }
  | { type: 'CardExploded'; instanceId: string; damage: number }
  | { type: 'EnergyChanged'; from: number; to: number }
  | { type: 'HandDiscarded'; instanceIds: string[] }
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

// ---------- Constantes de statuses ----------

/** Débil: infliges -25% de daño. */
export const WEAK_MULTIPLIER = 0.75;
/** Vulnerable: recibes +50% de daño. */
export const VULNERABLE_MULTIPLIER = 1.5;

// ---------- Constantes de Overclock y Prototipos ----------

/** Overclock: la apuesta cuesta +2 de Presión ANTES de resolver. */
export const OVERCLOCK_PRESSURE = 2;
/** Explosión de un Prototipo: coste × 4 de daño al jugador... */
export const FUSE_EXPLOSION_PER_COST = 4;
/** ...con un mínimo de 6 (los prototipos baratos también cobran). */
export const FUSE_EXPLOSION_MIN = 6;
