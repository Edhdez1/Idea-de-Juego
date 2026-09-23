/**
 * Goteras temporales: casillas que cambian de era cada `everyBeeps` pitidos
 * del Coso. Avisan (GoteraWarned) un pitido antes de cambiar.
 *
 * Cada era se materializa con un terreno fijo (ERA_TERRAIN); los datos deben
 * definir esos ids de terreno.
 */

import { tileOf } from './board';
import { emit, type Ctx } from './ctx';
import type { Board, Era, GoteraDef, GoteraState } from './types';

export const ERA_TERRAIN: Record<Era, string> = {
  medieval: 'paja',
  steampunk: 'respiradero',
  futurista: 'antigravedad',
  cyberpunk: 'neon',
};

export function initGoteras(defs: GoteraDef[] | undefined, board: Board): GoteraState[] {
  return (defs ?? []).map((g) => {
    if (g.cycle.length === 0) throw new Error('Gotera sin ciclo de eras');
    if (g.everyBeeps < 1) throw new Error('Gotera con everyBeeps < 1');
    const t = tileOf(board, g.pos);
    if (!t) throw new Error('Gotera fuera del tablero');
    t.terrain = ERA_TERRAIN[g.cycle[0]!];
    return { pos: { ...g.pos }, cycle: g.cycle.slice(), everyBeeps: g.everyBeeps, index: 0 };
  });
}

/** Tras cada pitido: primero los cambios que tocan, luego los avisos del siguiente pitido. */
export function onBeep(ctx: Ctx): void {
  const beeps = ctx.s.beeps;
  for (const g of ctx.s.goteras) {
    if (beeps % g.everyBeeps === 0) {
      const from = g.cycle[g.index]!;
      g.index = (g.index + 1) % g.cycle.length;
      const to = g.cycle[g.index]!;
      const terrain = ERA_TERRAIN[to];
      tileOf(ctx.s.board, g.pos)!.terrain = terrain;
      emit(ctx, { type: 'GoteraShifted', pos: { ...g.pos }, from, to, terrain });
    }
  }
  warnGoteras(ctx);
}

/** Avisa de las Goteras que cambiarán en el próximo pitido. */
export function warnGoteras(ctx: Ctx): void {
  const beeps = ctx.s.beeps;
  for (const g of ctx.s.goteras) {
    if ((beeps + 1) % g.everyBeeps === 0) {
      emit(ctx, { type: 'GoteraWarned', pos: { ...g.pos }, next: g.cycle[(g.index + 1) % g.cycle.length]! });
    }
  }
}
