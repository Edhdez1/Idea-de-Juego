# GDD — «El Coso del Rey»

> Deck builder roguelite steampunk-medieval y sinsentido total. Una freidora de aire cae del cielo en un reino que no está preparado para ella, y toda la pirámide social pierde la cabeza intentando explicar qué es. Tú subes esa pirámide a golpe de cartas… y tus propias cartas pueden explotarte en la mano.

**Formato**: juego web (navegador, desktop primero con soporte táctil), pixel art de alta legibilidad, sesiones de 20-30 min.
**Idioma**: español primero, textos en archivos de datos separados (traducibles después).
**Stack**: Phaser 4 + TypeScript + Vite + Vitest · PixelLab + Higgsfield (arte IA) · Playwright · Vercel.

---

## 0. Premisa: el Coso

Una mañana cualquiera, en la plaza del mercado del reino de **Vaporcracia**, aparece de la nada **una freidora de aire**. Nadie sabe qué es. Nadie sabrá NUNCA qué es — ese es el chiste que sostiene todo el juego.

- Pita tres veces al amanecer (la Iglesia ya declaró día festivo).
- Su pantalla marca «88:88» (los sabios del Gremio llevan meses descifrando la profecía).
- **Fríe sin aceite**, lo cual en un reino medieval-steampunk es, técnicamente, un milagro.
- Todavía tiene el plástico protector puesto. Quitárselo se castiga con la horca.

La estructura narrativa de la run: **cada acto es una institución que se apropia del Coso y da una explicación peor que la anterior**:
- **Acto 1 — el Gremio**: «Es una patente robada de uno de nuestros hornos, obviamente.» La quieren despiezar.
- **Acto 2 — la Iglesia del Vapor**: «Es el Santo Horno que Fríe Sin Pecado» (el aceite es pecado desde el martes). La quieren canonizar.
- **Acto 3 — la Corona**: «Es el legítimo heredero al trono.» La quieren **coronar**. De ahí el título del juego.

Cada personaje jugable persigue el Coso por su propia razón, igual de absurda (ver §4). Ningún final revela la verdad: cada final desbloquea una explicación NUEVA y peor. El único que sabe qué es, es el **Narrador** (§6) — y no piensa decirlo, aunque a veces se le escapan pistas incomprensibles para el reino («necesita 220 voltios; qué pena que eso no exista hasta dentro de 600 años»).

### Las Goteras del Tiempo

El Coso no vino solo. Su aparición **agujereó el tiempo**, y desde entonces al reino le caen anacronismos como a un techo viejo le caen goteras: personas de otras épocas, palabras que aún no existen, acentos de lugares que aún no se fundan, y héroes que claramente pertenecen a otras historias. Nadie del reino lo encuentra raro — la burocracia ya tiene un formulario para ello (el T-800: «Solicitud de Registro de Persona Temporalmente Desplazada»).

Las Goteras son el pegamento del lore: **justifican los personajes de otras épocas (§4), los acentos anacrónicos (§4.2), los cameos pop (§8) y al propio Coso** con una sola regla del mundo. Y son inagotables como fuente de contenido: cualquier cosa puede caerse por una gotera.

**Regla de producción**: la premisa es *envoltorio narrativo* — vive en eventos, diálogos de jefes, flavor y el Narrador. No añade sistemas mecánicos. El Coso puede ser, mecánicamente, la reliquia inicial de la run.

## 1. Pilares de diseño

