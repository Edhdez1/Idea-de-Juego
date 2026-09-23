/**
 * Movimiento: Dijkstra con coste de terreno y reglas de salto.
 *
 * - Subir: dh ≤ salto (+ jumpBonus del terreno de la casilla de salida).
 * - Bajar: −dh ≤ salto + 2.
 * - Unidades hostiles y prototipos bloquean; aliados se atraviesan pero no
 *   se puede terminar en una casilla ocupada.
 * - Desempates deterministas: menor coste, luego menor índice de casilla;
 *   vecinos en orden +x, +y, −x, −y.
 */

import { hostile, idxOf, inBounds, isDown, NEIGHBORS, posOfIdx } from './board';
import type { BattleState, Pos, ReachTile, TacticsRegistry, UnitState } from './types';

export function computeReach(s: BattleState, r: TacticsRegistry, u: UnitState): ReachTile[] {
  const b = s.board;
  const def = r.unit(u.defId);
  const startIdx = idxOf(b, u.pos);
  const startTile = b.tiles[startIdx]!;
  const jump = def.jump + (r.terrain(startTile.terrain).jumpBonus ?? 0);
  const n = b.tiles.length;

  // Ocupación: 0 libre, 1 aliado (atravesable), 2 bloqueado.
  const occ = new Uint8Array(n);
  for (const o of s.units) {
    if (o.id === u.id || isDown(o) || !inBounds(b, o.pos)) continue;
    occ[idxOf(b, o.pos)] = hostile(u.team, o.team) ? 2 : 1;
  }
  for (const p of s.prototypes) occ[idxOf(b, p.pos)] = 2;

  const dist = new Array<number>(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const done = new Uint8Array(n);
  dist[startIdx] = 0;

  for (;;) {
    let cur = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      if (!done[i] && dist[i]! < best) {
        best = dist[i]!;
        cur = i;
      }
    }
    if (cur < 0) break;
    done[cur] = 1;
    const cp = posOfIdx(b, cur);
    const ch = b.tiles[cur]!.h;
    for (const d of NEIGHBORS) {
      const np = { x: cp.x + d.x, y: cp.y + d.y };
      if (!inBounds(b, np)) continue;
      const ni = idxOf(b, np);
      if (done[ni] || occ[ni] === 2) continue;
      const nt = b.tiles[ni]!;
      const cost = r.terrain(nt.terrain).moveCost;
      if (!Number.isFinite(cost)) continue;
      const dh = nt.h - ch;
      if (dh > jump || -dh > jump + 2) continue;
      const nd = best + cost;
      if (nd > def.move) continue;
      if (nd < dist[ni]!) {
        dist[ni] = nd;
        prev[ni] = cur;
      }
    }
  }

  const out: ReachTile[] = [];
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(dist[i]!)) continue;
    if (i !== startIdx && occ[i] !== 0) continue;
    const path: Pos[] = [];
    for (let k = i; k >= 0; k = prev[k]!) path.unshift(posOfIdx(b, k));
    out.push({ pos: posOfIdx(b, i), cost: dist[i]!, path });
  }
  return out;
}
