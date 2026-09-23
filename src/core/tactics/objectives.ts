/**
 * Objetivos, derrota y disparadores de diálogo. Se evalúan tras cada lote
 * de eventos (cada intent y cada activación del Reloj de Vapor).
 *
 * Prioridad: derrota antes que victoria. Sin unidades del jugador en pie
 * siempre es derrota (aunque la batalla no declare partyWiped).
 * Los objetivos cumplidos se quedan cumplidos (ObjectiveMet una vez);
 * victoria = todos cumplidos y ≥ 1 unidad del jugador en pie.
 */

import { hostile, isDown, posEq, posKey } from './board';
import { emit, type Ctx } from './ctx';
import type { BattleState, DefeatCondition, Objective } from './types';

function playerStanding(s: BattleState): boolean {
  return s.units.some((u) => u.team === 'player' && !isDown(u));
}

function unitGone(s: BattleState, id: string): boolean {
  const u = s.units.find((x) => x.id === id);
  return !u || isDown(u);
}

export function objectiveMet(s: BattleState, o: Objective): boolean {
  switch (o.kind) {
    case 'rout':
      return s.units.filter((u) => hostile('player', u.team)).every(isDown);
    case 'defeat':
      return o.unitIds.every((id) => unitGone(s, id));
    case 'survive':
      return s.beeps >= o.beeps;
    case 'reach':
      return s.units.some((u) => u.team === 'player' && !isDown(u) && o.tiles.some((t) => posEq(t, u.pos)));
    case 'interact':
      return s.interacted.includes(posKey(o.tile));
  }
}

export function defeatMet(s: BattleState, d: DefeatCondition): boolean {
  switch (d.kind) {
    case 'partyWiped':
      return !playerStanding(s);
    case 'unitDown':
      return unitGone(s, d.unitId);
    case 'beepLimit':
      return s.beeps >= d.beeps;
  }
}

function end(ctx: Ctx, result: 'victory' | 'defeat'): void {
  ctx.s.phase = result;
  ctx.s.turn = null;
  ctx.pendingDetonations = [];
  emit(ctx, { type: 'BattleEnded', result });
}

/** Dispara los diálogos pendientes (una vez cada uno). */
export function fireTriggers(ctx: Ctx): void {
  const s = ctx.s;
  s.triggers.forEach((t, i) => {
    if (s.firedTriggers.includes(i)) return;
    let fire = false;
    switch (t.when.kind) {
      case 'start':
        fire = true;
        break;
      case 'beep':
        fire = s.beeps >= t.when.n;
        break;
      case 'hpBelow': {
        const pct = t.when.pct;
        const u = s.units.find((x) => x.id === (t.when as { unitId: string }).unitId);
        fire = !!u && u.hp * 100 < pct * u.maxHp;
        break;
      }
    }
    if (fire) {
      s.firedTriggers.push(i);
      emit(ctx, { type: 'Dialogue', script: t.script });
    }
  });
}

/** Evalúa fin de batalla. Devuelve true si la batalla ha terminado. */
export function evaluate(ctx: Ctx): boolean {
  const s = ctx.s;
  if (s.phase !== 'awaitingPlayer') return true;
  fireTriggers(ctx);
  if (ctx.forcedDefeat || !playerStanding(s) || s.defeat.some((d) => defeatMet(s, d))) {
    end(ctx, 'defeat');
    return true;
  }
  const met = (s.metObjectives ??= []);
  s.objectives.forEach((o, i) => {
    if (!met.includes(i) && objectiveMet(s, o)) {
      met.push(i);
      emit(ctx, { type: 'ObjectiveMet', index: i });
    }
  });
  if (s.objectives.length > 0 && met.length === s.objectives.length) {
    end(ctx, 'victory');
    return true;
  }
  return false;
}
