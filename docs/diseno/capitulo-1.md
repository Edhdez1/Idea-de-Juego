# Capítulo 1 — «La Patente» (vertical slice)

> Guion y diseño de batallas del prólogo y el capítulo 1. **Requiere aprobación del dueño.** Canon en `docs/BIBLIA-NARRATIVA.md`; números del motor en `docs/diseno/reglas-tacticas.md` (aquí solo van intenciones de diseño y los valores narrativos, como el número de pitidos; el motor puede ajustarlos).
>
> 🔶 = propuesta que depende de una propuesta de la Biblia (Persona Colectiva, Casilla 7, nombres). Si el dueño cambia la Biblia, este documento se ajusta.

**Protagonista:** la Ingeniera Desahuciada. **Piso:** Distrito del Gremio (y el Arrabal en el prólogo). **Custodio del Coso:** el Gran Maestre. **Duración objetivo:** 60–90 min; **≤ 15 min** de escenas no interactivas.

---

## 1. Tabla de beats

| # | Beat | Tipo | Objetivo de juego | Minutos (aprox.) | Deja |
|---|---|---|---|---|---|
| 0 | **Intro Parte I** «La Caída del Coso» | Cinemática (ya existe, `intro.ts`) | — (saltable) | 1,5 | — |
| 1 | **Desahucio** | Escena corta | — | 1 | — |
| 2 | **B0 «Taller Embargado»** | Batalla tutorial 8×8 | **Llegar a la puerta** (`reach`). Enseña mover, altura y empuje | 6–8 | — |
| 3 | **Intro Parte II** (reescrita) + **Ventanilla T-800** | Escena + **Voto 0** | Elegir el apodo del grupo (tutorial de La Balanza, sin consecuencias) | 3 | `apodo_*` |
| 4 | **La denuncia** | Escena corta | — | 1 | — |
| 5 | **B1 «La Plaza del Cráter»** | Batalla 12×12 | **Derrotar al Inquisidor de Patentes** (`defeat`). Opcional: **proteger a Encarna** la churrera. Primera **Gotera** y primer **Prototipo** | 12–15 | `encarna_salvada` o `encarna_desalojada` |
| 6 | **La Taberna de Brayan** (primera visita) + hub del Distrito | Exploración libre | Pistas, eventos, contratos, tienda, propinas | 10–20 | pistas, flags de eventos |
| 7 | **Investigar la patente** | Escena corta con Don Legajo | — | 1 | — |
| 8 | **B2 «Auditoría en el Archivo»** | Batalla 10×12 | **Llegar al archivador e interactuar antes del 3.er pitido** del Coso. Si no: escapar por la ventana | 12–15 | `patente_copiada` o `patente_sellada` |
| 9 | Hub (segunda vuelta) | Exploración | Pistas nuevas tras B2, red lines de los héroes | 5–10 | — |
| 10 | **V1 «¿Qué hacemos con la Patente del Coso?»** | **La Balanza** | Persuadir y votar: Gremio / Iglesia / Corona | 4–6 | `v1_gremio` / `v1_iglesia` / `v1_corona` |
| 11 | **B3 «El Gran Maestre»** | Batalla jefe 12×12 (3 variantes) | **Derrotar al Gran Maestre** antes de que la **Desmontadora** llegue al Coso | 15–20 | — |
| 12 | **Epílogo** «La procesión» | Escena + códice | — | 2 | gancho al cap. 2 |

---

## 2. Prólogo

### 2.1 Escena «Desahucio» (≤ 1 min)

Taller de la Ingeniera, Arrabal de las Calderas. Un **Cobrador de Cuotas del Gremio** clava sellos de embargo en todo, incluido el café. Dos aprendices cargan cajas sin ganas.

> **COBRADOR:** Por orden de la Junta del Gremio, queda embargado el taller, las herramientas y el aire que contiene.
> **INGENIERA:** ¿El aire también? ¡Avemaría, home!
> **COBRADOR:** Lo ha respirado usted sin licencia. Consta en el expediente. La acusamos de construir el Coso sin permiso de obra.
> **INGENIERA:** ¡Yo no construí esa vaina! Si la hubiera construido yo, *funcionaría el botón de apagado*.
> **COBRADOR:** Aprendices: sujétenla. Con cariño, que luego se quejan.
> **APRENDIZ 1** *(bajito)*: Perdone, señora. Nos pagan en exposición.

*Resumen al saltar (Narrador):* «Resumen: el Gremio le embarga el taller. Y el aire. Ella se va por la puerta, con o sin permiso.»

### 2.2 B0 «Taller Embargado» (tutorial)

- **Tamaño:** 8×8. **Unidades:** la Ingeniera sola. **Enemigos:** Cobrador de Cuotas (perfil *guardián*, junto a la puerta) y 2 Aprendices Explotados (perfil *cobarde*: huyen si les pegas; no quieren estar aquí).
- **Victoria:** `reach` la Ingeniera llega a la puerta **P**. **Derrota:** la Ingeniera cae.
- **Enseña, en este orden** (con avisos de una línea, no ventanas):
  1. **Mover** (turno 1): llegar a las cajas **s**.
  2. **Altura** (turno 2–3): subir a la estantería **E** (altura 3) y ver en la previsión el bonus por altura contra el aprendiz de la mesa.
  3. **Empuje** (turno 3–4): empujar la **caja k** o al aprendiz de la mesa **M** (cae 2 niveles, daño de caída, huye).
  4. **Orientación** (al terminar el turno): mirar hacia la puerta.
  5. El Cobrador bloquea la puerta: pegarle **por la espalda** (tras rodear la rejilla) o empujarlo contra la pared.
- **Mundo vivo:** rejilla de brasas **g** animada, engranaje de pared, sellos de embargo que tiemblan, por la ventana el parallax del cráter con el faro «88:88» del Coso latiendo a lo lejos.

```
Alturas                 Plano
    x 0 1 2 3 4 5 6 7        x 0 1 2 3 4 5 6 7
y0    3 3 1 0 0 0 0 0      y0  E E s . . . c P
y1    3 3 1 0 0 0 0 0      y1  E E s . . . . .
y2    1 1 1 0 2 2 0 0      y2  s s s . M M . .
y3    0 0 0 0 2 2 0 0      y3  . . . . M a . .
y4    0 k 0 0 0 0 g g      y4  . k . . . . g g
y5    0 0 1 1 0 0 0 0      y5  . . C C . . . .
y6    0 0 1 1 0 0 0 0      y6  @ . C C . a . .
y7    0 0 0 0 0 0 0 0      y7  . . . . . . . .

E estantería (altura 3)   s cajas/escalón   M mesa de trabajo (altura 2)
C caldera apagada (altura 1)   k caja empujable   g rejilla de brasas (daña al terminar turno encima)
@ Ingeniera   c Cobrador de Cuotas   a Aprendiz   P puerta (objetivo)
```
*(En la rejilla de alturas, `k` y `g` tienen altura 0.)*

