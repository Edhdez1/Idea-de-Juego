# Arte del vertical slice — Capítulo 1

> Lista de assets, tamaños, animaciones, puertas de aprobación y pipeline de PixelLab para el prólogo y el capítulo 1. **Requiere aprobación del dueño** (sobre todo las puertas G1–G4). Reglas generales de arte en `docs/GDD.md` §9; qué sale en cada batalla y mapa en `docs/diseno/capitulo-1.md`.

---

## 1. Principios

1. **Dos tipos de arte.** **Ilustración** para la historia (paneles de cinemática, retratos, códice, splash de capítulo), siempre dentro de marcos pixel. **Pixel art** para el juego (batalla, exploración, taberna, UI).
2. **Los sprites aprobados son canónicos. Nunca se rediseña.** Los 7 sprites laterales de 128 px que ya existen (`public/assets/sprites/`: ingeniera, aprendiz_explotado, golem_defectuoso, inquisidor_patentes, recaudador, gran_maestre, brayan) son la referencia de diseño. Se usan tal cual en el **panel de unidad** de la batalla y como referencia para generar las 8 direcciones.
3. **Mundo vivo.** Todo lo que sale en pantalla se mueve: personajes con reposo en bucle, losetas y props animados, ambiente por código. Hasta los placeholders respiran.
4. **Set mínimo de animaciones** (lección de Children of Morta): 5 direcciones dibujadas + 3 en espejo; enemigos solo en diagonales; el golpe recibido se refuerza con flash y retroceso por código.
5. **Sátira sin asco** en cada prompt (GDD §9.0): pueblo y héroes humanos y dignos; el poder, caricatura; la nobleza, rococó o andrógina afilada.

---

## 2. Lista de assets y tamaños

### 2.1 Personajes (pixel)

| Asset | Tamaño | Vista | Direcciones | Estado |
|---|---|---|---|---|
| Héroes: Ingeniera, Clérigo, Historiadora, Reparador | **64×64** | «low top-down» | 8 (5 dibujadas + 3 espejo) | Ingeniera: sprite 128 aprobado. **Clérigo, Historiadora y Reparador: solo hay retrato**; primero se aprueba su sprite lateral de 128 (puerta G1a) |
| Enemigos del Gremio: Aprendiz Explotado, Gólem de Latón Defectuoso, Cobrador de Cuotas (id `recaudador`), Inquisidor de Patentes | 64×64 | low top-down | 8 (se animan solo 2 diagonales) | Sprite 128 aprobado |
| Autómata de Atención al Súbdito | 64×64 | low top-down | 8 (2 diagonales animadas) | **Nuevo** (G3) |
| **Gran Maestre** (jefe) | **96×96** | low top-down | 8 (2 diagonales animadas) | Sprite 128 aprobado |
| Recaudadora Mayor (Doña Casilda) | 64×64 | low top-down | 8 | **Nuevo** (G3) |
| Mercenarios: Matón gallego (Xurxo), Boticaria chilanga (Lupita) | 64×64 | low top-down | 8 | **Nuevos** (G3) |
| Unidades de variante: Feligrés (B3-B), Alguacil fiscal (B3-C) | 64×64 | low top-down | 8 (2 diagonales animadas) | **Nuevos** (G3) |
| Brayan | 64×64 | low top-down | 8 (4 animadas) | Sprite 128 aprobado |
| Doña Remedios | 64×64 | low top-down | 8 (4 animadas) | **Nueva** (G3) |
| NPCs que caminan: Quino, Beata Felícitas, Don Legajo | 64×64 | low top-down | 8 (4 animadas) | **Nuevos** (G3). Quino reutiliza la base del Aprendiz con otra paleta de ropa |
| NPCs fijos: Ceferino, Encarna, Sir Pompeyo, Maese Octavio, Tuerca, Nico, el Barón, el Espadachín Atascado | 64×64 | low top-down | 1–2 (frente S / diagonal) | **Nuevos** (G3). Tuerca reutiliza el Gólem con otra paleta |

