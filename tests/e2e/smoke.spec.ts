import { expect, test } from '@playwright/test';
import type { Pos } from '../../src/core/tactics';
import { vigilarErrores } from './util';

/**
 * Smoke E2E de la batalla táctica: el juego carga directo en prueba_smoke,
 * la Ingeniera se mueve junto al Aprendiz, le pega con su ataque básico,
 * espera, y el Reloj de Vapor devuelve el turno al jugador (o la batalla
 * termina). Ningún error de consola ni excepción de página.
 */
test('mover, atacar y esperar sin errores', async ({ page }) => {
  const errores = vigilarErrores(page);

  await page.goto('/?test=1&batalla=prueba_smoke');
  await page.waitForFunction(() => window.__game?.ready === true && window.__game.modo === 'batalla');

  const inicio = await page.evaluate(() => {
    const s = window.__game!.getState();
    const yo = s.units.find((u) => u.id === s.turn?.unitId)!;
    const enemigo = s.units.find((u) => u.team === 'enemy' && !u.ko)!;
    return { yo: yo.id, enemigo: enemigo.id, enemigoPos: enemigo.pos, hp: enemigo.hp };
  });
  expect(inicio.yo).toBe('ingeniera');

  // MOVE: a una casilla alcanzable pegada al enemigo
  const destino = await page.evaluate(
    ({ yo, e }) =>
      window.__game!.query
        .reachable(yo)
        .map((t) => t.pos)
        .find((p) => Math.abs(p.x - e.x) + Math.abs(p.y - e.y) === 1) ?? null,
    { yo: inicio.yo, e: inicio.enemigoPos },
  );
  expect(destino).not.toBeNull();
  await page.evaluate((to: Pos) => window.__game!.dispatch({ type: 'MOVE', to }), destino!);
  await page.waitForFunction(
    (to: Pos) => {
      const s = window.__game!.getState();
      const u = s.units.find((x) => x.id === 'ingeniera')!;
      return u.pos.x === to.x && u.pos.y === to.y;
    },
    destino!,
  );

  // ACT: ataque básico sobre el enemigo
  const objetivo = await page.evaluate(
    ({ yo, e }) => window.__game!.query.validTargets(yo, 'golpe_de_llave').find((p) => p.x === e.x && p.y === e.y) ?? null,
    { yo: inicio.yo, e: inicio.enemigoPos },
  );
  expect(objetivo).not.toBeNull();
  await page.evaluate((target: Pos) => window.__game!.dispatch({ type: 'ACT', skillId: 'golpe_de_llave', target }), objetivo!);
  await page.waitForFunction(
    ({ id, hp }) => {
      const e = window.__game!.getState().units.find((u) => u.id === id)!;
      return e.hp < hp || e.ko;
    },
    { id: inicio.enemigo, hp: inicio.hp },
  );

  // WAIT: el turno vuelve al jugador (o la batalla termina)
  await page.evaluate(() => window.__game!.dispatch({ type: 'WAIT', facing: 'SE' }));
  await page.waitForFunction(() => {
    const s = window.__game!.getState();
    return (s.phase === 'awaitingPlayer' && s.turn?.unitId === 'ingeniera' && !s.turn.moved && !s.turn.acted) || s.phase !== 'awaitingPlayer';
  });
  // La escena terminó de animar y vuelve a aceptar órdenes
  await page.waitForFunction(() => window.__game!.ready === true);

  expect(await page.evaluate(() => window.__game!.avisos)).toEqual([]);
  expect(errores).toEqual([]);
});
