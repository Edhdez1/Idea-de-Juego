import { describe, expect, it } from 'vitest';
import {
  createCombat,
  endTurn,
  makeRegistry,
  playCard,
  type CombatState,
} from '../../src/core';
import { INGENIERA_CARDS } from '../../src/data/cards/ingeniera';
import { GREMIO_ENEMIES } from '../../src/data/enemies/gremio';

const registry = makeRegistry(INGENIERA_CARDS, GREMIO_ENEMIES);

function combatVs(
  enemies: string[],
  opts: { playerHp?: number; deck?: string[]; seed?: number } = {},
): CombatState {
  const { state } = createCombat({
    playerHp: opts.playerHp ?? 70,
    deck: opts.deck ?? Array(10).fill('golpe_de_llave'),
    enemies,
    registry,
    runSeed: opts.seed ?? 1,
  });
  return state;
}

describe('máquina de turnos', () => {
  it('turno completo: jugar cartas → endTurn → el enemigo actúa según su intent → turno nuevo', () => {
    let s = combatVs(['recaudador']);
    const enemyMaxHp = s.enemies[0]!.maxHp;
    // El intent inicial es SIEMPRE visible: Embargo Preventivo, 8 de daño.
    expect(s.enemies[0]!.nextMove).toMatchObject({
      moveId: 'embargo_preventivo',
      intent: 'attack',
      damage: 8,
    });

    // Tres golpes de llave (1 de energía cada uno).
    s = playCard(s, registry, 0, 0).state;
    s = playCard(s, registry, 0, 0).state;
    s = playCard(s, registry, 0, 0).state;
    expect(s.energy).toBe(0);
    expect(s.enemies[0]!.hp).toBe(enemyMaxHp - 18);

    const { state, events } = endTurn(s, registry);
    // El enemigo ejecutó exactamente lo que telegrafiaba.
    expect(events).toContainEqual({ type: 'EnemyTurnStarted', slot: 0 });
    expect(events).toContainEqual({ type: 'PlayerDamaged', amount: 8, blocked: 0, source: 'enemy' });
    expect(state.player.hp).toBe(62);
    // Y telegrafió el siguiente movimiento (alterna a su buff de fuerza).
    expect(state.enemies[0]!.nextMove).toMatchObject({ moveId: 'interes_compuesto', intent: 'buff' });
    expect(events.some((e) => e.type === 'EnemyIntentChanged')).toBe(true);
    // Vuelve a ser turno del jugador: 5 cartas, energía llena, mano descartada.
    expect(state.phase).toBe('player');
    expect(state.turn).toBe(2);
    expect(state.energy).toBe(3);
    expect(state.hand).toHaveLength(5);
    expect(events.some((e) => e.type === 'HandDiscarded')).toBe(true);
    expect(events).toContainEqual({ type: 'TurnStarted', turn: 2 });
    expect(events).toContainEqual({ type: 'EnergyChanged', from: 0, to: 3 });
    // El estado original no se mutó.
    expect(s.phase).toBe('player');
    expect(s.turn).toBe(1);
  });

  it('el buff de fuerza del Recaudador se refleja en el intent visible', () => {
    let s = combatVs(['recaudador']);
    s = endTurn(s, registry).state; // turno 1: ataca 8
    expect(s.player.hp).toBe(62);
    const { state, events } = endTurn(s, registry); // turno 2: Interés Compuesto (+2 fuerza)
    expect(state.enemies[0]!.statuses.strength).toBe(2);
    // El intent del próximo ataque YA muestra el daño modificado: 8 + 2 = 10.
    expect(state.enemies[0]!.nextMove).toMatchObject({ moveId: 'embargo_preventivo', damage: 10 });
    expect(
      events.some((e) => e.type === 'EnemyIntentChanged' && e.view.damage === 10),
    ).toBe(true);
    // Y en el turno 3 pega exactamente eso.
    const s3 = endTurn(state, registry).state;
    expect(s3.player.hp).toBe(62 - 10);
  });

  it('el Gólem de Latón sigue su patrón secuencial y se autodaña al tercer turno', () => {
    let s = combatVs(['golem_laton_defectuoso']);
    const maxHp = s.enemies[0]!.maxHp;
    expect(s.enemies[0]!.nextMove.moveId).toBe('prensazo_certificado');

    s = endTurn(s, registry).state; // prensazo: 12
    expect(s.player.hp).toBe(58);
    expect(s.enemies[0]!.nextMove.moveId).toBe('remache_a_traicion');

    s = endTurn(s, registry).state; // remache: 10
    expect(s.player.hp).toBe(48);
    expect(s.enemies[0]!.nextMove.moveId).toBe('control_de_calidad_pendiente');
    expect(s.enemies[0]!.nextMove.intent).toBe('unknown');

    const { state, events } = endTurn(s, registry); // control de calidad: se autodaña 6
    expect(state.player.hp).toBe(48); // a ti no te toca
    expect(state.enemies[0]!.hp).toBe(maxHp - 6);
    expect(events).toContainEqual({ type: 'DamageDealt', targetSlot: 0, amount: 6, blocked: 0 });
    expect(state.enemies[0]!.nextMove.moveId).toBe('prensazo_certificado'); // el ciclo reinicia
  });

  it('el Aprendiz Explotado (patrón aleatorio) elige moves con el rng de combate', () => {
    let s = combatVs(['aprendiz_explotado'], { playerHp: 999 });
    const seen = new Set<string>([s.enemies[0]!.nextMove.moveId]);
    for (let i = 0; i < 15; i++) {
      s = endTurn(s, registry).state;
      seen.add(s.enemies[0]!.nextMove.moveId);
    }
    // Con 16 muestras salen ambos movimientos (determinista para este seed).
    expect(seen).toEqual(new Set(['horas_extra', 'colapso_por_agotamiento']));
    // El colapso lo autodañó en algún momento: el caos también es de ellos.
    expect(s.enemies[0]!.hp).toBeLessThan(s.enemies[0]!.maxHp);
  });

  it('el bloqueo absorbe el daño enemigo', () => {
    let s = combatVs(['recaudador'], { deck: Array(10).fill('plancha_remachada') });
    s = playCard(s, registry, 0).state; // +5 de bloqueo
    const { state, events } = endTurn(s, registry); // embargo: 8
    expect(events).toContainEqual({ type: 'PlayerDamaged', amount: 8, blocked: 5, source: 'enemy' });
    expect(state.player.hp).toBe(67); // 70 - (8 - 5)
  });

  it('el bloqueo del jugador se resetea a 0 al INICIO de su turno', () => {
    let s = combatVs(['recaudador'], { deck: Array(10).fill('plancha_remachada') });
    s = endTurn(s, registry).state; // turno 1: ataca; turno 2 telegrafiado = buff
    s = playCard(s, registry, 0).state;
    s = playCard(s, registry, 0).state; // 10 de bloqueo
    expect(s.player.block).toBe(10);
    const after = endTurn(s, registry).state; // el enemigo solo se buffea
    expect(after.player.block).toBe(0); // el bloqueo no sobrevive al turno
  });

  it('varios enemigos actúan en orden de slot y solo los vivos', () => {
    let s = combatVs(['aprendiz_explotado', 'recaudador'], { playerHp: 200 });
    // Matamos al aprendiz (hp 16-20) con 4 golpes en dos turnos.
    while (s.enemies[0]!.hp > 0) {
      while (s.energy > 0 && s.enemies[0]!.hp > 0) {
        s = playCard(s, registry, 0, 0).state;
      }
      if (s.enemies[0]!.hp > 0) s = endTurn(s, registry).state;
    }
    expect(s.phase).toBe('player');
    const { events } = endTurn(s, registry);
    const started = events.filter((e) => e.type === 'EnemyTurnStarted').map((e) => e.slot);
    expect(started).toEqual([1]); // el muerto no actúa
  });

  it('derrota: el jugador muere por daño enemigo → phase defeat y CombatEnded', () => {
    const s = combatVs(['recaudador'], { playerHp: 5 }); // embargo pega 8
    const { state, events } = endTurn(s, registry);
    expect(state.phase).toBe('defeat');
    expect(state.player.hp).toBe(0);
    expect(events).toContainEqual({ type: 'CombatEnded', result: 'defeat' });
    expect(events.filter((e) => e.type === 'CombatEnded')).toHaveLength(1);
    // Tras la derrota NO arranca turno nuevo ni se roba.
    expect(events.some((e) => e.type === 'TurnStarted')).toBe(false);
    expect(state.hand).toHaveLength(0);
    // Y los intents fuera de fase lanzan error.
    expect(() => endTurn(state, registry)).toThrow(/fase/);
    expect(() => playCard(state, registry, 0, 0)).toThrow(/fase/);
  });
});
