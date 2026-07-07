# Cartas — Lote 2 de la Ingeniera Desahuciada

> Documento de diseño de contenido. **18 cartas nuevas** (10C / 6U / 2R) para llevar el pool obtenible de la Ingeniera de 5 a 23 (~25 con margen), **8 reliquias** especificadas para la fase de reliquias, **5 eventos "?"** y la **tabla de balance** que justifica los números.
>
> Regla madre (GDD §1): **caos justo** — todo riesgo se elige, se telegrafia y se mitiga. Nada aquí mata por sorpresa; todo aquí puede matarte si tú insistes, mijo.
>
> Todos los objetos `CardDef` usan **solo** los `Effect.kind` existentes en `src/core/types.ts` (`damage`, `block`, `draw`, `applyStatus`, `selfDamage`, `pressure`, `ventPressure`), los statuses soportados (`vulnerable`, `weak`, `poison`, `strength`) y las keywords soportadas (`exhaust`, `overclock`, `prototype` + `fuse`). Listos para pegar en `src/data/cards/ingeniera.ts`.

---

## 1. Las 18 cartas nuevas

Checklist de encargo: **6 cartas con Presión** (pide ≥3) · **2 Prototipos** (`taladro_de_asedio`, `horno_sin_licencia`) · **2 Overclock nuevas** (`escape_lateral`, `dinamo_de_cuerda`) · **3 que aplican statuses** (pide ≥2: `chorro_de_vapor`, `tuerca_floja`, `aceite_de_codo`) · **1 carta-chiste con nicho real** (`informe_trimestral`).

### 1.1 Comunes (10)

```ts
// ---------- COMUNES ----------

{
  id: 'soplete_de_segunda',
  name: 'Soplete de Segunda Mano',
  cost: 1,
  type: 'attack',
  rarity: 'common',
  target: 'enemy',
  effects: [
    { kind: 'damage', amount: 8 },
    { kind: 'pressure', amount: 1 },
  ],
  description: 'Inflige 8 de daño. Presión +1.',
  flavor: '«Dijo el vendedor que era de segunda. Segunda guerra, parce.»',
},
{
  id: 'engranaje_suelto',
  name: 'Engranaje Suelto',
  cost: 0,
  type: 'attack',
  rarity: 'common',
  target: 'enemy',
  effects: [{ kind: 'damage', amount: 4 }],
  description: 'Inflige 4 de daño.',
  flavor: 'Se cayó de algo importante. Ya sonará cuando haga falta.',
},
{
  id: 'chorro_de_vapor',
  name: 'Vaporazo en la Cara',
  cost: 1,
  type: 'attack',
  rarity: 'common',
  target: 'enemy',
  effects: [
    { kind: 'damage', amount: 5 },
    { kind: 'applyStatus', status: 'weak', stacks: 1, to: 'target' },
  ],
  description: 'Inflige 5 de daño. Aplica 1 de Débil.',
  flavor: '«Facial de vapor, mijo. En el spa del Gremio te lo cobran; yo te lo regalo.»',
},
{
  id: 'tuerca_floja',
  name: 'Aflojarle la Tuerca',
  cost: 1,
  type: 'attack',
  rarity: 'common',
  target: 'enemy',
  effects: [
    { kind: 'damage', amount: 4 },
    { kind: 'applyStatus', status: 'vulnerable', stacks: 1, to: 'target' },
  ],
  description: 'Inflige 4 de daño. Aplica 1 de Vulnerable.',
  flavor: 'Toda armadura tiene UNA tuerca que lo sostiene todo. La Ingeniera sabe cuál. El Gremio patentó no decírtelo.',
},
{
  id: 'escape_lateral',
  name: 'Escape Lateral',
  cost: 1,
  type: 'attack',
  rarity: 'common',
  target: 'allEnemies',
  effects: [{ kind: 'damage', amount: 4 }],
  keywords: ['overclock'],
  description:
    'Inflige 4 de daño a TODOS los enemigos. Overclock (opcional): +2 de Presión → efecto doblado.',
  flavor: '«¡Quihubo pues, háganse a un lado que esto sopla parejo pa todo el mundo!»',
},
{
  id: 'chatarra_soldada',
  name: 'Chatarra Soldada',
  cost: 2,
  type: 'skill',
  rarity: 'common',
  target: 'self',
  effects: [{ kind: 'block', amount: 11 }],
  description: 'Gana 11 de bloqueo.',
  flavor: 'Tres cacerolas, media puerta y el trofeo de «Empleada del Mes» que nunca vino con premio.',
},
{
  id: 'hora_extra',
  name: 'Hora Extra (No Remunerada)',
  cost: 0,
  type: 'skill',
  rarity: 'common',
  target: 'self',
  effects: [
    { kind: 'draw', count: 2 },
    { kind: 'selfDamage', amount: 2 },
  ],
  description: 'Roba 2 cartas. Pierdes 2 HP.',
  flavor: '«El Gremio lo llama "oportunidad de crecimiento". Yo lo llamo martes.»',
},
{
  id: 'atizar_la_caldera',
  name: 'Atizar la Caldera',
  cost: 0,
  type: 'skill',
  rarity: 'common',
  target: 'self',
  effects: [
    { kind: 'pressure', amount: 2 },
    { kind: 'draw', count: 1 },
  ],
  description: 'Presión +2. Roba 1 carta.',
  flavor: '«¿Que la caldera está que canta? Pues que cante más duro, home, que el que no arriesga no fríe.»',
},
{
  id: 'purga_de_emergencia',
  name: 'Purga de Emergencia',
  cost: 0,
  type: 'skill',
  rarity: 'common',
  target: 'self',
  effects: [{ kind: 'ventPressure', blockPerPressure: 1 }],
  description: 'Purga toda la Presión. Gana 1 de bloqueo por cada punto purgado.',
  flavor: 'El botón rojo del taller. El polvo encima es la prueba de que la Ingeniera nunca lo usa a tiempo.',
},
{
  id: 'informe_trimestral',
  name: 'Informe Trimestral',
  cost: 0,
  type: 'skill',
  rarity: 'common',
  target: 'self',
  effects: [{ kind: 'draw', count: 1 }],
  description: 'Roba 1 carta. (Eso es todo. Ese es el informe.)',
  flavor: '«Esta carta no hace nada. Como tu último informe.» — el Narrador',
},
```

