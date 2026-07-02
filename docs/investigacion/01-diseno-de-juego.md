# Investigación 01 — Diseño de juego: deck builder roguelite steampunk-medieval con sátira social y caos

Contexto: 2D pixel art, Phaser (navegador), equipo de 1 persona + IA. Números de juegos de referencia verificados contra wikis/fuentes de julio 2026 (listadas al final).

---

## 1. Juegos de referencia del género

### Slay the Spire (Mega Crit, EA 2017 → 1.0 2019) — el patrón oro
- **Estructura de partida**: mapa de nodos ramificado, 3 actos (+Acto IV opcional). Cada acto: ~15–16 pisos con nodos de combate, élite, evento "?", tienda, hoguera (descansar/mejorar carta), cofre, y jefe al final. El jugador ve todo el acto de antemano → el *pathing* (ruta arriesgada con élites vs. ruta segura) es la primera decisión estratégica del juego.
- **Combate**: 3 energía/turno, roba 5 cartas, la mano no jugada se descarta al final del turno, el mazo se rebaraja al agotarse. Clave universal: **intents de enemigos visibles** (icono que dice qué hará el enemigo) — convierte cada turno en un puzle determinista. Mazo inicial: ~10 cartas (5 Strike, 4–5 Defend, 1 carta de clase).
- **Contenido**: ~75 cartas por personaje (cifra deliberada: más cartas hacían la construcción "azarosa"), ~35 incoloras, ~180 reliquias en 1.0, 4 personajes. Rarezas: común/infrecuente/rara + status + maldición. Costes típicos: 0–3.
- **Meta-run**: desbloqueos por XP de partida (~3 "packs" por personaje). Ligero a propósito: la progresión real es el conocimiento del jugador. Ascension: 20 niveles de dificultad apilables.
- **Por qué destaca**: información perfecta (intents) + azar solo en el robo y las ofertas, nunca en la resolución.

### Monster Train (Shiny Shoe, 2020)
- 8 anillos, combates tower-defense en 3 pisos verticales + la Pyre (tu vida). **Clan primario + secundario** → 25 combinaciones con 5 clanes, cada clan con 2 campeones mejorables.
- Ember (energía) que crece durante el combate; unidades persistentes + hechizos; capacidad por piso → posicionamiento.
- **Lección**: la **combinación de dos pools** multiplica variedad sin multiplicar contenido — muy relevante para un equipo de 1.

### Balatro (LocalThunk, 2024)
- 8 antes × 3 blinds (Small/Big/Boss); los Boss Blinds imponen reglas distorsionadoras. La "build" son los **150 Jokers** (105 base + 45 desbloqueables) que modifican el scoring multiplicativamente.
- Manos y descartes por ronda en vez de energía; economía con **interés** (+1$ por cada 5$ ahorrados) — micro-decisión de riesgo brillante.
- **Lección**: números que explotan = dopamina; el humor vive en el *flavor text* de los Jokers (modelo perfecto para la sátira); UI/juice hace el 50% del atractivo — replicable en Phaser con tweens.

### Inscryption (Daniel Mullins, 2021)
- Costes alternativos (sangre/huesos), balanza de daño, sigils transferibles.
- **Lección**: la **personalización agresiva de cartas concretas** crea apego; un deck builder puede cargar toneladas de narrativa/tono sin tocar las reglas.

### Wildfrost (Deadpan Games, 2023)
- Sin energía; cada carta tiene un **contador** visible que la dispara automáticamente. Tu líder muere = fin de run.
- **Lección positiva**: contadores visibles = caos determinista y legible. **Lección negativa**: lanzó demasiado difícil y con demasiada varianza → review-bombing parcial. El caos sin mitigación quema a los jugadores.

### Griftlands (Klei, 2021)
- DOS mazos por personaje (combate y **negociación**); sistema de relaciones con boons/banes.
- **Lección**: la negociación es cara de producir (no para el MVP), pero los **boons/banes sociales** son baratos y perfectos para sátira.