**Barks del tutorial** (solo 3): Aprendiz al caer de la mesa: «¡Esto no cuenta como horas extra!». Cobrador al ser empujado: «¡Agresión a funcionario! …Anótelo, aprendiz. ¿Aprendiz?». Ingeniera al llegar a la puerta: «Me llevo lo puesto. Y la llave inglesa, que es mía, ¿oyó?».

### 2.3 Intro Parte II reescrita: «La Ventanilla T-800» 🔶

Sustituye a `PANELES_PARTE2` de `src/data/intro.ts` (que decía «cada quien va por su cuenta»). Se reproduce **después de B0**. Borrador para el agente de código (hablantes del registro único; Brayan con `#8ae8b0`):

**Panel `intro_6_cola`** (la cola del T-800 subiendo dos pisos hasta la catedral)
> **NARRADOR:** Sin taller y sin padrón, la Ingeniera hizo lo que hace todo el mundo en Vaporcracia cuando lo pierde todo: la cola.
> **NARRADOR:** Delante tenía a tres personas que no eran de aquí. O no de *ahora*.
> **CLÉRIGO:** ¿Tú también cayiste, mare? Yo caí cuatro minutos después del Coso. Ya de rodillas. Fue una señal, ¿va?
> **HISTORIADORA:** Es una freidora de aire. Calienta aire y lo hace circular. …No aplaudan. Por favor, no aplaudan.
> **REPARADOR:** Tranqui, papi. Cuando esto se mueva, yo la rooteo y el reino entero paga suscripción. Plan Bendito.
> **INGENIERA:** Yo solo vengo a que me devuelvan el padrón. Y el aire.

**Panel `intro_7_ventanilla`** (Ventanilla 3; Ceferino con una sola hoja en la mano)
> **CEFERINO:** Siguiente. …Siguientes. Me queda un formulario. Rellénenlo entre los cuatro, que la imprenta está en huelga.
> **NARRADOR:** Casilla «Siglo de origen». Cuatro personas. Cuatro siglos. Una casilla.
> **CEFERINO:** El sistema no admite cuatro siglos. Los registro como uno solo. *¡Pum!* Persona Colectiva número… la máquina marca 88-88. Como todo desde el martes.
> **CEFERINO:** Estatutos por defecto: decisiones por mayoría. Domicilio social:
> **BRAYAN** *(asomándose por la ventanilla de al lado)*: ¡Mi taberna, bro! ¡El Rellano, número 1! Pongan esa, que es la única que se saben.
> **NARRADOR:** Democracia por error administrativo. Como casi todas.

**Voto 0 — «Apodo del grupo»** (tutorial de La Balanza; sin persuasión, sin empate posible porque el jugador elige y los demás siguen al jugador con una línea cada uno):
- «**Los Desplazados**» · «**Comité Pro-Coso**» · «**Sociedad Limitada del Aire**».
- Efecto: flag `apodo_*`, que cambia cómo te llaman algunos NPCs y un par de líneas del Narrador. El nombre legal sigue siendo «Persona Colectiva nº 88-88».

*Resumen al saltar:* «Resumen: cuatro desconocidos, un formulario y un sello. Ahora son legalmente una sola persona. Que vota.»

---

## 3. Capítulo 1: escenas y batallas

### 3.1 Escena «La denuncia» (≤ 1 min)

Plaza del Cráter. En el centro, el Coso sobre su pedestal de gravilla, bajo los andamios del Pabellón que el Gremio construye encima (no pueden moverlo sin tocar el plástico). El **Inquisidor de Patentes** lee un pergamino que se desenrolla hasta el suelo.

> **INQUISIDOR:** La Persona Colectiva 88-88 queda denunciada. La Ingeniera, por fabricación sin licencia. Los otros tres, por asociación.
> **REPARADOR:** ¿Asociación? Bro, nos conocimos hace veinte minutos.
> **INQUISIDOR:** Veinte minutos de asociación. Agravante.
> **HISTORIADORA:** Técnicamente nadie *fabricó* eso aquí. Lo fabricaron en una planta en…
> **INQUISIDOR:** ¡Confesión de conocimiento de causa! ¡Aprendices, a por ellos!

*Resumen al saltar:* «Resumen: os denuncian a los cuatro. A la Historiadora, además, por saber cosas.»

### 3.2 B1 «La Plaza del Cráter»

- **Tamaño:** 12×12. **Grupo:** los 4 héroes (primer combate juntos). **Enemigos:** Inquisidor de Patentes (objetivo), Cobrador de Cuotas, 2 Aprendices (uno es **Quino**), 1 Gólem de Latón Defectuoso.
- **Victoria:** `defeat` al Inquisidor (se rinde a 0 y huye «a apelar»). **Derrota:** caen los 4 héroes.
- **Objetivo opcional:** **Encarna** (NPC neutral en su puesto de churros al vapor, altura 3) sobrevive. El Cobrador va a por ella: «Cuota del puesto, señora. Y la del cráter, que le da sombra». Si sobrevive: `encarna_salvada`. Si cae: no muere, **huye con su carrito** (`encarna_desalojada`) y su puesto aparece cerrado en el hub.
- **Enseña:**
  1. **Prototipos:** la Ingeniera recibe su primera habilidad de Prototipo («Caldera de Bolsillo», mecha 3). La mecha aparece en la barra de turnos.
  2. **Presión y fuego amigo:** en el turno 3 el Narrador puede decir su única línea de la batalla si la Presión pasa de 8.
  3. **Primera Gotera** en **G**: titila un pitido antes y cambia entre **paja** y **respiradero**. Está junto al puesto de Encarna, así que obliga a decidir: ¿paja que amortigua o respiradero que sube la Presión?
- **Mundo vivo:** estandartes del Gremio al viento sobre los andamios, grúa de vapor que gira, puesto de churros humeando, el Coso con su 88:88 parpadeante en el centro del cráter, palomas (partículas) que se espantan con las explosiones.

