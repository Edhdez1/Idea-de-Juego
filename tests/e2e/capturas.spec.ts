import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { vigilarErrores } from './util';

/**
 * Capturas y vídeo para revisión humana (NO corre en CI):
 *   CAPTURAS=1 npx playwright test --grep @capturas
 * Salida en CAPTURAS_DIR (por defecto el scratch de la sesión), nunca en el repo.
 */
const DIR = process.env.CAPTURAS_DIR ?? '/tmp/claude-0/-home-user-Idea-de-Juego/6c8b3c26-4f50-5590-903e-6c05c35cdb83/scratchpad/capturas';

test.use({ viewport: { width: 1280, height: 720 } });

async function listo(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__game?.ready === true && window.__game.modo === 'batalla', null, { timeout: 30_000 });
}

async function foto(page: Page, nombre: string): Promise<void> {
  fs.mkdirSync(DIR, { recursive: true });
  await page.screenshot({ path: path.join(DIR, `${nombre}.png`) });
}

test('capturas de la batalla @capturas', async ({ page }) => {
  test.setTimeout(120_000);
  const errores = vigilarErrores(page);

  // 1) Inicio de B0 con animaciones reales
  await page.goto('/?test=1&anim=1&batalla=prologo_taller');
  await listo(page);
  await page.waitForTimeout(800);
  await foto(page, '01_inicio_b0');

  // 2) Capa de movimiento (menú: «Mover» es la primera entrada)
  await page.keyboard.press('z');
  await page.waitForTimeout(500);
  await foto(page, '02_capa_movimiento');
  await page.keyboard.press('x');

  // 3) Previsión de daño con desglose (prueba_smoke: se pega al Aprendiz)
  await page.goto('/?test=1&anim=1&batalla=prueba_smoke');
  await listo(page);
  const destino = await page.evaluate(() => {
    const g = window.__game!;
    const e = g.getState().units.find((u) => u.team === 'enemy')!.pos;
    return g.query.reachable('ingeniera').map((t) => t.pos).find((p) => Math.abs(p.x - e.x) + Math.abs(p.y - e.y) === 1)!;
  });
  await page.evaluate((to) => window.__game!.dispatch({ type: 'MOVE', to }), destino);
  await listo(page);
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowDown'); // Deshacer → ataque básico
  await page.keyboard.press('z');
  await page.waitForTimeout(500);
  await foto(page, '03_prevision_danio');
  await page.keyboard.press('z'); // confirmar
  await listo(page);
  await page.waitForTimeout(300);
  await foto(page, '04_tras_golpe');

  // 4) Varios turnos en automático para ver el reloj, la Presión y la IA
  for (let i = 0; i < 3; i++) {
    const fin = await page.evaluate(() => window.__game!.getState().phase !== 'awaitingPlayer');
    if (fin) break;
    await page.evaluate(() => window.__game!.autoTurn());
    await listo(page);
  }
  await page.waitForTimeout(400);
  await foto(page, '05_tras_turnos_auto');

  expect(errores).toEqual([]);
});

test('vídeo del ambiente vivo @capturas', async ({ browser }) => {
  test.setTimeout(60_000);
  fs.mkdirSync(DIR, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: DIR, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  await page.goto('/?test=1&anim=1&batalla=prologo_taller');
  await listo(page);
  await page.waitForTimeout(4000);
  // Un turno en automático para que se vea moverse a la Ingeniera y a la IA
  await page.evaluate(() => window.__game!.autoTurn());
  await page.waitForTimeout(3000);
  const video = page.video();
  await ctx.close();
  if (video) {
    const destino = path.join(DIR, 'ambiente_b0.webm');
    await video.saveAs(destino);
    await video.delete();
  }
});
