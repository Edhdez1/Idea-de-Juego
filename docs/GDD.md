# GDD — «Vaporcracia» (título provisional)

> Deck builder roguelite steampunk-medieval. Una sátira de la sociedad donde subes la pirámide social a golpe de cartas… y donde tus propias cartas pueden explotarte en la mano.

**Formato**: juego web (navegador, desktop primero con soporte táctil), pixel art de alta legibilidad, sesiones de 20-30 min.
**Idioma**: español primero, textos en archivos de datos separados (traducibles después).
**Stack**: Phaser 4 + TypeScript + Vite + Vitest · PixelLab + Higgsfield (arte IA) · Playwright · Vercel.

---

## 1. Pilares de diseño

1. **Caos justo**: el caos se elige, se telegrafia y se mitiga. Nunca una tirada oculta que te mata; siempre un trato que firmaste, un medidor que ignoraste o una mecha que dejaste arder. El peor resultado te frena, no destruye la run — y a veces la explosión le cae también al enemigo.
2. **Sátira en el contenido, no en las reglas**: el humor vive en nombres de cartas, flavor text, enemigos-institución, eventos y el Narrador. Las reglas siguen siendo legibles y justas (tono Balatro/Fallout: cínico pero divertido).
3. **Pixel con forma**: sprites 64-96 px con silueta reconocible (franja Blasphemous/Wargroove), paleta maestra bloqueada, e ilustración de alta resolución solo donde toca (splash de selección, arte de carta, eventos) siempre dentro de marcos pixel.
4. **El feel es la mitad del juego**: los jugadores miran las cartas, no a los personajes. Frames donde se mira, código (tweens, shake, partículas) donde se siente.

## 2. Loop de juego

Estructura Slay the Spire probada: **mapa de nodos visible de antemano** (pathing = primera decisión de riesgo) → combates por turnos con **3 energía, mano de 5, intents de enemigos visibles** (no negociable) → recompensas (elige 1 de 3 cartas), tiendas, hogueras, eventos "?" → élite → jefe de acto. Vertical slice: 1 acto de 12-15 nodos, ~20-30 min por run.

## 3. Mecánicas de caos (sistema cohesivo alrededor de la Presión)

### 3.1 Presión de Vapor — LA mecánica identitaria
Medidor global 0-10, siempre visible como manómetro junto a la mano:
- **0-3**: caldera fría, sin efecto.
- **4-7**: *«la caldera canta»* — +25% de daño de tus cartas.
- **8-9**: aviso — tubos rojos, temblor, el manómetro vibra.
- **10 — SOBRECARGA**: explosión que daña a TODOS (tú y todos los enemigos), la presión se purga a 0.

Cartas potentes tienen `Presión: +N`. Cartas **Válvula** ventilan presión convirtiéndola en bloqueo/robo. Hay builds legítimas de "detonador" que juegan a explotar a propósito.

### 3.2 Prototipos (fusible visible)
Cartas ~30% por encima de la curva con contador de usos: *«Explota tras 3 usos»* (al tercero: daño a ti + se destruye). Cero RNG: un préstamo con vencimiento conocido. Cartas de «Reparar» reinician el fusible.

### 3.3 Overclock (caos elegido, carta a carta)
Keyword: *«Overclock (opcional): +2 de Presión → efecto doblado»*. Cada turno es una micro-apuesta.

### Post-MVP: Ruleta de Engranajes (azar entre resultados todos buenos, visibles en la carta) y Contrabando (reliquias potentes con maldición satírica pegada, opt-in).

## 4. Personajes jugables (la pirámide social)

| Clase | Sátira de | Mecánica de mazo | Relación con el caos |
|---|---|---|---|
| **La Ingeniera Desahuciada** ⭐ inicial | El precariado creativo (crunch, patentes robadas, "pago en exposición") | **Artilugios**: cartas-máquina persistentes que disparan cada turno; Prototipos | Especialista en Presión: la genera más rápido y es la única que convierte la Sobrecarga en arma dirigida |
| **El Barón del Humo** | Aristocracia rentista ("demasiado noble para quebrar") | El **oro como recurso de combate**: contrata mercenarios, soborna enemigos, interés post-combate | Apostador: doble o nada — arriesga su cartera hasta que la deuda toca HP |
| **El Clérigo del Vapor Bendito** | El vendehumo (televangelista medieval, wellness) | **Feligreses** (stacks por sermones) → colectas que escalan; milagros-placebo; inyecta «Reliquias Falsas» al mazo enemigo | Caos *exportado*: él vive ordenado, sus víctimas no |
| **La Recaudadora Mayor** | El Estado extractivo (fisco, deuda soberana) | **Deuda**: juega por encima de su energía; cada 3 turnos vence el plazo (telegrafiado) y paga con HP + intereses; Embargos | Bomba de relojería determinista, alto riesgo/alto skill |

**Selección de personaje**: splash art ilustrado de alta resolución (Higgsfield) de fondo, degradado a transparente, dentro de panel con marco pixel; el sprite de combate y las stats delante.

## 5. Enemigos y jefes (Acto 1: el Gremio)

Enemigos como instituciones, no ratas y slimes:
- **El Recaudador** — te roba oro cada turno; al morir lo suelta todo + interés.
- **Inquisidor de Patentes** — te "confisca" una carta durante el combate.
- **La Junta del Gremio** (encuentro triple) — se buffan entre sí y se culpan al morir.
- **Autómata de Atención al Súbdito** — cambia de intent aleatoriamente (*«su llamada es importante para nosotros»*).
- Relleno temático: aprendices explotados, gólems de latón defectuosos (se autodañan — el caos también es de ellos).

