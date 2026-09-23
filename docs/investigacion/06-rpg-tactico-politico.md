# 06 — Investigación: del deckbuilder roguelite al RPG táctico político

> Septiembre 2026. Objetivo: encontrar referentes en **pixel art** (o sprites / HD-2D) para el nuevo género de «El Coso del Rey» y resolver el problema detectado por el dueño: **en un roguelike de cartas la historia queda opacada.**
> Método: tres líneas de investigación en paralelo (RPG narrativos en pixel art · roguelites/deckbuilders narrativos y tácticos · reuso del código) con fuentes verificadas en la web. Lo no verificado se marca *(no verificado)*.

---

## 1. Diagnóstico: ¿por qué se opacaba la historia?

La conclusión compartida por las dos investigaciones: **el problema no son las cartas, es la estructura roguelike.**

| Síntoma | Evidencia |
|---|---|
| El bucle congela el mundo: el reino no puede cambiar si todo se reinicia | Hades II recibió críticas por un reparto «estático» y un final que tuvo que parchearse |
| Los beats principales se repiten entre runs | Griftlands: «los beats principales se repiten entre runs» |
| La historia pegada encima no importa | Monster Train 2: historia «slapped on», «forgettable» |
| La comedia se gasta al repetirse (peor que el drama) | Inferencia; coherente con la regla de Greg Kasavin (Hades) de no repetir nunca una línea |
| Sí se puede, pero a un coste enorme | Hades: ~20 personas, 21.020 líneas con voz, ~305.000 palabras |

Contraejemplos que prueban que el combate por turnos/cartas **sí** carga una historia profunda cuando va dentro de una **campaña escrita**: SteamWorld Quest (cartas + campaña lineal + humor steampunk), Death Howl (deckbuilder que abandonó el roguelite, 3 personas, Metacritic 82), Baten Kaitos, Mega Man Battle Network, Cross Blitz (campañas narrativas + modo roguelite aparte).

**Decisión del dueño:** RPG táctico político (Triangle Strategy), batallas isométricas con alturas, exploración cenital, sin cartas (el caos pasa al tablero) y **mundo vivo**: escenarios y personajes animados.

---

## 2. Referentes del género elegido: RPG táctico con historia política

| Juego | Arte | Qué hace con la historia | Alcance verificable | Qué tomamos | Qué evitamos |
|---|---|---|---|---|---|
| **Triangle Strategy** (Square Enix + Artdink, 2022) | HD-2D (sprites pixel sobre 3D) | **Balanzas de la Convicción**: en cada gran decisión hay que convencer a la mayoría del grupo; los argumentos se desbloquean con información reunida explorando; valores ocultos (Utilidad/Moralidad/Libertad); ramas que convergen; 4 finales | +1 millón de copias | La votación del grupo: nuestra premisa (todos discuten qué es el Coso) **es** una votación | >1 hora de escenas entre batallas; Arai: escribir la historia «como un libro» y encajar el juego después «fracasó» |
| **Tactics Ogre: Reborn** (2022) | Sprites reescalados | Rutas Ley / Neutral / Caos; guion reescrito por Matsuno | — | Rutas por convicción | El reescalado con filtro («vaselina») generó quejas: pixel nítido siempre |
| **Final Fantasy Tactics – The Ivalice Chronicles** (2025) | Mapas 3D + sprites 2D | «State of the Realm»: línea de tiempo entre batallas con dónde está cada personaje y enlaces a la enciclopedia | +1 millón en 3 meses; Game Informer 9,25 | Nuestro códice **«Estado del Reino»** | — |
| **Fell Seal: Arbiter's Mark** (6 Eyes, 2019) | Isométrico dibujado | Historia correcta pero «forgettable» | **2 personas** (programador + artista) + compositor; Kickstarter 2017 → 2019 | **Cámara fija que no rota**: reduce el arte a la mitad | La historia necesita inversión propia, el género no la regala |
| **Symphony of War** (Dancing Dragon, 2022) | RPG Maker modificado, chibi + retratos | Escritura calificada de «melodramatic» | Metacritic 81, 94 % positivo | Retratos realistas + unidades chibi | Melodrama sin humor |
| **Wargroove 1/2** (Chucklefish / Robotality) | Pixel HD | Campañas por facción; W2 añade modo roguelite «Conquest» | W1: ~**15.000 frames** de animación; «en 3D hubiera sido más fácil» | Estructura híbrida campaña + modo extra | El volumen de animación a mano |
| **Into the Breach** (Subset, 2018) | Pixel isométrico | Frases cortas de pilotos que reaccionan al tablero; viaje temporal justifica el reinicio | 2 fundadores + Chris Avellone; Metacritic 90 | Empujes, peligros del tablero, todo telegrafiado | «No canonical lore»: poca historia |
| **Shogun Showdown** (1 dev, 2024) | Pixel | Casi sin narrativa | 97 % positivo | — | Contraejemplo: éxito sin historia |

