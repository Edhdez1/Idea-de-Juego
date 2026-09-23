# GDD v2 — «El Coso del Rey»

> **RPG táctico político** steampunk-medieval y sinsentido total. Una freidora de aire cae del cielo sobre un reino que no está preparado para ella, y toda la pirámide social pierde la cabeza intentando explicar qué es. Tú subes esa pirámide piso a piso con un grupo de cuatro desplazados que, por un error administrativo, **tienen que votarlo todo**. En el tablero, el caos es tuyo: calderas que revientan, prototipos con mecha y goteras del tiempo que cambian el suelo bajo tus pies.

**Formato:** campaña narrativa por capítulos (prólogo, 3 capítulos y final). Batallas isométricas con alturas; exploración en vista cenital. Escritorio primero (Tauri), web para playtesting.
**Referentes:** Triangle Strategy (votos), Final Fantasy Tactics y Tactics Ogre (tablero, códice, rutas), Fell Seal (cámara fija, producción pequeña), Into the Breach (telegrafiado), EarthBound, Undertale y Deltarune (tono, cuarta pared, capítulo 1 gratis). Fichas completas en `docs/investigacion/06-rpg-tactico-politico.md`.
**Idioma:** español primero; todo el texto en archivos de datos.
**Stack:** Phaser 4 + TypeScript + Vite + Vitest · PixelLab (API REST v2) + Higgsfield · Tiled · Playwright · Vercel · Tauri.

**Documentos que cuelgan de este:**
- `docs/BIBLIA-NARRATIVA.md`: canon, geografía, facciones, capítulos, finales. **Manda sobre la historia.**
- `docs/diseno/reglas-tacticas.md`: números y fórmulas del motor (fuente de los tests). **Manda sobre los números.**
- `docs/diseno/capitulo-1.md`: guion y batallas del vertical slice.
- `docs/diseno/arte-slice.md`: assets, animaciones y puertas de aprobación.
- `docs/archivo/GDD-v1-cartas.md`: el GDD del deckbuilder, archivado. §11 dice qué sigue vigente.

---

## 0. Premisa: el Coso

Un martes a las 6:47 de la mañana, **el Coso cae del cielo** sobre la plaza del mercado del reino de **Vaporcracia** y deja un cráter. Es una freidora de aire. Nadie sabe qué es. Nadie sabrá NUNCA qué es: ese es el chiste que sostiene el juego.

- Pita tres veces al amanecer (la Iglesia ya declaró festivo).
- Su pantalla marca «88:88» (los sabios del Gremio van por el segundo 8).
- **Fríe sin aceite**, lo cual aquí es, técnica y legalmente, un milagro.
- Todavía tiene el plástico protector puesto. Quitárselo se castiga con la horca.

Cada institución da una explicación, y cada una es peor que la anterior: el **Gremio** dice que es una patente robada, la **Iglesia** que es el Santo Horno que Fríe Sin Pecado, la **Corona** que es el heredero al trono. El expediente fiscal del Coso tiene una casilla en blanco, la **Casilla 7 («Naturaleza del objeto»)**, y quien la rellene decide qué es. Por eso se sube la pirámide. Detalle en la Biblia §1.

### Las Goteras del Tiempo

La caída **agujereó el tiempo**: desde entonces al reino le caen anacronismos como goteras (personas de otras épocas, palabras que aún no existen, acentos de ciudades sin fundar). La burocracia ya tiene formulario: el **T-800**. Las Goteras justifican a los héroes de otras épocas, los acentos, los cameos… y ahora **también son terreno**: en batalla, una Gotera cambia la era de una casilla (§3.6).

### La premisa ahora genera mecánicas

En la v1 la premisa era solo envoltorio. En la v2 **es el sistema**: cada votación decide qué explicación del Coso respalda el grupo, y eso cambia aliados, objetivos y el final (§4). Las Goteras son terreno. La Presión de Vapor es la caldera del reino. El Coso pita **en la barra de turnos**.

---

## 1. Pilares de diseño (v2)