### Otros relevantes
- **StarVaders** (2025): medidor de **Heat** — cartas potentes generan calor, sobrecalentarte castiga. La referencia directa más cercana a la "presión de vapor".
- **Cobalt Core**: 3 tripulantes por run; humor en diálogos de combate — sátira ligera barata.
- **Peglin**: RNG físico visible — el azar gusta cuando es *espectáculo*, no tirada oculta.
- **Vault of the Void**: elimina casi todo el azar; demuestra que hay público que odia el caos → el caos debe ser **opt-in**.
- **Slay the Spire 2** entró en EA en marzo 2026; 850+ juegos con el tag en Steam ya en 2024: **la temática y el tono satírico son el diferenciador, no las mecánicas base**.

---

## 2. Mecánicas de caos / riesgo-recompensa

### Cómo lo hacen los existentes
| Juego | Mecánica | Por qué funciona (o no) |
|---|---|---|
| StS – Status/Curses | Cartas basura inyectadas al mazo | **Diluir el mazo** es el castigo más elegante: no te mata, te frena |
| StS – Snecko Eye | Robas 7 pero costes aleatorios 0–3 | Caos **elegido** y estadísticamente positivo → construyes alrededor del caos |
| StS – élites/eventos | Riesgo elegido por pathing | El mapa ES la mecánica de riesgo-recompensa |
| Balatro – Jokers de probabilidad | "1 en 2 de x1.5 mult" | Varianza acotada: el fallo es "no pasa nada", nunca "pierdes" |
| Inscryption – sacrificio | Destruyes recursos propios | El coste doloroso hace memorables las jugadas |
| Wildfrost – contadores | Todo telegrafiado, cero tiradas | "Caos determinista": complejidad emergente sin RNG |
| StarVaders – Heat | Medidor global que castiga el exceso | Push-your-luck de medidor visible |

**Principios de caos justo**: (1) el caos se **elige**, no se impone; (2) se **telegrafia** (medidor, fusible, contador — nunca tirada oculta); (3) es **mitigable** con cartas/reliquias drafteables; (4) varianza **acotada** (el peor resultado frena, no destruye la run); (5) idealmente el caos también salpica a los enemigos.

### 5 diseños concretos propuestos

1. **Presión de Vapor (medidor global, 0–10)** — LA mecánica identitaria. Cartas potentes tienen "Presión: +N". A presión 4–7, bonus (+25% daño: "la caldera canta"); a 8–9, aviso visual (tubos rojos, temblor); a 10, **Sobrecarga**: explosión que daña a TODOS (enemigos incluidos) y purga la presión. Cartas "Válvula" ventilan presión convirtiéndola en bloqueo/robo. Justo porque: medidor visible, umbral conocido, la explosión daña también al enemigo (a veces la QUIERES), y hay builds de "detonador".
2. **Fusible visible (cartas Prototipo)** — cartas ~30% sobre la curva con contador de usos: "Explota tras 3 usos" (al tercer uso: daño a ti + se destruye). Cero RNG: préstamo con vencimiento conocido. Cartas de "Reparar" reinician el fusible.
3. **Ruleta de Engranajes (azar entre opciones todas buenas)** — cartas con 3 resultados posibles, **todos jugables**, mostrados en la carta. Cartas "Calibrar" fijan el próximo giro. Regla de hierro: el azar decide *cuál* premio, nunca *si* hay premio.
4. **Contrabando (maldiciones opt-in satíricas)** — en tiendas/eventos: reliquia potente + maldición pegada ("Impuesto Real: cuando robas esta carta, pagas 5 de oro"). Siempre un TRATO que el jugador firmó. Purgarlas es caro (la burocracia de salir del sistema también es sátira).
5. **Sobrecarga elegida (Overclock)** — keyword: "Overclock (opcional): paga 2 de Presión extra → efecto doblado". Cada turno es una micro-apuesta; todo el mazo interactúa con el caos.

**Recomendación**: implementar 1+2+5 en el MVP (comparten el recurso Presión → sistema cohesivo); 3 y 4 son contenido incremental.

---

## 3. Sátira social en juegos