```
Alturas                                Plano
    x 0 1 2 3 4 5 6 7 8 9 A B            x 0 1 2 3 4 5 6 7 8 9 A B
y0    5 5 5 2 2 2 2 2 2 5 5 5          y0  A A A . . . . . . A A A
y1    5 5 5 2 2 2 2 2 2 5 5 5          y1  A A A . . . I . . A A A
y2    4 3 2 2 2 2 2 2 2 2 3 4          y2  l l . . . . . . . . l l
y3    2 2 2 2 1 1 1 1 2 2 2 2          y3  . . . . . . . . . . . .
y4    2 2 2 1 0 0 0 0 1 2 2 2          y4  . . . . . . . . . c . .
y5    2 2 2 1 0 0 0 0 1 2 3 3          y5  . . . . . O O . . . T T
y6    2 2 2 1 0 0 0 0 1 2 3 3          y6  . . . . . O O . . . T N
y7    2 2 2 1 0 0 0 0 1 2 2 2          y7  . g . . . . . . . G . .
y8    2 2 2 2 1 1 1 1 2 2 2 2          y8  . . . . . . . . . . a .
y9    2 2 2 2 2 2 2 2 2 2 2 2          y9  . @ @ . . . . . . . . .
yA    2 2 2 2 2 2 2 2 2 2 2 2          yA  . @ @ . . . . . a . . .
yB    2 2 2 2 2 2 2 2 2 2 2 2          yB  . . . . . . . . . . . .

A andamio (altura 5)   l escalera de mano (alturas 3-4)   O el Coso en su pedestal (bloquea; no se puede atacar)
T puesto de churros (altura 3)   N Encarna   G primera Gotera (paja ↔ respiradero)
@ despliegue   I Inquisidor (sobre la plaza, altura 2)   c Cobrador   a Aprendiz   g Gólem
El cráter: anillo de altura 1 y fondo de altura 0.
```

**Interactuable post-batalla:** al terminar, se puede examinar la parte trasera del Coso (desde el borde del cráter): una **etiqueta con letras raras**. La Historiadora la lee en voz alta («*Air fryer*. Dice "freidora de aire"») y los curiosos aplauden («¡qué imaginación!»). Flag `etiqueta_vista` (pista 1/3 del final oculto).

### 3.3 La Taberna de Brayan (primera visita, ≤ 2 min de escena, luego libre)

> **BRAYAN:** ¡Bros! ¡Bienvenidos al *hub*! Aquí hacemos *networking*, *upskilling* y cerveza. La cerveza es de mi mamá.
> **DOÑA REMEDIOS** *(desde la cocina)*: ¡BRAYAN! ¡Que tú naciste aquí, en la barra, que te parí yo entre dos barriles!
> **BRAYAN:** Mi madre es muy… *old school*. ¿Cómo se dice… «madre» en este idioma?
> **DOÑA REMEDIOS:** ¡MADRE, se dice! ¡Y se dice poco!
> **BRAYAN:** Bueno. Como soy el domicilio social, si empatan, voto yo. *Neutral total*. Pero las propinas son *data*, ¿me entiendes?

*Resumen al saltar:* «Resumen: Brayan desempata vuestras votaciones. Brayan acepta propinas. Saque sus propias conclusiones.»

### 3.4 Escena «Investigar la patente» (≤ 1 min)

Archivo de Patentes, de noche. **Don Legajo**, el archivero, les abre la puerta de servicio porque «a esta hora ya no estoy de servicio, así que técnicamente no les estoy abriendo».

> **DON LEGAJO:** La patente del Coso está en el archivador de la entreplanta. Al tercer pitido del amanecer llega el Inquisidor a sellarla en el Registro Definitivo. Sellada, ya no se puede consultar. Ni por mí.
> **INGENIERA:** ¿Y quién la registró?
> **DON LEGAJO:** Eso pone ahí. Yo no leo lo que archivo. Es más seguro.

*Resumen al saltar:* «Resumen: hay que copiar la patente antes del tercer pitido. Don Legajo no ha visto nada. Por contrato.»

### 3.5 B2 «Auditoría en el Archivo»

- **Tamaño:** 10×12. **Grupo:** 4 héroes (+ mercenarios contratados). **Enemigos:** Autómata de Atención al Súbdito (guardián en la entreplanta; «su llamada es importante para nosotros»: cada dos turnos se queda **en espera**, visible en la barra), 2 Gólems en lo alto de las escaleras, Cobrador de Cuotas en el pasillo central, 1 Aprendiz dormido sobre la mesa de lectura (se despierta si hay explosión cerca).
- **Victoria:** `interact` cualquier héroe usa el **archivador X** antes del **3.er pitido** del Coso (los pitidos están en la barra de turnos) → `patente_copiada`.
- **Si llega el 3.er pitido antes:** el Inquisidor sella la patente (animación de sello en el archivador). **No es derrota:** el objetivo cambia a `reach` **escapar por la ventana V** → `patente_sellada`. Se pierde el argumento A1 del voto, pero hay otro camino (A8, el Gólem Tuerca).
- **Derrota:** caen los 4 héroes.
- **Diseño:** la entreplanta (altura 5) solo se alcanza por las dos escaleras de caracol **e** de los lados; las estanterías (altura 6) no se escalan. Empujar a un Gólem escaleras abajo es la jugada. Una Sobrecarga hace volar los papeles (efecto de ambiente) y despierta al aprendiz.
- **Mundo vivo:** papeles volando en bucle desde el archivador, lámparas que parpadean (de vapor; las de aceite están prohibidas), polvo en los haces de luz, el Autómata con su luz de «en espera» girando.

```
Alturas                        Plano
    x 0 1 2 3 4 5 6 7 8 9        x 0 1 2 3 4 5 6 7 8 9
y0    5 5 5 5 5 5 5 5 5 5      y0  . . . . . X . . . V
y1    5 5 5 5 5 5 5 5 5 5      y1  . g . . u . . . g .
y2    6 4 6 0 0 0 0 6 4 6      y2  # e # . . . . # e #
y3    6 3 6 0 0 0 0 6 3 6      y3  # e # . . . . # e #
y4    6 2 6 0 6 6 0 6 2 6      y4  # e # . # # . # e #
y5    6 1 6 0 6 6 0 6 1 6      y5  # e # . # # . # e #
y6    0 0 0 0 0 0 0 0 0 0      y6  . . . . . c . . . .
y7    0 6 6 0 6 6 0 6 6 0      y7  . # # . # # . # # .
y8    0 6 6 0 0 0 0 6 6 0      y8  . # # . . . . # # .
y9    0 0 0 0 1 1 0 0 0 0      y9  . . . . m a . . . .
yA    0 0 0 0 1 1 0 0 0 0      yA  . . . . m m . . . .
yB    0 0 0 0 0 0 0 0 0 0      yB  . @ @ . . . . @ @ .

# estantería (altura 6, no se escala)   e escalera de caracol (alturas 1→4)   X archivador (objetivo)
V ventana (salida si se sella la patente)   m mesa de lectura (altura 1)
@ despliegue   u Autómata   g Gólem   c Cobrador   a Aprendiz dormido
```