1. **Historia y batalla juntas.** Cada batalla existe por un motivo de la historia y su objetivo lo cuenta (llegar al archivador, proteger a la vendedora, parar la Desmontadora). Cada escena termina en algo que hacer. Nunca una historia pegada encima del juego, nunca un combate de relleno. La campaña es **persistente**: si pierdes, reintentas la batalla; la partida nunca se borra.
2. **Caos justo en el tablero, caos total en el mundo.** El caos se elige, se telegrafía y se mitiga: la Presión se ve, las mechas están en la barra de turnos, las Goteras avisan un pitido antes, la previsión dice qué pasará «si nada cambia». No hay tiradas ocultas, ni probabilidad de fallar, ni críticos aleatorios. Y el fuego amigo existe: la explosión también te cae a ti si te quedas cerca. El mundo, en cambio, no tiene por qué tener sentido. El jugador siempre entiende *qué hace su acción*; jamás entiende *por qué el reino es así*.
3. **Democracia por error administrativo.** Los cuatro héroes son legalmente **una sola persona**, la Persona Colectiva nº 88-88, y sus estatutos exigen votar por mayoría. Las decisiones importantes se votan en **La Balanza** (§4). Las pistas que encuentras explorando se convierten en argumentos para persuadir a tus compañeros. La política no es un menú: es un sistema con su propia ficción.
4. **Sátira sin asco.** El humor vive en el contenido (nombres, diálogos, enemigos-institución, cláusulas, el Narrador) y las reglas son legibles y justas. El poder es caricatura; el pueblo es humano (§9.0). Cínicos con las instituciones, nunca crueles con las víctimas.
5. **Pixel con forma + Mundo vivo.** Siluetas reconocibles, paleta bloqueada, ilustración solo para la historia. Y **nada está quieto**: todos los escenarios (tableros, mapas de exploración, fondos) y **todos los personajes** (héroes, enemigos, jefes, NPCs, Brayan) tienen animación real en pixel art, incluido el reposo. Las animaciones por código complementan, nunca sustituyen (§9.3).
6. **Guardarraíl de alcance v2.** Las rutas son **variantes de una columna fija**: mismos capítulos, mismos mapas, mismos jefes; los votos cambian la variante de la batalla clímax, el favor de facción y las convicciones, y las ramas **reconvergen** al final de cada capítulo. **Máximo 3 opciones por voto.** Toda idea nueva entra primero como contenido (texto, barks, variante de batalla, cláusula de contrato) sobre las mecánicas existentes. Mecánica nueva solo si la aprueba el dueño y cabe en un hito.

---

## 2. Loop de juego

### 2.1 El bucle de un capítulo

```
exploración (cenital, NPCs, pistas)
   → escena corta (≤ 3 min, se puede saltar)
   → [voto en La Balanza, solo en momentos clave]
   → batalla táctica (isométrica, con alturas)
   → resultado  ─┬─ victoria → escena → siguiente beat
                 └─ derrota  → reintentar (misma semilla) o volver a la taberna
   → taberna de Brayan (tienda, contratos, códice, propinas)
```

Un capítulo del slice: ~4 batallas, 1 voto grande, 1 hub explorable, 60–90 minutos.

### 2.2 Persistencia y reintento (modelo Death Howl)

- La campaña se guarda con **checkpoints antes y después de cada batalla y de cada voto**.
- Al perder: **reintentar con la misma semilla** (el jefe lo recuerda y te lo dice: líneas de reintento) o volver a la taberna a reequiparse.
- Nunca se pierde progreso de historia. El reintento no tiene coste más allá del tiempo y la vergüenza.

### 2.3 Guardarraíl de ritmo

- **Ninguna escena dura más de 3 minutos.** Todas se pueden **saltar**, y el Narrador deja una línea de resumen («Resumen: el Gremio os ha denunciado. A los cuatro. Por asociación.»).
- Presupuesto del slice: **≤ 15 minutos de escenas no interactivas** en un capítulo de 60–90.
- Entre dos batallas, como mucho una escena larga (≤ 3 min) y cualquier número de interacciones cortas opcionales en el hub.

### 2.4 Qué se permite en la narrativa interactiva (y qué no)

