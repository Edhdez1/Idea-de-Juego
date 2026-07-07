# 05 — Referencias para la alfa de «El Coso del Rey»

> **Regla de oro**: todo lo que sigue es *referencia e inspiración*. Nunca copiamos sprites, sonidos, textos ni nombres literalmente. Anotamos *patrones* y los reinterpretamos en clave steampunk-medieval satírica.
>
> Investigación web realizada el 2026-07-07 (~23 búsquedas/fetches). URLs verificadas al final de cada sección.

---

## 1. UX del loop de run (mapa → combate → recompensa → tienda → descanso)

### 1.1 Mapa de nodos

**Slay the Spire** (el estándar del género):
- Cada acto tiene **17 pisos** con hasta **6 nodos por fila horizontal**; el jugador sube de abajo hacia arriba.
- Cada nodo tiene 1-3 caminos de entrada y 1-3 de salida; dos caminos que salen del mismo nodo nunca llevan al mismo destino (evita rombos triviales).
- Reglas fijas que dan ritmo: **piso 1 = solo combates normales**, **piso 9 = solo cofres/tesoro** (garantiza una reliquia a mitad de acto), **piso 15 = solo hogueras** antes del jefe.
- Iconos legibles a golpe de vista: monstruo, élite (con llama), «?», tienda ($), hoguera, cofre, jefe arriba. El camino recorrido se marca con pisadas.
- Dato curioso: un estudio académico sobre 20.000 runs halló que las runs victoriosas se asocian a rutas de mayor entropía (más riesgo) — el mapa *debe* ofrecer trade-offs reales entre ruta segura y ruta codiciosa.

**Monster Train**: lineal con bifurcaciones binarias (izquierda/derecha) entre anillos; cada rama muestra 2-3 beneficios visibles por adelantado. Menos «mapa», más «menú de dos ofertas». Más simple de implementar que StS.

**Wildfrost**: camino casi lineal con eventos intercalados; la tienda (Woolly Snail) aparece tras el 2.º combate y luego con frecuencia regular.

**Veredicto para HOY**: para la alfa, el modelo **Monster Train** (bifurcación binaria por piso: p. ej. «¿combate + oro» o «¿evento + carta?») es 10× más barato de programar en Phaser que el grafo de StS y conserva la sensación de elección. Para la beta, migrar a un grafo tipo StS reducido (3 columnas × 8-10 filas). Copiar la regla de StS de «fila fija de descanso antes del jefe»: es diseño puro, no contenido.

### 1.2 Pantalla de recompensa («elige 1 de 3»)

- **StS**: tras cada combate, recompensa = oro + poción (probable) + **elección de 1 entre 3 cartas, con botón Skip explícito**. La reliquia Singing Bowl añade un botón alternativo «+2 HP máx.» al lado del Skip — lección: *skippear debe ser una opción visible y a veces premiada*, no un fallo del jugador.
- **Monster Train**: siempre 3 cartas al draftear hechizo/unidad; los jefes sueltan **dos selecciones de 3 cartas** + oro. Las unidades de estandarte ofrecen solo 2 opciones (más impacto, menos ruido).
- **Wildfrost**: tras jefes se eligen exactamente 2 recompensas de un set mixto (3 campanas + 2 charms + corona); permite abrir el inventario *durante* la pantalla de recompensa para aplicar charms antes de elegir la segunda — la pantalla de recompensa es interactiva, no un modal muerto.
- **Peglin**: tras cada combate ofrece un mini-menú de compra: curar hasta **20% de HP**, comprar orbes nuevos o mejorar existentes — fusiona recompensa y tienda en una sola pantalla (barato de implementar).

**Feedback visual al elegir** (patrón común StS/MT/Balatro): la carta elegida escala ~1.1×, brilla, y **vuela con tween hacia el icono del mazo** en el HUD; las no elegidas se desvanecen. Sonido de «carta obtenida» distinto al de robar.

**Veredicto para HOY**: pantalla «elige 1 de 3» con botón **Saltar** siempre visible, hover que escala la carta +10% con borde dorado, y tween de la carta hacia el contador del mazo al confirmar. Es el mínimo que hace que se sienta juego y no formulario.

### 1.3 La tienda

Números de referencia (¡para calibrar la nuestra, no para clonar!):

