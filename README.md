# El Coso del Rey

Deck builder roguelite steampunk-medieval, sátira social y sinsentido total. Una freidora de aire cae del cielo en el reino de Vaporcracia y nadie —NADIE— averiguará jamás qué es. Juego web en pixel art hecho con Phaser 4 + TypeScript.

> *Fríe sin aceite. Técnicamente, eso es un milagro.*

## Documentación

- **[GDD](docs/GDD.md)** — la premisa del Coso, pilares, mecánicas (Presión de Vapor, Prototipos, Overclock), personajes con acentos, la Taberna y los mercenarios, guiños pop sin copyright, el Narrador y la cuarta pared.
- **[Roadmap](docs/ROADMAP.md)** — plan por fases hasta el vertical slice y más allá.
- **Investigación**: [diseño de juego](docs/investigacion/01-diseno-de-juego.md) · [arte pixel](docs/investigacion/02-arte-pixel.md) · [animación](docs/investigacion/03-animacion.md) · [arquitectura](docs/investigacion/04-arquitectura.md).

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # tests del motor de reglas (Vitest)
npm run typecheck  # TypeScript estricto
npm run build      # build de producción
```

## Arquitectura en una línea

`src/core/` es un motor de reglas puro en TypeScript (sin Phaser, RNG seedeado, 100% testeable en Node); las escenas Phaser solo envían intents y animan los `GameEvent` que el motor devuelve. Un test de arquitectura falla si `src/core/` o `src/data/` importan Phaser.
