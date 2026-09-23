import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Arquitectura ampliada: el motor (src/core) y los datos (src/data) no
 * importan Phaser ni la capa visual (game/, scenes/, ui/) y no usan fuentes
 * de no determinismo (Math.random, Date.now).
 */

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...tsFiles(full));
    else if (e.endsWith('.ts')) out.push(full);
  }
  return out;
}

const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('arquitectura del motor táctico', () => {
  const files = [...tsFiles('src/core'), ...tsFiles('src/data')];

  it('hay ficheros del motor táctico y de sus datos', () => {
    expect(files.some((f) => f.includes(join('core', 'tactics')))).toBe(true);
    expect(files.some((f) => f.includes(join('data', 'tactico')))).toBe(true);
  });

  for (const file of files) {
    it(`${file}: sin Phaser ni capa visual, sin Math.random ni Date.now`, () => {
      const src = stripComments(readFileSync(file, 'utf8'));
      expect(src).not.toMatch(/from\s+['"]phaser['"]|import\s+['"]phaser['"]/);
      expect(src).not.toMatch(/from\s+['"][^'"]*\/(game|scenes|ui)\/[^'"]*['"]/);
      expect(src).not.toMatch(/Math\.random|Date\.now|performance\.now/);
    });
  }
});
