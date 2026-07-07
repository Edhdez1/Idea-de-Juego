/**
 * Motor de combate (Fase 1): instancias de carta, máquina de turnos completa,
 * enemigos data-driven con intents siempre visibles, statuses con hooks,
 * Prototipos (fusible) y Overclock.
 *
 * Patrón: los intents entran, el estado se resuelve al instante y se
 * devuelve (nuevo estado, lista de GameEvent) para que la UI anime después.
 */

import { Rng, deriveSeed } from '../rng';
import { computeAttackDamage, decayStatuses, tickTurnStart } from './statuses';
import {
  FUSE_EXPLOSION_MIN,
  FUSE_EXPLOSION_PER_COST,
  OVERCLOCK_PRESSURE,
  OVERLOAD_DAMAGE,
  PRESSURE_DAMAGE_BONUS,
  PRESSURE_MAX,
  PRESSURE_SWEET_SPOT,
  type CardDef,
  type CardInstance,
  type CombatState,
  type Effect,
  type EnemyDef,
  type EnemyEffect,
  type EnemyIntentView,
  type EnemyMove,
  type EnemyState,
  type FighterState,
  type GameEvent,
} from '../types';

// ---------- Registry de contenido (cartas + enemigos) ----------

export interface Registry {
  get(id: string): CardDef;
  getEnemy(id: string): EnemyDef;
}

/** Registro simple sobre arrays de defs (los datos viven en src/data/). */
export function makeRegistry(
  cards: readonly CardDef[],
  enemies: readonly EnemyDef[] = [],
): Registry {
  const cardsById = new Map(cards.map((d) => [d.id, d]));
  const enemiesById = new Map(enemies.map((d) => [d.id, d]));
  return {
    get(id: string): CardDef {
      const def = cardsById.get(id);
      if (!def) throw new Error(`Carta desconocida: ${id}`);
      return def;
    },
    getEnemy(id: string): EnemyDef {
      const def = enemiesById.get(id);
      if (!def) throw new Error(`Enemigo desconocido: ${id}`);
      return def;
    },
  };
}

const STARTING_HAND_SIZE = 5;
const STARTING_ENERGY = 3;

// ---------- Creación de combate ----------

export function createCombat(opts: {
  playerHp: number;
  /** Vida máxima del héroe; por defecto igual a playerHp (combate suelto). */
  playerMaxHp?: number;
  deck: readonly string[];
  /** Ids de EnemyDef; el hp concreto se elige con el stream rng 'combat'. */
  enemies: readonly string[];
  registry: Registry;
  runSeed: number;
}): { state: CombatState; events: GameEvent[] } {
  const shuffleRng = new Rng(deriveSeed(opts.runSeed, 'shuffle'));
  const enemyRng = new Rng(deriveSeed(opts.runSeed, 'combat'));

  // Instancias con ids secuenciales: deterministas (nada de Math.random)
  // y estables para que la UI siga cada carta entre pilas.
  let nextInstanceId = 1;
  const instances = opts.deck.map((defId): CardInstance => {
    const def = opts.registry.get(defId);
    const instance: CardInstance = { instanceId: `c${nextInstanceId++}`, defId };
    if (def.fuse !== undefined) instance.fuseRemaining = def.fuse;
    return instance;
  });

  const state: CombatState = {
    player: { hp: opts.playerHp, maxHp: opts.playerMaxHp ?? opts.playerHp, block: 0, statuses: {} },
    enemies: [],
    energy: STARTING_ENERGY,
    maxEnergy: STARTING_ENERGY,
    pressure: 0,
    hand: [],
    drawPile: shuffleRng.shuffle(instances),
    discardPile: [],
    exhaustPile: [],
    nextInstanceId,
    turn: 1,
    phase: 'player',
    rng: shuffleRng.state,
    enemyRng: enemyRng.state,
  };

  const events: GameEvent[] = [{ type: 'TurnStarted', turn: 1 }];
  opts.enemies.forEach((defId, slot) => {
    const def = opts.registry.getEnemy(defId);
    const [min, max] = def.hp;
    const hp = min + enemyRng.int(max - min + 1);
    const enemy: EnemyState = {
      slot,
      defId,
      name: def.name,
      hp,
      maxHp: hp,
      block: 0,
      statuses: {},
      moveIndex: 0,
      nextMove: { moveId: '', intent: 'unknown' },
    };
    state.enemies.push(enemy);
    events.push(...chooseNextMove(state, enemy, def, enemyRng));
  });
  state.enemyRng = enemyRng.state;

  events.push(...draw(state, STARTING_HAND_SIZE));
  return { state, events };
}