### 2.2 Retratos (ilustración)

- **256×256**, recorte de busto, dentro de marco pixel de latón.
- **Parpadeo** (2 frames) y **boca** (2 frames: cerrada / abierta) mientras avanza el texto.
- Existentes (recortar de los concepts de `public/assets/intro/`): Ingeniera, Clérigo, Historiadora, Reparador, Brayan.
- Nuevos: Doña Remedios, Doña Casilda, Gran Maestre, el Barón, Ceferino, Don Legajo, Beata Felícitas, Sir Pompeyo, Encarna, Quino, Xurxo, Lupita. Higgsfield **solo con descripción de texto** (sin imágenes de referencia ajenas), cuantizados hacia la paleta.

### 2.3 Tablero isométrico

- **Loseta: 64×32 de cara superior + 64×16 de lateral por nivel de altura.** Escalón de 16 px por nivel; altura máxima 6.
- Losetas animadas: **4–6 frames**, bucle limpio.

| Loseta | Batallas | Animada |
|---|---|---|
| Tablones de taller | B0 | — |
| Rejilla de brasas | B0 | **Sí** (brasas que respiran) |
| Estantería / cajas / mesa (bloques) | B0, B2 | — |
| Adoquín de plaza | B1, B3 | — |
| Gravilla del cráter + borde del cráter | B1, B3 | — |
| Andamio / galería de madera | B1, B3 | — |
| Escalera de mano | B1, B3 | — |
| Riel de la Desmontadora | B3 | **Sí** (chispas al paso) |
| Piedra del Archivo / entreplanta | B2 | — |
| Estantería del Archivo (altura 6) | B2 | — |
| Escalera de caracol | B2 | — |
| Agua de canal | Reserva (hub, futuras batallas) | **Sí** |
| Respiradero con vapor | B1, B3 | **Sí** |
| **Goteras de era:** paja (ocre), respiradero (latón), antigravedad (cian), neón (magenta) | B1, B3 (paja y respiradero en el slice; las otras 2 se hacen para validar el sistema) | **Sí**: titileo en el color de su era, 4 frames |

Total: ~14 losetas base + 4 de era, como en el plan.

### 2.4 Exploración cenital (Tiled)

- **Losetas de 32×32.** Dos mapas: `distrito_gremio` y `taberna_brayan`.
- Animadas en el tileset de Tiled (`tiles[].animation`, reproducidas por `src/ui/vivo/LosetasAnimadas`): **agua del canal**, **fuego de forja**, **vapor de alcantarilla**, **chimenea de la taberna**.

### 2.5 Props animados (spritesheet en bucle, desfase aleatorio sembrado)

| Prop | Tamaño aprox. | Frames | Dónde |
|---|---|---|---|
| Engranaje de pared | 32×32 | 6 | B0, taberna, Archivo |
| Estandarte del Gremio | 32×64 | 6 | B1, B3, hub |
| Farol / lámpara de vapor | 16×32 | 4 | B2, B3, hub |
| Chimenea con humo | 32×64 | 6 | Hub, parallax |
| **El Coso** (pantalla «88:88» parpadeando + pitido con destello) | 48×48 | 6 (+3 del pitido) | B1, B3, hub, parallax |
| **La Desmontadora** (pistones, sierras) | 96×96 | **8** | B3 |
| Archivador con papeles volando | 48×64 | 6 | B2 |
| Grúa de vapor | 64×96 | 6 | B1, B3 |
| Puesto de churros humeante | 64×48 | 4 | B1, hub |
| La Balanza de latón (sellos cayendo) | 128×96 | 8 + 4 por sello | Escena de voto |

### 2.6 Fondos parallax

- **320×180 por capa**, 2–3 capas: cielo con nubes (se desplaza), horizonte de la pirámide-ciudad, y el **faro del Coso** pulsando con su 88:88.
- Variantes de luz: **día** (B1, hub), **noche** (B2, B3), **amanecer** (epílogo).

