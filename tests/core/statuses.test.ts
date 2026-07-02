import { describe, expect, it } from 'vitest';
import {
  computeAttackDamage,
  createCombat,
  endTurn,
  makeRegistry,
  playCard,
  type CombatState,
  type EnemyDef,
  type FighterState,
} from '../../src/core';
import { INGENIERA_CARDS } from '../../src/data/cards/ingeniera';
import { GREMIO_ENEMIES, RECAUDADOR } from '../../src/data/enemies/gremio';

/** Enemigo pasivo de prueba: hp fijo, no hace nada en su turno. */
const DUMMY: EnemyDef = {
  id: 'dummy',
  name: 'Recaudador de Prueba',
  hp: [50, 50],
  patron: 'secuencial',
  moves: [{ id: 'espera', name: 'Espera Burocrática', intent: 'unknown', effects: [] }],
};

const registry = makeRegistry(INGENIERA_CARDS, [...GREMIO_ENEMIES, DUMMY]);

function combatVs(enemyId: string, opts: { playerHp?: number; deck?: string[] } = {}): CombatState {
  const { state } = createCombat({
    playerHp: opts.playerHp ?? 70,
    deck: opts.deck ?? Array(10).fill('golpe_de_llave'),
    enemies: [enemyId],
    registry,
    runSeed: 1,
  });
  return state;
}

describe('statuses: modificadores de daño', () => {
  it('vulnerable amplifica el daño recibido (+50%)', () => {
    const s = combatVs('dummy');
    s.enemies[0]!.statuses.vulnerable = 2;
    const { state } = playCard(s, registry, 0, 0); // golpe: 6 → floor(9)
    expect(state.enemies[0]!.hp).toBe(50 - 9);
  });

  it('débil reduce el daño infligido (-25%)', () => {
    const s = combatVs('dummy');
    s.player.statuses.weak = 1;
    const { state } = playCard(s, registry, 0, 0); // 6 × 0.75 = 4.5 → floor 4
    expect(state.enemies[0]!.hp).toBe(50 - 4);
  });

  it('fuerza suma daño plano por stack y no decae', () => {
    const s = combatVs('dummy');
    s.player.statuses.strength = 3;
    const s1 = playCard(s, registry, 0, 0).state; // 6 + 3 = 9
    expect(s1.enemies[0]!.hp).toBe(50 - 9);
    const s2 = endTurn(s1, registry).state;
    expect(s2.player.statuses.strength).toBe(3); // el interés compuesto no perdona
  });

  it('orden del pipeline: base + fuerza → ×presión → ×débil → ×vulnerable → floor', () => {
    const s = combatVs('dummy');
    s.player.statuses.strength = 2;
    s.player.statuses.weak = 1;
    s.enemies[0]!.statuses.vulnerable = 1;
    s.pressure = 4; // la caldera canta
    // (6 + 2) × 1.25 = 10 → × 0.75 = 7.5 → × 1.5 = 11.25 → floor = 11
    const { state } = playCard(s, registry, 0, 0);
    expect(state.enemies[0]!.hp).toBe(50 - 11);
    // Y la función pura da lo mismo:
    const attacker: FighterState = { hp: 1, maxHp: 1, block: 0, statuses: { strength: 2, weak: 1 } };
    const target: FighterState = { hp: 1, maxHp: 1, block: 0, statuses: { vulnerable: 1 } };
    expect(computeAttackDamage({ base: 6, attacker, target, pressureMult: 1.25 })).toBe(11);
  });

  it('débil también reduce el daño de los enemigos', () => {
    const s = combatVs(RECAUDADOR.id);
    s.enemies[0]!.statuses.weak = 2;
    const { state } = endTurn(s, registry); // embargo: 8 × 0.75 = 6
    expect(state.player.hp).toBe(70 - 6);
  });

  it('vulnerable en el jugador amplifica los golpes enemigos', () => {
    const s = combatVs(RECAUDADOR.id);
    s.player.statuses.vulnerable = 2;
    // Al endTurn decae a 1 (fin del turno del jugador) pero sigue activo: 8 × 1.5 = 12.
    const { state } = endTurn(s, registry);
    expect(state.player.hp).toBe(70 - 12);
    expect(state.player.statuses.vulnerable).toBe(1);
  });

  it('el Inquisidor de Patentes aplica Vulnerable y Débil al jugador', () => {
    let s = combatVs('inquisidor_patentes');
    s = endTurn(s, registry).state; // Auditoría Sorpresa: Vulnerable 2
    expect(s.player.statuses.vulnerable).toBe(2);
    s = endTurn(s, registry).state; // Multa Retroactiva: 7 × 1.5 (vulnerable 1 tras decaer) = 10
    expect(s.player.hp).toBe(70 - 10);
    s = endTurn(s, registry).state; // Cese y Desista: 5 de daño + Débil 1
    expect(s.player.hp).toBe(70 - 10 - 5); // vulnerable ya expiró
    expect(s.player.statuses.weak).toBe(1);
    const after = playCard(s, registry, 0, 0).state; // golpe: 6 × 0.75 = 4
    expect(after.enemies[0]!.hp).toBe(after.enemies[0]!.maxHp - 4);
  });
});