1. **Caos justo en las reglas, caos total en el mundo**: mecánicamente el caos se elige, se telegrafia y se mitiga (nunca una tirada oculta que te mata; el peor resultado te frena, no destruye la run — y a veces la explosión le cae también al enemigo). Narrativamente, en cambio, NADA tiene por qué tener sentido: el mundo es un sinsentido estilo South Park sostenido con cara seria. El jugador siempre entiende *qué hace su carta*; jamás entiende *por qué el reino es así*. Esa asimetría es el tono del juego.
2. **Sátira en el contenido, no en las reglas**: el humor vive en nombres de cartas, flavor text, enemigos-institución, eventos, acentos y el Narrador. Las reglas siguen siendo legibles y justas (tono Balatro/Fallout/South Park: cínico pero divertido).
3. **Pixel con forma**: sprites 64-96 px con silueta reconocible (franja Blasphemous/Wargroove), paleta maestra bloqueada, e ilustración de alta resolución solo donde toca (splash de selección, arte de carta, eventos) siempre dentro de marcos pixel.
4. **El feel es la mitad del juego**: los jugadores miran las cartas, no a los personajes. Frames donde se mira, código (tweens, shake, partículas) donde se siente.
5. **Guardarraíl de alcance**: toda idea nueva (premisa, guiños, acentos, taberna) debe entrar como **contenido** (texto, eventos, retratos, barks) sobre el mismo esqueleto mecánico. La única mecánica nueva aprobada es la Taberna/mercenarios (§7), y entra escalonada.

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

## 4. Personajes jugables: las cuatro épocas

Por las Goteras del Tiempo (§0) no solo cayó el Coso: cayeron *personas*. Los personajes jugables vienen de **cuatro épocas**, y cada época define su relación con el Coso, su estilo de mazo y su lectura del mundo. **Importante (guardarraíl)**: las épocas NO son cuatro mundos — el reino, los enemigos, el mapa y la dirección de arte son siempre los mismos (steampunk-medieval). La época vive en el personaje: su mazo, su splash, sus barks y cómo reaccionan los eventos ante él. Así la variedad se multiplica sin multiplicar la producción del mundo.

**Selección de época**: en la primera partida el juego pregunta al jugador de qué época viene («Solicitud T-800: marque su siglo de origen») y eso define su personaje inicial. Las demás épocas se **desbloquean como rutas** completando runs (la meta-progresión del MVP): cada época desbloqueada añade su personaje, sus cameos de evento y su epílogo con una explicación nueva del Coso.

| Época | Personaje | Sátira de | Relación con el Coso | Mecánica de mazo |
|---|---|---|---|---|
| **Steampunk** ⭐ inicial del slice | **La Ingeniera Desahuciada** | El precariado creativo (crunch, patentes robadas, «pago en exposición») | **Agnóstica**: sabe que fríe; no sabe CÓMO fríe sin aceite. «¿Será magia? No. ¿Entonces? …¿será magia?» Le arde no poder abrirla (el plástico protector es sagrado) | **Artilugios** persistentes + Presión/Prototipos: la especialista en caos elegido |
| **Medieval** | **El Clérigo del Vapor Bendito** | El vendehumo (televangelista medieval, wellness) | **La adora como a un dios**: fundó su culto («la Freidora da y la Freidora quita el aceite») y vive de administrar sus pitidos como profecías | **Feligreses** (stacks por sermones) → colectas que escalan; milagros-placebo; inyecta «Reliquias Falsas» al mazo enemigo |
| **Futurista** | **La Historiadora Varada** | La academia y el sabelotodo insufrible (y la tragedia de Casandra) | **Sabe EXACTAMENTE qué es** — su tesis doctoral fue sobre electrodomésticos del siglo XXI. Nadie le cree. Cada vez que lo explica, el reino aplaude «qué imaginación» | **Spoilers**: información como recurso — ve el próximo intent extra de los enemigos, mira/ordena el top del mazo, «ya leí este combate» |
| **Cyberpunk** | **El Reparador No Autorizado** | El tech-bro de barrio: jailbreaks, suscripciones, «todo es una oportunidad de negocio» | **Le da igual qué es**: quiere rootearla, meterle firmware pirata y venderle al reino el plan premium de algo que era gratis | **Glitches/Suscripciones**: cartas que se «actualizan» solas al jugarse (mejoran o ganan bugs), deuda técnica que estalla telegrafiada |

**El Barón del Humo y la Recaudadora Mayor** no desaparecen: pasan a ser pilares del mundo — el Barón es el NPC estrella de la Taberna y los eventos de inversión (y candidato a 5.º jugable post-MVP); la Recaudadora es élite recurrente al servicio de la Corona (perseguirte a TI es su arco).

### 4.1 Tecnología de otras épocas: «Nerfeado porque sí»