// ---------- Intents enemigos (siempre visibles) ----------

/** Calcula la vista telegrafiada: daño ya modificado por statuses actuales. */
function computeIntentView(
  move: EnemyMove,
  enemy: EnemyState,
  player: FighterState,
): EnemyIntentView {
  const view: EnemyIntentView = { moveId: move.id, intent: move.intent };
  const attack = move.effects.find(
    (e): e is Extract<EnemyEffect, { kind: 'attack' }> => e.kind === 'attack',
  );
  if (attack) {
    view.damage = computeAttackDamage({ base: attack.amount, attacker: enemy, target: player });
    if (attack.times !== undefined) view.times = attack.times;
  }
  return view;
}

/** Elige (y telegrafia) el próximo movimiento según el patrón del enemigo. */
function chooseNextMove(
  state: CombatState,
  enemy: EnemyState,
  def: EnemyDef,
  rng: Rng,
): GameEvent[] {
  let move: EnemyMove;
  if (def.patron === 'secuencial') {
    move = def.moves[enemy.moveIndex % def.moves.length]!;
    enemy.moveIndex = (enemy.moveIndex + 1) % def.moves.length;
  } else {
    move = rng.pick(def.moves);
  }
  enemy.nextMove = computeIntentView(move, enemy, state.player);
  return [{ type: 'EnemyIntentChanged', slot: enemy.slot, view: enemy.nextMove }];
}

/**
 * Recalcula los números de los intents visibles (p.ej. el jugador aplicó
 * Débil al enemigo o quedó Vulnerable). Solo emite evento si algo cambió.
 */
function refreshEnemyIntents(state: CombatState, registry: Registry): GameEvent[] {
  const events: GameEvent[] = [];
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    const def = registry.getEnemy(enemy.defId);
    const move = def.moves.find((m) => m.id === enemy.nextMove.moveId);
    if (!move) continue;
    const view = computeIntentView(move, enemy, state.player);
    const prev = enemy.nextMove;
    if (view.damage !== prev.damage || view.times !== prev.times || view.intent !== prev.intent) {
      enemy.nextMove = view;
      events.push({ type: 'EnemyIntentChanged', slot: enemy.slot, view });
    }
  }
  return events;
}

// ---------- Utilidades de daño y presión ----------

