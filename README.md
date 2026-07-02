# Vaporcracia (título provisional)

Deck builder roguelite steampunk-medieval con sátira social y mecánicas de caos justo. Juego web en pixel art hecho con Phaser 4 + TypeScript.

> *Sube la pirámide social a golpe de cartas… y reza para que la caldera no cante demasiado.*

## Documentación

- **[GDD](docs/GDD.md)** — concepto, pilares, mecánicas (Presión de Vapor, Prototipos, Overclock), personajes, el Narrador y la cuarta pared.
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