### 3.6 Hub, segunda vuelta

Tras B2 aparecen pistas nuevas (Don Legajo, Quino) y los héroes, si hablas con ellos en la taberna, **revelan su línea roja** (candado en La Balanza). Ver §6.

---

## 4. Los héroes antes del voto

Qué piensa cada uno de la patente (sirve para sus líneas en el hub y en La Balanza):

- **Ingeniera** (protagonista, vota lo que elija el jugador): «Si nadie la inventó, ¿de quién es? Porque a mí sí me la cobraron.»
- **Clérigo**: «Una patente de un milagro es un sacrilegio, mare. Un milagro no tiene dueño. Tiene *administrador*.»
- **Historiadora**: «Me da igual quién la tenga. Me importa que no la quemen. Los archivos de la Corona sobreviven; los del Gremio se usan para calzar mesas. Lo sé porque calzaron una con mi informe.»
- **Reparador**: «Una patente es un activo, bro. Pero ¿un contrato público con Hacienda? Eso es ingreso recurrente, papi. Lo más bonito que existe.»

---

## 5. V1 — «¿Qué hacemos con la Patente del Coso?»

Escena: la taberna cerrada, de noche. La copia de la patente (o el recuerdo del sello) sobre la mesa. Brayan saca **La Balanza** de latón «que era de mi abuelo, que pesaba chorizos».

### 5.1 Opciones

| Opción | Facción · eje | Qué significa | Variante de B3 |
|---|---|---|---|
| **«Registrarla a nombre de la Ingeniera»** | Gremio · **Negocio** | Jugar el juego del Gremio: la patente la registró alguien 28 minutos después de la Caída, así que la registran *otra vez*, bien, a nombre de ella. El Gremio no puede acusarla de fabricar lo que es legalmente suyo | **A «El Notario»**: proteger a Don Legajo mientras sella el registro en el Pabellón. Algunos aprendices cambian de bando (se vuelven neutrales) |
| **«Entregarla a la Iglesia como Sagrada Escritura»** | Iglesia · **Fe** | Si la patente es escritura sagrada, el Gremio no puede despiezar lo que describe sin cometer sacrilegio | **B «Los Feligreses»**: 2 feligreses aliados (IA) y la Beata Felícitas dando sermones que suben el brío |
| **«Declararla a Hacienda Real»** | Corona · **Orden** | Si Hacienda la tiene, el pleito pasa a ser de la Corona y el Gremio pierde jurisdicción | **C «La Auditoría»**: la Recaudadora Doña Casilda aparece en el turno 3 como **tercer bando** con 2 alguaciles fiscales. Embarga Prototipos y multa a todos |

### 5.2 Inclinación inicial y líneas rojas

| Héroe | Inclinación inicial | Línea roja (nunca vota…) | Condiciones que cambian la inclinación |
|---|---|---|---|
| **Ingeniera** | La del jugador | — | — |
| **Clérigo** | Iglesia (Fe) | **Gremio**: «El Gremio llamó a mi milagro "defecto de fábrica". Al Gremio no le firmo ni el pésame, ¿va?» | Si el jugador **denunció el Altarcito Pirata** (`altarcito_denunciado`), A3 falla: «¿Denunciaste un altar y ahora me hablas de misas?» (A6 sigue funcionando) |
| **Historiadora** | Corona (Orden) | **Iglesia**: «No voy a firmar que un electrodoméstico es un texto sagrado. Tengo una tesis que defender.» | Si `patente_sellada`, A1 no existe (quedan A5 y A8) |
| **Reparador** | Corona (Orden): «licitación pública, papi» | Ninguna («Yo soy agnóstico de mercado») | Si `accionista_baron`, empieza inclinado al **Gremio**: «Ya soy accionista del Coso, bro. Conflicto de interés… a favor.» |

Por diseño **dos héroes empiezan en Corona**: es el camino de la inercia («el reino tiende al orden por pura pereza», dice el Narrador si gana sin persuadir a nadie). Las otras dos opciones **exigen explorar**. Invertir con el Barón mueve al Reparador y cambia el tablero del voto: las decisiones del hub se notan en La Balanza.

Las líneas rojas **se ven** como un candado en el platillo en cuanto hablas con ese héroe en el hub después de B2. Si no has hablado con él, puedes intentar un argumento hacia su línea roja: **rebota** con una línea graciosa y **gasta el intento** con ese héroe.

### 5.3 Argumentos (desbloqueados por pistas)

Cada argumento se usa sobre **un héroe**, una vez. Cada héroe acepta **un intento**. Sin dados: si el argumento es el adecuado y no cruza una línea roja, convence.