- **Sí:** convicciones ocultas por héroe (Negocio / Fe / Orden), votos, elecciones cortas (máx. 3 opciones), flags que cambian líneas y variantes, barks condicionales por pareja y por creencia.
- **No:** medidores de afinidad visibles, árboles de diálogo profundos, romances, misiones secundarias ramificadas.

---

## 3. Batallas (resumen; el detalle vive en `docs/diseno/reglas-tacticas.md`)

### 3.1 El tablero

- **Isométrico con alturas** (0–6 niveles), cámara **fija sin rotación**, mapas de hasta 14×14.
- Losetas de 64×32 con escalones de 16 px.
- La altura importa: se sube hasta tu **salto**, se baja un poco más; pegar desde arriba da bonus y desde abajo, malus; el cuerpo a cuerpo exige poca diferencia de altura; caer duele.
- **Orientación:** golpear de lado o por la espalda pega más. Al terminar el turno eliges hacia dónde miras.
- **Empuje:** casilla a casilla, con daño por choque o caída. Empujar a un enemigo a un canal o contra un Prototipo es una jugada, no un accidente.

### 3.2 Reloj de Vapor (orden de turnos)

- Sistema por tiempo de carga (CT) ligero al estilo FFT, con **una barra de turnos visible** en todo momento.
- En la misma barra aparecen, como entradas propias: las **mechas de los Prototipos**, las **Goteras** (un pitido antes de cambiar), los **pitidos del Coso** y las **cargas de los jefes** (la Desmontadora, por ejemplo).
- Esperar sin actuar te devuelve antes a la barra.

### 3.3 Previsión

- **Previsión determinista:** los enemigos muestran qué harían «si nada cambia». No es un compromiso vinculante: si los empujas o cambias el tablero, recalculan.
- **Daño con desglose visible** antes de confirmar: base, fuerza, caldera, altura, orientación, débil, vulnerable. Sin azar.
- **Mover y deshacer:** puedes deshacer el movimiento mientras no hayas actuado.

### 3.4 Presión de Vapor y Sobrecarga

- Medidor **global** 0–10 compartido por todo el tablero (manómetro en el HUD).
- Las habilidades de vapor suben Presión; las de **Válvula** la ventilan.
- **4 o más: la caldera canta**, las habilidades pegan más.
- **8–9:** aviso (tubos rojos, temblor, el manómetro vibra).
- **10: Sobrecarga.** Daño a **TODAS** las unidades del tablero, aliadas y enemigas; la Presión vuelve a 0. Hay jugadas legítimas de detonador.
- **Sobremarcha** (antes Overclock): opcional en ciertas habilidades, más Presión a cambio de doblar el efecto.

### 3.5 Prototipos

- Artilugios que se **colocan en el tablero** con una **mecha** que corre en la barra de turnos.
- Al llegar a 0 **explotan en área, con fuego amigo**.
- Se pueden **empujar** (a los enemigos, o lejos de los tuyos). Si se atacan, **detonan al instante**. Las cadenas de explosiones se resuelven en orden estable y se ven en la previsión.

### 3.6 Goteras

- Casillas que cambian de **era** en ciclo: **paja** (medieval), **respiradero** (steampunk), **antigravedad** (futurista), **neón** (cyberpunk). Cada era es un terreno con sus reglas.
- **Siempre avisan un pitido antes** y titilan en el color de la era que llega.

### 3.7 Objetivos

- `rout` (derrotar a todos), `defeat` (derrotar a uno), `survive` (aguantar N turnos), `reach` (llegar a una casilla), `interact` (usar algo del tablero). Condiciones de derrota propias por batalla (la Desmontadora llega a 0, muere el NPC protegido…).
- **IA determinista por utilidad**, con perfiles: agresivo, cobarde, guardián, kamikaze y jefe.

---

## 4. Votaciones: La Balanza

La escena de voto es una balanza de latón con tres platillos (máx. 3 opciones). Cada héroe tiene un sello; al votar, lo deja caer en un platillo.

