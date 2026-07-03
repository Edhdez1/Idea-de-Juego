import { defineConfig } from '@playwright/test';
import fs from 'node:fs';

/**
 * En este entorno de desarrollo hay un Chromium preinstalado en
 * /opt/pw-browsers/chromium; en CI se usa el que instala
 * `npx playwright install chromium` (executablePath undefined).
 */
function chromiumLocal(): string | undefined {
  const ruta = '/opt/pw-browsers/chromium';
  if (!fs.existsSync(ruta)) return undefined;
  if (fs.statSync(ruta).isFile()) return ruta;
  for (const candidato of ['chrome-linux/chrome', 'chrome-linux/headless_shell', 'chrome']) {
    const p = `${ruta}/${candidato}`;
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: { executablePath: chromiumLocal() },
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