| # | Argumento | Pista que lo desbloquea | Héroe → opción | Resultado |
|---|---|---|---|---|
| A1 | «**Registrada 28 minutos tarde**»: la patente se registró a las 7:15, 28 minutos después de la Caída | `patente_copiada` (B2) | Historiadora → **Gremio** | Convence: «Fuente primaria con hora. Si hay que conservarla, que sea con el nombre bien puesto.» |
| A2 | «**Licencias por uso**»: el Gremio cobra licencia por cada horno del reino; con la patente, las cobraríamos nosotros | Hablar con **Quino** tras B1 | Reparador → **Gremio** | Convence: «¿Licencia por *cada* horno? Bro, eso es un modelo de suscripción con pasos extra. Me encanta.» |
| A3 | «**Misa de coronación**»: la Corona promete que quien declare la patente elegirá al oficiante de la futura coronación | Escuchar al **Heraldo Sir Pompeyo** en la plaza | Clérigo → **Corona** | Convence (salvo `altarcito_denunciado`): «¿Oficiar una coronación? …Por el bien del reino, ¿va?» |
| A4 | «**La Iglesia paga las costas**»: la Iglesia cubre los gastos del pleito y cede los derechos de estampitas | Hablar con la **Beata Felícitas** | Reparador → **Iglesia** | Convence: «¿Costas pagadas *y* *merchandising*? Bro, eso es un *partnership*.» |
| A5 | «**La Casilla 7 está en blanco**»: si la declaramos, la Corona escribirá «rey» antes de que nadie la estudie | Sobornar a **Ceferino** (`casilla7_vista`) | Historiadora → **Gremio** | Convence: «Registrada, al menos alguien la leerá antes de coronarla. Es poco. Es algo.» |
| A6 | «**Las velas las paga un tal Barón**»: el mismo hombre del Barón paga los andamios del Gremio *y* las velas de la Iglesia | `encarna_salvada` + hablar con **Encarna** | Clérigo → **Corona** | Convence: «¿Mi Iglesia la financia un inversor? …Que lo investigue la Corona.» También deja `pista_baron_1` |
| A7 | «**La Iglesia conserva los textos**» | Hablar con la **Beata Felícitas** (segunda línea) | Historiadora → **Iglesia** | **Rebota (línea roja)**: «Los conserva. Y los corrige.» |
| A8 | «**El sello original**»: el Gólem Tuerca selló patentes 40 años y jura que nunca vio planos del Coso | **Reparar a Tuerca** (evento «El Gólem Deprimido») | Historiadora → **Gremio** | Convence: «Un testigo con memoria de latón. Admisible.» |
| A9 | «**Los aprendices cobrarían sueldo**» | Hablar con **Quino** (segunda línea) | Clérigo → **Gremio** | **Rebota (línea roja)**: «Mare, yo rezo por esos niños. Pero al Gremio, ni el pésame.» |

**Comprobación de alcanzabilidad** (para el test de contenido «todas las opciones se pueden alcanzar»; mayoría simple, empate 2-2 a Brayan):
- **Corona:** jugador + Historiadora + Reparador (inclinaciones) = 3. Sin persuadir a nadie. Unanimidad con A3 o A6 sobre el Clérigo.
- **Gremio:** jugador + Historiadora (A1, A5 o A8) → 2-1-1, gana; o jugador + Reparador (A2) → 2-1-1, gana; con ambos, 3. Con `accionista_baron` el Reparador ya empieza en Gremio.
- **Iglesia:** jugador + Clérigo = 2 contra Corona 2 → **empate: desempata Brayan**. Con A4 sobre el Reparador → 3, gana sin depender de las propinas.
- Nunca hay 1-1-1-1 (3 opciones, 4 votos). El único empate posible es **2-2**.

### 5.4 Desempate de Brayan

- Solo si hay 2-2.
- Brayan vota con el héroe que más **propina** le haya dejado a lo largo del capítulo (la propina se deja al salir de la taberna, en nombre de un héroe; 0–3 monedas por visita).
- Si hay empate de propinas, vota con la protagonista del capítulo.
- Línea: «Yo soy *neutral*, bro. Pero la data no miente: la *customer experience* de [héroe] fue top.»

### 5.5 Efectos del voto

- Flag `v1_gremio` / `v1_iglesia` / `v1_corona` → variante de B3.
- **Convicciones ocultas:** cada héroe suma +1 al eje de lo que votó (no de lo que ganó).
- **Favor de facción** (encuestas del códice): la opción ganadora +2; las otras dos −1.
- Entrada del códice «Estado del Reino»: «La Persona Colectiva 88-88 decide [opción]. Nadie entiende por qué. Ni ellos.»
- **Unanimidad** (4-0): accesorio **Sello de Consenso** (+1 brío inicial a todo el grupo en B3) y un bark del Narrador: «Unanimidad. En Vaporcracia no pasaba desde que votaron que el agua moja.» Ensaya la regla del final oculto, que exige unanimidad.

*Resumen al saltar (el voto no se puede saltar; solo sus escenas):* «Resumen: han votado. La mayoría manda. La minoría refunfuña. Es lo que tiene la democracia.»

---

## 6. Hub: el Distrito del Gremio y la Taberna

Dos mapas cenitales de Tiled: `distrito_gremio` (Plaza del Cráter, Archivo por fuera, Canal de Refrigeración, Mercado de Chatarra, andamios) y `taberna_brayan` (interior, con la puerta a la casa de Doña Remedios).

### 6.1 NPCs con nombre y qué desbloquean

| NPC | Dónde | Quién es | Qué desbloquea | Gesto (animación) |
|---|---|---|---|---|
| **Brayan** | Taberna | Tabernero, domicilio social | Tienda, **contratos**, códice, **propinas**. Tras B1 comenta la etiqueta: «¿Letras raras? Bro, yo hablo inglés *de negocios*.» (siembra el final oculto) | Frotarse las manos |
| **Doña Remedios** 🔶 | Taberna / su casa | Madre de Brayan | Rumores **ciertos** (lore del Gran Maestre: «no duerme desde la Caída; mira el Coso toda la noche»). Tras B2: **tónico gratis** para el grupo | Sacudir el trapo |
| **Ceferino** | «Ventanilla 3 bis (itinerante)», al final de la cola en la plaza | Funcionario del T-800 | Evento **La Fila del T-800** → argumento **A5** y `casilla7_vista` | Sellar en el aire |
| **Beata Felícitas** | Borde del cráter | Devota que reparte estampitas del Coso | Argumentos **A4** y **A7** (trampa) | Santiguarse con vapor |
| **Sir Pompeyo de Almidón** | Escalinata a la plaza | Heraldo de la Corona (nobleza rococó: peluca con un barquito de vapor dentro) | Argumento **A3** | Desenrollar pergamino |
| **Encarna** | Puesto de churros al vapor (solo si `encarna_salvada`) | Churrera; el aceite es pecado desde el martes y sus churros al vapor son horribles; los vende igual | Argumento **A6** + `pista_baron_1`; regala «Churro al Vapor» (tónico pequeño) | Dar vueltas a la masa |
| **Quino** | Mercado de Chatarra (tras B1) | Aprendiz explotado que se rindió en B1 | Argumentos **A2** y **A9** (trampa) + **consejo táctico** para B3: «La Desmontadora no gira. Si le cruzas algo en el riel, se para un turno.» | Barrer sin ganas |
| **Don Legajo** | Puerta de servicio del Archivo | Archivero | Escena previa a B2; tras B2, entrada del códice sobre la patente. En la variante Gremio, es el notario de B3 | Ajustarse los manguitos |
| **Maese Octavio Ochoa** | Mirador del cráter | Sabio del Gremio que descifra el 88:88 («voy por el segundo 8») | Lore; si hablas con él con la Historiadora al lado: «Por detrás tiene más runas», que señala la **etiqueta** del Coso (`etiqueta_vista`) | Contar con los dedos |
| **Tuerca** | Canal de Refrigeración | El Gólem Deprimido | Evento → argumento **A8** | Llorar vapor |
| **El Barón del Humo** | Mesa del fondo de la taberna | «Inversor» porteño simpático (nadie sospecha) | Evento **La Ronda del Barón** (`accionista_baron`) | Hacer anillos de humo |
| **Nico** | Detrás del Altarcito Pirata, en la plaza | Aprendiz con un silbato que imita los pitidos del Coso | Evento **El Altarcito Pirata** | Soplar el silbato |
| **El Espadachín Atascado** (cameo) | Puerta de la taberna | Espadachín rubio de pelo imposible con una espada más ancha que el marco | Evento cameo (máx. 1 por capítulo) | Forcejear |
| **Xurxo** y **Lupita** 🔶 | Tablón de contratos | Matón gallego y Boticaria chilanga | Contratos (Biblia §11) | Crujirse los nudillos / machacar en el mortero |
| **Los cuatro héroes** | Taberna | — | Hablar con ellos tras B2 revela su **línea roja** (candado en La Balanza) y da barks de pareja | Reposo propio |