**Nota de coste de arte:** isométrico = mínimo 2 direcciones dibujadas + espejo (4 aparentes), lo habitual son 8; vista lateral = 1. Estimación propia *(no verificada)*: pasar a táctico isométrico multiplica ×2–4 el trabajo de sprites por personaje, más mapas. Mitigación adoptada: set único de 8 direcciones (5 dibujadas + 3 espejo) para batalla **y** exploración, generado con PixelLab.

---

## 3. Referentes de tono y estructura narrativa (pixel art)

| Juego | Qué aporta a El Coso del Rey | Dato de alcance |
|---|---|---|
| **EarthBound** (1994) | Sátira de lo moderno visto como algo raro; victoria automática contra enemigos débiles (menos relleno) | 518.000 copias en Japón, 140.000 en EE. UU.; hoy de culto |
| **Mother 3** (2006) | Las «Happy Boxes» (aparatos tipo TV convertidos en objeto de culto) = precedente casi exacto del Coso; capítulos con protagonistas que se turnan | ~12 años de desarrollo intermitente; casi muere por la ambición 3D |
| **Undertale** (2015) | ACT (opciones no violentas), cuarta pared, jefes que recuerdan recargas | Toby Fox casi solo + Temmie Chang; ~32 meses; GameMaker; 5–10 M copias |
| **Deltarune** (2018–) | **Modelo de lanzamiento por capítulos**: cap. 1 gratis para crear comunidad | Caps. 3–4: ~11 M USD / 549.000 copias en su semana en Steam |
| **Live A Live** (1994 / HD-2D 2022) | **Un capítulo por era con una mecánica gancho** y un final que une a todos → nuestras Goteras y eras | Remake: 500.000 copias |
| **Chained Echoes** (2022) | JRPG pixel hecho por **una persona en ~7 años**; recortó sistemas para no inflar el juego | Metacritic 92; ~60.000 copias el primer mes |
| **Sea of Stars** (2023) | Un cronista que cuenta lore en los campamentos (≈ nuestra Historiadora como códice vivo) | 7 → 25 personas; ritmo inicial criticado por exposición |
| **Octopath Traveler I/II/0** | Acción de campo propia por héroe; **evitar héroes aislados** (crítica a Octopath I) | Saga: 7 M copias (marzo 2026) |
| **LISA**, **OMORI** | RPG Maker; decisiones con coste permanente; estados emocionales como piedra-papel-tijera | OMORI tardó el doble de lo previsto (~6,5 años) |
| **Cassette Beasts** (2023) | El RPG exitoso más pequeño: 2 personas a tiempo completo, Godot | +1,1 M copias |
| **Thimbleweed Park / Monkey Island** | Varios protagonistas intercambiables; el combate **es** el chiste (duelos de insultos) | Pixel, SCUMM |
| **Tactical Breach Wizards** (2024, no pixel) | «Motor de chistes»: cruzar conceptos (Riot Priest, Traffic Warlock) = medieval × cyberpunk de nuestras Goteras; banter antes de cada misión | 3 personas en el núcleo |
| **Clair Obscur: Expedition 33** (2025, no pixel) | Prueba de que el RPG narrativo por turnos vende hoy | +8 M copias; GOTY 2025 |

---

## 4. Técnicas para que la historia sea protagonista (y quién lo hace mejor)