Los personajes futurista y cyberpunk llegan con objetos que deberían romper el juego, y esto se resuelve **con la cuarta pared, no con excusas de lore**: sus cartas tienen números normales y el Narrador asume la culpa en el flavor. Es una mina de humor que convierte un problema de balance en identidad:

- *«Láser Desintegrador de Antimateria» — Inflige 8 de daño.* («Debería vaporizar el continente. Lo dejé en 8 por equilibrio narrativo. De nada.» — el Narrador)
- *«Katana Monomolecular» — Inflige 7 de daño.* («Corta átomos. También corta mi paciencia con los números grandes.» — el Narrador)
- La Historiadora tiene una carta que literalmente se llama *«En Mi Época Esto Era Instantáneo»* (roba 2; el Narrador: «aquí se roba de una en una, señora, hay cola»).

### 4.2 Por qué persigue cada uno el Coso (todas las razones son igual de malas)

- **La Ingeniera**: el Gremio la acusó de haber construido el Coso *sin licencia*. Sube la pirámide para demostrar que no lo hizo… o para reclamar la patente si resulta que vale oro. Aún no lo decide.
- **El Clérigo**: fue el primero en declararlo milagro y ahora la Iglesia oficial le robó el negocio. Quiere recuperar *su* reliquia y su diezmo.
- **La Historiadora**: si documenta «el Incidente de la Freidora» con rigor académico, quizá la rescaten… o al menos le publiquen el paper. Necesita el Coso como evidencia primaria.
- **El Reparador**: detectó que el Coso es el único dispositivo del reino con puerto de carga. Quien controla el único enchufe del medievo, controla el mercado.

### 4.3 Acentos marcadísimos (anacrónicos a propósito)

Cada personaje habla con un acento regional del español contemporáneo **escrito fonéticamente** en sus barks, flavor y diálogos — cortesía de las Goteras del Tiempo, y nadie del reino lo comenta jamás:

- **La Ingeniera** — *paisa* (Medellín): «¡Avemaría pues, esta caldera sí sirve, home!»
- **El Clérigo** — *yucateco* (Mérida): «No te asustes, mare, el vapor bendito lo cura todo… por una módica limosna, ¿va?»
- **La Historiadora** — **español neutro de doblaje de documental** (el «acento» más artificial de todos): «Observemos cómo el espécimen local intenta abrir la freidora con una espada. Fascinante. Y triste.»
- **El Reparador** — *boricua* (San Juan): «Tranqui, papi, esto lo rooteo en dos minutos. ¿Garantía? La garantía la perdiste al nacer en este siglo, bro.»
- **El Barón** (Taberna) — *porteño chamuyero*: «Tranquilo, che, la inversión está garantizada. ¿Vos me viste cara de mentiroso?»
- **La Recaudadora** (élite) — *madrileña funcionaria castiza*: «Esto sin sellar no me vale. Vuelva usted mañana.»
- Los **mercenarios de la Taberna** (§7) amplían el mapa: un gallego, una chilanga, un andaluz cerrado, un chileno que nadie entiende… y el Primo Brayan (§7).

**Reglas de escritura**: (1) el acento es *cariñoso y celebratorio*, nunca burla del lugar — el chiste es el anacronismo y el personaje, no su origen; (2) escrito con muletillas y música de la región, no con transcripción impenetrable (debe seguir leyéndose rápido); (3) cada acento es también un diferenciador de UX: reconoces quién habla sin leer el nombre. A futuro, voces con ElevenLabs.

### 4.4 La trama según tu grupo (fe contra escepticismo)

La composición de tu party cambia el tono de la run **por contenido condicional, no por sistemas nuevos**:

- **Barks de pareja**: si llevas un mercenario creyente del Coso y tu personaje es escéptico (o viceversa), discuten entre combates con líneas condicionales («—Es un dios. —Es un horno. —Los dioses también calientan, hereje»). Data-driven: cada bark declara requisitos (`{ requires: { belief: 'devoto' }, versus: { belief: 'escéptico' } }`).
- **Eventos con variante por época/creencia**: el mismo evento "?" se lee distinto según quién eres — ante el altar de la freidora, el Clérigo puede oficiar misa (+Feligreses), la Historiadora puede corregir la liturgia (los fieles se ofenden: combate), el Reparador puede cobrar entrada.
- **El eje de creencia** (devoto / agnóstico / escéptico / oportunista) es una etiqueta de datos en personajes y mercenarios que alimenta ambos sistemas. Nada más: sin medidores de relación ni árboles de diálogo.