1. **Inclinación inicial:** cada héroe llega con una opción preferida según sus **convicciones ocultas** (Negocio / Fe / Orden) y los flags de la historia.
2. **Persuasión:** el jugador usa **argumentos** desbloqueados con **pistas de exploración** (hablar con NPCs, objetos del hub, resultados de batalla). Sin dados. **Un intento por héroe.** Algunas posturas son **líneas rojas** que ningún argumento cruza (y el héroe lo dice con gracia).
3. **El protagonista del capítulo** vota lo que elija el jugador.
4. **Empate:** desempata **Brayan**, porque su taberna es el domicilio social de la Persona Colectiva. Vota con el héroe que más **propina** le ha dejado.
5. **Efectos:** las convicciones de cada héroe suben según su voto (ocultas); el **favor de facción** sube o baja (visible como encuestas en el códice). El voto decide la **variante** de la batalla clímax.

Canon, votos y opciones: Biblia §8. Voto 1 completo: `capitulo-1.md` §5.

---

## 5. Unidades

### 5.1 Los cuatro héroes

Siempre los cuatro en el grupo (son una persona jurídica; no pueden separarse). Cada uno tiene un rol táctico heredado de su mazo en la v1:

| Héroe | Época | Creencia | Rol táctico | Identidad mecánica |
|---|---|---|---|---|
| **La Ingeniera Desahuciada** | Steampunk (nativa) | Agnóstica | Artillera de caos | Coloca **Prototipos**, sube Presión, Sobremarcha |
| **El Clérigo del Vapor Bendito** | Medieval | Devoto | Apoyo y control | **Feligreses** (brío por sermones), milagros-placebo con efecto visible, Válvula |
| **La Historiadora Varada** | Futurista | «La que sabe» | Información y precisión | **Spoilers**: ve la previsión extendida, retrasa enemigos en la barra, «ya leí esta batalla» |
| **El Reparador No Autorizado** | Cyberpunk | Oportunista | Empuje y sabotaje | **Glitches**: reprograma Prototipos enemigos, empuja, «actualizaciones» con efecto previsto |

La regla «nerfeado porque sí» de la v1 se mantiene: la tecnología del futuro pega números normales y el Narrador asume la culpa en el texto de la habilidad.

### 5.2 Mercenarios (tablón de contratos de Brayan)

- Se contratan **por capítulo** en el tablón de la taberna y son **unidades completas** en el tablero.
- Cada contrato tiene **cláusulas absurdas que son reglas reales**, visibles antes de firmar («no trabaja martes», «se va si la miras feo» = rescinde si le cae fuego amigo). El contrato vence al final del capítulo.
- Slice: **el Matón gallego** y **la Boticaria chilanga**. Elenco completo en la Biblia §11.

### 5.3 Estadísticas y progresión

- Vida, ataque, defensa, velocidad, movimiento, salto, **brío** (recurso por unidad) y estados (vulnerable, débil, veneno, fuerza).
- Progresión ligera por capítulo (habilidades nuevas por historia, no por grindeo) y **accesorios** (las antiguas reliquias; ver `capitulo-1.md` §8).
- Números en `reglas-tacticas.md`.

---

## 6. La Taberna de Brayan (hub)

La taberna está en el rellano de cada piso (Brayan «escala» abriendo sucursales). Es un mapa interior cenital con NPCs vivos, y en ella se hace todo lo que no es batalla:

- **Tienda de Brayan:** tónicos, objetos de batalla, accesorios. Precios según el favor de facción.
- **Tablón de contratos:** mercenarios del capítulo, con sus cláusulas.
- **Códice «Estado del Reino»:** el tablero de corcho de Brayan («mi tablero de *insights*, bro»). Entradas cronológicas de lo que ha pasado, fichas de personajes y facciones, **encuestas de favor** y un **tablero de conspiración** con hilos rojos como resumen. Modelo: FFT *The Ivalice Chronicles*.
- **Propinas:** al salir, el jugador deja propina en nombre de un héroe. Brayan lo apunta. Brayan desempata votos.
- **Interacciones cortas:** eventos reciclados de la v1 (el Gólem Deprimido, la Ronda del Barón, el Espadachín Atascado…).
- **Doña Remedios**, la madre de Brayan, pared con pared, desmintiéndolo a gritos.

