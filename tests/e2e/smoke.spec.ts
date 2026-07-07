import { expect, test } from '@playwright/test';
import type { CombatState, Intent } from '../../src/core/types';

declare global {
  interface Window {
    __game?: {
      ready: boolean;
      getState(): CombatState;
      dispatch(intent: Intent): void;
    };
  }
}

/**
 * Smoke E2E: el juego carga, se juega una carta real, el turno enemigo
 * resuelve, y no hay NINGÚN error de consola ni excepción de página.
 */
test('jugar una carta y terminar el turno sin errores', async ({ page }) => {
  const errores: string[] = [];
  // Los assets opcionales (audio, sprites aún no generados) pueden faltar:
  // ni el 404 del navegador ni el fallo de decodificación de un audio
  // ausente son errores del juego — hay fallback silencioso para ambos.
  const esRuidoDeAsset = (texto: string): boolean =>
    texto.includes('Failed to load resource') ||
    texto.includes('Error decoding audio') ||
    texto.includes('Failed to process file') ||
    texto.includes('Unable to decode audio data');
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !esRuidoDeAsset(msg.text())) errores.push(msg.text());
  });
  page.on('pageerror', (err) => {
    if (!esRuidoDeAsset(String(err))) errores.push(String(err));
  });

  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__game?.ready === true);

  // El robo es determinista pero no garantiza un ataque en el índice 0:
  // buscamos la primera carta de ataque en mano.
  const idx = await page.evaluate(() => {
    const ataques = ['golpe_de_llave', 'motor_a_presion', 'pistola_de_remaches'];
    return window.__game!.getState().hand.findIndex((c) => ataques.includes(c.defId));
  });
  expect(idx).toBeGreaterThanOrEqual(0);

  const hpAntes = await page.evaluate(() => window.__game!.getState().enemies[0]!.hp);
  await page.evaluate(
    (i) => window.__game!.dispatch({ type: 'PLAY_CARD', handIndex: i, targetSlot: 0 }),
    idx,
  );
  await page.waitForFunction(
    (hp) => window.__game!.getState().enemies[0]!.hp < hp,
    hpAntes,
  );

  await page.evaluate(() => window.__game!.dispatch({ type: 'END_TURN' }));
  await page.waitForFunction(() => window.__game!.getState().turn === 2);

  // La mano del turno 2 debe estar servida (5 cartas) y ser fase del jugador
  const estado = await page.evaluate(() => {
    const s = window.__game!.getState();
    return { mano: s.hand.length, fase: s.phase, energia: s.energy };
  });
  expect(estado.mano).toBe(5);
  expect(estado.fase).toBe('player');
  expect(estado.energia).toBe(3);

  expect(errores).toEqual([]);
});