| Juego | Oferta | Precios relativos | Quitar carta | Extras |
|---|---|---|---|---|
| **StS** | 5 cartas de clase (2 ataque, 2 skill, 1 poder) + 2 incoloras + 3 pociones + 3 reliquias | Común 45-55 oro, rara 135-165+; incoloras +20%; **1 ítem aleatorio siempre con −50% de descuento** | **75 oro, +25 por cada uso** (1 uso por tienda) | Membership Card (−precios), Courier (restock, −20%) |
| **Balatro** | 2 cartas (≈71% Jokers) + 2 booster packs + 1 voucher ($10) | Jokers $4-$8 aprox. | n/a | **Reroll: $5 base, +$1 por uso**; packs/voucher NO se rerollean |
| **Monster Train** | 3 mercaderes temáticos (Acero=unidades, Magia=hechizos, Baratijas=artefactos), 3 ítems cada uno | — | **Purga: 50 oro, +25 por uso** | Refrescar tienda: 50 oro |
| **Wildfrost** | 4 ítems (1 con −50%), dispensador de charms 45/65/85 blings, 1 corona por tienda (80) | escala 45→85 | n/a | El descuento del 50% en 1 ítem crea el «chollo del día» |
| **Backpack Hero** | Baz (rana mercader) con **9 ítems**, en todo piso no-jefe salvo el primero | Precio por rareza; a veces −50% | n/a | **Puedes venderle hasta 3 ítems tuyos** (a precio de oferta); regalo (Tasty Fly) → todo a mitad de precio para siempre |

Patrones transversales accionables:
1. **Siempre hay un descuento visible** (StS −50% en 1 carta, Wildfrost −50% en 1 ítem, Backpack Hero rebajas): el tachado de precio rojo→verde es dopamina barata.
2. **Quitar carta cuesta ~1.5× una carta común y se encarece** (75+25 StS, 50+25 MT): mantiene la purga como decisión, no como rutina.
3. **Reroll encarece** (Balatro $5+$1, MT 50 fijo): da agencia sin romper economía.
4. Feedback al comprar: el precio hace *pop*, suena moneda, el ítem vuela al inventario, y el hueco queda vacío con un cartelito («SOLD OUT» en Balatro). Si no te alcanza, el precio se muestra en rojo y el botón tiembla (shake de 2-3 px).

**Veredicto para HOY**: tienda con **5 cartas + 1 servicio de quitar carta (75 oro, +25) + 1 ítem con descuento del 50% marcado con cartel**. Sin reroll en la alfa (añadirlo en beta a lo Balatro). Precio en rojo + shake si no alcanza el oro.

### 1.4 El descanso

- **StS**: hoguera = **curar 30% del HP máximo** *o* forjar (mejorar 1 carta permanentemente). Nunca ambas: es la decisión de recursos más limpia del género («HP es moneda a corto plazo, cartas mejoradas son el motor a largo plazo»). Reliquias amplían opciones (curar +15, +5 HP máx., etc.).
- **Peglin**: curación como compra post-combate (hasta 20% HP, pagando).

**Veredicto para HOY**: nodo de descanso con exactamente 2 botones: **«Dormir la mona» (cura 30% HP máx.)** vs **«Afilar» (mejora 1 carta)**. El 30% es el número canónico probado; empezar ahí y ajustar con playtest.