### Referentes y técnicas
- **Papers, Please**: la sátira ES la mecánica — te vuelves cómplice porque los incentivos (pagar el alquiler) te empujan. Técnica: *incentivos perversos jugables*.
- **Frostpunk**: los humanos como recursos con modificadores; la deshumanización está en la propia UI. Técnica: *la hoja de cálculo como crítica*.
- **Fallout**: corporaciones alegres sobre un mundo que destruyeron. Técnica: *tono publicitario vs. realidad*.
- **Cookie Clicker**: crecimiento exponencial como parodia del capitalismo. Técnica: *escalada absurda + flavor text*.
- **Pony Island / Inscryption**: contratos diabólicos, el propio juego como entidad explotadora. Técnica: *meta-humor*.
- **Balatro**: todo su humor vive en nombres y descripciones de 150 Jokers sin tocar una regla.

### Cómo integrarla (de más barato a más caro)
1. **Nombres y flavor de cartas** (coste cero): "Recorte de Personal" (exhaust una carta aleatoria, gana 2 energía), "Informe Trimestral" (no hace nada; al final del combate, 10 de oro), "Trabajo Voluntario" (el enemigo gana bloqueo, tú robas 1), "Seguro Real contra Incendios (no cubre incendios)". Maldiciones: *Diezmo*, *Tasa de Timbre*, *Peaje del Puente que Nunca se Construyó*.
2. **Enemigos como instituciones**: el *Recaudador* (te roba oro; al morir lo suelta todo +interés), el *Inquisidor de Patentes* (te "confisca" una carta durante el combate), la *Junta del Gremio* (3 enemigos que se buffan y se culpan al morir), el *Autómata de Atención al Súbdito* (cambia de intent aleatoriamente — "su llamada es importante para nosotros").
3. **Eventos de mapa "?"** (coste bajo, altísimo retorno): "El Censo" (declara tu oro: miente y arriesga multa), "Feria de Inventos" (compra un prototipo sin ver stats), "La Cola del Pan" (pierde un turno de mapa, cura 15 HP), "Privatización de la Fuente Curativa" (las hogueras ahora cuestan oro).
4. **Reliquias satíricas**: "Sello Real de Calidad" (no hace nada; se vende por 75), "Mano Invisible" (tienda -50% pero un ítem aleatorio 'agotado').
5. **Jefes como pilares del sistema**: Acto 1 = el Gremio, Acto 2 = la Iglesia del Vapor, Acto 3 = la Corona. La run entera es subir la pirámide social.

**Regla de oro**: la sátira va en **contenido** (nombres, arte, eventos), nunca debe hacer el juego menos legible o menos justo. Un roguelite de 500 runs necesita el tono de Balatro/Fallout: cínico pero divertido.

---

## 4. Alcance realista para MVP / vertical slice

**Dato ancla**: Slay the Spire lanzó en EA (nov. 2017) con 2 personajes, ~75 cartas por personaje, 3 actos, hecho por 2 devs en ~2 años; vendió ~2.000 copias las primeras semanas y explotó por streamers meses después.

### Vertical slice (objetivo: "¿es divertido 20 minutos?") — 4–8 semanas con IA
- **1 personaje** (la Ingeniera: demuestra la mecánica de Presión).
- **30–35 cartas**: 10 iniciales + 20–25 obtenibles (12 comunes, 8 infrecuentes, 5 raras). Menos de 25 y el draft no ofrece decisiones.
- **1 acto de 12–15 nodos** (mapa 7 filas × 2–3 columnas), run de 20–30 min.
- **6–8 enemigos normales** (4–5 encuentros), **1 élite, 1 jefe**.
- **10–12 reliquias, 4–6 eventos "?", 3 consumibles.**
- **Sistemas**: combate (energía 3, mano 5, intents visibles — no negociable), Presión de Vapor, recompensa de carta (1 de 3), tienda, hoguera, derrota/victoria. **Sin meta-progresión todavía.**

### MVP público (demo itch.io / Steam Next Fest) — +2–3 meses
- 50–60 cartas del personaje 1, 12–15 enemigos, 2 élites, 2 jefes, 20–25 reliquias, 8–10 eventos, 2 actos o 1 acto + endless.
- Meta ligera: 6–8 desbloqueos + 3 niveles de Ascensión.
- **Segundo personaje solo después de validar el primero** (cada personaje ≈ 50 cartas + arte: lo más caro del juego).