### 2.7 Ilustraciones de historia

- Nuevas para la intro Parte II: `intro_6_cola`, `intro_7_ventanilla`.
- Epílogo: `cap1_procesion` (costaleros llevándose el Coso con cráter y todo).
- Splash de capítulo: `cap1_titulo`, `cap1_fin`.
- 640×360 o mayor para el paneo lento, cuantizadas a la paleta.

### 2.8 UI

- **Iconos de habilidad** (32×32): se reciclan las 7 ilustraciones de cartas de `public/assets/cards/` (recortadas y reducidas).
- **Iconos de la barra de turnos** (16×16): mecha, Gotera, pitido del Coso, Desmontadora, retrato mini de cada unidad.
- **Manómetro** de Presión: se reutiliza.
- **Capas del tablero** con color **y** patrón (daltonismo): movimiento, ataque, área, peligro, Gotera, camino.

---

## 3. Tabla de animaciones

### 3.1 Personajes (todas en pixel art, `characters/animations` de PixelLab)

| Quién | Reposo | Caminar | Atacar / habilidad | Herido | KO | Extra |
|---|---|---|---|---|---|---|
| **4 héroes** | 4 f × 5 dir | 6 f × 5 dir | 6 f × 2 diag | 3 f × 2 diag | 4 f × 2 diag | **celebrar** 4 f (S) |
| **Recaudadora y 2 mercenarios** | 4 f × 5 dir | 6 f × 5 dir | 6 f × 2 diag | 3 f × 2 diag | 4 f × 2 diag | celebrar 4 f (S) |
| **Enemigos del Gremio (5)** | 4 f × 2 diag | 6 f × 2 diag | 6 f × 2 diag | 3 f × 2 diag | 4 f × 2 diag | — |
| **Feligrés, Alguacil fiscal** | 4 f × 2 diag | 6 f × 2 diag | 6 f × 2 diag | 3 f × 2 diag | 4 f × 2 diag | — |
| **Gran Maestre** (96) | 4 f × 2 diag | 6 f × 2 diag | 6 f × 2 diag | 3 f × 2 diag | 4 f × 2 diag | **subir a la Desmontadora** 8 f |
| **Brayan, Doña Remedios, NPCs que caminan (3)** | 4 f × 4 dir | 6 f × 4 dir | — | — | — | **gesto propio** 4 f (Brayan: frotarse las manos; Remedios: sacudir el trapo) |
| **NPCs fijos (8)** | 4 f × 1–2 dir | — | — | — | — | gesto propio 4 f (ver `capitulo-1.md` §6.1) |

«5 dir» = S, SE, E, NE, N (SO, O y NO en espejo). «2 diag» = SE y NE (las otras 2 en espejo). «4 dir» = S, E, N, SE.

**Estimación de frames:**

| Grupo | Frames por personaje | Personajes | Total |
|---|---|---|---|
| Héroes | 20 + 30 + 12 + 6 + 8 + 4 = **80** | 4 | 320 |
| Recaudadora + mercenarios | 80 | 3 | 240 |
| Enemigos y unidades de variante | 8 + 12 + 12 + 6 + 8 = **46** | 7 | 322 |
| Gran Maestre | 46 + 8 = **54** | 1 | 54 |
| Brayan, Remedios, NPCs que caminan | 16 + 24 + 4 = **44** | 5 | 220 |
| NPCs fijos | ~8 + 4 = **12** | 8 | 96 |
| **Total personajes** | | | **≈ 1.250** |

Dentro de la horquilla del plan (1.100–1.300). Lejos de los ~15.000 de Wargroove.

### 3.2 Escenario