Fuentes: [Merchant (Fandom)](https://slay-the-spire.fandom.com/wiki/Merchant) · [The Merchant (wiki.gg)](https://slaythespire.wiki.gg/wiki/The_Merchant) · [Rest Sites (wiki.gg)](https://slaythespire.wiki.gg/wiki/Rest_Sites) · [Map Generation (wiki.gg)](https://slaythespire.wiki.gg/wiki/Map_Generation) · [Análisis de incertidumbre en mapas de StS (arXiv)](https://arxiv.org/html/2504.03918v1) · [The Shop (Balatro Wiki)](https://balatrowiki.org/w/The_Shop) · [Merchants (Monster Train Fandom)](https://monster-train.fandom.com/wiki/Merchants) · [The Woolly Snail (Wildfrost Wiki)](https://wildfrostwiki.com/The_Woolly_Snail) · [Dungeon Shop (Backpack Hero wiki.gg)](https://backpackhero.wiki.gg/wiki/Dungeon_Shop) · [Peglin beginner's guide (Level Winner)](https://www.levelwinner.com/peglin-beginners-guide-tips-tricks-strategies/) · [Singing Bowl (wiki.gg)](https://slaythespire.wiki.gg/wiki/Singing_Bowl) · [Card Rewards (Fandom)](https://slay-the-spire.fandom.com/wiki/Card_Rewards)

---

## 2. Mercaderes memorables — referencia para el Primo Brayan

### Qué hace icónico a cada uno

- **Merchant (StS)**: hombre de piel azul sentado sobre una alfombra azul-verde. Su chiste definitorio: **la alfombra famosamente NO está a la venta** — un límite absurdo e inamovible que los fans convirtieron en lore. StS2 remató el chiste 8 años después: un Merchant falso vende una alfombra «For Sale» y al derrotarlo te la quedas. Lección: **un solo "no" arbitrario y consistente crea más personalidad que 20 líneas de diálogo**.
- **Merchant (Resident Evil 4)**: creado tarde en el desarrollo como «la encarnación viva de la tienda» para poder colocarla en cualquier parte. Gabardina negra que abre para *revelar* la mercancía (la tienda ES la animación). Su muletilla **«What're ya buyin'?»** con cadencia rasposa es de las frases más reconocibles del videojuego; funciona como saludo, presión comercial y meme. Lección: **muletilla corta + entrega vocal única + gesto físico de abrir el "inventario"**.
- **Bello (Enter the Gungeon)**: reacciona en escalada si disparas en su tienda: 1.º te advierte, 2.º **duplica los precios enfadado**, 3.º saca una escopeta y te ataca; robar te maldice (curse sube). Lección: **el mercader reacciona al mal comportamiento del jugador con consecuencias graduales y cómicas** — oro puro para Brayan («¿Otra vez tocando sin pagar, primo? Ahora todo cuesta double, my friend»).
- **Caronte (Hades)**: no habla, solo **gruñe** («Hrrmph…»); toda su personalidad es sonido gutural + pose. Tiene un secreto: robarle la bolsa de 300 óbolos (22% de aparición) desencadena una pelea oculta; si le bajas la vida a ~15% te da la **Loyalty Card (−20% en sus tiendas)** — te ganas su respeto a golpes. Lección: **un mercader puede ser memorable sin diálogo** y **esconder un easter egg transaccional**.
- **Moonlighter**: invierte el rol — tú eres el tendero. Los clientes muestran **4 reacciones faciales al precio** (encantado=muy barato, contento=justo, molesto=caro pero paga, furioso=no compra). Lección: **emoji/mueca sobre la cabeza como feedback económico instantáneo**, aplicable a Brayan cuando le regateas o no te alcanza.

### Patrones que los hacen queribles (checklist para Brayan)

1. **Muletilla de 2-4 palabras repetida siempre** al entrar/salir (el «What're ya buyin'?» de Brayan debe ser spanglish: p. ej. estructura tipo saludo + anglicismo — escribir la nuestra, no copiar).
2. **Animación de moneda**: morder la moneda, hacerla girar, o frotarse las manos al cobrar (2-3 frames bastan).
3. **Reacción a "no te alcanza"**: línea burlona + gesto (negar con el dedo). Precio en rojo + shake.
4. **Un "no" absurdo e inamovible** (su alfombra, su sombrero, su gallina — algo que NUNCA vende y sobre lo que hace comentarios).
5. **Reacción a comprar caro**: celebración exagerada (confeti de 5 partículas, «¡Eso es business!»).
6. **Sonido gutural o coletilla de audio propia** aunque no haya voz grabada (un «mmm-HM» sintetizado tipo Animal Crossing/Caronte).
7. **Escalada cómica si el jugador abusa** (clicks repetidos en él = líneas cada vez más molestas, a lo Bello).

Fuentes: [Merchant (RE) — Wikipedia](https://en.wikipedia.org/wiki/Merchant_(Resident_Evil)) · [Por qué el Merchant de RE4 es icónico (GameRant)](https://gamerant.com/resident-evil-4-merchant-popularity-explained/) · [StS2 esconde un boss secreto del Merchant (Kotaku)](https://kotaku.com/slay-spire-2-merchant-secret-boss-fight-event-2000679068) · [Shop (Enter the Gungeon wiki.gg)](https://enterthegungeon.wiki.gg/wiki/Shop) · [Loyalty Card (Hades Fandom)](https://hades.fandom.com/wiki/Loyalty_Card) · [Selling and Reactions (Moonlighter Fandom)](https://moonlighter.fandom.com/wiki/Selling_and_Reactions)

---

## 3. Arte pixel: animación mínima pero expresiva

Números concretos que funcionan en juegos publicados:

- **Idle de 2 frames con hold de 200-400 ms por frame** es el estándar de facto en juegos comerciales. Entre frame A y B basta: cuerpo/cabeza **1 px abajo** (respiración), pelo/capa 1 px en dirección opuesta (arrastre), parpadeo. Un sprite estático se siente muerto; 2 frames se sienten vivos — el retorno decrece rápido a partir de ahí.
- **Vampire Survivors**: enemigos y personajes con **2-6 frames**; el idle de muchos personajes es literalmente el frame 1 de la caminata con velocidad 0. Cientos de sprites en pantalla lo exigen y nadie lo nota.
- **Regla anti-trampa**: «más frames = mejor» es falso en pixel art; cada frame extra es otro set de píxeles colocados a mano que mantener consistente — el jank viene de la inconsistencia, no de la escasez.
- **Ataque sin frames (técnica StS/tween)**: Slay the Spire ni siquiera anima frame a frame el ataque del héroe: hace un **lunge por código** (tween de posición: adelanta el sprite 30-60 px en 100 ms con ease-out, retrocede en 200 ms) + flash blanco del objetivo + partícula de slash. En Phaser esto son 5 líneas de `this.tweens.add(...)`. Wildfrost hace lo mismo con sus cartas: la carta embiste físicamente al objetivo.
- **Recibir daño sin frames**: tint blanco o rojo 80 ms + shake 2-3 px + número de daño flotante con tween arriba y fade. Cero sprites nuevos.

**Presupuesto de animación recomendado para la alfa (por personaje):**

| Estado | Frames | Cómo |
|---|---|---|
| Idle | 2 (200-300 ms c/u) | 1 px de bob vertical |
| Ataque | 0 sprites nuevos | tween de lunge + flash del objetivo |
| Daño | 0-1 | tint rojo + shake por código |
| Muerte | 1 | fade + caída/rotación por tween |
| Brayan hablando | 2 | boca abierta/cerrada alternando |

**Veredicto para HOY**: cero hojas de sprites de ataque. Todo el combate se «anima» con tweens de Phaser (lunge, shake, flash, floating numbers) sobre idles de 2 frames. Es exactamente lo que hacen StS y Wildfrost con presupuestos millonarios.

Fuentes: [Guía de animación pixel art (Sprite-AI)](https://www.sprite-ai.art/guides/how-to-animate-pixel-art) · [Hero Idle Animation tutorial (itch.io)](https://itch.io/t/2489389/pixel-tutorial-hero-idle-animation) · [Pixel art character animations (Sandro Maglione)](https://www.sandromaglione.com/articles/pixel-art-character-animations-guide) · [Creando un rogue-like tipo Vampire Survivors (Terresquall)](https://blog.terresquall.com/2024/07/creating-a-rogue-like-vampire-survivors-in-unity-part-15-5/) · [Juice in Game Design (Blood Moon Interactive)](https://www.bloodmooninteractive.com/articles/juice.html) · [Making a game feel juicy (itch.io)](https://itch.io/blog/1059831/making-a-game-feel-juicy-with-simple-effects)

---

## 4. SONIDO (prioridad)

### 4a. SFX imprescindibles en un deck builder y cómo suenan

Lista mínima viable (orden de prioridad), con su carácter sonoro de referencia:

1. **Jugar carta** — *fwip* de papel corto (50-120 ms) + capa de impacto según tipo. Balatro es la referencia moderna: sus assets extraídos incluyen «card fwip», sonidos distintos por material (foil, holo, polychrome, glass que se rompe) y **pitch aleatorio por reproducción** para que 100 repeticiones no cansen.
2. **Robar carta** — fwip más suave y agudo que jugar; si roban 5, escalonar 40-60 ms entre cada una con pitch ascendente. Ojo: en StS el SFX de robo fue polémico entre jugadores por repetitivo — mantenerlo MUY corto y suave.
3. **Daño (golpe)** — thud/slash medio-grave + capa de crunch. Distinguir «yo pego» (satisfactorio) de «me pegan» (más sordo/alarmante).
4. **Bloqueo/armadura** — clank metálico o «shield up» tipo whoosh+metal; en nuestro caso: vapor + metal (steampunk).
5. **Oro** — clink de monedas (Balatro usa «money clinking»); reproducir 2-3 clinks apilados si la cantidad es grande.
6. **Victoria** — jingle de 1-2 s (fanfarria corta); **derrota** — jingle descendente triste. Kenney «Music Jingles» trae ambos listos.
7. Secundarios (semana 2): hover de carta (tick suave), carta imposible de pagar (buzz), poción/reliquia, subir de piso, botón UI genérico.

Reglas de mezcla aprendidas de Balatro/StS: aleatorizar pitch ±10%, nunca más de ~3 instancias simultáneas del mismo SFX, y los sonidos de UI 6-10 dB por debajo de los de combate. Quitar el audio reduce el impacto percibido de un golpe en 50-70% aunque el visual no cambie — el sonido ES la mitad del juice. Análisis en video del audio de Balatro: [Analyzing the Sound Design of Balatro (YouTube)](https://www.youtube.com/watch?v=wfKmiXv-26c) y [Balatro Game Audio Analysis (YouTube)](https://www.youtube.com/watch?v=ZIVXeSQSLug); assets navegables en [The Sounds Resource](https://sounds.spriters-resource.com/pc_computer/balatro/asset/452647/). StS usa .ogg para todo (buen formato también para Phaser, con fallback .m4a en Safari viejo).

### 4b. Bancos de sonido GRATUITOS con licencia comercial

| Fuente | Licencia | Qué tiene | URL |
|---|---|---|---|
| **Kenney.nl** | **CC0** (dominio público, sin atribución, uso comercial OK) | Packs de audio: **Casino Audio** (¡fichas y cartas! perfecto para deck builder), **Interface Sounds**, **UI Audio**, **RPG Audio** (50 sonidos: pasos, armas, foley), **Impact Sounds**, **Digital Audio**, **Music Jingles** (victoria/derrota), **Sci-fi Sounds**, **Voiceover Pack** ×2 | https://kenney.nl/assets/category:Audio — descarga directa ZIP por pack, sin registro |
| **OpenGameArt** | Filtrable por licencia; buscar **CC0** | Colecciones: «CC0 Sounds Library», «SoundFX Library [CC0]», «100 CC0 SFX», «80 CC0 RPG SFX», «80 CC0 creature SFX» | https://opengameart.org/content/cc0-sound-effects (colección índice); en búsqueda avanzada filtrar License = CC0 |
| **freesound.org** | Mixto: filtro de licencia en la búsqueda. **CC0 = sin atribución**; **CC-BY = uso comercial OK con crédito** (formato: «"sonido" de usuarioX — freesound.org/s/ID — CC-BY 4.0», vale ponerlo en pantalla de créditos o TXT adjunto) | Millones de sonidos crudos; ideal para vapor, engranajes, monedas reales | https://freesound.org (requiere cuenta gratuita para descargar) |
| **Pixabay Audio** | Licencia propia Pixabay: comercial OK, **sin atribución obligatoria**; prohibido redistribuir el audio «standalone» | 120.000+ SFX y música | https://pixabay.com/sound-effects/ · licencia: https://pixabay.com/service/license-summary/ |
| **Sonniss GameAudioGDC** | Licencia propia: royalty-free, **comercial, sin atribución, proyectos ilimitados de por vida**; prohibido revender los sonidos sueltos | Bundles anuales desde 2015; el de 2026 trae **7,47 GB**; archivo histórico total >200 GB de SFX profesionales | https://gdc.sonniss.com/ (descarga directa) · licencia: https://sonniss.com/gdc-bundle-license/ · archivo: https://sonniss.com/gameaudiogdc/ |

### 4c. Generadores

**SFX retro (todos gratis, salida usable comercialmente):**
- **jsfxr** — https://sfxr.me — port JS del sfxr original; corre en navegador, exporta WAV, y **existe como librería JS** (github.com/chr15m/jsfxr) que puede generar el sonido en runtime dentro de Phaser (¡cero assets!). Presets de un click: pickup/coin, hit/hurt, powerup, blip.
- **ChipTone** (SFBGames) — https://sfbgames.itch.io/chiptone — gratis, HTML5 en navegador + versiones Win/Mac; el autor declara los sonidos generados como **CC0** (comercial sin restricción). Más potente que jsfxr (vocoder, secuenciador).
- **Bfxr** — https://www.bfxr.net — clásico, código Apache 2.0, output libre. Algo anticuado (Flash/AIR); usar jsfxr o ChipTone antes.
- **jfxr** — https://github.com/ttencate/jfxr — «cualquier sonido que crees es enteramente tuyo», sin atribución.

**Música (con licencia comercial):**
- **Suno**: plan **gratis = SOLO uso no comercial** (Suno retiene derechos); planes **Pro/Premier = eres dueño y tienes licencia comercial**, que se conserva aunque canceles después — pero NO es retroactiva para temas hechos en el plan gratis. Contexto legal aún movedizo (acuerdo con Warner en nov-2025; el US Copyright Office no reconoce copyright en música 100% IA).
- **Beatoven.ai**: plan gratis genera ilimitado pero **no permite descargar**; pagando (~$3/min o suscripción baja) obtienes **licencia perpetua no exclusiva** que cubre explícitamente **juegos**; prohíbe distribuir la pista sola en Spotify etc. Entrenado con música licenciada (menos riesgo legal).
- **Soundraw**: licencia perpetua no exclusiva para monetizar contenido (juegos incluidos); solo permite subir a streaming versiones sustancialmente modificadas.
- **Alternativa 100% segura y gratis**: música CC0/CC-BY de OpenGameArt (hay chiptune y medieval-fantasy de sobra) o los jingles CC0 de Kenney.

### Veredicto de sonido

- **Para HOY (alfa)**: 1) descargar **Kenney Casino Audio + Interface Sounds + RPG Audio + Music Jingles** (CC0, 10 minutos de trabajo, cubre carta/oro/UI/victoria); 2) generar hit/block/draw a medida con **jsfxr o ChipTone** (CC0, 20 minutos); 3) música: **un solo loop CC0 de OpenGameArt** o incluso sin música hoy. Cero riesgo legal, cero coste, cero atribución obligatoria (acreditar a Kenney igualmente: es gratis y elegante).
- **Para el LANZAMIENTO**: base de SFX profesional del **archivo Sonniss GameAudioGDC** (gratis, comercial, sin atribución) + pasada de personalización (pitch, capas); música original encargada o **Beatoven.ai de pago** (licencia perpetua explícita para juegos y dataset licenciado). Evitar Suno gratis para cualquier build pública; si se usa Suno, solo bajo plan Pro/Premier y sabiendo que el copyright de música IA sigue gris.

Fuentes: [Kenney Audio](https://kenney.nl/assets/category:Audio) · [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) · [Soporte Kenney (CC0)](https://kenney.nl/support) · [CC0 Sound Effects (OGA)](https://opengameart.org/content/cc0-sound-effects) · [FAQ Freesound](https://freesound.org/help/faq/) · [Licencia Pixabay](https://pixabay.com/service/license-summary/) · [Sonniss GDC](https://gdc.sonniss.com/) · [Licencia bundle Sonniss](https://sonniss.com/gdc-bundle-license/) · [jsfxr](https://sfxr.me/) · [jsfxr lib (GitHub)](https://github.com/chr15m/jsfxr) · [ChipTone](https://sfbgames.itch.io/chiptone) · [Bfxr](https://www.bfxr.net/) · [Derechos Suno (help center)](https://help.suno.com/en/articles/2746945) · [Suno free vs pro (Dynamoi)](https://dynamoi.com/learn/ai-music-distribution/suno-commercial-rights-explained) · [Beatoven.ai](https://www.beatoven.ai/) · [Beatoven vs Soundraw (Singify)](https://singify.fineshare.com/blog/ai-music-apps/beatoven-ai-vs-soundraw) · [SFX de StS: hilo sobre card draw (Steam)](https://steamcommunity.com/app/646570/discussions/4/2590022385672942037/)

---

## 5. Tono y sátira: humor bien integrado en UI

1. **Balatro** — el humor vive en los *sistemas*, no en chistes largos: Jimbo suelta frases al ganar/perder; la carta Wheel of Fortune al fallar muestra literalmente **«Nope!»** y desaparece; los Jokers Gros Michel/Cavendish son un chiste botánico sobre plátanos extintos; y si rompes el juego con puntuaciones absurdas, el marcador se rinde y muestra **notación científica y hasta «NaN»** — el propio UI es el remate. Lección: **poner el chiste donde el jugador ya está mirando** (tooltip, marcador, mensaje de fallo), en ≤4 palabras.
2. **Kingdom of Loathing / West of Loathing** — la masterclass de sátira RPG («World of Warcraft escrito por Monty Python e ilustrado por xkcd»). Reglas de su charla en GDC 2018 que adoptamos como política editorial: (a) **el humor no golpea hacia abajo** — nos reímos de reyes, burocracia y del propio género, no de la gente por lo que es; (b) **evitar repetición**: un chiste visto 10 veces muere — variar líneas de tienda/derrota con pools de 5-10 textos; (c) **cada personaje con voz reconocible solo por el texto** (Brayan debe poder identificarse sin retrato). Todo ítem y localización lleva flavor: la descripción de objetos es el mejor lugar barato para el humor.
3. **Slay the Spire (meta-humor de tienda)** — el chiste de la alfombra «no está a la venta» demuestra que **negarle algo al jugador con cara seria** es comedia de larguísimo recorrido (8 años hasta el remate en StS2). Nuestro equivalente: un objeto absurdo en la tienda de Brayan permanentemente «RESERVADO (no preguntes)».
4. **Enter the Gungeon / Hades (humor reactivo)** — el humor como *respuesta a acciones del jugador* (disparar en la tienda, robar la bolsa de Caronte) es el que más se recuerda y se comparte. Game overs: en vez de «Has muerto», el Rey puede emitir un decreto burocrático satírico distinto por causa de muerte (pool de textos), estilo a los epitafios variables de los roguelikes.

**Veredicto para HOY**: 3 pools de texto (saludo de tienda ×5, «no te alcanza» ×5, game over ×5) + flavor de 1 línea en cada carta. Regla editorial fija: sátira hacia arriba (monarquía, burocracia, tecnología a vapor que no funciona), spanglish solo en boca de Brayan para que sea *su* voz.

Fuentes: [Funny — Balatro (TV Tropes)](https://tvtropes.org/pmwiki/pmwiki.php/Funny/Balatro) · [Writing comedic games the West of Loathing way (Game Developer)](https://www.gamedeveloper.com/design/writing-comedic-games-the-i-west-of-loathing-i-way) · [Kingdom of Loathing (Wikipedia)](https://en.wikipedia.org/wiki/Kingdom_of_Loathing) · [Kotaku sobre el Merchant de StS2](https://kotaku.com/slay-spire-2-merchant-secret-boss-fight-event-2000679068) · [Shop — Enter the Gungeon (wiki.gg)](https://enterthegungeon.wiki.gg/wiki/Shop)

---

## Apéndice: checklist «para hoy» consolidada

- [ ] Mapa: bifurcación binaria por piso (modelo Monster Train); descanso garantizado antes del jefe.
- [ ] Recompensa: 1 de 3 cartas + botón Saltar; hover escala 1.1×; tween de carta al mazo.
- [ ] Tienda Brayan: 5 cartas, quitar carta 75 oro (+25), 1 chollo −50% con cartel; precio rojo + shake si no alcanza.
- [ ] Descanso: curar 30% HP máx. vs mejorar carta (excluyentes).
- [ ] Animación: idles 2 frames (1 px bob); ataques = tween lunge; daño = tint + shake + número flotante.
- [ ] Audio: Kenney (Casino/Interface/RPG/Jingles, CC0) + jsfxr/ChipTone para hit/block/draw; pitch aleatorio ±10%.
- [ ] Textos: pools de 5 líneas (saludo, sin oro, game over); muletilla fija de Brayan; un objeto «RESERVADO» nunca a la venta.
