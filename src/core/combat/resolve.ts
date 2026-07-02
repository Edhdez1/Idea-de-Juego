/**
 * Motor de combate mínimo (Fase 0): crear combate, robar, jugar carta,
 * Presión de Vapor con Sobrecarga. La IA de enemigos, statuses con hooks
 * y la máquina de turnos completa llegan en la Fase 1 (ver docs/ROADMAP.md).
 *
 * Patrón: los intents entran, el estado se resuelve al instante y se
 * devuelve (nuevo estado, lista de GameEvent) para que la UI anime.
 */

import { Rng, deriveSeed } from '../rng';
import {
  OVERLOAD_DAMAGE,
  PRESSURE_DAMAGE_BONUS,
  PRESSURE_MAX,
  PRESSURE_SWEET_SPOT,
  type CardDef,
  type CombatState,
  type Effect,
  type EnemyState,
  type FighterState,
  type GameEvent,
} from '../types';

export interface CardRegistry {
  get(id: string): CardDef;
}

/** Registro simple sobre un array de defs (los datos viven en src/data/). */
export function makeRegistry(defs: readonly CardDef[]): CardRegistry {
  const byId = new Map(defs.map((d) => [d.id, d]));
  return {
    get(id: string): CardDef {
      const def = byId.get(id);
      if (!def) throw new Error(`Carta desconocida: ${id}`);
      return def;
    },
  };
}

export interface EnemySpawn {
  defId: string;
  name: string;
  hp: number;
}

const STARTING_HAND_SIZE = 5;

export function createCombat(opts: {
  playerHp: number;
  deck: readonly string[];
  enemies: readonly EnemySpawn[];
  runSeed: number;
}): { state: CombatState; events: GameEvent[] } {
  const rng = new Rng(deriveSeed(opts.runSeed, 'shuffle'));
  const drawPile = rng.shuffle(opts.deck);
  const state: CombatState = {
    player: { hp: opts.playerHp, maxHp: opts.playerHp, block: 0, statuses: {} },
    enemies: opts.enemies.map(
      (e, slot): EnemyState => ({
        slot,
        defId: e.defId,
        name: e.name,
        hp: e.hp,
        maxHp: e.hp,
        block: 0,
        statuses: {},
      }),
    ),
    energy: 3,
    maxEnergy: 3,
    pressure: 0,
    hand: [],
    drawPile,
    discardPile: [],
    exhaustPile: [],
    turn: 1,
    phase: 'player',
    rng: rng.state,
  };
  const events: GameEvent[] = [{ type: 'TurnStarted', turn: 1 }];
  events.push(...draw(state, STARTING_HAND_SIZE));
  return { state, events };
}

/** Roba `count` cartas, rebarajando el descarte si hace falta. Muta `state`. */
function draw(state: CombatState, count: number): GameEvent[] {
  const events: GameEvent[] = [];
  const rng = new Rng(state.rng);
  const drawn: string[] = [];
  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) break;
      state.drawPile = rng.shuffle(state.discardPile);
      state.discardPile = [];
      events.push({ type: 'DeckReshuffled' });
    }
    const card = state.drawPile.pop();
    if (card === undefined) break;
    state.hand.push(card);
    drawn.push(card);
  }
  state.rng = rng.state;
  if (drawn.length > 0) events.push({ type: 'CardsDrawn', cardIds: drawn });
  return events;
}

function damageFighter(
  target: FighterState,
  amount: number,
): { dealt: number; blocked: number } {
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  const dealt = amount - blocked;
  target.hp = Math.max(0, target.hp - dealt);
  return { dealt, blocked };
}

/** Multiplicador de daño según Presión: "la caldera canta" en el sweet spot. */
export function pressureMultiplier(pressure: number): number {
  return pressure >= PRESSURE_SWEET_SPOT ? PRESSURE_DAMAGE_BONUS : 1;
}

/** Sube la presión; a PRESSURE_MAX estalla la Sobrecarga: daña a TODOS y purga. */
function gainPressure(state: CombatState, amount: number): GameEvent[] {
  const events: GameEvent[] = [];
  const from = state.pressure;
  state.pressure = Math.min(PRESSURE_MAX, state.pressure + amount);
  events.push({ type: 'PressureChanged', from, to: state.pressure });
  if (state.pressure >= PRESSURE_MAX) {
    events.push({ type: 'Overload', damage: OVERLOAD_DAMAGE });
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;
      const { blocked } = damageFighter(enemy, OVERLOAD_DAMAGE);
      events.push({
        type: 'DamageDealt',
        targetSlot: enemy.slot,
        amount: OVERLOAD_DAMAGE,
        blocked,
      });
      if (enemy.hp === 0) events.push({ type: 'EnemyDied', slot: enemy.slot });
    }
    const { blocked } = damageFighter(state.player, OVERLOAD_DAMAGE);
    events.push({
      type: 'PlayerDamaged',
      amount: OVERLOAD_DAMAGE,
      blocked,
      source: 'overload',
    });
    const before = state.pressure;
    state.pressure = 0;
    events.push({ type: 'PressureChanged', from: before, to: 0 });
  }
  return events;
}

