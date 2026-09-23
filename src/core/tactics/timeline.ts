/**
 * Reloj de Vapor (CTB). Cada entrada suma `speed` de CT por tick; actúa al
 * llegar a CT_READY. Se avanza el mínimo número de ticks k para que alguien
 * esté listo. Desempates: más CT, más velocidad, mechas → reloj → unidades
 * («las mechas van primero»), jugador antes que la IA, id estable.
 */

import { CT_READY, CT_WAIT_BONUS } from '../shared/constants';
import { compareIds } from './board';
import type { BattleState, Team, TimelineEntry, TimelineRef } from './types';

const KIND_RANK: Record<TimelineRef['kind'], number> = { prototype: 0, clock: 1, unit: 2 };

export type TeamOf = (unitId: string) => Team | undefined;

export function teamLookup(s: BattleState): TeamOf {
  const m = new Map(s.units.map((u) => [u.id, u.team]));
  return (id) => m.get(id);
}

export function compareEntries(a: TimelineEntry, b: TimelineEntry, teamOf: TeamOf): number {
  if (a.ct !== b.ct) return b.ct - a.ct;
  if (a.speed !== b.speed) return b.speed - a.speed;
  const ka = KIND_RANK[a.ref.kind];
  const kb = KIND_RANK[b.ref.kind];
  if (ka !== kb) return ka - kb;
  if (a.ref.kind === 'unit' && b.ref.kind === 'unit') {
    const pa = teamOf(a.ref.id) === 'player' ? 0 : 1;
    const pb = teamOf(b.ref.id) === 'player' ? 0 : 1;
    if (pa !== pb) return pa - pb;
  }
  return compareIds(a.ref.id, b.ref.id);
}

/** Avanza el reloj (muta los CT) y devuelve la entrada que actúa ahora. */
export function advanceTimeline(tl: TimelineEntry[], teamOf: TeamOf): TimelineEntry {
  if (tl.length === 0) throw new Error('El Reloj de Vapor está vacío');
  let k = Infinity;
  for (const e of tl) {
    if (e.speed <= 0) continue;
    k = Math.min(k, Math.max(0, Math.ceil((CT_READY - e.ct) / e.speed)));
  }
  if (!Number.isFinite(k)) throw new Error('Nadie en el Reloj de Vapor tiene velocidad');
  if (k > 0) for (const e of tl) e.ct += k * e.speed;
  let best: TimelineEntry | undefined;
  for (const e of tl) {
    if (e.ct < CT_READY) continue;
    if (!best || compareEntries(e, best, teamOf) < 0) best = e;
  }
  return best!;
}

/** CT con el que una unidad termina su turno. */
export function ctAfterTurn(moved: boolean, acted: boolean): number {
  return (moved ? 0 : CT_WAIT_BONUS) + (acted ? 0 : CT_WAIT_BONUS);
}

/**
 * Próximas n activaciones. Supone que el turno en curso termina ya (con sus
 * flags moved/acted) y que los turnos futuros mueven y actúan (CT → 0).
 * Las mechas desaparecen tras su última activación.
 */
export function predictTimeline(s: BattleState, n: number): TimelineRef[] {
  const tl: TimelineEntry[] = s.timeline.map((e) => ({ ref: e.ref, ct: e.ct, speed: e.speed }));
  const teamOf = teamLookup(s);
  const remaining = new Map(s.prototypes.map((p) => [p.id, p.remaining]));
  if (s.turn) {
    const cur = tl.find((e) => e.ref.kind === 'unit' && e.ref.id === s.turn!.unitId);
    if (cur) cur.ct = ctAfterTurn(s.turn.moved, s.turn.acted);
  }
  const out: TimelineRef[] = [];
  while (out.length < n && tl.length > 0) {
    const e = advanceTimeline(tl, teamOf);
    out.push(e.ref);
    e.ct = 0;
    if (e.ref.kind === 'prototype') {
      const left = (remaining.get(e.ref.id) ?? 1) - 1;
      remaining.set(e.ref.id, left);
      if (left <= 0) tl.splice(tl.indexOf(e), 1);
    }
  }
  return out;
}