**Nota de diseño — `informe_trimestral` (la carta-chiste):** parece papel mojado (una carta que solo se reemplaza a sí misma) y ese es exactamente el chiste: no hace *nada*… salvo **adelgazar el mazo gratis**. En un pool cuyo plan de juego es *«llegar al Prototipo antes de que se apague la mecha»* y *«robar la Válvula justo antes de la Sobrecarga»*, un ciclado a coste 0 es velocidad pura: acelera fusibles, alimenta `hora_extra` y hace que el mazo de 12 cartas juegue como uno de 11. El jugador nuevo la descarta riéndose; el jugador de detonador la toma riéndose distinto.

### 1.2 Infrecuentes (6)

```ts
// ---------- INFRECUENTES ----------

{
  id: 'martillo_neumatico',
  name: 'Martillo Neumático',
  cost: 2,
  type: 'attack',
  rarity: 'uncommon',
  target: 'enemy',
  effects: [
    { kind: 'damage', amount: 6, times: 3 },
    { kind: 'pressure', amount: 3 },
  ],
  description: 'Inflige 6 de daño 3 veces. Presión +3.',
  flavor: '«¡TA-TA-TÁ! Así suena el progreso, mijo. Y así suena también la caldera pidiendo cacao.»',
},
{
  id: 'taladro_de_asedio',
  name: 'Taladro de Asedio (Prototipo)',
  cost: 2,
  type: 'attack',
  rarity: 'uncommon',
  target: 'enemy',
  effects: [{ kind: 'damage', amount: 20 }],
  keywords: ['prototype'],
  fuse: 3,
  description: 'Inflige 20 de daño. Explota tras 3 usos.',
  flavor: 'Perfora murallas, contratos y expectativas. Garantía: exactamente tres usos, ni uno más, léase la letra pequeña remachada al mango.',
},
{
  id: 'valvula_maestra',
  name: 'Válvula Maestra',
  cost: 1,
  type: 'skill',
  rarity: 'uncommon',
  target: 'self',
  effects: [{ kind: 'ventPressure', blockPerPressure: 3 }],
  description: 'Purga toda la Presión. Gana 3 de bloqueo por cada punto purgado.',
  flavor: '«Esta la hice yo. Por eso funciona. Por eso mismo el Gremio dice que es de ellos.»',
},
{
  id: 'dinamo_de_cuerda',
  name: 'Dínamo de Cuerda',
  cost: 1,
  type: 'skill',
  rarity: 'uncommon',
  target: 'self',
  effects: [{ kind: 'draw', count: 2 }],
  keywords: ['overclock'],
  description: 'Roba 2 cartas. Overclock (opcional): +2 de Presión → efecto doblado.',
  flavor: '«Le das cuerda y piensa por ti. Overclockeada piensa de más, como yo a las 3 de la mañana.»',
},
{
  id: 'aceite_de_codo',
  name: 'Aceite de Codo',
  cost: 1,
  type: 'skill',
  rarity: 'uncommon',
  target: 'self',
  effects: [{ kind: 'applyStatus', status: 'strength', stacks: 2, to: 'self' }],
  keywords: ['exhaust'],
  description: 'Gana 2 de Fuerza. Consumir.',
  flavor: '«El único aceite que la Iglesia no ha declarado pecado. Todavía. Hay cónclave el jueves.»',
},
{
  id: 'remiendo_de_urgencia',
  name: 'Remiendo de Urgencia',
  cost: 1,
  type: 'skill',
  rarity: 'uncommon',
  target: 'self',
  effects: [
    { kind: 'block', amount: 8 },
    { kind: 'pressure', amount: 1 },
  ],
  description: 'Gana 8 de bloqueo. Presión +1.',
  flavor: '«¿Que si aguanta? Aguanta. ¿Que si es seguro? Esa es otra pregunta y cuesta aparte.»',
},
```

