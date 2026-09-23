/**
 * API del motor táctico: createBattle y dispatch.
 *
 * - El estado de entrada nunca se muta (structuredClone al entrar).
 * - Intents inválidos lanzan Error con mensaje en español (la UI lo muestra).
 * - WAIT cierra el turno y el motor resuelve IA, mechas y el reloj del Coso
 *   hasta el próximo turno de una unidad del jugador o el fin de la batalla.
 * - createBattle también avanza hasta el primer turno del jugador.
 */

import { COSO_CLOCK_SPEED, MAX_ACTIVATIONS_PER_WAIT } from '../shared/constants';
import { faceNearestHostile, planFor } from './ai';
import { resolveSkill } from './actions';
import {
  buildBoard,
  dirTo,
  inBounds,
  isDown,
  livingUnitAt,
  manhattan,
  mustUnit,
  posEq,
  posKey,
  prototypeAt,
  tileOf,
} from './board';
import { emit, makeCtx, type Ctx } from './ctx';
import { initGoteras, onBeep, warnGoteras } from './goteras';
import { evaluate } from './objectives';
import { computeReach } from './pathfinding';
import { addPressure } from './pressure';
import { placePrototype, tickPrototype } from './prototypes';
import { isValidTarget } from './targeting';
import { advanceTimeline, teamLookup } from './timeline';
import { endUnitTurn, startUnitTurn } from './turn';
import type {
  BattleDef,
  BattleState,
  Dir,
  Pos,
  RosterEntry,
  TacticalEvent,
  TacticalIntent,
  TacticsRegistry,
  UnitState,
} from './types';

/** Presión que purga la válvula al interactuar. */
export const VALVE_RELIEF = 3;

export function createBattle(
  def: BattleDef,
  opts: { roster: RosterEntry[]; flags?: string[]; seed: number; registry: TacticsRegistry },
): { state: BattleState; events: TacticalEvent[] } {
  const r = opts.registry;
  const board = buildBoard(def, r);
  const goteras = initGoteras(def.goteras, board);
  if (opts.roster.length === 0) throw new Error('El grupo está vacío');
  if (opts.roster.length > def.deploy.length) {
    throw new Error(`La batalla ${def.id} solo admite ${def.deploy.length} unidades desplegadas`);
  }

  const units: UnitState[] = [];
  const used = new Set<string>();
  const occupy = (p: Pos, who: string) => {
    const t = tileOf(board, p);
    if (!t) throw new Error(`${who}: posición fuera del tablero (${p.x},${p.y})`);
    if (!Number.isFinite(r.terrain(t.terrain).moveCost)) throw new Error(`${who}: casilla impasable (${p.x},${p.y})`);
    const k = posKey(p);
    if (used.has(k)) throw new Error(`${who}: casilla ocupada (${p.x},${p.y})`);
    used.add(k);
  };
  const idCount = new Map<string, number>();
  const makeId = (defId: string, explicit?: string) => {
    if (explicit) {
      if (units.some((u) => u.id === explicit)) throw new Error(`Id de unidad repetido: ${explicit}`);
      return explicit;
    }
    const n = (idCount.get(defId) ?? 0) + 1;
    idCount.set(defId, n);
    const id = n === 1 ? defId : `${defId}#${n}`;
    return units.some((u) => u.id === id) ? `${defId}#${n}b` : id;
  };

  opts.roster.forEach((entry, i) => {
    const ud = r.unit(entry.defId);
    const pos = def.deploy[i]!;
    occupy(pos, ud.name);
    // Mira hacia el enemigo más cercano (o SE si no hay).
    let facing: Dir = 'SE';
    let best = Infinity;
    for (const o of def.units) {
      if (o.team === 'player' || o.team === 'ally') continue;
      const d = manhattan(pos, o.pos);
      if (d < best) {
        best = d;
        facing = dirTo(pos, o.pos) ?? facing;
      }
    }
    const hp = Math.max(1, Math.min(ud.hp, entry.hp ?? ud.hp));
    const u: UnitState = {
      id: makeId(entry.defId),
      defId: entry.defId,
      team: 'player',
      pos: { ...pos },
      facing,
      hp,
      maxHp: ud.hp,
      block: 0,
      brio: 0,
      statuses: {},
      ko: false,
    };
    units.push(u);
  });
  for (const spec of def.units) {
    const ud = r.unit(spec.defId);
    occupy(spec.pos, ud.name);
    units.push({
      id: makeId(spec.defId, spec.id),
      defId: spec.defId,
      team: spec.team,
      pos: { ...spec.pos },
      facing: spec.facing,
      hp: ud.hp,
      maxHp: ud.hp,
      block: 0,
      brio: 0,
      statuses: {},
      ko: false,
    });
  }

  const s: BattleState = {
    id: def.id,
    board,
    units,
    prototypes: [],
    goteras,
    timeline: [],
    turn: null,
    pressure: 0,
    beeps: 0,
    activations: 0,
    phase: 'awaitingPlayer',
    objectives: structuredClone(def.objectives),
    defeat: structuredClone(def.defeat),
    triggers: structuredClone(def.triggers ?? []),
    firedTriggers: [],
    metObjectives: [],
    interacted: [],
    campaignFlags: [...(opts.flags ?? [])],
    rng: opts.seed | 0,
    nextId: 1,
  };
  for (const u of s.units) s.timeline.push({ ref: { kind: 'unit', id: u.id }, ct: 0, speed: r.unit(u.defId).speed });
  s.timeline.push({ ref: { kind: 'clock', id: 'coso' }, ct: 0, speed: COSO_CLOCK_SPEED });

  const ctx = makeCtx(s, r);
  for (const p of def.prototypes ?? []) {
    occupy(p.pos, r.prototype(p.defId).name);
    placePrototype(ctx, p.defId, p.pos, 'battle');
  }
  warnGoteras(ctx);
  evaluate(ctx);
  advance(ctx);
  return { state: s, events: ctx.ev };
}