function resolveEffect(
  state: CombatState,
  effect: Effect,
  targetSlot: number | undefined,
): GameEvent[] {
  const events: GameEvent[] = [];
  switch (effect.kind) {
    case 'damage': {
      const target = targetSlot !== undefined ? state.enemies[targetSlot] : undefined;
      if (!target || target.hp <= 0) break;
      const times = effect.times ?? 1;
      for (let i = 0; i < times && target.hp > 0; i++) {
        const amount = Math.floor(effect.amount * pressureMultiplier(state.pressure));
        const { blocked } = damageFighter(target, amount);
        events.push({ type: 'DamageDealt', targetSlot: target.slot, amount, blocked });
        if (target.hp === 0) events.push({ type: 'EnemyDied', slot: target.slot });
      }
      break;
    }
    case 'block': {
      state.player.block += effect.amount;
      events.push({ type: 'BlockGained', who: 'player', amount: effect.amount });
      break;
    }
    case 'draw': {
      events.push(...draw(state, effect.count));
      break;
    }
    case 'applyStatus': {
      if (effect.to === 'self') {
        state.player.statuses[effect.status] =
          (state.player.statuses[effect.status] ?? 0) + effect.stacks;
        events.push({
          type: 'StatusApplied',
          who: 'player',
          status: effect.status,
          stacks: effect.stacks,
        });
      } else {
        const targets =
          effect.to === 'allEnemies'
            ? state.enemies.filter((e) => e.hp > 0)
            : targetSlot !== undefined && state.enemies[targetSlot]
              ? [state.enemies[targetSlot]!]
              : [];
        for (const enemy of targets) {
          enemy.statuses[effect.status] = (enemy.statuses[effect.status] ?? 0) + effect.stacks;
          events.push({
            type: 'StatusApplied',
            who: enemy.slot,
            status: effect.status,
            stacks: effect.stacks,
          });
        }
      }
      break;
    }
    case 'selfDamage': {
      const { blocked } = damageFighter(state.player, effect.amount);
      events.push({ type: 'PlayerDamaged', amount: effect.amount, blocked, source: 'self' });
      break;
    }
    case 'pressure': {
      events.push(...gainPressure(state, effect.amount));
      break;
    }
    case 'ventPressure': {
      const vented = state.pressure;
      if (vented > 0) {
        state.pressure = 0;
        events.push({ type: 'PressureChanged', from: vented, to: 0 });
        const block = vented * effect.blockPerPressure;
        state.player.block += block;
        events.push({ type: 'BlockGained', who: 'player', amount: block });
      }
      break;
    }
    default: {
      // Exhaustividad: si se añade un Effect.kind y no se maneja, TS falla aquí.
      const _exhaustive: never = effect;
      void _exhaustive;
    }
  }
  return events;
}

function checkCombatEnd(state: CombatState, events: GameEvent[]): void {
  if (state.player.hp <= 0) {
    state.phase = 'defeat';
    events.push({ type: 'CombatEnded', result: 'defeat' });
  } else if (state.enemies.every((e) => e.hp <= 0)) {
    state.phase = 'victory';
    events.push({ type: 'CombatEnded', result: 'victory' });
  }
}

export function playCard(
  state: CombatState,
  registry: CardRegistry,
  handIndex: number,
  targetSlot?: number,
): { state: CombatState; events: GameEvent[] } {
  if (state.phase !== 'player') {
    throw new Error(`No se puede jugar una carta en fase '${state.phase}'`);
  }
  const cardId = state.hand[handIndex];
  if (cardId === undefined) {
    throw new Error(`Índice de mano inválido: ${handIndex}`);
  }
  const def = registry.get(cardId);
  if (def.cost > state.energy) {
    throw new Error(`Energía insuficiente para ${def.name} (cuesta ${def.cost})`);
  }
  if (def.target === 'enemy') {
    const target = targetSlot !== undefined ? state.enemies[targetSlot] : undefined;
    if (!target || target.hp <= 0) {
      throw new Error(`${def.name} necesita un objetivo vivo`);
    }
  }

  const next = structuredClone(state);
  const events: GameEvent[] = [{ type: 'CardPlayed', cardId, handIndex }];

  next.energy -= def.cost;
  next.hand.splice(handIndex, 1);
  if (def.keywords?.includes('exhaust')) {
    next.exhaustPile.push(cardId);
  } else {
    next.discardPile.push(cardId);
  }

  for (const effect of def.effects) {
    if (next.phase !== 'player') break; // la Sobrecarga pudo terminar el combate
    events.push(...resolveEffect(next, effect, targetSlot));
    checkCombatEnd(next, events);
  }

  return { state: next, events };
}