---

## 7. Mundo y personajes

### 7.1 El mundo

Se conserva todo el mundo de la v1: Vaporcracia, la pirámide social, los formularios (Q-12, T-800, D-66), la Iglesia del Vapor Bendito, el Gremio, la Corona. La pirámide es **literal**: la capital es una ciudad escalonada y cada capítulo es un piso. Geografía, lugares y NPCs con nombre: Biblia §2.

**Reglas de eras (guardarraíl heredado):** las épocas **no son cuatro mundos**. El reino, los enemigos, los mapas y la dirección de arte son siempre steampunk-medieval. La época vive en los personajes (habilidades, barks, cómo reaccionan los NPCs) y, en la v2, **en las Goteras del tablero** (una casilla, no un nivel entero).

### 7.2 Acentos marcadísimos (anacrónicos a propósito)

Se mantienen tal cual de la v1. Cada personaje de Gotera habla con un acento regional del español contemporáneo **escrito fonéticamente**, cortesía de las Goteras. Nadie del reino lo comenta jamás.

| Personaje | Acento | Muestra |
|---|---|---|
| La Ingeniera | Paisa (Medellín) | «¡Avemaría pues, esta caldera sí sirve, home!» |
| El Clérigo | Yucateco (Mérida) | «No te asustes, mare, el vapor bendito lo cura todo… por una módica limosna, ¿va?» |
| La Historiadora | Español neutro de doblaje de documental | «Observemos cómo el espécimen local intenta abrir la freidora con una espada. Fascinante. Y triste.» |
| El Reparador | Boricua (San Juan) | «Tranqui, papi, esto lo rooteo en dos minutos.» |
| Brayan | Spanglish de coach | «Bro, mi *workflow* de arar ya no *escala*.» |
| El Barón del Humo | Porteño chamuyero | «Tranquilo, che, la inversión está garantizada.» |
| La Recaudadora | Madrileña funcionaria castiza | «Esto sin sellar no me vale. Vuelva usted mañana.» |
| Mercenarios | Gallego, chilango, andaluz, chileno | Biblia §11 |
| Nativos del reino (Gran Maestre, Doña Remedios, funcionarios) | Castellano de reino: formal, burocrático, sin marca regional | «Rellene el D-66. Por triplicado.» |

**Reglas de escritura:**
1. El acento es **cariñoso y celebratorio**, nunca burla del lugar: el chiste es el anacronismo y el personaje, no su origen.
2. Se escribe con muletillas y música de la región, no con transcripción impenetrable: tiene que leerse rápido.
3. Cada acento es también UX: reconoces quién habla sin leer el nombre. En diálogo, el «blip» de voz tiene un tono por acento.
4. Nunca más de dos muletillas por línea.

### 7.3 Fe contra escepticismo (barks por creencia)

Se mantiene el **eje de creencia** de la v1 (devoto / agnóstico / escéptico / oportunista) como etiqueta de datos en héroes y mercenarios. Alimenta los **barks de pareja** («—Es un dios. —Es un horno. —Los dioses también calientan, hereje.») y las reacciones de los NPCs. En la v2 se suman las **convicciones ocultas** (Negocio / Fe / Orden), que alimentan los votos. Son dos ejes distintos: la creencia es *qué piensas del Coso*; la convicción es *qué quieres hacer con él*.

Barks: sistema por prioridad y enfriamiento sobre eventos tácticos (modelo Hades / Cobalt Core). Presupuesto en `capitulo-1.md` §10.

### 7.4 Guiños pop y anime (sin infringir copyright)

Reglas de la v1, intactas:
1. **Nunca el nombre real, nunca el diseño exacto:** arquetipo + rasgo exagerado + contexto absurdo.
2. **Transformación satírica:** el cameo siempre degradado por la burocracia del reino.
3. **Sin assets ajenos:** todo sale de nuestro pipeline y nuestra paleta.
4. **Densidad controlada:** **máx. 1 cameo por capítulo**, en el hub. El mundo propio es el plato; los guiños son la especia.