## 5. Enemigos y jefes (Acto 1: el Gremio)

Enemigos como instituciones, no ratas y slimes:
- **El Recaudador** — te roba oro cada turno; al morir lo suelta todo + interés.
- **Inquisidor de Patentes** — te "confisca" una carta durante el combate.
- **La Junta del Gremio** (encuentro triple) — se buffan entre sí y se culpan al morir.
- **Autómata de Atención al Súbdito** — cambia de intent aleatoriamente (*«su llamada es importante para nosotros»*).
- Relleno temático: aprendices explotados, gólems de latón defectuosos (se autodañan — el caos también es de ellos).

**Jefes por acto**: Acto 1 = **el Gran Maestre del Gremio** · Acto 2 = la Iglesia del Vapor · Acto 3 = la Corona. La run entera es subir la pirámide, y **cada jefe custodia el Coso y defiende SU explicación** (§0) — sus diálogos de entrada, cambio de fase y derrota giran alrededor de ella. Al derrotarlo, su explicación queda oficialmente desmentida… y la siguiente es peor.

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

**El Narrador y el Coso**: es el único ser del universo que sabe qué es una freidora de aire, y su relación con ese secreto es su rasgo definitorio. Nunca lo revela, pero (a) se burla de cada explicación nueva («¿"Santo Horno"? Cada acto lo hacéis mejor, en serio»), (b) deja caer pistas técnicamente correctas e inútiles para el reino («el manual recomienda precalentar 3 minutos; el manual está en un idioma que no existe aún»), y (c) en el nivel 3 de cuarta pared, apela directamente al jugador como único testigo cuerdo («Tú sí sabes lo que es. No se lo digas. Esto es lo más divertido que ha pasado aquí en siglos»).

Referentes: Hades (narrador que reacciona a tus actos), The Stanley Parable (burla al jugador), Inscryption/Pony Island (el juego como entidad), Undertale (memoria entre partidas), Balatro (humor en flavor text), South Park (sinsentido sostenido con cara seria).

## 7. La Taberna y los mercenarios (el aire a D&D)

La fantasía de «llegar a la taberna y armar tu party» entra como **nuevo tipo de nodo de mapa** (aparece 1-2 veces por acto, como la tienda), no como sistema de combate nuevo. Es el corazón social y cómico del juego: música, jarras, un tablón de anuncios absurdos, y mercenarios contratables con acento propio.

**Implementación escalonada (guardarraíl de alcance):**

- **v1 — vertical slice (barata, cero cambios al motor de combate)**: el mercenario contratado es un **Contrato** — una mini-baraja de 3 cartas «Órdenes» que se mezcla en tu mazo (ej. el matón gallego añade 3× «¡Marchando!»: 8 de daño; la boticaria chilanga añade 3× «Remedio casero»: cura 4, 50/50 de aplicar Veneno… a alguien). Su retrato aparece junto a las reliquias y suelta barks al jugar sus cartas. El contrato **vence al final del acto** con cláusulas absurdas de rescisión («no trabaja martes», «cobra extra si hay autómatas», «se va si lo miras feo» — reliquia-maldición temporal).
- **v2 — post-slice (si v1 diverte)**: el mercenario como **aliado en tablero** — sprite de 64 px detrás del héroe, 1 acción simple por turno (patrón intents, como un enemigo amigo), puede morir (y su funeral cuesta oro).
- La Taberna también ofrece: rumores (pistas falsas sobre el Coso, a 5 de oro el rumor — todos contradictorios), beber (cura HP, añade la carta «Resaca» al mazo), y el tablón de misiones absurdas (mini-objetivos de run: «gana un combate con la caldera a 9» → recompensa).