| Patrón | Mejor ejemplo | Cómo lo usamos |
|---|---|---|
| Votación / convicción del grupo | Triangle Strategy | **La Balanza**: la Persona Colectiva nº 88-88 vota qué hacer con el Coso |
| Discusión como conflicto con reglas | Griftlands (negociación), Signs of the Sojourner | Argumentos desbloqueados por pistas; cada facción prefiere un tipo de argumento |
| Pistas de exploración que cambian decisiones | Triangle Strategy | Hablar con NPCs del distrito desbloquea argumentos |
| Hub reactivo | Hades (Casa de Hades), Loop Hero (campamento) | La taberna de Brayan comenta lo que pasó |
| Diálogo por prioridades, sin repetir | Hades, Cobalt Core (base de datos de diálogo consultada por estado) | `pickBark()` con prioridad y enfriamiento |
| Jefes que recuerdan intentos | Hades | «Reintento número 3. El Gran Maestre ya te pone café.» |
| Perder = reintentar el encuentro, no perder todo | Death Howl | Reintento con la misma semilla; nunca se borra la partida |
| Arco por personaje | Cobalt Core (recuerdos), Enter the Gungeon (Pasados) | Un héroe protagonista por capítulo |
| Códice político / línea temporal | FFT «State of the Realm» | Códice «Estado del Reino» + tablero de conspiración |
| Narrador que comenta | Darkest Dungeon, Hand of Fate (el crupier es el antagonista), Voice of Cards | El Narrador burlón, escaso (≤15–20 líneas por capítulo) |
| Cambio de formato como giro | Inscryption | Reservado para la ruptura de cuarta pared del final |
| Capítulos con mecánica distinta | Live A Live, Dicey Dungeons | Una Gotera / era protagonista por capítulo |
| Campaña escrita + modo aparte | Griftlands (Historia/Brawl), Wargroove 2, Cross Blitz | Posible modo «Goteras» tras el slice (no ahora) |

---

## 5. Lecciones de producción para un equipo diminuto

1. **Capítulos** (Deltarune): el Capítulo 1 como vertical slice gratuito.
2. **Cámara fija, sin rotación** (Fell Seal): la mitad de arte isométrico.
3. **Un solo set de sprites para dos vistas** + espejo: 8 direcciones con 5 dibujadas.
4. **Animación con presupuesto** (Children of Morta: 2 artistas desbordados; Wargroove: 15.000 frames). El dueño exige mundo vivo → animación generada con PixelLab por dirección, piloto primero (la Ingeniera) antes de producir en lote.
5. **Escenas cortas y saltables** (crítica a Triangle Strategy): ≤3 min por escena, ≤15 min no interactivos en todo el capítulo.
6. **Historia y batalla se diseñan juntas** (lección de Arai): cada beat tiene un objetivo de batalla que lo expresa.
7. **Recortar antes de que infle** (Chained Echoes): toda mecánica nueva exige retirar otra.
8. **No gastar la historia en acceso anticipado** (CrossCode): los previews muestran jugabilidad, no el final.
9. **Riesgos del género**: plazos que se disparan (OMORI ×2, Chained Echoes 7 años), combates repetitivos (Rise of the Third Power), humor forzado, buena crítica ≠ ventas (Baten Kaitos, EarthBound en EE. UU.).

---

## 6. Herramientas verificadas para el nuevo género

- **PixelLab API v2** (`api.pixellab.ai/v2`): personajes en 4 y 8 direcciones (32–256 px, vistas `low top-down` / `high top-down` / `side`, referencias por dirección — la vista Sur es obligatoria si se dan referencias), animaciones por dirección (4–16 frames), losetas isométricas (thin tile / block / thick) y tilesets cenitales Wang. Trabajos asíncronos con sondeo.
- **Phaser 4**: Tilemap de Tiled para la exploración cenital; el tablero isométrico con alturas se dibuja con un renderizador propio (las capas isométricas de Tiled no manejan alturas).

---

## Fuentes

