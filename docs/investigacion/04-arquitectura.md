# Investigación 04 — Arquitectura técnica (Phaser + TypeScript + Vite + Vitest, Vercel)

## 0. Phaser 3 vs Phaser 4 (estado en 2026)

**Veredicto: Phaser 4 (npm `phaser@^4.1`).** Phaser 4.0 salió estable a finales de 2025; la 4.1 "Salusa" (abril 2026) es la mayor release de la historia del framework. El propio equipo: "si empiezas un proyecto nuevo, no hay razón para empezar en Phaser 3".
- API casi idéntica a Phaser 3 en lo que usaremos (Scenes, Sprites, Containers, Input, Tweens, BitmapText).
- Nuevo renderer de "render nodes", Filters unificados, `SpriteGPULayer` para partículas masivas.
- Contra: menos tutoriales que 3.x. Mitigación: la superficie de API que tocamos es pequeña; si hay fricción (plugins sin portar), se cae a Phaser 3.87+ **sin cambiar la arquitectura** — el diseño aísla Phaser precisamente para eso.

## 1. Core engine puro TS separado del render

**Veredicto: core headless en `src/core/` sin ningún import de Phaser**, con resolución instantánea de efectos + cola de eventos que la capa Phaser consume para animar.

**Referencia principal: [Slay the Web](https://github.com/oskarrough/slaytheweb)** (motor "UI-agnostic"):
- **Un único objeto de estado inmutable** (jugador, dungeon, pilas, monstruos). "El estado no sabe nada de tu UI".
- **Acciones = funciones puras síncronas** `(state, payload) => newState`, catalogadas.
- **ActionManager con cola** e historial → undo/redo y replay gratis.
- Tests del motor sin tocar la UI.

**Patrón intent → resolve → event queue:**
1. La escena Combat emite **intents** (`{type: 'PLAY_CARD', cardId, targetId}`). Nunca muta estado.
2. El core valida (state machine de turno) y **resuelve instantáneamente** todos los efectos, incluidas cascadas, produciendo `(newState, GameEvent[])` — p. ej. `[CardPlayed, DamageDealt{12}, StatusApplied{vulnerable,2}, EnemyDied]`.
3. La escena consume la lista con una **cola secuencial de animaciones** (patrón "Event Queue" de *Game Programming Patterns*): la lógica nunca espera a las animaciones, las animaciones nunca calculan reglas. En Vitest: 1.000 combates/segundo; en Playwright: animaciones a duración 0.
4. **State machine de turno explícita**: `PlayerTurn → EnemyTurnResolving → PlayerTurn → ... → CombatEnded`. El core rechaza intents fuera de fase.

**Regla verificable en CI**: lint/test que falla si algo bajo `src/core/` importa `phaser`.

## 2. Cartas y efectos data-driven

**Veredicto: cartas en archivos TS (no JSON) tipados como datos puros**, efectos como operaciones atómicas componibles, statuses con hooks.

```ts
type Effect =
  | { kind: 'damage'; amount: number; times?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'draw'; count: number }
  | { kind: 'applyStatus'; status: StatusId; stacks: number; to: 'target'|'self'|'allEnemies' }
  | { kind: 'selfDamage'; amount: number }
  | { kind: 'pressure'; amount: number };   // mecánica de caos

interface CardDef {
  id: string; name: string; cost: number;
  target: 'enemy'|'self'|'allEnemies'|'none';
  effects: Effect[];
  keywords?: ('exhaust'|'ethereal'|'innate')[];
  upgrade?: Partial<CardDef>;
}
```

Un solo intérprete: `resolveEffect(state, effect, ctx) => GameEvent[]`, `switch` exhaustivo (TS obliga a cubrir todos los `kind`). Carta nueva = datos; mecánica nueva = un caso + tests.

**Statuses con hooks** (patrón event-driven estándar):
```ts
interface StatusDef {
  id: StatusId; stacking: 'intensity'|'duration';
  onTurnStart?: (state, owner) => GameEvent[];
  modifyDamageDealt?: (amount, owner) => number;    // weak: *0.75
  modifyDamageTaken?: (amount, owner) => number;    // vulnerable: *1.5
  decayAtTurnEnd?: boolean;
}
```
En el estado solo `{statusId, stacks}`; los `StatusDef` viven en un registry estático → estado serializable a JSON (saves y replays).

**RNG seedeado (crítico)**: `Math.random()` no es seedeable. **Implementar `splitmix32` a mano (~10 líneas)**.
- **Streams por dominio**: mapa, barajar, combate, recompensas — derivados del seed (`hash(seed + 'map')`). Jugar una carta extra no cambia el mapa.
- El RNG vive **dentro del estado** (su contador se guarda en el save); la capa Phaser jamás llama al RNG del juego.
- Daily run = seed de la fecha; replay = seed + lista de intents.

## 3. Mapa procedural

Algoritmo de StS documentado: rejilla 7 columnas × 15 pisos, 6 random walks de abajo arriba sin cruces, reglas de tipos (piso 1 = monstruo, 9 = tesoro, 15 = campfire, élites/campfires no adyacentes, cuotas por tipo). Implementación traducible: [slay-the-spire-map-in-unity (silverua, MIT)](https://github.com/silverua/slay-the-spire-map-in-unity).

**MVP: versión simplificada (~150 líneas)** — rejilla, N random walks sin cruces, tipos fijos por piso + asignación ponderada con una regla de adyacencia. Tests: sin cruces, todo nodo alcanzable, boss alcanzable. Migrar al algoritmo completo después sin tocar nada más (misma estructura de salida).

## 4. Persistencia

**localStorage con saves JSON versionados; IndexedDB no hace falta** (un save de run son pocos KB; localStorage es síncrono → apto para `beforeunload`/`visibilitychange`).
- **Dos claves**: `game:run` (run en curso: estado + RNG + versión; se borra al morir) y `game:meta` (desbloqueos, estadísticas; nunca se borra).
- **Guardar en puntos de decisión**: al salir de combate, elegir recompensa, moverse en el mapa.
- **Versionado con migraciones encadenadas** (`if (version < N)` secuenciales). Meta se migra siempre; run en curso puede invalidarse en versiones tempranas.
- Extras: try/catch en todo acceso a storage; **export/import del save como base64** (backup + reproducción de bugs).

## 5. Phaser: escenas, pixel art, input, texto, atlas

- **Escenas**: `Boot → Preload → MainMenu → CharacterSelect → Map → Combat → Reward → GameOver`. `Reward`/`Pause`/`DeckView` como **overlay** (`scene.launch`). Escena `HUD` paralela a `Combat` (screen-shake del combate sin sacudir la UI). Ninguna escena guarda estado: todas leen del core y emiten intents vía un `GameController`.
- **Pixel-perfect**: `pixelArt: true`, base 640×360, `Scale.FIT` + `autoCenter`, zoom entero en resize. Cartas: no escalar a valores no enteros — elevación (y-offset) en hover en vez de scale, o asumir estética chunky.
- **Input — veredicto: tap-tap** (tap carta → targeting → tap enemigo; tap fuera cancela). Idéntico con ratón y dedo, trivial en Playwright, es el esquema del port móvil de StS. Drag como azúcar posterior.
- **Texto — veredicto: BitmapText para todo** (el `Text` de canvas es "extremadamente caro" con muchas cadenas y no es pixel-perfect). Fuente bitmap desde TTF pixel (BMFont/SnowB) en 2 tamaños. Números de daño: BitmapText + tween, pooled.
- **Atlas — veredicto: [free-tex-packer-core](https://www.npmjs.com/package/free-tex-packer-core)** como script npm (`assets:pack`): formato Phaser JSON Hash, trim/multipack. Un atlas `ui`, uno `cards`, uno por acto de enemigos.
- **Rendimiento**: pooling de cartas/números/partículas (`Group` con `get/killAndHide`), todo en atlas, límites en emitters.

## 6. Testing y CI

- **Vitest sobre `src/core/` (el 90% del valor)**: tests de cada efecto y status, combates por script de intents, propiedades del mapa, y **test de determinismo** (mismo seed + mismos intents ⇒ estado final idéntico). No testear escenas Phaser con Vitest.
- **Playwright: 1-2 smoke tests, no más**: hook `window.__game` (`getState()`, flag `ready`) solo en modo test; esperar marcadores explícitos, nunca sleeps; **fallar ante `console.error`/`pageerror`**; animaciones a duración 0. Flujo: cargar → ready → iniciar run → jugar una carta → asertar HP enemigo bajó y cero errores.
- **CI/deploy — veredicto**: Vercel despliega con su integración Git nativa; GitHub Actions solo como quality gate (typecheck + vitest + build + playwright por PR). `vercel.json` mínimo (SPA, cache largo para assets con hash).

## 7. Estructura de carpetas

```
assets-src/                  # fuentes de arte (aseprite, PNGs, TTF)
public/assets/               # salida del packer: atlas, .fnt, audio
scripts/pack-atlases.mjs
src/
├─ core/                     # ⛔ SIN imports de Phaser. Corre en Node.
│  ├─ index.ts  types.ts  rng.ts
│  ├─ combat/                # turn-machine, resolveIntent, resolveEffect, statuses, enemy-ai
│  ├─ map/  run/  save/
├─ data/                     # solo datos tipados, sin lógica
│  ├─ cards/  enemies/  encounters/  relics/  statuses.ts
├─ game/                     # main.ts, config.ts, controller.ts (puente core ⇄ escenas)
├─ scenes/                   # Boot, Preload, MainMenu, CharacterSelect, Map, Combat, Reward, GameOver, HUD
├─ ui/                       # CardSprite, HandLayout, EnergyGauge, IntentIcon
│  └─ fx/                    # DamageNumbers, cola de animación de GameEvents
└─ test-hooks.ts             # window.__game solo en modo test
tests/core/  tests/e2e/
.github/workflows/ci.yml  vercel.json  vite.config.ts  vitest.config.ts  playwright.config.ts
```

Reglas que sostienen todo: `src/core` y `src/data` no importan Phaser (lint lo verifica); `src/scenes`/`src/ui` no mutan estado; todo lo aleatorio pasa por `core/rng.ts`.

### Resumen de veredictos
| Tema | Decisión |
|---|---|
| Framework | Phaser 4.1+ (fallback sin coste a 3.87) |
| Arquitectura | Core puro TS estilo *Slay the Web*: estado inmutable + acciones puras + `GameEvent[]` → cola de animaciones |
| Cartas | Datos TS tipados, efectos atómicos, intérprete único; statuses con hooks |
| RNG | splitmix32 propio, streams por dominio, estado en el save |
| Mapa | Random walks 7×15 sin cruces; luego port del repo de silverua |
| Persistencia | localStorage, `run`/`meta` separadas, migraciones, export/import |
| Input | Tap-tap primario; drag opcional |
| Texto/atlas | BitmapText siempre; free-tex-packer-core |
| Testing | Vitest exhaustivo + test de determinismo; 1 smoke Playwright; Actions gate + Vercel Git |

Fuentes: [Slay the Web](https://github.com/oskarrough/slaytheweb) · [Phaser 3 vs 4](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4) · [Migrating Phaser 3→4](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know) · [StS Map Generation (Steam Guide)](https://steamcommunity.com/sharedfiles/filedetails/?id=2830078257) · [silverua/slay-the-spire-map-in-unity](https://github.com/silverua/slay-the-spire-map-in-unity) · [splitmix32](https://jkomyno.dev/gists/splitmix32-prng/) · [Game Save Best Practices (Bugnet)](https://bugnet.io/blog/game-save-best-practices-web) · [free-tex-packer-core](https://www.npmjs.com/package/free-tex-packer-core) · [Vercel + GitHub Actions](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel)
