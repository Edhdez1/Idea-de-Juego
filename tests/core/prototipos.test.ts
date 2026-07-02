import { describe, expect, it } from 'vitest';
import {
  createCombat,
  makeRegistry,
  playCard,
  type CardInstance,
  type CombatState,
  type EnemyDef,
} from '../../src/core';
import { INGENIERA_CARDS } from '../../src/data/cards/ingeniera';

const DUMMY: EnemyDef = {
  id: 'dummy',
  name: 'Recaudador de Prueba',
  hp: [200, 200],
  patron: 'secuencial',
  moves: [{ id: 'espera', name: 'Espera Burocrática', intent: 'unknown', effects: [] }],
};

const registry = makeRegistry(INGENIERA_CARDS, [DUMMY]);

function setup(deck: string[]): CombatState {
  const { state } = createCombat({ playerHp: 70, deck, enemies: ['dummy'], registry, runSeed: 1 });
  return state;
}

/** Simula volver a robar una instancia concreta desde el descarte. */
function backToHand(state: CombatState, instanceId: string): CombatState {
  const card = state.discardPile.find((c) => c.instanceId === instanceId);
  if (!card) throw new Error(`${instanceId} no está en el descarte`);
  return {
    ...state,
    energy: 3,
    hand: [...state.hand, card],
    discardPile: state.discardPile.filter((c) => c.instanceId !== instanceId),
  };
}

function findInstance(state: CombatState, instanceId: string): CardInstance | undefined {
  return [...state.hand, ...state.drawPile, ...state.discardPile, ...state.exhaustPile].find(
    (c) => c.instanceId === instanceId,
  );
}

describe('Prototipos: el fusible visible', () => {
  it('el fusible se decrementa con cada uso y la carta explota al tercero', () => {
    const s0 = setup(Array(5).fill('prototipo_inestable'));
    const target = s0.hand[0]!;
    expect(target.fuseRemaining).toBe(3);

    // Uso 1: va al descarte con el fusible gastado.
    let s = playCard(s0, registry, 0, 0).state;
    expect(findInstance(s, target.instanceId)!.fuseRemaining).toBe(2);
    expect(s.discardPile.some((c) => c.instanceId === target.instanceId)).toBe(true);

    // Uso 2.
    s = backToHand(s, target.instanceId);
    s = playCard(s, registry, s.hand.length - 1, 0).state;
    expect(findInstance(s, target.instanceId)!.fuseRemaining).toBe(1);

    // Uso 3: EXPLOTA — daño al jugador (coste 1 × 4, mínimo 6) y a exhaust.
    s = backToHand(s, target.instanceId);
    const { state: after, events } = playCard(s, registry, s.hand.length - 1, 0);
    expect(events).toContainEqual({
      type: 'CardExploded',
      instanceId: target.instanceId,
      damage: 6,
    });
    expect(events).toContainEqual({ type: 'PlayerDamaged', amount: 6, blocked: 0, source: 'self' });
    expect(after.player.hp).toBe(70 - 6);
    expect(after.exhaustPile.map((c) => c.instanceId)).toContain(target.instanceId);
    expect(after.discardPile.some((c) => c.instanceId === target.instanceId)).toBe(false);
    expect(after.exhaustPile.find((c) => c.instanceId === target.instanceId)!.fuseRemaining).toBe(0);
  });

  it('cada instancia lleva SU propio fusible: las otras copias no explotan', () => {
    const s0 = setup(Array(5).fill('prototipo_inestable'));
    const target = s0.hand[0]!;
    let s = playCard(s0, registry, 0, 0).state;
    s = backToHand(s, target.instanceId);
    s = playCard(s, registry, s.hand.length - 1, 0).state;
    s = backToHand(s, target.instanceId);
    s = playCard(s, registry, s.hand.length - 1, 0).state; // explotó
    // Las copias que siguen en mano conservan el fusible intacto.
    for (const card of s.hand) {
      expect(card.fuseRemaining).toBe(3);
    }
    expect(s.exhaustPile).toHaveLength(1);
  });

  it('los efectos del Prototipo se resuelven aunque sea su último uso', () => {
    const s0 = setup(Array(5).fill('prototipo_inestable'));
    const target = s0.hand[0]!;
    let s = playCard(s0, registry, 0, 0).state;
    s = backToHand(s, target.instanceId);
    s = playCard(s, registry, s.hand.length - 1, 0).state;
    s = backToHand(s, target.instanceId);
    const enemyHpBefore = s.enemies[0]!.hp;
    const pressureBefore = s.pressure;
    const { state: after } = playCard(s, registry, s.hand.length - 1, 0);
    // El daño y la presión de la carta ocurrieron ANTES del boom.
    expect(after.enemies[0]!.hp).toBeLessThan(enemyHpBefore);
    expect(after.pressure).toBeGreaterThan(pressureBefore);
  });
});