### 6.2 Los 5 eventos del lote 2 como interacciones del hub

Recompensas convertidas al RPG: la vida perdida pasa a **tónicos** (objetos), las cartas a **accesorios**, las maldiciones a **accesorios malditos** o flags. Cada evento: 3 opciones, una sola vez.

| Evento (v1) | Dónde | Opciones y efectos v2 |
|---|---|---|
| **El Altarcito Pirata** | Plaza (Nico) | **Rezarle**: +1 tónico («el placebo es el único servicio de salud sin lista de espera»). **Denunciarlo al Gremio**: +25 oro y `altarcito_denunciado` (Nico se lo llevan; el Clérigo te lo recuerda en el voto). **Robar una pieza «de estudio»**: accesorio **Pitido de Barro** y un héroe empieza B2 con −6 de vida |
| **La Fila del T-800** | Ventanilla 3 bis (Ceferino) | **Hacer la fila**: +1 tónico y 3 minutos de chistes de cola (se puede saltar). **Colarte**: +30 oro («tasas cobradas en exceso»). **Sobornar a Ceferino** (20 oro): te enseña el **Expediente 88-88** con la **Casilla 7 en blanco** (`casilla7_vista`, entrada de códice) y desbloquea **A5** |
| **La Ronda del Barón** | Taberna (el Barón) | **Invertir 30 oro**: accesorio aleatorio **y** accesorio maldito **Letra Pequeña**; `accionista_baron` (el Reparador empieza el voto inclinado al Gremio; en el final el Barón te llama «socio»). **Venderle la copia de la patente** (solo con `patente_copiada`): +60 oro, pero **pierdes A1** y `patente_vendida` (el Barón la usará en el cap. 3). **Irte sin firmar**: nada; el Barón te apunta en «inversores tímidos, insistir en el capítulo 3» |
| **El Gólem Deprimido** | Canal (Tuerca) | **Repararlo** (cuesta 1 tónico o 20 oro en piezas): accesorio **Tuerca de la Amistad**, `golem_reparado`, desbloquea **A8** y Tuerca aparece en el epílogo saludando. **Desguazarlo**: +30 oro y `golem_desguazado` (el Clérigo y la Boticaria lo comentan). **Llorar con él**: +1 tónico. Narrador: «Terapia de grupo: dos unidades. Facturable a nadie.» |
| **El Espadachín Atascado** (cameo) | Puerta de la taberna | **Sacarlo con la palanca hidráulica**: accesorio raro **Técnica de un Pasado Complicado**; un héroe empieza la siguiente batalla con −8 de vida. **Cobrarle la grúa**: +20 oro; se desatasca solo por dignidad dramática. **Recitarle la póliza**: nada. Narrador: «Tres días. Podría soltar la espada. No va a soltar la espada.» |

---

## 7. B3 «El Gran Maestre» (Pabellón del Cráter)

La misma plaza de B1, **de noche**, con el Pabellón terminado: los andamios son ahora galerías (altura 5) unidas por una pasarela norte, y un **riel** baja desde la galería oeste por el borde del cráter hasta el Coso. Reutiliza el tileset y la geometría de B1 (ahorro de producción, y el jugador reconoce el sitio).

- **Jefe:** Maese Ulpiano Cremallera, Gran Maestre (96×96). **Enemigos:** Cobrador de Cuotas, 2 Aprendices, 2 Gólems (en la variante Gremio, los aprendices son neutrales).
- **La Desmontadora** (prop animado grande, 8 frames): entrada propia en la **barra de turnos** con una **mecha** (pasos que le quedan hasta el Coso; 7 en el riel **r**). Avanza una casilla del riel por turno suyo. **Si llega al Coso, le quita el plástico y pierdes** (el Gremio ahorca a todos, empezando por el Gran Maestre, que no se lo esperaba).
- **Cómo pararla** (todo telegrafiado): poner algo en el riel (unidad o Prototipo) la **detiene un turno** y daña a lo que esté ahí («la Desmontadora desmonta lo que encuentra»); un **Prototipo que explota en el riel** la retrasa 2; la Historiadora puede **retrasarla** en la barra; la Sobrecarga la retrasa 1 («se le empañan los sensores»).
- **Victoria:** `defeat` el Gran Maestre (se rinde a 0: «¡Apelo!»). **Derrota:** la Desmontadora llega al Coso, o caen los 4 héroes.
- **Fase 2** (Gran Maestre a la mitad de vida): salta a la Desmontadora y la **pilota**: +1 de velocidad para ella, pero ahora él está sobre el riel, **al alcance** del cuerpo a cuerpo desde el borde del cráter.
- **Mundo vivo:** faroles del Pabellón balanceándose, chispas del riel, la Desmontadora con pistones y sierras girando, el Coso iluminando el cráter con su 88:88, estandartes, vapor subiendo del fondo del cráter.

