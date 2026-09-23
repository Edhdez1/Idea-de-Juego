/**
 * Hooks para los E2E (Playwright). Solo se activan con ?test=1:
 * animaciones a duración 0 y window.__game para inspeccionar/despachar.
 *
 *   ?test=1&batalla=<id>   → directo a esa batalla (por defecto prueba_smoke)
 *   &anim=1                → conserva las animaciones (capturas y vídeo)
 */

import type { BattleState, Pos, ReachTile, TacticalIntent } from '../core/tactics';
import { setAnimScale } from './anim';
import { batalla } from './controladores/batalla';

export interface TestApi {
  ready: boolean;
  modo: 'batalla' | 'otro';
  getState(): BattleState;
  dispatch(intent: TacticalIntent): void;
  query: {
    reachable(unitId: string): ReachTile[];
    validTargets(unitId: string, skillId: string): Pos[];
  };
  autoTurn(): void;
  /** Errores de intent inválido mostrados al jugador (para depurar E2E). */
  avisos: string[];
}

declare global {
  interface Window {
    __game?: TestApi;
  }
}

const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();

export const MODO_TEST = params.has('test');

/** Batalla a la que va directo el modo test. */
export const BATALLA_TEST = params.get('batalla') ?? 'prueba_smoke';

/** Semilla fija del modo test (reproducible). */
export const SEMILLA_TEST = Number(params.get('seed') ?? 20260923) | 0;

export function instalarTestHooks(): void {
  if (!MODO_TEST) return;
  if (params.get('anim') !== '1') setAnimScale(0);
  window.__game = {
    ready: false,
    modo: 'otro',
    getState: () => batalla.getState(),
    dispatch: () => {},
    query: {
      reachable: (unitId) => batalla.reachable(unitId),
      validTargets: (unitId, skillId) => batalla.validTargets(unitId, skillId),
    },
    autoTurn: () => {},
    avisos: [],
  };
}

/** La escena de batalla conecta aquí sus despachadores (que además animan). */
export function conectarBatalla(api: { dispatch(intent: TacticalIntent): void; autoTurn(): void }): void {
  if (!MODO_TEST || !window.__game) return;
  window.__game.modo = 'batalla';
  window.__game.dispatch = api.dispatch;
  window.__game.autoTurn = api.autoTurn;
}

export function marcarListo(listo: boolean): void {
  if (!MODO_TEST || !window.__game) return;
  window.__game.ready = listo;
}

export function registrarAviso(msg: string): void {
  if (!MODO_TEST || !window.__game) return;
  window.__game.avisos.push(msg);
}