/** Activa entradas del Reloj de Vapor hasta el turno de una unidad del jugador o el fin. */
function advance(ctx: Ctx): void {
  const s = ctx.s;
  let n = 0;
  while (s.phase === 'awaitingPlayer' && !s.turn) {
    if (++n > MAX_ACTIVATIONS_PER_WAIT) {
      throw new Error('El Reloj de Vapor se ha atascado: demasiadas activaciones sin turno del jugador');
    }
    activateNext(ctx);
    evaluate(ctx);
  }
}

function activateNext(ctx: Ctx): void {
  const s = ctx.s;
  const entry = advanceTimeline(s.timeline, teamLookup(s));
  s.activations++;
  const ref = entry.ref;
  emit(ctx, { type: 'TurnStarted', ref });
  switch (ref.kind) {
    case 'clock':
      entry.ct = 0;
      s.beeps++;
      emit(ctx, { type: 'CosoBeeped', beeps: s.beeps });
      onBeep(ctx);
      return;
    case 'prototype':
      entry.ct = 0;
      tickPrototype(ctx, ref.id);
      return;
    case 'unit': {
      const u = mustUnit(s, ref.id);
      if (!startUnitTurn(ctx, u)) return;
      if (evaluate(ctx)) return;
      if (u.team === 'player') {
        s.turn = { unitId: u.id, moved: false, acted: false, origin: { ...u.pos }, originFacing: u.facing };
        return;
      }
      runAiTurn(ctx, u);
      return;
    }
  }
}

function moveAlong(ctx: Ctx, u: UnitState, path: Pos[]): void {
  const last = path[path.length - 1]!;
  const prev = path[path.length - 2] ?? u.pos;
  u.pos = { ...last };
  emit(ctx, { type: 'UnitMoved', unitId: u.id, path: path.map((p) => ({ ...p })) });
  const d = dirTo(prev, last);
  if (d && d !== u.facing) {
    u.facing = d;
    emit(ctx, { type: 'Faced', unitId: u.id, dir: d });
  }
}

function face(ctx: Ctx, u: UnitState, d: Dir | null): void {
  if (!d || d === u.facing || isDown(u)) return;
  u.facing = d;
  emit(ctx, { type: 'Faced', unitId: u.id, dir: d });
}