| Tipo | Qué | Frames | Método |
|---|---|---|---|
| **Losetas iso animadas** | Agua de canal, respiradero con vapor, rejilla de brasas, riel con chispas, titileo de Gotera × 4 eras | 4–6 | `create-isometric-tile` + `animate-with-text-v3`; si no hay bucle limpio, **ciclo de paleta** o desplazamiento por código |
| **Props animados** | Engranaje, estandarte, farol, chimenea, el Coso (88:88), Desmontadora, archivador con papeles, grúa, puesto de churros, La Balanza | 4–8 | Generar el prop estático y animarlo con `animate-with-text-v3` |
| **Losetas cenitales animadas** | Agua, fuego de forja, vapor de alcantarilla, chimenea | 4 | `create-tileset` + animación; se declaran en Tiled |
| **Parallax** | Cielo, horizonte, faro del Coso | Desplazamiento por código; faro 4 f | Capas estáticas 320×180 + el faro como prop animado |
| **Ambiente por código** (no es pixel, complementa) | Partículas de vapor, chispas, polvo, hollín, papeles; nubes; luz que respira | — | `src/ui/vivo/Ambiente` |

---

## 4. Puertas de aprobación

Nada llega a `public/assets/` sin pasar su puerta. Mientras tanto, placeholders animados (§7).

| Puerta | Qué se aprueba | Cómo | Criterio |
|---|---|---|---|
| **G1 — Hoja de giro** | Cada personaje en 8 direcciones | 1) El **sprite lateral aprobado de 128 px se reduce a 64** y se usa como **referencia Este**. 2) PixelLab exige una vista **Sur**: se genera y **se aprueba primero la vista Sur**. 3) Con la Sur aprobada como referencia principal, se generan las 8 direcciones. **Nunca se rediseña**: si una dirección no se parece, se regenera o se retoca, no se cambia el diseño | Misma silueta, misma paleta, mismos rasgos que el sprite de 128. Se lee a 64 px sobre una loseta |
| **G1a — Sprite lateral nuevo** | Clérigo, Historiadora, Reparador (y todos los personajes nuevos de G3) | Sprite lateral de 128 px generado desde su retrato aprobado, que pasa a ser su referencia canónica | Coincide con el retrato; silueta legible |
| **G2 — Look del escenario** | Losetas **animadas** y el ambiente | Maqueta de losetas y un **video corto** de una batalla con el ambiente en movimiento (grabación de Playwright) | Se lee la altura, se distinguen los terrenos, nada parpadea de forma molesta, FPS estables |
| **G3 — Personajes nuevos** | Recaudadora, mercenarios, madre de Brayan, Autómata, NPCs, unidades de variante | Retrato + sprite de 128 (G1a) antes de las 8 direcciones (G1) | «Sátira sin asco» según su posición en la pirámide |
| **G4 — Animación** | Primero **la Ingeniera completa** (todas sus animaciones); después, el lote | Hoja de animaciones en bucle + GIF de cada una | Bucles limpios, lectura clara del golpe; **con el piloto se estima el coste en créditos y se avisa al dueño antes de producir en lote** |

---

## 5. PixelLab (API REST v2): endpoints y parámetros por asset

> Los nombres de parámetros son los previstos; **se verifican contra la documentación de la API v2 en la prueba técnica de M0** y se corrigen aquí. Token en la variable de entorno **`PIXELLAB_API_TOKEN`**, nunca en el repositorio. Scripts en `scripts/pixellab/`; cada petición guarda prompt, semilla y parámetros en `assets-src/pixellab/manifest.json`. Los trabajos largos se consultan en `background-jobs`.