### 1.3 Raras (2)

```ts
// ---------- RARAS ----------

{
  id: 'remachadora_del_juicio',
  name: 'La Remachadora del Juicio',
  cost: 3,
  type: 'attack',
  rarity: 'rare',
  target: 'enemy',
  effects: [
    { kind: 'damage', amount: 9, times: 3 },
    { kind: 'pressure', amount: 3 },
  ],
  description: 'Inflige 9 de daño 3 veces. Presión +3.',
  flavor: '«Tres remaches: uno por cada año de sueldo que me deben. ¡AVEMARÍA PUES, FIRMEN ESTO!»',
},
{
  id: 'horno_sin_licencia',
  name: 'Horno Sin Licencia (Prototipo)',
  cost: 2,
  type: 'attack',
  rarity: 'rare',
  target: 'allEnemies',
  effects: [
    { kind: 'damage', amount: 15 },
    { kind: 'pressure', amount: 2 },
  ],
  keywords: ['prototype'],
  fuse: 2,
  description: 'Inflige 15 de daño a TODOS los enemigos. Presión +2. Explota tras 2 usos.',
  flavor: '«Yo NO construí el Coso. Este es distinto: este sí lo hice yo, este sí explota, y este sí fríe con aceite como Dios manda.»',
},
```

**Notas de arquetipo:** el lote consolida las tres builds de la Ingeniera sin tocar el motor. **Detonadora**: `atizar_la_caldera` + `martillo_neumatico` + `remachadora_del_juicio` suben a Sobrecarga a propósito (y `escape_lateral`/`horno_sin_licencia` limpian la sala antes del boom). **Caldera cantora**: `soplete_de_segunda` + `remiendo_de_urgencia` mantienen 4-7 de Presión con `valvula_maestra`/`purga_de_emergencia` como frenos. **Prestamista de fusibles**: los dos Prototipos + `informe_trimestral`/`dinamo_de_cuerda` para encontrarlos rápido, sabiendo el día exacto del vencimiento.

---

## 2. Reliquias (especificación para la fase de reliquias)

> El motor aún no soporta reliquias; esta es la especificación de contenido y de hooks. Todas se implementan escuchando `GameEvent`s existentes (`PressureChanged`, `Overload`, `PlayerDamaged{source:'self'}`, `CardExploded`, `CombatEnded`, `TurnStarted`) — cero mecánicas nuevas, fiel al guardarraíl del GDD §1.5.