function runAiTurn(ctx: Ctx, u: UnitState): void {
  const s = ctx.s;
  const plan = planFor(s, ctx.r, u.id);
  let moved = false;
  let acted = false;
  if (!posEq(plan.moveTo, u.pos)) {
    const dest = computeReach(s, ctx.r, u).find((t) => posEq(t.pos, plan.moveTo));
    if (dest) {
      moveAlong(ctx, u, dest.path);
      moved = true;
    }
  }
  if (plan.skillId && plan.target && !isDown(u) && s.phase === 'awaitingPlayer') {
    const sk = ctx.r.skill(plan.skillId);
    if (sk.cost <= u.brio && isValidTarget(s, ctx.r, u, sk, plan.target)) {
      resolveSkill(ctx, u, sk, plan.target, false);
      acted = true;
    }
  }
  if (!acted) face(ctx, u, faceNearestHostile(s, u));
  endUnitTurn(ctx, u, moved, acted);
}

export function dispatch(
  state: BattleState,
  intent: TacticalIntent,
  registry: TacticsRegistry,
): { state: BattleState; events: TacticalEvent[] } {
  if (state.phase !== 'awaitingPlayer') throw new Error('La batalla ya ha terminado');
  if (!state.turn) throw new Error('No es el turno de ninguna unidad del jugador');
  const s = structuredClone(state);
  const ctx = makeCtx(s, registry);
  const turn = s.turn!;
  const u = mustUnit(s, turn.unitId);

  switch (intent.type) {
    case 'MOVE': {
      if (turn.moved) throw new Error('Esta unidad ya se ha movido este turno');
      if (!inBounds(s.board, intent.to)) throw new Error('Esa casilla está fuera del tablero');
      if (posEq(intent.to, u.pos)) throw new Error('La unidad ya está en esa casilla');
      const dest = computeReach(s, registry, u).find((t) => posEq(t.pos, intent.to));
      if (!dest) throw new Error('No se puede llegar a esa casilla');
      moveAlong(ctx, u, dest.path);
      turn.moved = true;
      break;
    }
    case 'UNDO_MOVE': {
      if (!turn.moved) throw new Error('No hay movimiento que deshacer');
      if (turn.acted) throw new Error('No se puede deshacer el movimiento después de actuar');
      u.pos = { ...turn.origin };
      u.facing = turn.originFacing;
      turn.moved = false;
      emit(ctx, { type: 'MoveUndone', unitId: u.id, to: { ...turn.origin } });
      break;
    }
    case 'ACT': {
      if (turn.acted) throw new Error('Esta unidad ya ha actuado este turno');
      const def = registry.unit(u.defId);
      if (!def.skills.includes(intent.skillId)) throw new Error('Esta unidad no conoce esa habilidad');
      const sk = registry.skill(intent.skillId);
      if (sk.cost > u.brio) throw new Error(`Brío insuficiente: hace falta ${sk.cost} y hay ${u.brio}`);
      if (intent.overclock && !sk.overclock) throw new Error('Esta habilidad no admite Sobremarcha');
      if (!isValidTarget(s, registry, u, sk, intent.target)) throw new Error('Objetivo fuera de alcance o no válido');
      turn.acted = true;
      resolveSkill(ctx, u, sk, intent.target, !!intent.overclock);
      break;
    }
    case 'INTERACT': {
      if (turn.acted) throw new Error('Esta unidad ya ha actuado este turno');
      const t = tileOf(s.board, intent.tile);
      if (!t?.interact) throw new Error('Ahí no hay nada con lo que interactuar');
      if (manhattan(u.pos, intent.tile) > 1) throw new Error('Hay que estar en la casilla o al lado para interactuar');
      if (prototypeAt(s, intent.tile) || (livingUnitAt(s, intent.tile) && !posEq(u.pos, intent.tile))) {
        throw new Error('La casilla está ocupada');
      }
      turn.acted = true;
      const key = posKey(intent.tile);
      if (!s.interacted.includes(key)) s.interacted.push(key);
      emit(ctx, { type: 'Interacted', unitId: u.id, tile: { ...intent.tile }, id: t.interact });
      if (t.interact === 'valvula') addPressure(ctx, -VALVE_RELIEF);
      face(ctx, u, dirTo(u.pos, intent.tile));
      break;
    }
    case 'WAIT': {
      face(ctx, u, intent.facing);
      endUnitTurn(ctx, u, turn.moved, turn.acted);
      s.turn = null;
      break;
    }
    default:
      throw new Error('Intent desconocido');
  }

  evaluate(ctx);
  // Si la unidad del turno cayó durante su propia acción, su turno termina solo.
  if (s.turn && isDown(mustUnit(s, s.turn.unitId))) s.turn = null;
  advance(ctx);
  return { state: s, events: ctx.ev };
}
