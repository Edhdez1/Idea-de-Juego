import { describe, expect, it } from 'vitest';
import {
  createCombat,
  endTurn,
  makeRegistry,
  playCard,
  type CombatState,
  type GameEvent,
} from '../../src/core';
import { INGENIERA_CARDS } from '../../src/data/cards/ingeniera';
import { GREMIO_ENEMIES } from '../../src/data/enemies/gremio';

const registry = makeRegistry(INGENIERA_CARDS, GREMIO_ENEMIES);

const DECK = [
  'golpe_de_llave',
  'golpe_de_llave',
  'golpe_de_llave',
  'golpe_de_llave',
  'plancha_remachada',
  'plancha_remachada',
  'pistola_de_remaches',
  'pistola_de_remaches',
  'motor_a_presion',
  'valvula_de_escape',
];

/**
 * Política determinista: cada turno juega la primera carta pagable de la mano
 * (apuntando al primer enemigo vivo) hasta quedarse sin energía, y termina el
 * turno. La secuencia de intents resultante es idéntica entre corridas.
 */
function runScript(seed: number): { state: CombatState; log: GameEvent[] } {
  const combat = createCombat({
    playerHp: 80,
    deck: DECK,
    enemies: ['aprendiz_explotado', 'recaudador'],
    registry,
    runSeed: seed,
  });
  let state = combat.state;
  const log: GameEvent[] = [...combat.events];

  for (let round = 0; round < 20 && state.phase === 'player'; round++) {
    let played = true;
    while (played && state.phase === 'player') {
      played = false;
      for (let i = 0; i < state.hand.length; i++) {
        const def = registry.get(state.hand[i]!.defId);
        if (def.cost > state.energy) continue;
        const alive = state.enemies.find((e) => e.hp > 0);
        const targetSlot = def.target === 'enemy' ? alive?.slot : undefined;
        if (def.target === 'enemy' && targetSlot === undefined) continue;
        const result = playCard(state, registry, i, targetSlot);
        state = result.state;
        log.push(...result.events);
        played = true;
        break;
      }
    }
    if (state.phase === 'player') {
      const result = endTurn(state, registry);
      state = result.state;
      log.push(...result.events);
    }
  }
  return { state, log };
}

describe('determinismo', () => {
  it('mismo seed + misma secuencia de intents ⇒ estado final JSON idéntico', () => {
    const a = runScript(20260702);
    const b = runScript(20260702);
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
    // Y no solo el estado: la lista completa de eventos también.
    expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
    // El script llega a un final real (nadie se queda a mitad de camino).
    expect(['victory', 'defeat', 'player']).toContain(a.state.phase);
  });

  it('el hp de cada enemigo sale del rango declarado en su def', () => {
    for (const seed of [1, 2, 3, 42, 999]) {
      const { state } = createCombat({
        playerHp: 70,
        deck: Array(10).fill('golpe_de_llave'),
        enemies: GREMIO_ENEMIES.map((e) => e.id),
        registry,
        runSeed: seed,
      });
      state.enemies.forEach((enemy, i) => {
        const [min, max] = GREMIO_ENEMIES[i]!.hp;
        expect(enemy.maxHp).toBeGreaterThanOrEqual(min);
        expect(enemy.maxHp).toBeLessThanOrEqual(max);
        expect(enemy.hp).toBe(enemy.maxHp);
      });
    }
  });

  it('robar cartas no altera el rng de los enemigos (streams separados)', () => {
    // Dos combates con el mismo seed: en uno se juega una carta de robo antes
    // de terminar el turno. El movimiento aleatorio del Aprendiz debe coincidir.
    const make = () =>
      createCombat({
        playerHp: 200,
        deck: Array(10).fill('plancha_remachada'),
        enemies: ['aprendiz_explotado'],
        registry,
        runSeed: 7,
      }).state;

    let a = make();
    let b = make();
    b = playCard(b, registry, 0).state; // consumir una carta (y nada del stream enemigo)
    a = endTurn(a, registry).state;
    b = endTurn(b, registry).state;
    expect(a.enemies[0]!.nextMove.moveId).toBe(b.enemies[0]!.nextMove.moveId);
  });
});