Triangle Strategy: https://en.wikipedia.org/wiki/Triangle_Strategy · https://www.destructoid.com/triangle-strategy-interview-producers-asano-arai-square-enix-hd-2d-tactics-rpg/ · https://kotaku.com/triangle-strategy-square-enix-scales-of-conviction-vote-1848657909 · https://culturedvultures.com/triangle-strategy-switch-review/
Tactics Ogre Reborn: https://rpgamer.com/review/tactics-ogre-reborn-review/ · https://nintendoeverything.com/tactics-ogre-reborn-graphics-and-style-explained/
FFT Ivalice Chronicles: https://gameinformer.com/review/final-fantasy-tactics-the-ivalice-chronicles/a-historic-undertaking · https://noisypixel.net/final-fantasy-tactics-ivalice-chronicles-state-of-the-realm/
Fell Seal: https://en.wikipedia.org/wiki/Fell_Seal:_Arbiter%27s_Mark · https://www.fellseal.com/the-team
Symphony of War: https://en.wikipedia.org/wiki/Symphony_of_War:_The_Nephilim_Saga
Wargroove: https://en.wikipedia.org/wiki/Wargroove · https://en.wikipedia.org/wiki/Wargroove_2 · https://www.gamedeveloper.com/design/an-inside-look-at-i-wargroove-s-i-wicked-design-choices
Into the Breach: https://en.wikipedia.org/wiki/Into_the_Breach · https://kotaku.com/into-the-breach-tells-its-story-through-its-characters-1824159682
Shogun Showdown: https://en.wikipedia.org/wiki/Shogun_Showdown
Hades / Hades II: https://www.gamedeveloper.com/design/roguelikes-and-narrative-design-with-i-hades-i-creative-director-greg-kasavin · https://nintendowire.com/news/2020/12/30/hades-has-over-300000-words-of-voiced-dialogue-heres-a-handy-breakdown-of-who-speaks-most-and-least/ · https://aftermath.site/hades-2-supergiant-narrative-interview-ending-changes/
Cobalt Core: https://en.wikipedia.org/wiki/Cobalt_Core · https://turnbasedlovers.com/10-turns-interview/with-cobalt-core-devs/
Inscryption: https://en.wikipedia.org/wiki/Inscryption
Griftlands: https://en.wikipedia.org/wiki/Griftlands · https://gameinformer.com/review/griftlands/griftlands-review-great-friends-in-low-places
Monster Train 2: https://gamecritics.com/ben-schwartz/monster-train-2-review/
Death Howl: https://en.wikipedia.org/wiki/Death_Howl · https://blog.playstation.com/2026/02/16/how-open-world-soulslike-deckbuilder-death-howl-was-built/
Children of Morta: https://www.gamedeveloper.com/design/postmortem-children-of-morta
Loop Hero: https://en.wikipedia.org/wiki/Loop_Hero · Darkest Dungeon: https://en.wikipedia.org/wiki/Darkest_Dungeon · Hand of Fate: https://en.wikipedia.org/wiki/Hand_of_Fate_(video_game)
EarthBound: https://en.wikipedia.org/wiki/EarthBound · Mother 3: https://en.wikipedia.org/wiki/Development_of_Mother_3
Undertale: https://en.wikipedia.org/wiki/Undertale · Deltarune: https://en.wikipedia.org/wiki/Deltarune · https://alineaanalytics.com/blog/steam_week_23/
Live A Live: https://en.wikipedia.org/wiki/Live_A_Live · https://www.gematsu.com/2022/09/live-a-live-remake-shipments-and-digital-sales-top-500000
Chained Echoes: https://www.gamedeveloper.com/production/matthias-linda-s-seven-year-quest-to-make-retro-jrpg-chained-echoes
Sea of Stars: https://en.wikipedia.org/wiki/Sea_of_Stars · Octopath: https://www.nintendolife.com/news/2026/03/hd-2d-series-octopath-traveler-hits-another-major-sales-milestone · https://collider.com/octopath-traveler-story-problem/
OMORI: https://en.wikipedia.org/wiki/Omori_(video_game) · LISA: https://en.wikipedia.org/wiki/Lisa:_The_Painful · Cassette Beasts: https://en.wikipedia.org/wiki/Cassette_Beasts
Rise of the Third Power: https://www.rpgfan.com/review/rise-of-the-third-power/
SteamWorld Quest: https://gameinformer.com/review/steamworld-quest-hand-of-gilgamech/streamlined-strategic-deck-building · Cross Blitz: https://store.steampowered.com/app/1619520/Cross_Blitz/ · Baten Kaitos: https://en.wikipedia.org/wiki/Baten_Kaitos:_Eternal_Wings_and_the_Lost_Ocean
Thimbleweed Park: https://en.wikipedia.org/wiki/Thimbleweed_Park · Tactical Breach Wizards: https://www.gamedeveloper.com/design/the-comedic-cheat-sheet-that-helped-build-tactical-breach-wizard · Clair Obscur: https://en.wikipedia.org/wiki/Clair_Obscur:_Expedition_33
PixelLab API: https://api.pixellab.ai/v2/llms.txt · https://api.pixellab.ai/v2/docs