| Asset | Endpoint | Parámetros clave |
|---|---|---|
| Sprite lateral nuevo (G1a) | `create-image` (o equivalente pixflux/bitforge) | `description` desde el retrato; `image_size` 128×128; `view: side`; `direction: east`; paleta forzada (`color_image` con la paleta del juego); `no_background: true` |
| Personaje en 8 direcciones (G1) | **`create-character-with-8-directions`** (modo **pro**) | `description`; `image_size` 64×64 (96×96 jefe); `view: low top-down`; **referencias**: Sur aprobada + Este (el 128 reducido a 64); `outline`, `shading`, `detail` fijos por lote; `seed` guardada |
| Animaciones de personaje | **`characters/animations`** | `character_id`; acción (`idle`, `walk`, `attack`, `hurt`, `death`, gesto con texto); `directions` según §3.1; `n_frames` según §3.1 |
| Loseta isométrica | **`create-isometric-tile`** | `description` (terreno + era); tamaño 64 (cara superior 64×32); grosor de lateral 16 px por nivel; paleta forzada |
| Tileset cenital | **`create-tileset`** | `lower_description` / `upper_description` (p. ej. adoquín / gravilla del cráter); `tile_size` 32; `view: high top-down`; transición |
| Loseta o prop animado | **`animate-with-text-v3`** | Imagen del frame base; `action` en texto («water flowing in a canal, seamless loop»); `n_frames` 4–8 |
| Estado de trabajos | **`background-jobs`** | Sondeo hasta `completed`; descarga al directorio de revisión |

Prompts base (en inglés, como pide la herramienta):
- Héroes y pueblo: «…sympathetic, dignified, normal human proportions, tired but charming, steampunk-medieval, pixel art».
- Poder (Gran Maestre, Cobrador, Inquisidor, Recaudadora): «…caricature, pompous, exaggerated features, comedic — NOT disgusting, NOT creepy».
- Nobleza (Sir Pompeyo, el Barón): «…androgynous, elegant, porcelain-perfect, unsettlingly beautiful» o la fórmula rococó del GDD §9.0.

---

## 6. Regla de paleta

- **Paleta maestra Resurrect 64**, bloqueada. Sub-paletas por piso para acentos (piso 1: latón y hollín).
- **Verde gas** reservado a lo tóxico (veneno, remedios de Lupita).
- Colores de era de las Goteras reservados: ocre (medieval), latón (steampunk), cian (futurista), magenta (cyberpunk). No se usan como color dominante de ningún personaje.
- Todo asset generado se **cuantiza** a la paleta sin dithering antes de aprobarse (Pillow). Las ilustraciones se cuantizan «hacia» la paleta (sin forzar cada píxel).
- Colores de hablante (UI) únicos y registrados en `src/data/speakers.ts`; Brayan `#8ae8b0`; el dorado `#ffd27a` queda solo para el oro.

---

## 7. Política de placeholders

- **El código nunca espera al arte.** `src/game/placeholders.ts` genera una textura para toda clave del manifiesto que falte.
- **Losetas:** rombos con color por terreno y caras laterales sombreadas; las animadas **pulsan** (tinte o ciclo de 2 colores).
- **Unidades:** peones por equipo con la inicial y una flecha de orientación; **respiran** (escala 1,00↔1,03 en bucle) y hacen «salto» al caminar.
- **Props:** rectángulos con etiqueta que oscilan o parpadean según su tipo.
- **Retratos:** marco con la inicial y el color del hablante; el parpadeo y la boca se simulan con una línea.
- Un test de contenido comprueba que **todo personaje del manifiesto declara reposo y caminar** y que **toda batalla y mapa declara una capa `ambiente` no vacía**.
- Al llegar el arte aprobado, se sustituye la clave en el manifiesto; nada más cambia.

---

## 8. Orden de producción sugerido

1. **M0:** vista Sur de la Ingeniera desde su sprite de 128 (prueba G1) + piloto de escenario (canal y respiradero animados).
2. **G4 piloto:** la Ingeniera completa → estimación de créditos → aviso al dueño.
3. Losetas y props de B0 y B1 (G2 con video).
4. Resto de héroes (G1a → G1 → animación).
5. Enemigos del Gremio y Gran Maestre (la Desmontadora aparte).
6. Personajes nuevos (G3): Recaudadora, mercenarios, Remedios, NPCs.
7. Retratos e ilustraciones de historia.