| # | Reliquia | Efecto mecánico propuesto | Flavor |
|---|---|---|---|
| 1 | **El Coso** ⭐ *reliquia inicial de la run* | Al terminar cada combate, **cura 4 HP**. (Hook: `CombatEnded{victory}`.) | «Pita tres veces al amanecer. Marca 88:88. Fríe sin aceite. Nadie sabe qué es, pero recalienta las sobras que nadie más quiere — y en este reino, eso es medicina.» |
| 2 | **Plástico Protector de Repuesto** | La **primera Sobrecarga** de cada combate **no te daña a ti** (los enemigos la reciben completa). (Hook: `Overload`, flag por combate.) | «Quitárselo al Coso se paga con la horca. Ponértelo tú es simplemente seguridad industrial.» |
| 3 | **Válvula del Becario** | La primera vez en cada combate que la Presión **llegaría a 10, se queda en 9**. (Hook: interceptar `PressureChanged`.) | «El becario la sostiene con las dos manos. Le pagan en exposición. A la explosión, concretamente.» |
| 4 | **Sindicato de Uno** | Cada vez que **una de tus propias cartas te daña** (`selfDamage` o explosión de Prototipo), **roba 1 carta**. (Hooks: `PlayerDamaged{source:'self'}`, `CardExploded`.) | «Se afilió ella sola. Preside, cotiza y se declara en huelga contra sí misma. Al menos alguien la escucha.» |
| 5 | **Sello del Gremio (Falsificado)** | Tus **Prototipos ganan +1 de fusible**. (Hook: `fuseRemaining + 1` al crear instancias.) | «Auténtico sello falso, del falsificador oficial del Gremio. La burocracia también tiene mercado negro y también pide cita.» |
| 6 | **Termo de Tinto Recalentado** | En tu **primer turno** de cada combate, **roba 2 cartas adicionales**. (Hook: `TurnStarted{turn:1}`.) | «Recalentado en el Coso, obviamente. Tercer uso no autorizado del heredero al trono. Sabe a gloria y a demanda judicial.» |
| 7 | **Recibo Sin Sellar** | Ganas **+10 de oro** al final de cada combate. | «La Recaudadora dice que sin sellar no vale. Exacto: si no vale, no tributa. Jaque mate, funcionaria.» |
| 8 | **Engranaje Trucado** | **Overclock cuesta 1 de Presión** en lugar de 2. (Hook: constante `OVERCLOCK_PRESSURE` por jugador.) | «Le limé un diente al engranaje del riesgo. Ahora el abismo hace un descuentico.» |

**Justificación del Coso como inicial:** curar 4 por combate es el arquetipo Burning Blood — simple, siempre útil, no empuja hacia ninguna build (la identidad de la Ingeniera ya la ponen Presión/Prototipos) y deja el chiste donde debe estar: la reliquia más importante del universo hace lo más doméstico posible. El Narrador tiene línea reservada: *«Lo estás usando para recalentar. Siglos de ingeniería. Recalentar. Perfecto.»*

---

## 3. Eventos "?" (5)

> Consecuencias 100% concretas (oro/HP/cartas/maldición). Un solo cameo pop (regla GDD §8: máx. 1 por acto). Las maldiciones referenciadas se definen al final de esta sección con los tipos actuales.

### 3.1 El Altarcito Pirata
Una réplica del Coso hecha de barro cocido, con velitas y un letrero: «SE ACEPTA LIMOSNA (NO SE ACEPTAN PREGUNTAS)». Pita gracias a un aprendiz escondido detrás con un silbato.

- **Rezarle** → cura **8 HP**. *(El placebo es el único servicio de salud sin lista de espera del reino.)*
- **Denunciarlo al Gremio** → ganas **25 de oro** de recompensa por «infracción de patente espiritual», pero añades la maldición **`cargo_de_conciencia`** a tu mazo. *(El aprendiz del silbato te mira mientras se lo llevan.)*
- **Robarte una pieza "de estudio"** → pierdes **6 HP** (el barro cocido corta, y las velitas queman) y **eliges 1 de 3 cartas** de rareza infrecuente o superior.