```
Alturas                                Plano (base; los extras dependen de la variante)
    x 0 1 2 3 4 5 6 7 8 9 A B            x 0 1 2 3 4 5 6 7 8 9 A B
y0    5 5 5 5 5 5 5 5 5 5 5 5          y0  A A A A A M A A A A A A
y1    5 5 5 2 2 2 2 2 2 5 5 5          y1  D A A . . . . . . A A L
y2    4 3 2 2 2 2 2 2 2 2 3 4          y2  r l . . . . . . . . l l
y3    2 2 2 2 1 1 1 1 2 2 2 2          y3  r r r r r . . . . . g .
y4    2 2 2 1 0 0 0 0 1 2 2 2          y4  . . . . r . . . . . . .
y5    2 2 2 1 0 0 0 0 1 2 2 2          y5  . . . . r O O . . . . .
y6    2 2 2 1 0 0 0 0 1 2 2 2          y6  . a . . . O O . . . a .
y7    2 2 2 1 0 0 0 0 1 2 2 2          y7  . . . . . . . . . . . .
y8    2 2 2 2 1 1 1 1 2 2 2 2          y8  . g . . . . . . . c . .
y9    2 2 2 2 2 2 2 2 2 2 2 2          y9  . . . . . . . . . . . .
yA    2 2 2 2 2 2 2 2 2 2 2 2          yA  . . . @ @ . . @ @ . . .
yB    2 2 2 2 2 2 2 2 2 2 2 2          yB  . . . . . . . . . . . z

A galería del Pabellón (altura 5)   M Gran Maestre (inicio, pasarela norte)   D Desmontadora (inicio)
r riel (7 pasos hasta el Coso)   O el Coso   l escalera de mano
@ despliegue   a Aprendiz   g Gólem   c Cobrador
L Don Legajo (solo variante A)   z entrada de la Recaudadora (solo variante C, turno 3)
Variante B: 2 feligreses aliados y la Beata Felícitas se despliegan en y9 (x 1-2 y x 9-A).
```

### 7.1 Las tres variantes

| Variante | Voto | Cambios | Condición extra | Tono |
|---|---|---|---|---|
| **A «El Notario»** | `v1_gremio` | Don Legajo (NPC, altura 5, esquina NE) necesita **4 turnos suyos** sellando el registro. Los aprendices son **neutrales** (se apartan: «¿La jefa nueva paga? Pues yo me siento»). El Gran Maestre prioriza a Don Legajo | **Derrota** también si cae Don Legajo. Al completar el sellado, el Gran Maestre pierde su escudo («¡No tengo licencia para pelear contra el titular!») | Burocracia contra burocracia |
| **B «Los Feligreses»** | `v1_iglesia` | 2 **feligreses aliados** (IA, perfil guardián: se ponen en el riel a propósito, «¡por el Santo Horno!»). La Beata Felícitas da **+1 brío** a un aliado cada turno suyo | Si un feligrés cae, no muere: «asciende» (se desmaya con una sonrisa). El Clérigo tiene barks extra | Fervor útil y un poco inquietante |
| **C «La Auditoría»** | `v1_corona` | En el turno 3 entra **Doña Casilda, la Recaudadora** (64×64, perfil tercer bando) con 2 alguaciles fiscales por **z**. Ataca a quien tenga más oro o Prototipos: **embarga Prototipos** (los retira del tablero) de ambos bandos y **multa** (quita brío) | Si la Recaudadora queda a 0, se retira «a por refuerzos… y un sello». No es obligatorio vencerla | Caos a tres bandas; Hacienda como fuerza de la naturaleza |

---

## 8. Accesorios (las reliquias de la v1, recicladas)

Números provisionales: el motor los fija en `reglas-tacticas.md`.

| Accesorio | Origen | Efecto v2 (intención) |
|---|---|---|
| **Plástico Protector de Repuesto** | Reliquia v1 | La primera Sobrecarga de cada batalla no daña al portador |
| **Válvula del Becario** | Reliquia v1 | Mientras el portador esté en pie, la primera vez por batalla que la Presión llegaría a 10, se queda en 9 |
| **Sindicato de Uno** | Reliquia v1 | Cuando el portador recibe fuego amigo, gana +1 brío |
| **Sello del Gremio (Falsificado)** | Reliquia v1 | Los Prototipos del portador tienen +1 de mecha |
| **Termo de Tinto Recalentado** | Reliquia v1 | El portador empieza cada batalla más adelantado en el Reloj de Vapor |
| **Recibo Sin Sellar** | Reliquia v1 | +10 oro al terminar cada batalla |
| **Engranaje Trucado** | Reliquia v1 | La Sobremarcha del portador cuesta 1 de Presión en lugar de 2 |
| **Tuerca de la Amistad** | Evento del Gólem | +3 de bloqueo al inicio de cada batalla |
| **Pitido de Barro** | Evento del Altarcito | Una vez por batalla, el portador puede «pitar» y retrasar a un enemigo en la barra (el enemigo cree que amanece) |
| **Técnica de un Pasado Complicado** | Cameo | +1 de alcance a los ataques cuerpo a cuerpo del portador («es material de mi… pasado complicado») |
| **Letra Pequeña** (maldito) | Ronda del Barón | Ocupa hueco; −1 de vida al portador al inicio de cada turno suyo. Se quita pagando a Brayan («te hago el *unsubscribe*, bro») |

El Coso **ya no es reliquia**: es el objeto de la trama. Su línea reservada se reutiliza en el epílogo.

---

## 9. Epílogo «La procesión» (≤ 2 min)

Amanecer tras B3. El Gran Maestre, atado con su propio cinturón de herramientas, apela a gritos. El Coso **pita tres veces**.

> **NARRADOR:** Y al tercer pitido, como cada mañana, la Iglesia declaró milagro.
> **NARRADOR:** Esta vez, además, vino a por él.

Cuarenta costaleros **se llevan el Coso con cráter y todo**: levantan la losa entera (once varas de gravilla) para no tocar el plástico. La procesión sube la escalinata hacia el Barrio Catedral.

Una línea según la ruta:
- **Gremio:** «**DON LEGAJO:** El registro es válido. El Coso es de la señora. **CARDENAL** *(fuera de plano)*: …y lo que es de la señora, es de Dios. Llévenselo.»
- **Iglesia:** «**BEATA FELÍCITAS:** ¡Ustedes nos lo dieron! ¡Qué generosidad! **REPARADOR:** Bro, les dimos la *patente*, no el *producto*.»
- **Corona:** «**DOÑA CASILDA:** Queda embargado. **SACRISTÁN:** Derecho de sagrado, señora. Donde pisa el Santo Horno, es templo. **DOÑA CASILDA:** …Vuelva usted mañana. Con él.»