**Jefes por acto**: Acto 1 = **el Gran Maestre del Gremio** · Acto 2 = la Iglesia del Vapor · Acto 3 = la Corona. La run entera es subir la pirámide.

## 6. El Narrador y la cuarta pared

Un **Narrador** con voz propia (texto en pergamino/placa de latón, quizá voz ElevenLabs a futuro) comenta la run con sorna. Regla de oro: **poco y bien** — si comenta todo, se vuelve ruido predecible; si aparece de vez en cuando, cada línea aterriza.

**Diseño del sistema (barks data-driven):**
- El Narrador es un consumidor más de los `GameEvent` del motor: un `NarratorSystem` escucha eventos con condiciones (`onOverload`, `onPlayerDeath{count}`, `onCardExploded`, `onHoardGold`, `onTurnTimeout`, `onRepeatedCard`…) y elige líneas de un banco de datos (`src/data/narrator.ts`), con pesos, cooldowns globales (máx. 1-2 intervenciones por combate) y memoria (`game:meta` guarda cuántas veces has muerto, con qué…).
- **Tres voces**: (1) el **Narrador** (comentarista burlón del mundo), (2) los **jefes** (líneas de entrada/fase/muerte dirigidas al personaje… y a veces claramente a ti), (3) el **propio juego/UI** (tooltips y textos de derrota que rompen personaje).

**Escala de ruptura de la cuarta pared** (de más frecuente a más rara):
1. **Burla diegética** (común): se ríen del personaje. *«Otra ingeniera que cree que esta vez la caldera aguantará.»*
2. **Meta-juego** (ocasional): comentan tus decisiones de jugador. Mueres por tu propia Sobrecarga: *«El informe forense dirá "error del operario". El operario eras tú.»* Llevas 3 runs muriendo con el mismo jefe: *«Él ya te reconoce. Pregunta si eres nuevo por cortesía.»*
3. **Cuarta pared rota** (rara, memorable): hablan directamente a quien sostiene el ratón. El jefe final del acto, con la vida baja: *«¿En serio vas a jugar esa carta? Sí, tú. El del otro lado del cristal.»* Un tooltip de la carta «Informe Trimestral»: *«Esta carta no hace nada. Como tu último informe.»*

**Presupuesto de frecuencia** (anti-predecibilidad): nivel 1 ~1 de cada 3 combates; nivel 2 ~1 por run; nivel 3 solo en momentos clave (primera Sobrecarga, jefes, derrotas repetidas) y con cooldown en `game:meta` para que no se repita entre runs. Cada línea se marca como vista y no vuelve a salir hasta agotar el banco.

Referentes: Hades (narrador que reacciona a tus actos), The Stanley Parable (burla al jugador), Inscryption/Pony Island (el juego como entidad), Undertale (memoria entre partidas), Balatro (humor en flavor text).

## 7. Especificaciones de arte (resumen ejecutivo)

- Resolución interna **640×360**, escalado entero, `pixelArt: true`.
- Héroes **96×96**, enemigos 64-96, jefes 128-160. PixelLab: generar a 128, animar con esqueleto (≤128). Set por enemigo: idle 2-4f, attack 4-6f, death 4-6f; el "hit" es tint-flash + knockback por código.
- **Paleta maestra Resurrect 64**; verde-gas reservado a lo tóxico; cuantización Pillow sin dithering; BitForge con paleta forzada.
- Cartas 100×140 lógico; marco pixel codifica tipo (latón=ataque, cobre/tubos=habilidad, hueso=maldición) y rareza; coste dentro de engranaje/válvula; arte 128×96.
- Splash de selección: ilustración 2K Higgsfield cuantizada hacia la paleta, marco pixel, sprite como referencia de diseño.
- Fuentes: **m6x11/m5x7** texto (verificar acentos: á é ñ ¡ ¿), **monogram** números, **Press Start 2P** solo títulos. BitmapText en Phaser.
- Carta explosiva: pulso que acelera + mecha de partículas + humo → anticipación → flash blanco → hitstop → shake → ráfaga de engranajes → secuela de humo.

## 8. Alcance del vertical slice (primer hito)

- 1 personaje (la Ingeniera), **30-35 cartas** (10 iniciales + 20-25 obtenibles: 12C/8U/5R).
- 1 acto de 12-15 nodos, **6-8 enemigos** (4-5 encuentros), 1 élite, 1 jefe.
- 10-12 reliquias, 4-6 eventos satíricos, 3 consumibles.
- Sistemas: combate completo, Presión de Vapor, Prototipos, Overclock, recompensas 1-de-3, tienda, hoguera, Narrador v1 (banco de ~30 líneas), save/load.
- Sin meta-progresión todavía (llega en el MVP público).

## 9. Arquitectura (resumen — detalle en docs/investigacion/04)

Core headless en `src/core/` sin Phaser (estado inmutable + acciones puras + RNG seedeado splitmix32 con streams por dominio) → `GameEvent[]` → cola de animaciones en escenas Phaser. Cartas como datos TS tipados con efectos atómicos e intérprete único. Tests Vitest del core (incl. determinismo), 1 smoke Playwright, CI en Actions, deploy Vercel.