### 3.2 La Fila del T-800
La cola para registrar Personas Temporalmente Desplazadas da la vuelta a la catedral. Tú, técnicamente, cuentas.

- **Hacer la fila completa** → cura **10 HP**. *(Seis horas de pie sin hacer nada: en este reino, a eso lo llaman descanso, y estadísticamente lo es.)*
- **Colarte** → pierdes **5 HP** (los codazos de la tercera edad de Vaporcracia son artillería) pero ganas **30 de oro**: al llegar a ventanilla te devuelven «tasas cobradas en exceso» de un formulario que nunca presentaste.
- **Sobornar al funcionario de la ventanilla 3** → pagas **20 de oro** y él «extravía un expediente»: **elimina 1 carta de tu mazo** a tu elección. *(El servicio público más eficiente del reino es el ilegal.)*

### 3.3 La Ronda del Barón
El Barón del Humo, copa en mano: «Justo a vos te estaba buscando, che. La Compañía del Coso abre su ronda Serie B. ¿Vos me viste cara de mentiroso? No contestes.»

- **Invertir 30 de oro** → recibes **1 reliquia aleatoria** («activo tangible del portafolio, che, tocalo, es tuyísimo») **y** la maldición **`letra_pequenia`** a tu mazo. *(El activo es real. Las cláusulas también.)*
- **Venderle TU patente** → **eliminas 1 carta de tu mazo** a tu elección y ganas **10 de oro**. *(«Te pago casi todo en exposición, que cotiza altísimo.» La Ingeniera acepta solo por verlo intentar revenderla al Gremio.)*
- **Irte sin firmar** → nada. El Barón anota tu nombre en la lista de «inversores tímidos, insistir en el Acto 3».

### 3.4 El Gólem Deprimido
Un gólem de latón defectuoso llora vapor sentado en una zanja. Lleva 40 años en la misma obra y hoy le comunicaron, por paloma, que «su puesto ha sido optimizado».

- **Repararlo** → pierdes **7 HP** (quemaduras de vapor emocional) y ganas la reliquia **`tuerca_de_la_amistad`** — *propuesta: «Al inicio de cada combate, gana 3 de bloqueo»* — porque ahora te sigue a todas partes, agradecido y enorme.
- **Desguazarlo** → ganas **30 de oro** en piezas de latón, y la maldición **`cargo_de_conciencia`**. *(Lloraba vapor. Tú también sudas agua. Piénsalo camino a la tienda.)*
- **Sentarte a llorar con él** → cura **5 HP**. Nadie repara nada, nadie cobra nada, y es la opción más sana del evento. El Narrador: *«Terapia de grupo: dos unidades. Facturable a nadie.»*

### 3.5 El Espadachín Atascado *(cameo — máx. 1 por acto)*
Un espadachín rubio de pelo imposible lleva tres días atascado en la puerta de la Taberna porque su espada es más ancha que el marco. Nadie lo ayuda: «el seguro no cubre espadas emocionales».

- **Sacarlo con la palanca hidráulica** → pierdes **8 HP** (la espada cede de golpe y a alguien le toca amortiguarla) y, en agradecimiento, **eliges 1 de 3 cartas raras**. *(«Es material de mi... pasado complicado», dice, y te da una técnica.)*
- **Cobrarle el servicio de grúa por adelantado** → ganas **20 de oro**; él, ofendido, se desatasca solo por pura dignidad dramática y se va sin darte nada más. *(La dignidad dramática mueve más peso que la hidráulica.)*
- **Recitarle la póliza** → nada mecánico. El Narrador: *«Tres días. Podría soltar la espada. No va a soltar la espada. Tú tampoco soltarías la tuya, no me mientas.»*

### Maldiciones referenciadas (implementables HOY con los tipos actuales)