Cierre:
> **CLÉRIGO** *(mirando la procesión, sin sonreír por primera vez)*: Mare… esa es *mi* procesión. Esos son *mis* cánticos. Y ese de la mitra no es nadie mío.
> **BRAYAN:** Bros, ¡buenas noticias! Abro sucursal en el rellano de la Catedral. *Scaling*.
> **DOÑA REMEDIOS:** ¿Y quién me sube los barriles?
> **NARRADOR:** Queda oficialmente desmentido que el Coso saliera de un taller del Gremio. Mañana la Iglesia explicará de dónde salió. Les adelanto algo: es peor.

Nueva entrada del códice y pantalla **FinCapitulo** (sustituye a la escena Victory de la alfa). Gancho al capítulo 2 «El Milagro».

*Resumen al saltar:* «Resumen: ganasteis. La Iglesia se lo llevó igual. Con cráter y todo.»

**Ranura de nivel 3 del capítulo** (solo se dispara una de las dos, la primera que ocurra; ver §11): si no la gastó el Gran Maestre, el Narrador cierra con: «Tú sí sabes lo que es. No se lo digas a nadie de aquí. No me estropees el mejor siglo que he tenido.»

---

## 10. Líneas del Gran Maestre (voz 2)

Castellano de reino, pomposo. No gastan presupuesto del Narrador.

| Disparador | Línea |
|---|---|
| **Entrada** (1 de 3, rotación) | «¡Alto! Ese Coso salió de MIS talleres. Modelo VPR-88. La documentación se quemó, lo cual demuestra que existía: ¿para qué iba a quemarse algo que no existe?» |
| Entrada | «¿Venís por el Coso? Querréis decir el Horno Patentado N.º 1. Primero pasad sobre mí. Después, sobre el papeleo. El papeleo es peor.» |
| Entrada | «Tres desmontadores ahorcados por tocar el plástico. No porque crea en el plástico: porque el plástico es MÍO.» |
| **Variante A** (entrada extra) | «¿Registrarla a nombre de una *empleada*? ¡Eso es peor que robarla! ¡Eso es *pagarle*!» |
| **Variante B** | «¿Sagrada Escritura? ¡Mi patente no es un salmo! …¿Cuánto paga la Iglesia por derechos?» |
| **Variante C** | «¿La habéis declarado? ¿A HACIENDA? ¿Sabéis lo que me va a costar eso en recargos?» |
| **Fase 2** (sube a la Desmontadora) | «¡Si queréis algo bien desmontado, desmontadlo vosotros mismos! …Digo, ¡yo mismo!» |
| Fase 2 | «¡El 88:88 es el número de serie! ¡Llevo meses diciéndolo en la Junta y nadie me DA EL PREMIO!» |
| **Desmontadora a 1 paso** | «¡Un paso! ¡Un paso y veremos por fin qué hay debajo del plástico! …Y luego me ahorcarán. Merecerá la pena.» |
| **Derrota** (1 de 3) | «La patente… era robada… luego alguien… la tenía… luego yo… tenía razón…» |
| Derrota | «Registrad mi derrota… en el formulario D-66… "Defunción por Litigio"… tres copias… ¡que no estoy muerto! ¡Apelo!» |
| Derrota | «Al menos yo tenía una explicación. La vuestra, ¿cuál es? …Exacto. Eso pensaba.» |
| **Reintento 2.º intento** | «¿Otra vez vosotros? Traed el formulario de reincidencia. Es el azul.» |
| **Reintento 3.er intento** | «Ya he guardado vuestra estrategia en un cajón, junto a la patente que juro que me robasteis.» |
| **Reintento 3.º+ (nivel 3, consume la ranura del capítulo)** | «Él lo vuelve a intentar. Sí, tú. El del otro lado del cristal. ¿Pongo la tetera?» |
| **Reintento 5.º+** | «Mirad, os hago precio: si perdéis una vez más, os cobro la entrada como a los turistas.» |
| **Victoria del jugador tras 3+ intentos** | «…Por fin. Ya me estaba encariñando. No se lo digáis a la Junta.» |

**Recaudadora (variante C):** entrada «Buenas noches. Hacienda. Nadie se mueva, que les cuento a todos.» · al embargar un Prototipo: «Esto queda precintado. No me ponga esa cara, que la cara también tributa.» · al retirarse: «Me voy a por refuerzos. Y un sello. Sobre todo el sello.»

---

## 11. Presupuesto de barks y del Narrador

| Voz | Capítulo 1 | Notas |
|---|---|---|
| **Narrador** | **≤ 18 líneas** vistas en una partida normal (sin contar resúmenes al saltar) | ≤ 1 por batalla (+1 en derrota/reintento). **Una sola ruptura de nivel 3 en todo el capítulo**: la ranura la consume el primero que llegue: el Gran Maestre en el 3.er reintento o el Narrador en el epílogo |
| Resúmenes al saltar | 1 por escena (≈ 10) | No cuentan en el presupuesto |
| **Héroes** (barks de batalla) | ~20 por héroe (80) | Inicio de turno, Prototipo colocado, fuego amigo recibido, Sobrecarga, Gotera avisada, aliado caído, vida baja, victoria |
| **Barks de pareja** (fe contra escepticismo) | ~12 | Por ejemplo, Clérigo e Historiadora ante el Coso: «—Es un dios. —Es un horno. —Los dioses también calientan, hereje.» |
| **Mercenarios** | ~8 cada uno (16) | Incluye la rescisión de Lupita («Órale, me miraste feo. Con una explosión.») |
| **Enemigos del Gremio** | ~4 por tipo (20) | Aprendices: humanos y cansados, nunca ridiculizados |
| **Gran Maestre y Recaudadora** | §10 (≈ 20) | Voz 2 |
| **NPCs del hub** | 2–4 cada uno (≈ 40) | Ambientales y de pista |
| **Total** | **≈ 220 líneas** | Con enfriamiento y prioridad (`pickBark`) |

---

## 12. Flags del capítulo (para `src/data/flags.ts`)

`apodo_desplazados`, `apodo_comite`, `apodo_sociedad` · `encarna_salvada`, `encarna_desalojada` · `etiqueta_vista` · `patente_copiada`, `patente_sellada`, `patente_vendida` · `casilla7_vista` · `altarcito_denunciado` · `accionista_baron` · `golem_reparado`, `golem_desguazado` · `pista_baron_1` · `lineas_rojas_clerigo`, `lineas_rojas_historiadora` (candados vistos) · `v1_gremio`, `v1_iglesia`, `v1_corona` · `cap1_completo`.