Pool de la v1 (FF7, Zelda, Pokémon, Mario, Dragon Ball, Roshi) disponible para capítulos futuros. Capítulo 1: el Espadachín Atascado en la puerta de la taberna.

---

## 8. El Narrador y la cuarta pared

El Narrador es el único ser del universo que sabe qué es una freidora de aire, y no piensa decirlo. Deja caer pistas técnicamente correctas e inútiles («el manual recomienda precalentar 3 minutos; el manual está en un idioma que no existe aún»), se burla de cada explicación nueva y, muy de vez en cuando, te habla a ti.

**Reglas v2 (más estrictas que en la v1, porque ahora hay más historia):**
- **Poco y bien.** Como mucho **15–20 líneas por capítulo**, contando batallas y hub. Las líneas de resumen al saltar escenas no cuentan (son servicio, no comentario).
- **Como mucho 1 ruptura de nivel 3 por capítulo.**
- Como mucho 1 intervención por batalla (salvo la de derrota/reintento).
- Cada línea se marca como vista y no se repite hasta agotar su grupo.

**Tres voces:** (1) el **Narrador**; (2) los **jefes** (entrada, fase, derrota y memoria de reintentos; no gastan presupuesto del Narrador); (3) el **propio juego/UI** (tooltips y textos de derrota que rompen personaje).

**Escala de cuarta pared** (de la v1):
1. **Burla diegética** (común): se ríen del personaje.
2. **Meta-juego** (ocasional): comentan tus decisiones de jugador. «El informe forense dirá "error del operario". El operario eras tú.»
3. **Cuarta pared rota** (rara, memorable): hablan a quien sostiene el ratón. «Tú sí sabes lo que es. No se lo digas.»

Banco de líneas y disparadores tácticos: `docs/diseno/narrador-banco-v1.md` (sección de remapeo).

---

## 9. Dirección de arte

### 9.0 Dirección de personajes: sátira sin asco (se mantiene de la v1)

Regla maestra: **el poder es caricatura; el pueblo es humano.** La exageración la dicta la posición en la pirámide:

- **Las víctimas del sistema** (aprendices, campesinos, vendedores, mercenarios de a pie, los 4 héroes) son **personas normales, atractivas o dignas**: cansadas, remendadas, humanas. La sátira duele más cuando el explotado tiene cara de persona.
- **Los que ostentan poder** (cobradores, juntas, jefes, clero alto) admiten **caricatura grotesca-cómica**: papadas, pelucas torcidas, monóculos. Límite duro: **grotesco ≠ asqueroso**. Nada repulsivo ni que dé grima.
- **La nobleza y la Corona** van al extremo opuesto: **refinados, esbeltos y andróginos hasta lo absurdo**. Dos escuelas: (a) la **andrógina afilada** (el Barón: líneas limpias, aire casi vampírico); (b) la **rococó Versalles / María Antonieta**: cara empolvada de blanco (maquillaje de corte, NO de mimo), rubor, lunar postizo, pelucas monumentales con barcos, jaulas o maquinaria de vapor dentro, joyas excesivas, sedas pastel con bordados de latón. Prompt: «18th century French rococo aristocracy, Marie Antoinette court style, white powdered face makeup (period royal makeup, not mime), rouge, beauty mark, towering powdered wig, excessive jewels».
- **Máquinas y autómatas:** encanto torpe, nunca horror corporal.

Prompts: pueblo y héroes, «sympathetic, dignified, normal human proportions, tired but charming» (evitar «grotesque/creature»); poder, «caricature, pompous, exaggerated features, comedic — NOT disgusting, NOT creepy»; nobleza, «androgynous, elegant, porcelain-perfect, unsettlingly beautiful».

### 9.1 Dos tipos de arte

| Tipo | Dónde | Cómo |
|---|---|---|
| **Ilustración** | Historia: cinemáticas (paneles con paneo), retratos de diálogo, códice, splash de capítulo, finales | Concepts estilo caricatura satírica (Higgsfield), cuantizados hacia la paleta, **siempre dentro de marcos pixel**. Retratos de 256 px con parpadeo y boca de 2 frames |
| **Pixel art** | Juego: batallas, exploración, taberna, UI | PixelLab + retoque en Aseprite. Paleta forzada |