```ts
// ---------- MALDICIONES DE EVENTOS ----------

{
  id: 'cargo_de_conciencia',
  name: 'Cargo de Conciencia',
  cost: 1,
  type: 'curse',
  rarity: 'common',
  target: 'none',
  effects: [],
  keywords: ['exhaust'],
  description: 'No hace nada. Cuesta 1 jugarla para Consumirla. Ocupa mano, como la culpa.',
  flavor: 'Se archiva en el mismo cajón que «luego lo arreglo» y «era por su bien».',
},
{
  id: 'letra_pequenia',
  name: 'Letra Pequeña',
  cost: 1,
  type: 'curse',
  rarity: 'common',
  target: 'self',
  effects: [{ kind: 'selfDamage', amount: 1 }],
  keywords: ['exhaust'],
  description: 'Cuesta 1 y pierdes 1 HP jugarla para Consumirla. Cláusula 47-B: usted acepta.',
  flavor: '«¿La leíste? Yo tampoco la escribí. Se escribió sola. Es lo que hace la letra pequeña, che.» — el Barón',
},
```

---

## 4. Balance

### 4.1 Presupuesto de diseño (los "precios" de cada rider)

Referencias existentes: **Golpe de Llave 6/1⚡** (starter), **Plancha 5/1⚡** (starter), **Motor a Presión 12/2⚡ + Presión 2** (común). Regla StS-like: las obtenibles deben superar a las starter; a más coste, mejor tasa o mejor consolidación.

| Rider | Valor presupuestado | Por qué |
|---|---|---|
| Presión +1 | ≈ **+1.5–2 de daño** de presupuesto | Acerca al sweet spot 4-7 (+25% de daño) *pero* acerca a la Sobrecarga (8 a TODOS, tú incluido). Es medio pago y medio riesgo elegido: se paga con números por encima de curva. |
| Débil 1 | ≈ **2.5–3 de daño** equivalente | Mitiga ~25% de un ataque enemigo típico (8-12 en Acto 1). |
| Vulnerable 1 | ≈ **+2–3 de daño** futuro | +50% al siguiente golpe tuyo (~5-7 en Acto 1). |
| Golpes múltiples (`times`) | neutro/ligero + | Sinergia con Fuerza (`aceite_de_codo`), peor contra bloqueo. Se paga solo. |
| Prototipo (fusible) | ≈ **+30% sobre curva** | Préstamo con vencimiento: 3 (o 2) usos y explosión de coste×4 (mín. 6) al portador. |
| Coste 0 | efecto ≈ **4 de daño / 2 riders menores** | Debe valer menos que media carta de coste 1. |
| Overclock | gratis en la carta | La keyword ya cobra en Presión (+2) al usarse; la carta base va EN curva, no por encima. |

### 4.2 Ataques — daño por energía

*(Sweet spot = daño con la caldera cantando, ×1.25, redondeo del motor.)*

| Carta | Coste | Daño base | Daño/⚡ | En sweet spot | Riders / notas |
|---|---|---|---|---|---|
| Golpe de Llave *(starter, ref.)* | 1 | 6 | 6.0 | 7.5 | — |
| Motor a Presión *(común, ref.)* | 2 | 12 | 6.0 | 15 | Presión +2; un solo golpe (bueno vs bloqueo) |
| Pistola de Remaches *(común, ref.)* | 1 | 4×2 = 8 | 8.0 | 10 | Overclock (→16 por +2 Presión) |
| **Engranaje Suelto** | 0 | 4 | ∞ (4 gratis) | 5 | Filler; en presupuesto de coste 0 |
| **Soplete de Segunda** | 1 | 8 | 8.0 | 10 | Presión +1 paga los 2 pts sobre Golpe |
| **Vaporazo en la Cara** | 1 | 5 | 5.0 | 6.25 | + Débil 1 (≈2.5-3 de valor defensivo) ⇒ ~8 total |
| **Aflojarle la Tuerca** | 1 | 4 | 4.0 | 5 | + Vulnerable 1 (≈+2-3 futuro) ⇒ ~7 total; carta de apertura |
| **Escape Lateral** | 1 | 4 × cada enemigo | 4×N | 5×N | AoE: contra la Junta (3 enemigos) son 12; Overclock → 8×N por +2 Presión |
| **Martillo Neumático** | 2 | 6×3 = 18 | 9.0 | 22 | Presión +3: por encima de Motor porque calienta un 50% más la caldera; núcleo detonador |
| **Taladro de Asedio** 🧨 | 2 | 20 | 10.0 | 25 | Prototipo, fusible 3; explosión 8 (2×4). ~+30% sobre curva de coste 2 (~15) |
| **Remachadora del Juicio** ⭐ | 3 | 9×3 = 27 | 9.0 | 33 | Presión +3; con Fuerza +2 son 33 base. Finisher rara |
| **Horno Sin Licencia** 🧨⭐ | 2 | 15 × cada enemigo | 15×N/2⚡ | 18×N | Prototipo fusible 2 + Presión +2: AoE rarísimo en el pool, ventana de 2 usos |

