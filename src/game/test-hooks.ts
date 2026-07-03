/**
 * Hooks para el smoke test E2E (Playwright). Solo se activan con ?test=1:
 * animaciones a duración 0 y window.__game para inspeccionar/despachar.
 */

import type { CombatState, Intent } from '../core';
import { setAnimScale } from './anim';
import { controller } from './controller';

interface TestApi {
  ready: boolean;
  getState(): CombatState;
  dispatch(intent: Intent): void;
}

declare global {
  interface Window {
    __game?: TestApi;
  }
}

export const MODO_TEST =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('test');

export function instalarTestHooks(): void {
  if (!MODO_TEST) return;
  setAnimScale(0);
  window.__game = {
    ready: false,
    getState: () => controller.getState(),
    dispatch: () => {},
  };
}

/** La escena de combate conecta aquí su despachador cuando está lista. */
export function conectarEscenaDeCombate(despachar: (intent: Intent) => void): void {
  if (!MODO_TEST || !window.__game) return;
  window.__game.dispatch = despachar;
  window.__game.ready = true;
}
