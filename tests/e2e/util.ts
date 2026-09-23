import type { Page } from '@playwright/test';
// Trae la declaración global de window.__game (TestApi).
import type {} from '../../src/game/test-hooks';

/** Ruido de assets opcionales (audio, sprites aún no generados): hay fallback silencioso. */
export const esRuidoDeAsset = (texto: string): boolean =>
  texto.includes('Failed to load resource') ||
  texto.includes('Error decoding audio') ||
  texto.includes('Failed to process file') ||
  texto.includes('Unable to decode audio data');

export function vigilarErrores(page: Page): string[] {
  const errores: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !esRuidoDeAsset(msg.text())) errores.push(msg.text());
  });
  page.on('pageerror', (err) => {
    if (!esRuidoDeAsset(String(err))) errores.push(String(err));
  });
  return errores;
}