**Elenco inicial de mercenarios** (cada uno = retrato + 3 cartas + ~6 barks + etiqueta de creencia para §4.4): el **Matón gallego** («¡Home, xa vou!», devoto), la **Boticaria chilanga** («Órale, esto no sabe a nada bueno, pero jala», escéptica), el **Bardo andaluz** que solo canta rumores falsos del Coso (oportunista), y el **Cartógrafo chileno** al que nadie del reino entiende (sus cartas tienen el texto «???» y efectos sorpresa acotados — caos justo: el rango de efectos se ve en el tooltip).

**El Primo Brayan** (mercenario especial, creencia: «lo que convenga»): campesino del reino que pasó **dos semanas** en la época cyberpunk por una gotera y volvió jurando que se le olvidó su idioma natal. Habla spanglish corporativo con muletillas de coach («Bro, es que mi *workflow* de arar el campo ya no *escala*, ¿me entiendes? ¿Cómo se dice… uhm… "vaca" en este idioma?»). Todo el reino sabe que es de aquí — su madre vive al lado de la Taberna y lo desmiente a gritos. Sus cartas: *«Networking»* (roba 1 por cada aliado/enemigo con acento distinto en combate), *«Mindset»* (bloqueo que se dobla si te dañaste a ti mismo este turno: «los golpes son *feedback*»), *«Pivotar»* (mueve una carta de tu descarte a la mano; Brayan: «esto en mi época era *drag and drop*»). Es la sátira del que emigra dos semanas y vuelve extranjero — cariñosa, porque en el fondo Brayan solo quiere que lo admiren.

## 8. Guiños pop y anime (sin infringir copyright)

El mundo está lleno de cameos parodiados, al estilo Balatro/South Park/Los Simpson. **Reglas legales de oro** (parodia, no copia):

1. **Nunca el nombre real, nunca el diseño exacto**: se alude por silueta de arquetipo + un rasgo exagerado + contexto absurdo. El jugador que conoce la referencia la pilla; el que no, ve un personaje gracioso que funciona solo.
2. **Transformación satírica**: el cameo siempre está degradado por la burocracia del reino (el héroe legendario está haciendo papeleo, el villano icónico cobra por autógrafos).
3. **Sin assets ajenos**: todo el arte sale de nuestro pipeline (PixelLab/Higgsfield) con nuestra paleta; jamás trazar/copiar sprites u obras existentes.
4. **Densidad controlada**: los guiños viven sobre todo en **eventos "?" y la Taberna** (1 cameo por acto como mucho en el slice). El mundo propio es el plato; los guiños son la especia.

**Pool inicial de cameos (eventos "?")**:
- *Un espadachín rubio de pelo puntiagudo* con una espada absurdamente grande, atascada en la puerta de la Taberna. Lleva tres días. Nadie lo ayuda porque «el seguro no cubre espadas emocionales». (guiño FF7)
- *Un caballero de armadura verde con gorro puntiagudo* que insiste en romper TODAS las vasijas del reino buscando rupias. La Recaudadora lo persigue por evasión de impuestos sobre cerámica. (Zelda)
- *Un chaval con gorra* que intenta meter al Autómata de Atención al Súbdito en una jaulita esférica mientras grita que «ya casi lo tiene». Lleva 47 intentos. (Pokémon)
- *Un fontanero bigotudo del Gremio de Tuberías* en huelga porque «llevan 30 años mandándolo a rescatar gente que no está en su castillo». (Mario)
- *Un saiyajin de peluquería imposible* meditando en un nodo del mapa: si lo esperas 3 turnos de mapa «terminando de cargar su técnica», te da una reliquia. Si no, se ofende. (Dragon Ball)
- *Una tortuga ermitaña maestra de artes marciales* que cobra la clase por adelantado y luego «recuerda» que hoy le duele la espalda. (Roshi)

Cada cameo es un evento con decisión mecánica real (ayudar/ignorar/explotar la situación) — el guiño es el envoltorio, la decisión de riesgo/recompensa es el juego.

## 9. Especificaciones de arte (resumen ejecutivo)

### 9.0 Dirección de personajes: sátira sin asco

Regla maestra: **el poder es caricatura; el pueblo es humano.** El nivel de exageración de un personaje lo dicta su posición en la pirámide, no la palabra «sátira»:

