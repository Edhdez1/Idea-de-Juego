import { describe, expect, it } from 'vitest';
import {
  OVERLOAD_DAMAGE,
  createCombat,
  makeRegistry,
  playCard,
  pressureMultiplier,
  type CombatState,
} from '../../src/core';
import { INGENIERA_CARDS } from '../../src/data/cards/ingeniera';

const registry = makeRegistry(INGENIERA_CARDS);

function combatWith(deck: string[], enemyHp = 50): CombatState {
  const { state } = createCombat({
    playerHp: 70,
    deck,
    enemies: [{ defId: 'dummy', name: 'Recaudador de Prueba', hp: enemyHp }],
    runSeed: 1,
  });
  return state;
}

function handIndexOf(state: CombatState, cardId: string): number {
  const i = state.hand.indexOf(cardId);
  if (i === -1) throw new Error(`${cardId} no está en mano: ${state.hand.join(', ')}`);
  return i;
}

describe('createCombat', () => {
  it('roba 5 cartas y arranca con 3 de energía en fase player', () => {
    const state = combatWith(Array(10).fill('golpe_de_llave'));
    expect(state.hand).toHaveLength(5);
    expect(state.drawPile).toHaveLength(5);
    expect(state.energy).toBe(3);
    expect(state.pressure).toBe(0);
    expect(state.phase).toBe('player');
  });

  it('es determinista: mismo seed, mismo orden de robo', () => {
    const deck = ['golpe_de_llave', 'plancha_remachada', 'motor_a_presion', 'valvula_de_escape', 'prototipo_inestable', 'golpe_de_llave'];
    const a = createCombat({ playerHp: 70, deck, enemies: [{ defId: 'd', name: 'X', hp: 10 }], runSeed: 77 });
    const b = createCombat({ playerHp: 70, deck, enemies: [{ defId: 'd', name: 'X', hp: 10 }], runSeed: 77 });
    expect(a.state.hand).toEqual(b.state.hand);
    expect(a.state.drawPile).toEqual(b.state.drawPile);
  });
});

describe('playCard: efectos básicos', () => {
  it('un ataque hace daño y va al descarte', () => {
    const s0 = combatWith(Array(10).fill('golpe_de_llave'));
    const { state, events } = playCard(s0, registry, 0, 0);
    expect(state.enemies[0]!.hp).toBe(44); // 50 - 6
    expect(state.energy).toBe(2);
    expect(state.hand).toHaveLength(4);
    expect(state.discardPile).toContain('golpe_de_llave');
    expect(events.some((e) => e.type === 'DamageDealt')).toBe(true);
    expect(s0.enemies[0]!.hp).toBe(50); // el estado original no se muta
  });

  it('una carta de bloqueo protege del daño', () => {
    const s0 = combatWith(Array(10).fill('plancha_remachada'));
    const { state } = playCard(s0, registry, 0);
    expect(state.player.block).toBe(5);
  });

  it('rechaza jugar sin energía suficiente', () => {
    const s0 = combatWith(Array(10).fill('motor_a_presion')); // cuesta 2
    const s1 = playCard(s0, registry, 0, 0).state;
    expect(s1.energy).toBe(1);
    expect(() => playCard(s1, registry, 0, 0)).toThrow(/Energía insuficiente/);
  });
});

describe('Presión de Vapor', () => {
  it('las cartas con Presión suben el manómetro', () => {
    const s0 = combatWith(Array(10).fill('motor_a_presion'), 200);
    const { state } = playCard(s0, registry, 0, 0);
    expect(state.pressure).toBe(2);
  });

  it('la caldera canta: +25% de daño con presión >= 4', () => {
    expect(pressureMultiplier(0)).toBe(1);
    expect(pressureMultiplier(3)).toBe(1);
    expect(pressureMultiplier(4)).toBe(1.25);
    expect(pressureMultiplier(9)).toBe(1.25);
    // En combate: con presión 4, motor_a_presion (12) hace floor(12*1.25)=15
    const s0 = combatWith(Array(10).fill('motor_a_presion'), 200);
    const s1 = playCard(s0, registry, 0, 0).state; // presión 0→2, daño 12
    const s2 = playCard({ ...s1, energy: 3 }, registry, 0, 0).state; // presión 2→4; el daño se calcula ANTES de subir presión
    expect(s2.enemies[0]!.hp).toBe(200 - 12 - 12);
    // tercera carta: la presión ya está en 4 al calcular el daño
    const s3 = { ...s2, energy: 3 };
    const s4 = playCard(s3, registry, 0, 0).state;
    expect(s4.enemies[0]!.hp).toBe(200 - 12 - 12 - 15);
  });

  it('Sobrecarga a 10: daña a TODOS (jugador incluido) y purga la presión', () => {
    const s0 = combatWith(Array(10).fill('prototipo_inestable'), 200); // presión +3 c/u
    let s = playCard(s0, registry, 0, 0).state; // presión 3
    s = playCard({ ...s, energy: 3 }, registry, 0, 0).state; // presión 6
    s = playCard({ ...s, energy: 3 }, registry, 0, 0).state; // presión 9
    const { state: after, events } = playCard({ ...s, energy: 3 }, registry, 0, 0); // 9+3 → tope 10 → BOOM
    expect(events.some((e) => e.type === 'Overload')).toBe(true);
    expect(after.pressure).toBe(0); // purgada
    expect(after.player.hp).toBe(70 - OVERLOAD_DAMAGE); // la explosión también es tuya
    const enemyDamage = events.filter(
      (e) => e.type === 'DamageDealt' && e.amount === OVERLOAD_DAMAGE,
    );
    expect(enemyDamage).toHaveLength(1); // y del enemigo
  });

  it('Válvula de Escape convierte presión en bloqueo', () => {
    const s0 = combatWith(
      ['motor_a_presion', 'motor_a_presion', 'valvula_de_escape', 'golpe_de_llave', 'plancha_remachada'],
      200,
    );
    const s1 = playCard(s0, registry, handIndexOf(s0, 'motor_a_presion'), 0).state; // presión 2
    const { state } = playCard(s1, registry, handIndexOf(s1, 'valvula_de_escape'));
    expect(state.pressure).toBe(0);
    expect(state.player.block).toBe(4); // 2 presión × 2 bloqueo
  });
});

describe('fin de combate', () => {
  it('matar al último enemigo termina en victoria y bloquea más cartas', () => {
    const s0 = combatWith(Array(10).fill('golpe_de_llave'), 5);
    const { state, events } = playCard(s0, registry, 0, 0);
    expect(state.phase).toBe('victory');
    expect(events.some((e) => e.type === 'CombatEnded' && e.result === 'victory')).toBe(true);
    expect(() => playCard(state, registry, 0, 0)).toThrow(/fase/);
  });
});