### 9.2 Especificaciones pixel

- Resolución interna **640×360**, escalado entero, `pixelArt: true`.
- **Personajes: un solo set de 64×64 en 8 direcciones**, vista «low top-down», para batalla y exploración. Se dibujan 5 direcciones y 3 se obtienen en espejo. **Jefes a 96×96.**
- Los **sprites laterales aprobados de 128 px** son la **referencia canónica** (nunca se rediseñan) y aparecen en el panel de unidad de la batalla.
- **Losetas isométricas 64×32** (cara superior) + 64×16 de lateral por nivel de altura. **Losetas cenitales 32×32** (Tiled).
- **Parallax** 320×180 en 2–3 capas.
- **Paleta maestra Resurrect 64**; verde gas reservado a lo tóxico; cuantización sin dithering.
- Fuentes: **m6x11 / m5x7** para texto (verificar á é í ó ú ñ ¡ ¿), **monogram** para números, **Press Start 2P** solo títulos. BitmapText.
- Lista completa de assets, tamaños y puertas de aprobación: `docs/diseno/arte-slice.md`.

### 9.3 Mundo vivo (animaciones obligatorias)

Cada pantalla tiene **tres capas de movimiento**:
1. **Losetas y props animados en pixel art:** agua de canal, respiraderos con vapor, rejillas con brasas, Goteras que titilan, engranajes, estandartes, faroles, chimeneas, el Coso con su «88:88».
2. **Ambiente por código:** partículas (vapor, chispas, polvo, hollín), parallax de cielo y horizonte con el faro del Coso, nubes, luz que respira.
3. **Vida en los personajes:** **todos** tienen reposo en bucle; caminar; atacar, herido, KO y celebrar según su rol; los NPCs patrullan o hacen su gesto; los retratos parpadean y mueven la boca.

Hasta los **placeholders se mueven** (peones que respiran, losetas que pulsan): nada se ve estático desde el primer hito. Tabla de animaciones: `arte-slice.md` §3. Presupuesto: set mínimo (lección de Children of Morta), enemigos solo en diagonales, espejo para 3 direcciones.

---

## 10. Alcance del vertical slice: «Capítulo 1: La Patente»

- **Contenido:** prólogo + capítulo 1 completos, **60–90 min**, ≤ 15 min de escenas no interactivas.
- **Batallas:** B0 «Taller Embargado» (tutorial 8×8), B1 «La Plaza del Cráter», B2 «Auditoría en el Archivo», B3 «El Gran Maestre» (3 variantes según el voto).
- **Votos:** V0 (apodo del grupo, tutorial) y **V1 «¿Qué hacemos con la Patente del Coso?»**.
- **Unidades:** 4 héroes, 2 mercenarios (Matón gallego, Boticaria chilanga), 5 enemigos del Gremio (Aprendiz Explotado, Gólem de Latón Defectuoso, Cobrador de Cuotas del Gremio, Inquisidor de Patentes, Autómata de Atención al Súbdito), el Gran Maestre y la Recaudadora (tercer bando).
- **Hub:** 2 mapas cenitales (`distrito_gremio`, `taberna_brayan`), ~10 NPCs con nombre, 5 interacciones recicladas, 1 cameo.
- **Sistemas:** motor táctico completo (Reloj de Vapor, alturas, empuje, Presión y Sobrecarga, Sobremarcha, Prototipos, Goteras de 2 eras, objetivos, IA), La Balanza, guardado de campaña con checkpoints, diálogo v2 (máquina de escribir, blip por acento, saltar con resumen), códice, tienda, contratos, barks, Narrador (≤ 20 líneas).
- **Mundo vivo** completo en todo lo que sale en pantalla.
- **Fuera del slice:** capítulos 2, 3 y final; eras futurista y cyberpunk en el tablero; Bardo y Cartógrafo; voces grabadas; multijugador.
- Criterio de salida: 3 playtesters externos; merge a `main` como **Capítulo 1 gratis** (modelo Deltarune). Ver `docs/ROADMAP.md` (M7).