/** Roba `count` cartas, rebarajando el descarte si hace falta. Muta `state`. */
function draw(state: CombatState, count: number): GameEvent[] {
  const events: GameEvent[] = [];
  const rng = new Rng(state.rng);
  const drawn: CardInstance[] = [];
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
  if (drawn.length > 0) {
    events.push({ type: 'CardsDrawn', instanceIds: drawn.map((c) => c.instanceId) });
  }
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

// ---------- Efectos de cartas ----------

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
        // Pipeline: base + fuerza → ×presión → ×débil → ×vulnerable → floor.
        const amount = computeAttackDamage({
          base: effect.amount,
          attacker: state.player,
          target,
          pressureMult: pressureMultiplier(state.pressure),
        });
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

/** Overclock: dobla los efectos numéricos (daño, bloqueo, robo, stacks). */
function doubleEffect(effect: Effect): Effect {
  switch (effect.kind) {
    case 'damage':
      return { ...effect, amount: effect.amount * 2 };
    case 'block':
      return { ...effect, amount: effect.amount * 2 };
    case 'draw':
      return { ...effect, count: effect.count * 2 };
    case 'applyStatus':
      return { ...effect, stacks: effect.stacks * 2 };
    default:
      // pressure, selfDamage y ventPressure no se doblan: el precio es el precio.
      return effect;
  }
}

function checkCombatEnd(state: CombatState, events: GameEvent[]): void {
  if (state.phase === 'victory' || state.phase === 'defeat') return;
  if (state.player.hp <= 0) {
    state.phase = 'defeat';
    events.push({ type: 'CombatEnded', result: 'defeat' });
  } else if (state.enemies.every((e) => e.hp <= 0)) {
    state.phase = 'victory';
    events.push({ type: 'CombatEnded', result: 'victory' });
  }
}

// ---------- Intent: PLAY_CARD ----------

export function playCard(
  state: CombatState,
  registry: Registry,
  handIndex: number,
  targetSlot?: number,
  overclock = false,
): { state: CombatState; events: GameEvent[] } {
  if (state.phase !== 'player') {
    throw new Error(`No se puede jugar una carta en fase '${state.phase}'`);
  }
  const instance = state.hand[handIndex];
  if (instance === undefined) {
    throw new Error(`Índice de mano inválido: ${handIndex}`);
  }
  const def = registry.get(instance.defId);
  if (def.cost > state.energy) {
    throw new Error(`Energía insuficiente para ${def.name} (cuesta ${def.cost})`);
  }
  if (overclock && !def.keywords?.includes('overclock')) {
    throw new Error(`${def.name} no admite Overclock`);
  }
  if (def.target === 'enemy') {
    const target = targetSlot !== undefined ? state.enemies[targetSlot] : undefined;
    if (!target || target.hp <= 0) {
      throw new Error(`${def.name} necesita un objetivo vivo`);
    }
  }

  const next = structuredClone(state);
  const events: GameEvent[] = [
    { type: 'CardPlayed', instanceId: instance.instanceId, defId: instance.defId, handIndex },
  ];

  const energyBefore = next.energy;
  next.energy -= def.cost;
  if (next.energy !== energyBefore) {
    events.push({ type: 'EnergyChanged', from: energyBefore, to: next.energy });
  }

  const played = next.hand.splice(handIndex, 1)[0]!;

  // Overclock: la apuesta se paga ANTES de resolver (+2 Presión, efectos doblados).
  let effects = def.effects;
  if (overclock) {
    events.push(...gainPressure(next, OVERCLOCK_PRESSURE));
    checkCombatEnd(next, events); // la Sobrecarga pudo terminar el combate
    effects = def.effects.map(doubleEffect);
  }

  for (const effect of effects) {
    if (next.phase !== 'player') break;
    events.push(...resolveEffect(next, effect, targetSlot));
    checkCombatEnd(next, events);
  }

  // Destino de la instancia: fusible (posible explosión), exhaust o descarte.
  if (played.fuseRemaining !== undefined) {
    played.fuseRemaining -= 1;
    if (played.fuseRemaining <= 0) {
      // El Prototipo EXPLOTA: daño al jugador y a la pila de agotadas.
      next.exhaustPile.push(played);
      const damage = Math.max(FUSE_EXPLOSION_MIN, def.cost * FUSE_EXPLOSION_PER_COST);
      events.push({ type: 'CardExploded', instanceId: played.instanceId, damage });
      if (next.phase === 'player') {
        const { blocked } = damageFighter(next.player, damage);
        events.push({ type: 'PlayerDamaged', amount: damage, blocked, source: 'self' });
        checkCombatEnd(next, events);
      }
    } else {
      next.discardPile.push(played);
    }
  } else if (def.keywords?.includes('exhaust')) {
    next.exhaustPile.push(played);
  } else {
    next.discardPile.push(played);
  }

  // Los statuses pudieron cambiar los números de los intents telegrafiados.
  if (next.phase === 'player') {
    events.push(...refreshEnemyIntents(next, registry));
  }

  return { state: next, events };
}

// ---------- Intent: END_TURN (máquina de turnos) ----------

/** Resuelve un efecto de movimiento enemigo. Muta `state`. */
function resolveEnemyEffect(
  state: CombatState,
  enemy: EnemyState,
  effect: EnemyEffect,
): GameEvent[] {
  const events: GameEvent[] = [];
  switch (effect.kind) {
    case 'attack': {
      const times = effect.times ?? 1;
      for (let i = 0; i < times && state.player.hp > 0; i++) {
        // Mismo pipeline que el jugador, sin presión: los enemigos no tienen caldera.
        const amount = computeAttackDamage({
          base: effect.amount,
          attacker: enemy,
          target: state.player,
        });
        const { blocked } = damageFighter(state.player, amount);
        events.push({ type: 'PlayerDamaged', amount, blocked, source: 'enemy' });
      }
      break;
    }
    case 'block': {
      enemy.block += effect.amount;
      events.push({ type: 'BlockGained', who: enemy.slot, amount: effect.amount });
      break;
    }
    case 'applyStatus': {
      const target = effect.to === 'self' ? enemy : state.player;
      target.statuses[effect.status] = (target.statuses[effect.status] ?? 0) + effect.stacks;
      events.push({
        type: 'StatusApplied',
        who: effect.to === 'self' ? enemy.slot : 'player',
        status: effect.status,
        stacks: effect.stacks,
      });
      break;
    }
    case 'selfDamage': {
      const { blocked } = damageFighter(enemy, effect.amount);
      events.push({ type: 'DamageDealt', targetSlot: enemy.slot, amount: effect.amount, blocked });
      if (enemy.hp === 0) events.push({ type: 'EnemyDied', slot: enemy.slot });
      break;
    }
    default: {
      const _exhaustive: never = effect;
      void _exhaustive;
    }
  }
  return events;
}

/**
 * Termina el turno del jugador: descarta la mano, resuelve el turno enemigo
 * completo (cada enemigo vivo ejecuta su movimiento telegrafiado) y arranca
 * el turno siguiente (bloqueo a 0, energía al máximo, roba 5).
 */
export function endTurn(
  state: CombatState,
  registry: Registry,
): { state: CombatState; events: GameEvent[] } {
  if (state.phase !== 'player') {
    throw new Error(`No se puede terminar el turno en fase '${state.phase}'`);
  }
  const next = structuredClone(state);
  const events: GameEvent[] = [];

  // 1. Descartar la mano entera (StS-style: nada se guarda entre turnos).
  if (next.hand.length > 0) {
    events.push({ type: 'HandDiscarded', instanceIds: next.hand.map((c) => c.instanceId) });
    next.discardPile.push(...next.hand);
    next.hand = [];
  }

  // 2. Fin del turno del jugador: decaen sus statuses de duración.
  events.push(...decayStatuses(next, 'player'));

  // 3. Turno enemigo: cada enemigo vivo ejecuta su movimiento telegrafiado.
  next.phase = 'enemy';
  const rng = new Rng(next.enemyRng);
  for (const enemy of next.enemies) {
    if (next.phase !== 'enemy') break;
    if (enemy.hp <= 0) continue;
    events.push({ type: 'EnemyTurnStarted', slot: enemy.slot });
    enemy.block = 0; // el bloqueo enemigo caduca al empezar su turno

    // Inicio del turno del dueño: veneno, etc. (puede matarlo antes de actuar).
    events.push(...tickTurnStart(next, enemy.slot));
    if (enemy.hp <= 0) {
      events.push({ type: 'EnemyDied', slot: enemy.slot });
      checkCombatEnd(next, events);
      continue;
    }

    const def = registry.getEnemy(enemy.defId);
    const move = def.moves.find((m) => m.id === enemy.nextMove.moveId);
    if (!move) {
      throw new Error(`Movimiento desconocido '${enemy.nextMove.moveId}' en ${def.id}`);
    }
    for (const effect of move.effects) {
      events.push(...resolveEnemyEffect(next, enemy, effect));
      checkCombatEnd(next, events);
      if (next.phase !== 'enemy') break;
    }
    if (next.phase !== 'enemy') break;

    // Fin del turno del enemigo: decaen sus statuses y telegrafia el siguiente.
    if (enemy.hp > 0) {
      events.push(...decayStatuses(next, enemy.slot));
      events.push(...chooseNextMove(next, enemy, def, rng));
    }
  }
  next.enemyRng = rng.state;
  checkCombatEnd(next, events);

  // 4. Turno siguiente del jugador.
  if (next.phase === 'enemy') {
    next.phase = 'player';
    next.turn += 1;
    events.push({ type: 'TurnStarted', turn: next.turn });
    next.player.block = 0; // el bloqueo caduca al INICIO del turno del jugador (StS)
    const energyBefore = next.energy;
    next.energy = next.maxEnergy;
    if (energyBefore !== next.energy) {
      events.push({ type: 'EnergyChanged', from: energyBefore, to: next.energy });
    }
    // Inicio del turno del jugador: veneno, etc. (puede rematarlo).
    events.push(...tickTurnStart(next, 'player'));
    checkCombatEnd(next, events);
    if (next.phase === 'player') {
      events.push(...draw(next, STARTING_HAND_SIZE));
    }
  }

  return { state: next, events };
}