### Notas Phaser (1 persona + IA)
- Cartas como **datos + sistema de efectos por keywords** — la IA genera contenido casi gratis si el motor es data-driven.
- Escenas separadas: Boot/Map/Combat/Reward/Shop/Event. Combate = máquina de estados.
- Cartas de 1 ilustración estática + tweens dan el "juice" tipo Balatro sin animación por frames. **Presupuestar el juice: es la mitad de la sensación de calidad del género.**
- Navegador = sesiones cortas: runs de 20–30 min y autosave obligatorios.

---

## 5. Cuatro clases jugables propuestas

1. **La Ingeniera Desahuciada** *(el precariado creativo: crunch, patentes robadas, "exposición como pago")*
   - **Mazo**: construye **Artilugios** — cartas-máquina persistentes que disparan efectos cada turno. Sus mejores cartas son *Prototipos* con fusible visible.
   - **Caos**: la especialista en Presión — la genera más rápido que nadie pero tiene las únicas cartas que convierten la Sobrecarga en arma dirigida. Fantasía: "esto no debería funcionar, y por eso funciona".
   - **Personaje inicial recomendado**: enseña las dos mecánicas nucleares.
2. **El Barón del Humo** *(aristocracia rentista: especulador, "demasiado noble para quebrar")*
   - **Mazo**: el **oro como segundo recurso de combate** — cartas que cuestan oro ("Contratar Mercenario: 15 de oro, 12 de daño"), soborna enemigos, genera interés al final de cada combate si no gastó.
   - **Caos**: apostador — cartas de "doble o nada". Nunca arriesga su vida: arriesga su cartera... hasta que la deuda toca HP.
3. **El Clérigo del Vapor Bendito** *(el vendehumo: televangelista medieval, industria del wellness)*
   - **Mazo**: acumula **Feligreses** (stacks por "sermones") y los **recauda** con colectas que escalan. Sus "milagros" son placebos que se transforman al jugarse. Inyecta cartas basura ("Reliquia Falsa") en el mazo *enemigo*.
   - **Caos**: caos *exportado* — él vive ordenado, sus víctimas no. La clase de control.
4. **La Recaudadora Mayor** *(el Estado extractivo: burocracia fiscal, deuda soberana)*
   - **Mazo**: **Deuda** — juega cartas por encima de su energía acumulando Deuda; cada 3 turnos "vence el plazo" (telegrafiado) y paga con HP + intereses. Cartas de "Embargo" que roban buffs, bloqueo y cartas del enemigo.
   - **Caos**: bomba de relojería determinista — máximo poder inmediato con vencimiento visible. Alto riesgo/alto skill.

Las cuatro cubren los 4 perfiles de jugador (motor, económico/apostador, control, high-roller) y forman la pirámide social del mundo: trabajo, capital, fe y Estado — los cuatro jefes finales pueden ser las versiones corruptas de estas mismas instituciones.

---

### Fuentes principales
- [Slay the Spire — Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire) · [StS 1.0: Farewell Early Access — Steam](https://steamcommunity.com/games/646570/announcements/detail/1714084208003916507)
- [Balatro: 120→150 Jokers — PC Gamer](https://www.pcgamer.com/games/card-games/balatro-was-only-supposed-to-have-120-jokers-but-instead-of-correcting-a-publisher-mistake-localthunk-just-made-30-more-of-them/) · [Balatro Wiki — Jokers](https://balatrowiki.org/w/Jokers)
- [Monster Train — BlueStacks guide](https://www.bluestacks.com/blog/game-guides/monster-train/mstn-beginners-guide-en.html) · [Monster Train Wiki](https://monster-train.fandom.com/wiki/Cards)
- [Rogueliker — roguelike deckbuilders](https://rogueliker.com/roguelike-deckbuilders/) · [Wikipedia — Roguelike deck-building game](https://en.wikipedia.org/wiki/Roguelike_deck-building_game)
- [EGM — Frostpunk, Papers Please y deshumanización](https://egmnow.com/not-quite-human-frostpunk-papers-please-and-the-dehumanization-of-totalitarianism/) · [Vice — Cookie Clicker](https://www.vice.com/en/article/cookie-clicker-wasnt-meant-to-be-fun-why-is-it-so-popular-8-years-later/)
