import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Regla arquitectónica del proyecto: el motor de reglas (src/core/) y los
 * datos (src/data/) no dependen de Phaser. Corren en Node puro, se testean
 * sin navegador, y permiten cambiar de framework de render sin tocar reglas.
 */

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('reglas de arquitectura', () => {
  for (const layer of ['src/core', 'src/data']) {
    it(`${layer} no importa phaser`, () => {
      const files = collectTsFiles(layer);
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        const source = readFileSync(file, 'utf8');
        expect(source, `${file} importa phaser`).not.toMatch(
          /from\s+['"]phaser['"]|import\s+['"]phaser['"]|require\(['"]phaser['"]\)/,
        );
      }
    });
  }
});
