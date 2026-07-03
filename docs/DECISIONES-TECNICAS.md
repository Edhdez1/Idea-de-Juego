# Decisiones técnicas — preguntas frecuentes del equipo

Respuestas a las dudas que surgieron al compartir la sinopsis (web vs escritorio, motor, multiplayer, PCs "papa").

## Decisión: el juego será una aplicación de escritorio

Adoptada por recomendación de Koumy (programador del equipo con experiencia en juegos): más libertad, más fluidez, acceso a todos los recursos del PC. Lo que queda abierto es el **cómo** — el motor no tiene por qué ser Unity; hay una gama de opciones y se evaluará con criterio (ver abajo).

**Cómo llegamos a escritorio sin tirar lo construido:**

1. **La arquitectura ya nos protege.** El motor de reglas completo (`src/core/`: cartas, turnos, Presión, enemigos) es TypeScript puro **sin una sola línea de Phaser**, verificado por un test automático. Las reglas del juego —lo más caro de construir y balancear— sobreviven a cualquier cambio de motor: se llevan tal cual (si el motor habla JS) o se traducen mecánicamente. Solo se rehace la capa de dibujo.
2. **Camino inmediato: empaquetar como app de escritorio (Tauri o Electron).** El juego actual se convierte en un `.exe`/app nativa con su propio proceso dedicado (sin las limitaciones de una pestaña compartida), reutilizando el 100% del código. Tauri produce binarios pequeños (~10 MB) y ligeros de RAM.
3. **El navegador se conserva como canal de playtesting**: un link corre en cualquier papa sin instalación — se pushea y todos los testers prueban la misma versión en segundos. Escritorio para jugar; web para probar.
4. **Nota de escala**: la preocupación de memoria web (~500 MB) aplica a juegos 3D/HD; este deck builder pixel art usa <30 MB de VRAM (Balatro entero pesa ~50 MB en disco). Aun así, la decisión de escritorio se mantiene por las razones de libertad y fluidez de largo plazo.

## ¿Qué motor para el escritorio? (evaluación abierta)

| Opción | Qué implica | Cuándo conviene |
|---|---|---|
| **Tauri/Electron sobre el stack actual** | Cero reescritura; .exe ya; desarrollo sigue igual de rápido | Validar el juego YA y llegar a Steam (muchos éxitos indie 2D lo hacen: Vampire Survivors salió en Electron/web tech) |
| **Godot** | Open source, ligero, excelente 2D, corre en CI; reescritura de la capa de render (GDScript/C#) + port del core | Si el juego valida y queremos build nativa "de verdad" para Steam/consolas |
| **Unity** | Reescritura completa en C#; editor potente; requiere licencia/instalación pesada | Si Koumy lidera esa parte con su experiencia; es el que menos se presta a nuestro flujo automatizado actual |

Plan: terminar el vertical slice sobre el stack actual (es el prototipo jugable en semanas), empaquetarlo con Tauri como primera app de escritorio, y decidir el motor definitivo con el juego ya validado y con Koumy en la mesa.

## ¿Será multiplayer?

**Single player primero, sí — y el multiplayer está contemplado, no descartado.** El plan de fases pone multiplayer (Nakama o similar) después de validar que el single player es divertido. Detalle técnico importante: el motor ya es **determinista con RNG por seed** (misma semilla + mismas jugadas = misma partida exacta), que es justo la propiedad que hace baratos los modos multijugador del género: daily runs competitivas (todos juegan la MISMA run y comparan puntaje), replays compartibles y espectador. Eso llega mucho antes y más barato que un multiplayer en tiempo real.

## ¿El arte no es lo más tardado?

Era cierto hace dos años; hoy el pipeline es: concepts con Higgsfield (dirección visual, splash de historia) → **sprites y animaciones pixel art con PixelLab** (API, minutos por personaje) → retoque humano en Aseprite donde haga falta. El elenco completo del Acto 1 (5 personajes de combate) se generó en una tarde. La ayuda humana en arte sigue siendo bienvenida donde más vale: **retoque de sprites, tilesets del fondo y coherencia de paleta**.

## La regla de los dos artes (confirmada)

- **Combate y mapa**: pixel art (sprites PixelLab 128×128, UI pixel).
- **Transiciones, diálogos, selección de personaje, eventos narrativos**: ilustraciones (los concepts estilo caricatura satírica), siempre dentro de marcos pixel y con la misma paleta.