- **Las víctimas del sistema** (aprendices, campesinos, mercenarios de a pie, los 4 héroes jugables) se dibujan como **personas normales, atractivas o dignas** — cansadas, remendadas, pero humanas. Un campesino se ve como un campesino, no como una criatura. La sátira duele más cuando el explotado tiene cara de persona.
- **Los que ostentan poder** (recaudadores, juntas, jefes, clero alto) admiten **caricatura grotesca-cómica**: papadas, pelucas torcidas, monóculos que agrandan el ojo. Límite duro: grotesco ≠ asqueroso. Nada de deformidad repulsiva, babas, ni rasgos que den grima — la meta es la risa, no el rechazo.
- **La nobleza y la Corona** (Acto 3, el Barón) van al extremo opuesto: **refinados, esbeltos y andróginos hasta lo absurdo** — belleza hegemónica pulida como sátira en sí misma (tan perfectos que dan desconfianza). Elegancia excesiva, poses de retrato, ni un pelo fuera de lugar.
- **Máquinas y autómatas**: encanto torpe (el Gólem), nunca horror corporal.

En prompts de IA: para pueblo/héroes evitar «grotesque/creature»; usar «sympathetic, dignified, normal human proportions, tired but charming». Para poder: «caricature, pompous, exaggerated features, comedic — NOT disgusting, NOT creepy». Para nobleza: «androgynous, elegant, porcelain-perfect, unsettlingly beautiful».

- Resolución interna **640×360**, escalado entero, `pixelArt: true`.
- Héroes **96×96**, enemigos 64-96, jefes 128-160. PixelLab: generar a 128, animar con esqueleto (≤128). Set por enemigo: idle 2-4f, attack 4-6f, death 4-6f; el "hit" es tint-flash + knockback por código.
- **Paleta maestra Resurrect 64**; verde-gas reservado a lo tóxico; cuantización Pillow sin dithering; BitForge con paleta forzada.
- Cartas 100×140 lógico; marco pixel codifica tipo (latón=ataque, cobre/tubos=habilidad, hueso=maldición) y rareza; coste dentro de engranaje/válvula; arte 128×96.
- Splash de selección: ilustración 2K Higgsfield cuantizada hacia la paleta, marco pixel, sprite como referencia de diseño.
- Fuentes: **m6x11/m5x7** texto (verificar acentos: á é ñ ¡ ¿), **monogram** números, **Press Start 2P** solo títulos. BitmapText en Phaser.
- Carta explosiva: pulso que acelera + mecha de partículas + humo → anticipación → flash blanco → hitstop → shake → ráfaga de engranajes → secuela de humo.

## 10. Alcance del vertical slice (primer hito)

- 1 personaje (la Ingeniera, época steampunk, con su acento paisa en todo su texto), **30-35 cartas** (10 iniciales + 20-25 obtenibles: 12C/8U/5R). La pregunta de época inicial («Solicitud T-800») y los otros 3 personajes llegan con el MVP público — pero personajes, mercenarios y barks llevan la etiqueta de época/creencia en sus datos desde el día 1.
- 1 acto de 12-15 nodos, **6-8 enemigos** (4-5 encuentros), 1 élite, 1 jefe (el Gran Maestre, con sus diálogos del Coso).
- 10-12 reliquias (incluido **el Coso** como reliquia inicial de la run), 4-6 eventos satíricos (máx. 1 cameo pop), 3 consumibles.
- **Taberna v1**: 1 nodo por acto, 2 mercenarios contratables (Contratos), rumores del Coso.
- Sistemas: combate completo, Presión de Vapor, Prototipos, Overclock, recompensas 1-de-3, tienda, hoguera, Narrador v1 (banco de ~30 líneas), save/load.
- Sin meta-progresión todavía (llega en el MVP público).

## 11. Arquitectura (resumen — detalle en docs/investigacion/04)

Core headless en `src/core/` sin Phaser (estado inmutable + acciones puras + RNG seedeado splitmix32 con streams por dominio) → `GameEvent[]` → cola de animaciones en escenas Phaser. Cartas como datos TS tipados con efectos atómicos e intérprete único. Tests Vitest del core (incl. determinismo), 1 smoke Playwright, CI en Actions, deploy Vercel.