**Lectura:** la curva de comunes obtenibles queda en **~8 de daño por energía** (con rider que lo paga), infrecuentes calientes en **~9-10**, raras en **~9-10 con consolidación**. Motor a Presión se mantiene relevante: es el único golpe único grande barato del pool común (mejor contra bloqueo que los `times`), y su +2 de Presión es *combustible*, no solo coste — bajo la caldera cantando rinde 7.5/⚡.

### 4.3 Defensa y utilidad — bloqueo por energía

| Carta | Coste | Bloqueo | Bloq/⚡ | Riders / notas |
|---|---|---|---|---|
| Plancha Remachada *(starter, ref.)* | 1 | 5 | 5.0 | — |
| Turbina de Taller *(común, ref.)* | 1 | 6 | 6.0 | Overclock (→12 por +2 Presión) |
| Válvula de Escape *(común, ref.)* | 1 | 2 × Presión | variable | A 5 de Presión: 10/⚡ |
| **Chatarra Soldada** | 2 | 11 | 5.5 | Consolidación: 1 carta, 1 acción |
| **Remiendo de Urgencia** | 1 | 8 | 8.0 | Presión +1 paga los 3 pts sobre Plancha; el remiendo aprieta la caldera |
| **Purga de Emergencia** | 0 | 1 × Presión | gratis | Freno de mano: a 8-9 de Presión, 8-9 de bloqueo gratis. Débil a caldera fría (a propósito) |
| **Válvula Maestra** | 1 | 3 × Presión | variable | A 5: 15/⚡; a 9: 27/⚡. La razón para vivir a 8-9 sin miedo (mitigación telegrafiada del GDD §3.1) |
| **Hora Extra** | 0 | — | — | 2 cartas por 2 HP: el HP como cuarta energía; activa `Sindicato de Uno` y `Mindset` de Brayan |
| **Atizar la Caldera** | 0 | — | — | +2 Presión + 1 carta gratis: acelerador de detonador |
| **Dínamo de Cuerda** | 1 | — | — | Robar 2/⚡ en curva; Overclock → 4 cartas por +2 Presión (mejor motor de robo del pool, con precio) |
| **Aceite de Codo** | 1 | — | — | Fuerza +2 con Consumir: +2 por golpe, ×3 en los `times` (Martillo: +6, Remachadora: +6). Sin Consumir rompería la curva |
| **Informe Trimestral** | 0 | — | — | Ciclado neutro. Ver nota de la carta-chiste |

**Lectura defensiva:** la escalera de válvulas queda `purga (0⚡, ×1)` → `válvula_de_escape (1⚡, ×2)` → `válvula_maestra (1⚡, ×3, infrecuente)`: tres precios para el mismo seguro, y la promesa del GDD («el peor resultado te frena, no te destruye») sigue siendo verdad en cada tramo de la run.

### 4.4 Salud del pool resultante

Pool obtenible de la Ingeniera tras el lote: **23 cartas** — 14 comunes (4 existentes + 10 nuevas), 7 infrecuentes (`prototipo_inestable` + 6 nuevas) y 2 raras — dentro del objetivo de GDD §10 (20-25 obtenibles). Reparto de roles: 12 ataques / 11 habilidades obtenibles; 8 cartas que suben la Presión (más 4 Overclock opcionales) frente a 3 válvulas de purga — la caldera siempre tiene más acelerador que freno, la proporción que hace que la Sobrecarga sea una decisión y no un accidente; 3 Prototipos, 3 cartas de statuses y 4 motores de robo/ciclado. Ninguna carta depende de mecánicas que el motor no tenga hoy.
