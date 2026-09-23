# Roadmap — El Coso del Rey (RPG táctico político)

> **Pivote de septiembre de 2026.** La alfa de cartas (deckbuilder roguelite) queda congelada en `main` con la etiqueta `alfa-cartas-v0.1` y sigue siendo el link público hasta que el slice nuevo cumpla sus criterios. Todo el trabajo nuevo va en la rama de desarrollo con un **PR draft**; los testers juegan en el **preview de Vercel** de esa rama.
>
> Objetivo: **vertical slice «Capítulo 1: La Patente»** (prólogo + capítulo 1, 60–90 min), que se publicará gratis como capítulo 1 (modelo Deltarune). Horizonte: unos **3–4 meses** de calendario.
>
> Diseño: `docs/GDD.md` · canon: `docs/BIBLIA-NARRATIVA.md` · guion: `docs/diseno/capitulo-1.md` · reglas: `docs/diseno/reglas-tacticas.md` · arte: `docs/diseno/arte-slice.md`.

## Hitos

| Hito | Contenido | Criterio de salida |
|---|---|---|
| **M0 — Documentos y pruebas técnicas** | GDD v2, Biblia narrativa v2, reglas tácticas, guion del capítulo 1, arte del slice, este roadmap y decisiones técnicas. Etiqueta `alfa-cartas-v0.1` y rama de trabajo. Pruebas técnicas: Tilemap y Arcade en Phaser 4.1, vista Sur de la Ingeniera generada desde su sprite aprobado, rombo isométrico | Documentos en el repo; **el dueño aprueba la Biblia, el GDD y el Capítulo 1** (y decide las marcas 🔶) |
| **M1 — Motor táctico base** | Tablero, pathfinding, Reloj de Vapor, mover, deshacer, atacar, esperar, daño con desglose, estados, IA v1. **Se borra el código de cartas** (tras la etiqueta) | Vitest en verde; batalla automática IA contra IA con **50 semillas**; **contrato de API congelado** |
| **M2 — Tablero jugable + Mundo vivo v1** | HUD, capas de color y patrón, cámara fija, animaciones por código, hooks de test y smoke E2E. Sistema «Mundo vivo» v1: `PersonajeVivo` con reposo en bucle, losetas y props animados, partículas de ambiente y parallax, todo con placeholders animados | **B0 jugable de principio a fin en el preview, con todo en movimiento**; CI en verde; capturas y video revisados |
| **M3 — Caos en el tablero** | Presión y Sobrecarga, Sobremarcha, Prototipos, empuje, Goteras, IA v2 | Tests de cada mecánica; playtest: «¿es divertido?» |
| **M4 — Historia** | Guiones (`ScriptNode` + `step()`), La Balanza, guardado de campaña con checkpoints y migraciones, diálogo v2 (máquina de escribir, blip por acento, saltar con resumen), barks | **Escena del T-800 y V1 jugables**; el guardado sobrevive a recargar; tests de contenido (hablantes, flags, ids, **todas las opciones de voto alcanzables**, colores únicos) |
| **M5 — Exploración y hub** | Exploración cenital (Tiled), taberna de Brayan (tienda, contratos, propinas), códice «Estado del Reino» | Recorrido completo: **hub → argumentos → batalla → taberna** |
| **M6 — Arte con puertas** (en paralelo desde M0) | Producción según `arte-slice.md` con las puertas G1–G4 | Todo lo que sale en pantalla, aprobado; **cada personaje con su set de animaciones y cada escenario con losetas, props y ambiente animados** |
| **M7 — Capítulo 1 completo y pulido** | Las 4 batallas, V0 y V1, epílogo, audio nuevo, balance, pulido | Slice de **60–90 min**, **≤ 15 min** de escenas no interactivas, **3 playtesters externos** → **merge a `main`** (Capítulo 1 gratis) |

### En la primera ejecución del pivote

- M0, M1 y M2 completos: una batalla táctica isométrica jugable en el preview, con el escenario y los personajes en movimiento (placeholders animados, partículas, parallax).
- Prueba G1 de arte: vista Sur de la Ingeniera, enviada al dueño para aprobar.
- Piloto de animación de escenario: una loseta de canal y un respiradero animados con PixelLab.
- La narrativa detallada (M4 en adelante) espera a que el dueño apruebe la Biblia v2.

## Riesgos principales

- **Volumen de arte animado** (~1.250 frames de personaje): un set de 8 direcciones con espejo, enemigos solo en diagonales, la Ingeniera como piloto antes de producir en lote, placeholders animados mientras tanto.
- **Créditos de PixelLab:** se estiman con el piloto y se avisa al dueño antes de producir en lote.
- **Rendimiento con todo animado:** atlas, tope de partículas, pausar animaciones fuera de cámara; FPS medidos en las capturas.
- **Explosión de rutas:** columna fija, variantes sobre el mismo mapa y jefe, máximo 3 opciones por voto.
- **Escenas largas:** presupuesto de 3 minutos por escena y saltar con resumen.
- **Profundidad isométrica:** cámara fija, mapas de hasta 14×14, altura máxima 6, proyección testeada.

## Después del slice

- Capítulo 2 «El Milagro» (el Clérigo; Barrio Catedral; Goteras futuristas), capítulo 3 «La Corona» (el Reparador; Alcázar; Goteras cyberpunk) y final «Casilla 7» (la Historiadora; el Barón del Humo).
- Más mercenarios (Bardo andaluz, Cartógrafo chileno, Brayan como Consultor Externo).
- App de escritorio con Tauri; voces (ElevenLabs, con acentos); Steam Next Fest.
- Multijugador: solo tras validar el single player (el motor determinista con semilla ya permite replays y retos compartidos).
