# Roadmap — Vaporcracia (título provisional)

Objetivo del primer hito: **vertical slice** — 1 personaje (la Ingeniera), 1 acto, divertido de punta a punta en 20-30 min.

## Fase 0 — Scaffolding ✅ (esta rama)
- Investigación consolidada (`docs/investigacion/`), GDD y roadmap.
- Proyecto Vite + TypeScript estricto + Phaser 4 + Vitest + ESLint (regla: prohibido importar `phaser` bajo `src/core/`).
- Primer código del core: RNG splitmix32 con streams, tipos base, primeras cartas de la Ingeniera con tests en verde.
- Escenas Boot/Preload/MainMenu placeholder que arrancan sin errores. CI (typecheck + tests + build).

## Fase 1 — Motor de combate completo (core puro + tests)
- Máquina de estados de turno, energía, robar/descartar/rebarajar con RNG seedeado.
- Intérprete de efectos completo; statuses con hooks (Vulnerable, Débil, Veneno).
- **Presión de Vapor** (bonus 4-7, aviso 8-9, Sobrecarga a 10), **Prototipos** (fusible), **Overclock**.
- Enemigos con intents visibles e IA por patrón; victoria/derrota.
- Suite Vitest exhaustiva + test de determinismo (seed + intents ⇒ estado idéntico).

## Fase 2 — Combate jugable en pantalla
- Escena Combat + HUD overlay; mano en abanico; input tap-tap con targeting.
- Cola de animación de `GameEvent[]` (input nunca bloqueado por reglas).
- Juice básico: tint-flash, knockback, screen shake, partículas de vapor/chispas, números de daño flotantes (pooled), manómetro de Presión.
- Placeholders de arte; hook `window.__game` para tests.

## Fase 3 — Loop de run completo
- Mapa de nodos procedural (random walks sin cruces) + escena Map.
- Recompensas (1 de 3), tienda, hoguera, eventos "?", reliquias.
- Save/load en localStorage (`game:run` / `game:meta`) con versionado y export/import.
- **Narrador v1**: sistema de barks data-driven sobre GameEvents (cooldowns, pesos, memoria) con banco inicial de ~30 líneas en 3 niveles (burla diegética / meta-juego / cuarta pared).

## Fase 4 — Arte de producción con IA
- Paleta bloqueada (Resurrect 64 + sub-paletas) y pipeline Pillow de cuantización.
- PixelLab: Ingeniera 96×96 + 8 enemigos + jefe del Gremio (idle/attack/death); retoque Aseprite.
- Higgsfield: splash de la Ingeniera (selección de personaje), iconos de carta, fondo de combate, viñetas de eventos.
- Marcos de carta pixel (tipo + rareza), fuentes bitmap (m6x11 + monogram), atlas con free-tex-packer-core.

## Fase 5 — Contenido y balance del vertical slice
- 30-35 cartas, 10-12 reliquias, 4-6 eventos satíricos, élite + jefe con diálogo (líneas de jefe, niveles 1-3).
- Balance por playtesting (simulaciones headless del core + partidas reales).

## Fase 6 — Pulido y deploy
- Coreografía completa de la carta explosiva; juice fino; audio (sfxr; ElevenLabs/Suno en fase posterior).
- Smoke test Playwright en CI (falla ante errores de consola).
- Deploy a Vercel con link público jugable.

## Post-slice (MVP público → futuro)
- 50-60 cartas, 2 actos, 2 jefes, meta-progresión ligera (6-8 desbloqueos) + 3 Ascensiones.
- Segundo personaje (el Barón del Humo) **solo tras validar el primero**.
- Más adelante: daily runs (seed por fecha), Ruleta de Engranajes, Contrabando, narrador con voz, itch.io/Steam Next Fest.