---

## 11. Qué sustituye la v2 (respecto al GDD v1)

| GDD v1 (`docs/archivo/GDD-v1-cartas.md`) | Qué decía | Qué dice la v2 |
|---|---|---|
| Línea 13 (§0) | El Coso «aparece de la nada» | **Cae del cielo** un martes a las 6:47 y deja un cráter (§0; Biblia §1) |
| Línea 33 (§0, regla de producción) | La premisa es envoltorio narrativo, sin mecánicas; el Coso como reliquia inicial | La premisa **genera mecánicas**: votos, Casilla 7, Goteras como terreno, pitidos del Coso en la barra. El Coso deja de ser reliquia |
| Línea 41 (§1.5, guardarraíl) | Toda idea entra como contenido sobre el esqueleto de cartas; única mecánica nueva, la Taberna | **Guardarraíl v2**: columna fija, variantes que reconvergen, máx. 3 opciones por voto (§1.6) |
| Línea 116 (§4.4) | Sin medidores de relación ni árboles de diálogo | Se permiten **convicciones ocultas, votos y elecciones cortas**; siguen prohibidos los medidores de afinidad y los árboles profundos (§2.4) |
| §2 Loop | Mapa de nodos, 3 energía, mano de 5, recompensas 1 de 3, runs de 20–30 min | Campaña persistente: exploración → escena → voto → batalla táctica → taberna (§2) |
| §3 Mecánicas de caos | Presión, Prototipos y Overclock como cartas | Presión y Sobrecarga **globales en el tablero**; Prototipos **colocados con mecha**; Overclock → **Sobremarcha**; + Goteras (§3) |
| §4 Personajes | Selección de época por run; mazos | Los **cuatro juntos** desde el prólogo; la pregunta de siglo es **diegética** (T-800); roles tácticos (§5.1) |
| §4 (Barón) | Candidato a 5.º jugable | **Antagonista oculto y jefe final** (Biblia §5.2) |
| §5 Enemigos | «El Recaudador» del Gremio | **Cobrador de Cuotas del Gremio** (id de sprite `recaudador` sin cambios) |
| §7 Taberna | Nodo de mapa; mercenario como mini-baraja de 3 cartas | **Hub persistente** con tienda, contratos, códice y propinas; mercenarios como **unidades completas** (§5.2, §6) |
| §9 Arte | Héroes 96×96, jefes 128–160, cartas 100×140, marcos de carta | **64×64 en 8 direcciones**, jefes 96, losetas iso 64×32, **Mundo vivo**; se retiran los marcos de carta (el arte de las 7 cartas pasa a iconos de habilidad) (§9) |
| §10 Alcance | 1 personaje, 30–35 cartas, 1 acto de 12–15 nodos | Prólogo + Capítulo 1, 4 batallas, 1 voto, hub (§10) |
| Narrador (§6) | 1–2 intervenciones por combate; ~30 líneas por run | ≤ 15–20 líneas por capítulo; ≤ 1 ruptura de nivel 3 por capítulo (§8) |

**Se conserva de la v1:** el mundo y las facciones; las reglas de eras; los acentos y sus reglas de escritura; los cameos y sus reglas legales; los niveles de cuarta pared; «sátira sin asco» y la escuela rococó; la paleta y las fuentes; la regla de los dos artes.

---

## 12. Arquitectura (resumen)

Core sin Phaser en `src/core/` (reglas tácticas, historia y votos como funciones puras, RNG sembrado splitmix32 con streams) → eventos (`TacticalEvent[]`) → cola de animaciones en las escenas de Phaser. `createBattle` / `dispatch(state, intent) → {state, events}` y consultas puras (`reachable`, `previewDamage`, `forecast`…). Guiones como `ScriptNode` con un ejecutor puro `step()`. Tests de Vitest (reglas, determinismo con 50 semillas, contenido), smoke de Playwright, CI y previews de Vercel por rama. Detalle: `docs/DECISIONES-TECNICAS.md` y `docs/diseno/reglas-tacticas.md`.