describe('statuses: veneno y decaimiento', () => {
  it('el veneno hace tick al inicio del turno del dueño (enemigo) y decae', () => {
    const s = combatVs('dummy');
    s.enemies[0]!.statuses.poison = 3;
    const { state, events } = endTurn(s, registry);
    expect(state.enemies[0]!.hp).toBe(47); // pierde 3 (ignora bloqueo)
    expect(state.enemies[0]!.statuses.poison).toBe(2);
    expect(events).toContainEqual({ type: 'StatusTicked', who: 0, status: 'poison', stacks: 2 });
    expect(events).toContainEqual({ type: 'DamageDealt', targetSlot: 0, amount: 3, blocked: 0 });
  });

  it('el veneno del jugador hace tick al inicio de SU turno', () => {
    const s = combatVs('dummy');
    s.player.statuses.poison = 2;
    const { state, events } = endTurn(s, registry);
    expect(state.player.hp).toBe(68);
    expect(state.player.statuses.poison).toBe(1);
    expect(events).toContainEqual({ type: 'PlayerDamaged', amount: 2, blocked: 0, source: 'poison' });
  });

  it('el veneno puede matar al enemigo antes de que actúe → victoria', () => {
    const s = combatVs('dummy');
    s.enemies[0]!.hp = 2;
    s.enemies[0]!.statuses.poison = 3;
    const { state, events } = endTurn(s, registry);
    expect(state.phase).toBe('victory');
    expect(events).toContainEqual({ type: 'EnemyDied', slot: 0 });
    expect(events).toContainEqual({ type: 'CombatEnded', result: 'victory' });
    expect(events.some((e) => e.type === 'TurnStarted')).toBe(false);
  });

  it('vulnerable y débil decaen al final del turno del dueño; fuerza no', () => {
    const s = combatVs('dummy');
    s.enemies[0]!.statuses.vulnerable = 2;
    s.enemies[0]!.statuses.weak = 1;
    s.enemies[0]!.statuses.strength = 4;
    s.player.statuses.weak = 2;
    const { state, events } = endTurn(s, registry);
    // El jugador decae al terminar su turno.
    expect(state.player.statuses.weak).toBe(1);
    // El enemigo decae al terminar el suyo; a 0 stacks el status desaparece.
    expect(state.enemies[0]!.statuses.vulnerable).toBe(1);
    expect(state.enemies[0]!.statuses.weak).toBeUndefined();
    expect(state.enemies[0]!.statuses.strength).toBe(4);
    expect(events).toContainEqual({ type: 'StatusTicked', who: 0, status: 'weak', stacks: 0 });
  });

  it('aplicar veneno con una carta usa el efecto applyStatus genérico', () => {
    // No hay carta de veneno de la Ingeniera todavía: probamos el efecto directo
    // con una def sintética para cubrir applyStatus → target.
    const venenosa = {
      id: 'prueba_veneno',
      name: 'Vapores Tóxicos de Prueba',
      cost: 1,
      type: 'skill' as const,
      rarity: 'common' as const,
      target: 'enemy' as const,
      effects: [{ kind: 'applyStatus' as const, status: 'poison' as const, stacks: 4, to: 'target' as const }],
      description: 'Aplica 4 de Veneno.',
    };
    const reg = makeRegistry([...INGENIERA_CARDS, venenosa], [DUMMY]);
    const { state: s0 } = createCombat({
      playerHp: 70,
      deck: Array(5).fill('prueba_veneno'),
      enemies: ['dummy'],
      registry: reg,
      runSeed: 1,
    });
    const { state, events } = playCard(s0, reg, 0, 0);
    expect(state.enemies[0]!.statuses.poison).toBe(4);
    expect(events).toContainEqual({ type: 'StatusApplied', who: 0, status: 'poison', stacks: 4 });
  });
});
